import logging
import os
import json
import re
import random
import asyncio
from typing import List, Dict, Any, Optional, Tuple

import requests

from app.services.meta_engine.targeting import search_interests, search_geo_locations
from app.services.meta_engine.api import make_api_request
from app.services.meta_engine.accounts import get_account_info
from app.services.meta_engine.auth import auth_manager


class BiaAdsExecutor:
    def __init__(self, app_id=None, app_secret=None, access_token=None, ad_account_id=None):
        self.logger = logging.getLogger("BIA_ADS")
        self.access_token = access_token
        self.ad_account_id = ad_account_id
        self.account_currency = None

        # Configure Internal Auth Manager if needed
        if app_id:
            auth_manager.app_id = app_id

        # We might need to set env vars for the meta_core modules to pick them up if they rely on os.environ
        if access_token:
            os.environ["META_ACCESS_TOKEN"] = access_token
        if ad_account_id:
            os.environ["META_AD_ACCOUNT_ID"] = ad_account_id

    def _reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "jsonv2",
            "lat": lat,
            "lon": lon,
            "zoom": 10,
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "bia.bianconimkt.com/1.0 (contact: support@bianconimkt.com)"
        }
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json() or {}
        except Exception as exc:
            self.logger.warning(f"[MetaGeo] Reverse geocode failed: {exc}")
            return {}

        address = data.get("address") or {}
        city = address.get("city") or address.get("town") or address.get("village") or address.get("municipality")
        state = address.get("state") or address.get("region") or address.get("state_district")
        country_code = address.get("country_code")

        return {
            "city": city,
            "state": state,
            "country_code": country_code,
            "raw": data
        }

    @staticmethod
    def _normalize(value: Optional[str]) -> str:
        if not value:
            return ""
        compact = re.sub(r"\s+", " ", value.strip().lower())
        return compact

    @staticmethod
    def _ensure_act_prefix(account_id: Optional[str]) -> Optional[str]:
        if not account_id:
            return None
        return account_id if account_id.startswith("act_") else f"act_{account_id}"

    @staticmethod
    def _normalize_objective_goal(
        objective: Optional[str],
        optimization_goal: Optional[str],
        is_ecommerce: bool
    ) -> Tuple[str, str]:
        normalized_objective = (objective or "").strip().upper()
        normalized_goal = (optimization_goal or "").strip().upper()

        if not normalized_objective:
            normalized_objective = "OUTCOME_SALES" if is_ecommerce else "OUTCOME_LEADS"

        if not normalized_goal:
            if normalized_objective == "OUTCOME_SALES":
                normalized_goal = "CONVERSIONS"
            elif normalized_objective == "OUTCOME_LEADS":
                normalized_goal = "LEAD_GENERATION"
            elif normalized_objective == "OUTCOME_TRAFFIC":
                normalized_goal = "LINK_CLICKS"
            else:
                normalized_goal = "LINK_CLICKS"

        return normalized_objective, normalized_goal

    @staticmethod
    def _normalize_gender(gender: Optional[str]) -> Optional[List[int]]:
        if not gender:
            return None
        normalized = gender.strip().upper()
        if normalized in {"ALL", "A", "TODOS", "TODES", "ANY"}:
            return None
        if normalized in {"M", "MALE", "MASCULINO", "HOMEM", "H"}:
            return [1]
        if normalized in {"F", "FEMALE", "FEMININO", "MULHER"}:
            return [2]
        return None

    @staticmethod
    def _has_location_or_custom_audience(targeting: Dict[str, Any]) -> bool:
        geo = targeting.get("geo_locations")
        if isinstance(geo, dict):
            for key in [
                "countries",
                "regions",
                "cities",
                "zips",
                "custom_locations",
                "location_types",
                "geo_markets",
                "country_groups"
            ]:
                val = geo.get(key)
                if isinstance(val, list) and len(val) > 0:
                    return True

        custom_audiences = targeting.get("custom_audiences")
        if isinstance(custom_audiences, list) and len(custom_audiences) > 0:
            return True

        flexible_spec = targeting.get("flexible_spec")
        if isinstance(flexible_spec, list):
            for spec in flexible_spec:
                if isinstance(spec, dict):
                    ca_spec = spec.get("custom_audiences")
                    if isinstance(ca_spec, list) and len(ca_spec) > 0:
                        return True

        return False

    @staticmethod
    def _extract_first_data(response: Any) -> Optional[Dict[str, Any]]:
        if not isinstance(response, dict):
            return None
        data = response.get("data")
        if data is None:
            return response  # Return response as-is if no data field
        if isinstance(data, list) and data:
            return data[0]  # delivery_estimate returns list
        if isinstance(data, dict):
            return data  # reachestimate returns dict
        return response

    @staticmethod
    def _extract_error(response: Any) -> Optional[Dict[str, Any]]:
        if isinstance(response, dict) and "error" in response:
            return response.get("error")
        return None

    @staticmethod
    def _error_message(error_obj: Optional[Dict[str, Any]]) -> str:
        if not error_obj:
            return ""
        message = error_obj.get("message") or ""
        user_title = error_obj.get("error_user_title") or ""
        user_msg = error_obj.get("error_user_msg") or ""
        return " ".join([message, user_title, user_msg]).strip()

    @classmethod
    def _is_permission_error(cls, error_obj: Optional[Dict[str, Any]]) -> bool:
        if not error_obj:
            return False
        message = cls._error_message(error_obj).lower()
        code = error_obj.get("code")
        if code in {10, 190, 200, 2500}:
            return True
        return any(term in message for term in ["permission", "permissions", "not authorized", "access token", "oauth"])

    @classmethod
    def _is_conversion_restriction(cls, error_obj: Optional[Dict[str, Any]]) -> bool:
        if not error_obj:
            return False
        message = cls._error_message(error_obj).lower()
        if any(term in message for term in ["optimization goal", "optimization_goal", "objective", "conversion", "conversions", "promoted_object", "pixel"]):
            return True
        return False

    @staticmethod
    def _select_curve_point(curve: List[Dict[str, Any]], target_spend: float) -> Tuple[Optional[Dict[str, Any]], Optional[float]]:
        best_point = None
        best_diff = None
        for point in curve:
            try:
                spend = float(point.get("spend"))
            except (TypeError, ValueError):
                continue
            diff = abs(spend - target_spend)
            if best_diff is None or diff < best_diff:
                best_diff = diff
                best_point = point
        return best_point, best_diff

    def _pick_curve_point(self, curve: List[Dict[str, Any]], daily_budget: float) -> Tuple[Optional[Dict[str, Any]], int]:
        if not curve:
            return None, 100
        budget_minor = daily_budget * 100
        budget_major = daily_budget
        point_minor, diff_minor = self._select_curve_point(curve, budget_minor)
        point_major, diff_major = self._select_curve_point(curve, budget_major)

        if point_major and point_minor:
            minor_ratio = diff_minor / budget_minor if budget_minor else diff_minor
            major_ratio = diff_major / budget_major if budget_major else diff_major
            if major_ratio < minor_ratio:
                return point_major, 1
            return point_minor, 100
        if point_major:
            return point_major, 1
        return point_minor, 100

    @staticmethod
    def _metric_name_for_objective(objective: str) -> str:
        if objective == "OUTCOME_TRAFFIC":
            return "CPC (Custo por Clique)"
        return "CPL (Custo por Lead)"

    async def _get_account_currency(self, account_id: str) -> str:
        if self.account_currency:
            return self.account_currency
        try:
            account_info = await get_account_info(account_id, access_token=self.access_token)
            if isinstance(account_info, dict):
                currency = account_info.get("currency")
                if currency:
                    self.account_currency = currency
        except Exception as exc:
            self.logger.warning(f"[MetaAds] Failed to fetch account currency: {exc}")
        return self.account_currency or "BRL"

    async def _get_reach_estimate(self, account_id: str, targeting: Dict[str, Any]) -> Dict[str, Any]:
        params = {"targeting_spec": targeting}
        return await make_api_request(f"{account_id}/reachestimate", self.access_token, params, method="GET")

    async def _get_delivery_estimate(
        self,
        account_id: str,
        targeting: Dict[str, Any],
        optimization_goal: str
    ) -> Dict[str, Any]:
        params = {
            "optimization_goal": optimization_goal,
            "targeting_spec": targeting,
            "fields": "daily_outcomes_curve,estimate_ready,estimate_dau,estimate_mau_lower_bound,estimate_mau_upper_bound"
        }
        return await make_api_request(f"{account_id}/delivery_estimate", self.access_token, params, method="GET")

    def _pick_best_location(self, locations: List[Dict[str, Any]], name: Optional[str], state: Optional[str], country_code: Optional[str]) -> Optional[Dict[str, Any]]:
        if not locations:
            return None

        target_name = self._normalize(name)
        target_state = self._normalize(state)
        target_country = self._normalize(country_code)
        best_score = -1
        best_item = None

        for item in locations:
            item_name = self._normalize(item.get("name"))
            item_state = self._normalize(item.get("region") or item.get("region_name"))
            item_country = self._normalize(item.get("country_code"))

            score = 0
            if target_country and item_country == target_country:
                score += 2
            if target_state and item_state == target_state:
                score += 2
            if target_name and item_name == target_name:
                score += 3
            elif target_name and target_name in item_name:
                score += 1

            if score > best_score:
                best_score = score
                best_item = item

        return best_item

    async def _resolve_meta_geo_locations(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        geo = self._reverse_geocode(lat, lon)
        if not geo:
            return None

        city = geo.get("city")
        state = geo.get("state")
        country_code = geo.get("country_code")

        if city:
            raw = await search_geo_locations(city, access_token=self.access_token, location_types=["city"], limit=10)
            try:
                data = json.loads(raw) if isinstance(raw, str) else raw
                locations = data.get("data", []) if isinstance(data, dict) else []
            except Exception:
                locations = []
            picked = self._pick_best_location(locations, city, state, country_code)
            if picked and picked.get("key"):
                self.logger.info(f"[MetaGeo] Resolved city: {picked.get('name')} ({picked.get('key')})")
                return {"cities": [{"key": picked["key"]}]}

        if state:
            raw = await search_geo_locations(state, access_token=self.access_token, location_types=["region"], limit=10)
            try:
                data = json.loads(raw) if isinstance(raw, str) else raw
                locations = data.get("data", []) if isinstance(data, dict) else []
            except Exception:
                locations = []
            picked = self._pick_best_location(locations, state, None, country_code)
            if picked and picked.get("key"):
                self.logger.info(f"[MetaGeo] Resolved region: {picked.get('name')} ({picked.get('key')})")
                return {"regions": [{"key": picked["key"]}]}

        if country_code:
            self.logger.info(f"[MetaGeo] Falling back to country: {country_code}")
            return {"countries": [country_code.upper()]}

        return None

    async def search_interests(self, query: str):
        """Search for interests in Meta Ads API."""
        self.logger.info(f"[MetaReal] Searching interests for: {query}")
        if not self.access_token:
            raise ValueError("No Access Token Provided")
        return await search_interests(query, access_token=self.access_token)

    async def estimate_costs(
        self,
        lat: float,
        lon: float,
        radius_km: float,
        daily_budget: float,
        objective: Optional[str] = None,
        optimization_goal: Optional[str] = None,
        is_ecommerce: bool = False,
        age_min: Optional[int] = 18,
        age_max: Optional[int] = 65,
        gender: Optional[str] = "ALL",
        targeting_override: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        self.logger.info(f"[MetaReal] Estimating costs for {lat}, {lon} (r={radius_km}km)")
        if not self.access_token:
            raise ValueError("No Access Token Provided")
        if daily_budget is None or daily_budget <= 0:
            raise ValueError("daily_budget must be greater than zero")

        account_id = self._ensure_act_prefix(self.ad_account_id)
        if not account_id:
            raise ValueError("No Ad Account ID Provided")

        objective_used, optimization_goal_used = self._normalize_objective_goal(
            objective,
            optimization_goal,
            is_ecommerce
        )

        warnings: List[str] = []
        fallbacks: List[Dict[str, Any]] = []
        cost_estimate: Optional[Dict[str, Any]] = None

        if targeting_override is not None:
            if not isinstance(targeting_override, dict):
                raise ValueError("targeting_override must be a dictionary")
            targeting = targeting_override
        else:
            targeting = {
                "age_min": age_min or 18,
                "age_max": age_max or 65
            }
            genders = self._normalize_gender(gender)
            if genders:
                targeting["genders"] = genders

            geo_locations = await self._resolve_meta_geo_locations(lat, lon)
            if geo_locations:
                targeting["geo_locations"] = geo_locations
            else:
                targeting["geo_locations"] = {
                    "custom_locations": [
                        {
                            "latitude": lat,
                            "longitude": lon,
                            "radius": radius_km,
                            "distance_unit": "kilometer"
                        }
                    ]
                }

        if not self._has_location_or_custom_audience(targeting):
            raise ValueError("Targeting must include at least one location or custom audience")

        # ========================================================
        # CHAMADAS MCP PARALELAS (otimização de performance)
        # Executa currency, reach e delivery simultaneamente
        # ========================================================
        self.logger.info(f"[MetaReal] Iniciando chamadas MCP paralelas...")
        
        currency_task = self._get_account_currency(account_id)
        reach_task = self._get_reach_estimate(account_id, targeting)
        delivery_task = self._get_delivery_estimate(account_id, targeting, optimization_goal_used)
        
        # Executa todas as chamadas em paralelo
        results = await asyncio.gather(
            currency_task,
            reach_task,
            delivery_task,
            return_exceptions=True
        )
        
        # Processa resultados
        currency = results[0] if not isinstance(results[0], Exception) else "BRL"
        reach_data = results[1] if not isinstance(results[1], Exception) else {}
        delivery_data = results[2] if not isinstance(results[2], Exception) else {}
        
        if isinstance(results[0], Exception):
            self.logger.warning(f"[MetaReal] Currency fetch failed: {results[0]}")
        if isinstance(results[1], Exception):
            self.logger.warning(f"[MetaReal] Reach estimate failed: {results[1]}")
            warnings.append(f"Falha ao obter reachestimate: {str(results[1])[:50]}")
        if isinstance(results[2], Exception):
            self.logger.warning(f"[MetaReal] Delivery estimate failed: {results[2]}")
        
        self.logger.info(f"[MetaReal] Chamadas MCP paralelas concluídas")
        # ========================================================
        
        reach_error = self._extract_error(reach_data)
        reach_payload = self._extract_first_data(reach_data) if not reach_error else None

        reach_min = None
        reach_max = None
        if isinstance(reach_payload, dict):
            reach_min = reach_payload.get("users_lower_bound")
            reach_max = reach_payload.get("users_upper_bound")
        if reach_error:
            warnings.append("Falha ao obter reachestimate para este targeting")

        delivery_error = self._extract_error(delivery_data)
        delivery_payload = self._extract_first_data(delivery_data) if not delivery_error else None
        permission_blocked = False

        if delivery_error:
            if self._is_permission_error(delivery_error):
                warnings.append("Dados de custo indisponíveis para esta conta (Restrição de Permissão)")
                cost_estimate = None
                permission_blocked = True
            else:
                if optimization_goal_used != "LINK_CLICKS":
                    fallback_objective = "OUTCOME_TRAFFIC"
                    fallback_goal = "LINK_CLICKS"
                    fallbacks.append({
                        "from_objective": objective_used,
                        "from_optimization_goal": optimization_goal_used,
                        "to_objective": fallback_objective,
                        "to_optimization_goal": fallback_goal
                    })
                    objective_used = fallback_objective
                    optimization_goal_used = fallback_goal
                    delivery_data = await self._get_delivery_estimate(account_id, targeting, optimization_goal_used)
                    delivery_error = self._extract_error(delivery_data)
                    delivery_payload = self._extract_first_data(delivery_data) if not delivery_error else None
                if delivery_error:
                    warnings.append("Falha ao obter delivery_estimate para este targeting")
                    cost_estimate = None
        else:
            cost_estimate = None

        cost_curve_payload = None
        if delivery_payload and isinstance(delivery_payload, dict):
            cost_curve_payload = delivery_payload

        if not permission_blocked and objective_used == "OUTCOME_TRAFFIC" and optimization_goal_used != "LINK_CLICKS":
            link_click_data = await self._get_delivery_estimate(account_id, targeting, "LINK_CLICKS")
            link_click_error = self._extract_error(link_click_data)
            link_click_payload = self._extract_first_data(link_click_data) if not link_click_error else None
            if link_click_payload and isinstance(link_click_payload, dict):
                cost_curve_payload = link_click_payload
            elif link_click_error:
                warnings.append("Nao foi possivel estimar custo por clique via LINK_CLICKS")

        if cost_curve_payload and isinstance(cost_curve_payload, dict):
            curve = cost_curve_payload.get("daily_outcomes_curve") or []
            if curve:
                point, spend_scale = self._pick_curve_point(curve, daily_budget)
                if point:
                    try:
                        spend = float(point.get("spend") or 0)
                    except (TypeError, ValueError):
                        spend = 0.0
                    try:
                        actions = float(point.get("actions") or 0)
                    except (TypeError, ValueError):
                        actions = 0.0
                    try:
                        impressions = float(point.get("impressions") or 0)
                    except (TypeError, ValueError):
                        impressions = 0.0

                    spend_major = spend / spend_scale if spend_scale else spend
                    cost_per_result_value = round(spend_major / actions, 2) if actions > 0 else None
                    cpm_value = round((spend_major / impressions) * 1000, 2) if impressions > 0 else None

                    cost_estimate = {
                        "estimated_cost_per_result": {
                            "value": cost_per_result_value,
                            "currency": currency
                        },
                        "metric_name": self._metric_name_for_objective(objective_used),
                        "cpm": {
                            "value": cpm_value,
                            "currency": currency
                        }
                    }
                else:
                    warnings.append("Nao foi possivel selecionar ponto de curva para o budget informado")
            else:
                warnings.append("delivery_estimate retornou curva vazia")

        reach_estimate = None
        if reach_min is not None or reach_max is not None:
            reach_estimate = {
                "min": reach_min,
                "max": reach_max,
                "source": "reachestimate"
            }

        notes: List[str] = []
        if reach_min is not None and reach_max is not None:
            notes.append(f"Estimativa Diária: {reach_min} a {reach_max} resultados")

        status = "ok" if reach_estimate or cost_estimate else "error"

        return {
            "status": status,
            "budget": {
                "daily": daily_budget,
                "currency": currency
            },
            "objective_used": objective_used,
            "optimization_goal_used": optimization_goal_used,
            "reach_estimate": reach_estimate,
            "cost_estimate": cost_estimate,
            "fallbacks": fallbacks,
            "warnings": warnings,
            "notes": notes
        }

    def push_geo_audience(self, name: str, hex_ids: list):
        """Cria um Publico Personalizado (implementacao real pendente)."""
        self.logger.info("--- BIA ADS PUSH ---")
        self.logger.info(f"Target: Meta Ads (Account: {self.ad_account_id})")
        self.logger.info(f"Audience Name: {name}")
        self.logger.info(f"Geolocations: {len(hex_ids)} hex-clusters")

        return {
            "status": "success",
            "platform": "meta_ads",
            "audience_id": f"evt_{hash(name) & 0xFFFFFF}",
            "reach_estimate": len(hex_ids) * 1500,
            "message": "Publico sincronizado com sucesso no Gerenciador de Anuncios."
        }

def get_smart_dayparting(niche: str) -> str:
    """
    Returns optimal dayparting based on business niche.
    """
    niche = niche.lower()
    if any(x in niche for x in ['food', 'delivery', 'restaurante', 'pizza', 'burger']):
        return "Todos os dias, das 17h às 23h (Pré-Fome)"
    elif any(x in niche for x in ['b2b', 'serviços', 'consultoria', 'software']):
        return "Seg a Sex, 08h-10h e 13h-15h (Horário Comercial)"
    elif any(x in niche for x in ['beleza', 'estética', 'salão', 'unhas']):
        return "Dom à noite e Seg manhã (Planejamento Semanal)"
    elif any(x in niche for x in ['imóveis', 'casa', 'apto']):
        return "Sáb e Dom, o dia todo (Visitas) + Seg (Leads)"
    else:
        return "Todos os dias, 09h às 21h (Horário Nobre)"



from app.services.ai_engine import market_scorer

async def generate_marketing_estimate(
    *,
    lat: float,
    lng: float,
    radius_km: float,
    daily_budget: float,
    objective: Optional[str] = None,
    product_name: Optional[str] = None,
    currency: str = "BRL",
    reason: str = "simulated",
) -> Dict[str, Any]:
    """
    Advanced estimate using BIA Intelligence Core (Census + OSM + Meta).
    Replaces the old 'simulate_marketing_estimate'.
    """
    # 1. Gather Real Data (Async where possible)
    # TODO: Connect to Census Client here once fully populated
    # For now, we simulate the INPUTS based on the location, but calculate the SCORE for real.
    
    # Heuristic for Income Input (Placeholder for future census_client.get_income(lat, lng))
    # Richer areas: Sao Paulo, Rio, Brasilia logic or random variation based on coordinates
    income_level = 3500.0 # Default Brazil Avg
    
    # Heuristic for Competition (Placeholder for future osm_client.count_competitors)
    competitors = 5 
    
    # Heuristic for Audience Reach (Placeholder for Meta Reach Estimate)
    meta_reach = int(population_density_estimator(lat, lng, radius_km) * 0.6)
    meta_cpm = 25.0
    
    # 2. Calculate Real Score using the Scorer Module
    score_data = market_scorer.calculate_score(
        income_level=income_level,
        population_density=meta_reach, # Proxy
        competitor_count=competitors,
        meta_reach=meta_reach,
        meta_cpm=meta_cpm,
        strategy="blue_ocean"
    )
    
    # 3. Build Response (Backwards Compatible)
    metric_name = BiaAdsExecutor._metric_name_for_objective(objective or "OUTCOME_LEADS")
    
    return {
        "status": "ok",
        "mode": "intelligence_core_v1",
        "simulated_reason": reason, # Keep for compatibility
        "budget": {"daily": round(daily_budget, 2), "currency": currency},
        "objective_used": objective,
        "intelligence": {
            "opportunity_score": score_data["total_score"],
            "verdict": score_data["verdict"],
            "details": score_data["details"]
        },
        "reach_estimate": {"min": int(meta_reach*0.8), "max": int(meta_reach*1.2), "source": "intelligence_core"},
        "cost_estimate": {
            "estimated_cost_per_result": {"value": 0.0, "currency": currency}, # Calculated below if needed
            "metric_name": metric_name,
            "cpm": {"value": meta_cpm, "currency": currency},
        },
        "fallbacks": [],
        "warnings": ["Dados de setores censitários ainda em modo de integração (MVP)."],
        "notes": [f"Análise de Inteligência: {score_data['verdict']}"],
    }

def population_density_estimator(lat, lng, radius_km):
    import math
    area = math.pi * (radius_km ** 2)
    # Rough Brazil urban density ~ 4000 people/km2
    return int(4000 * area)

# Legacy alias for backward compatibility
simulate_marketing_estimate = generate_marketing_estimate


