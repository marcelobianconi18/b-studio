#!/usr/bin/env python3
"""
Script de Análise Completa de Público - Professor Lemos
Facebook Page ID: 416436651784721

Versão melhorada com tratamento de erros e endpoints alternativos
"""

import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional
import facebook

# Carregar variáveis de ambiente
load_dotenv()

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Perfil do Professor Lemos
PROFESSOR_LEMOS_PAGE_ID = "416436651784721"
PROFESSOR_LEMOS_NAME = "Professor Lemos"

# Token e API
FACEBOOK_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
BASE_GRAPH_URL = "https://graph.facebook.com/v22.0"

# Período de análise (últimos 90 dias)
DAYS_TO_ANALYZE = 90
SINCE_DATE = (datetime.now() - timedelta(days=DAYS_TO_ANALYZE)).strftime("%Y-%m-%d")
UNTIL_DATE = datetime.now().strftime("%Y-%m-%d")

# ============================================================================
# CLIENTE API
# ============================================================================

class MetaInsightsClient:
    """Cliente para coletar insights do Facebook, Instagram e Ads."""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = BASE_GRAPH_URL
        self.graph = facebook.GraphAPI(access_token=access_token) if access_token else None
        
    def _make_request(self, endpoint: str, params: Dict = None, post_method: bool = False) -> Dict:
        """Faz requisição para a Graph API."""
        url = f"{self.base_url}/{endpoint}"
        if params is None:
            params = {}
        params["access_token"] = self.access_token
        
        try:
            if post_method:
                response = requests.post(url, params=params, timeout=30)
            else:
                response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = f"{error_msg} - {error_data.get('error', {}).get('message', 'Unknown')}"
                except:
                    pass
            return {"error": error_msg, "status_code": getattr(e, 'response', None)}
    
    def verify_token(self) -> Dict:
        """Verifica se o token é válido e retorna informações do usuário."""
        try:
            me = self.graph.get_object("me")
            return {"valid": True, "data": me}
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def get_token_info(self) -> Dict:
        """Obtém informações sobre o token atual (permissões, expiry, etc)."""
        return self._make_request("me/permissions")
    
    # ========================================================================
    # FACEBOOK PAGE INSIGHTS
    # ========================================================================
    
    def get_facebook_page_info(self, page_id: str) -> Dict:
        """Obtém informações básicas da página."""
        fields = ",".join([
            "id", "name", "username", "category", "followers_count", "likes",
            "about", "website", "emails", "phone", "location", "verification_status",
            "fan_count", "talking_about_count", "were_here_count"
        ])
        return self._make_request(page_id, {"fields": fields})
    
    def get_facebook_insights_detailed(self, page_id: str) -> Dict:
        """
        Obtém TODAS as métricas disponíveis da página.
        """
        # Lista completa de métricas disponíveis para páginas
        metrics = ",".join([
            # Alcance e Impressões
            "page_impressions",
            "page_impressions_unique",
            "page_impressions_paid",
            "page_impressions_organic",
            "page_engaged_users",
            "page_consumptions",
            "page_consumptions_unique",
            
            # Seguidores
            "page_fans",
            "page_fans_unique",
            "page_fan_adds",
            "page_fan_removes",
            "page_fan_adds_unique",
            "page_fan_removes_unique",
            "page_followers",
            
            # Engajamento
            "page_post_engagements",
            "page_engaged_users",
            "page_negative_feedback",
            "page_positive_feedback_by_type",
            "page_places_checkin_total",
            
            # Vídeo
            "page_video_views",
            "page_video_views_unique",
            
            # Cliques
            "page_clicks",
            "page_clicks_by_type",
            
            # Demografia (lifetime)
            "page_fans_gender_age",
            "page_fans_city",
            "page_fans_country",
            "page_fans_locale"
        ])
        
        # Métricas diárias (com período)
        daily_params = {
            "metric": metrics,
            "period": "day",
            "since": SINCE_DATE,
            "until": UNTIL_DATE
        }
        daily_result = self._make_request(f"{page_id}/insights", daily_params)
        
        # Métricas lifetime (acumuladas totais)
        lifetime_metrics = ",".join([
            "page_fans",
            "page_followers",
            "page_fans_gender_age",
            "page_fans_city",
            "page_fans_country"
        ])
        lifetime_params = {
            "metric": lifetime_metrics,
            "period": "lifetime"
        }
        lifetime_result = self._make_request(f"{page_id}/insights", lifetime_params)
        
        return {
            "daily": daily_result,
            "lifetime": lifetime_result
        }
    
    def get_facebook_posts_detailed(self, page_id: str, limit: int = 50) -> Dict:
        """
        Obtém posts recentes com TODAS as métricas disponíveis.
        """
        fields = ",".join([
            "id",
            "message",
            "created_time",
            "updated_time",
            "full_picture",
            "permalink_url",
            "status_type",
            "type",
            "shares",
            "likes.summary(true)",
            "comments.summary(true)",
            "reactions.summary(true)",
            "reactions.type(LIKE).summary(true)",
            "reactions.type(LOVE).summary(true)",
            "reactions.type(WOW).summary(true)",
            "reactions.type(HAHA).summary(true)",
            "reactions.type(SAD).summary(true)",
            "reactions.type(ANGRY).summary(true)",
            # Insights dos posts
            "insights.metric(post_impressions,post_impressions_unique,post_impressions_paid,post_impressions_organic,post_engaged_users,post_clicks,post_clicks_unique,post_negative_feedback,post_positive_feedback,post_video_views,post_video_views_unique,post_video_complete_views_30s,post_video_avg_time_watched)"
        ])
        
        params = {
            "fields": fields,
            "limit": limit,
            "since": SINCE_DATE,
            "until": UNTIL_DATE
        }
        return self._make_request(f"{page_id}/posts", params)
    
    def get_facebook_videos(self, page_id: str, limit: int = 30) -> Dict:
        """Obtém vídeos da página com métricas detalhadas."""
        fields = ",".join([
            "id",
            "title",
            "description",
            "created_time",
            "permalink_url",
            "thumbnail_url",
            "length",
            "views",
            "reactions.summary(true)",
            "shares",
            "comments.summary(true)",
            "insights.metric(video_views,video_views_unique,video_view_time,video_avg_time_watched,video_retention_graph,video_complete_views_30s)"
        ])
        
        params = {
            "fields": fields,
            "limit": limit,
            "since": SINCE_DATE,
            "until": UNTIL_DATE
        }
        return self._make_request(f"{page_id}/videos", params)
    
    def get_facebook_photos(self, page_id: str, limit: int = 30) -> Dict:
        """Obtém fotos da página com métricas."""
        fields = ",".join([
            "id",
            "created_time",
            "name",
            "picture",
            "full_picture",
            "permalink_url",
            "likes.summary(true)",
            "comments.summary(true)",
            "shares",
            "insights.metric(post_impressions,post_impressions_unique,post_engaged_users)"
        ])
        
        params = {
            "fields": fields,
            "limit": limit,
            "since": SINCE_DATE,
            "until": UNTIL_DATE
        }
        return self._make_request(f"{page_id}/photos", params)
    
    # ========================================================================
    # INSTAGRAM INSIGHTS
    # ========================================================================
    
    def get_instagram_account(self, page_id: str) -> Optional[Dict]:
        """Obtém a conta do Instagram conectada à página."""
        fields = "instagram_business_account"
        result = self._make_request(page_id, {"fields": fields})
        
        if "instagram_business_account" in result:
            return result["instagram_business_account"]
        return None
    
    def get_instagram_detailed_info(self, ig_id: str) -> Dict:
        """Obtém informações detalhadas do Instagram."""
        fields = ",".join([
            "id",
            "username",
            "name",
            "biography",
            "website",
            "followers_count",
            "follows_count",
            "media_count",
            "profile_picture_url",
            "is_verified",
            "is_business_account",
            "business_category_name",
            "category",
            "business_email",
            "business_phone_number",
            "business_address_json"
        ])
        return self._make_request(ig_id, {"fields": fields})
    
    def get_instagram_insights_detailed(self, ig_id: str) -> Dict:
        """
        Obtém TODOS os insights disponíveis do Instagram.
        """
        # Métricas diárias
        daily_metrics = ",".join([
            "impressions",
            "reach",
            "profile_views",
            "website_clicks",
            "email_button_clicks",
            "get_directions_clicks",
            "text_message_clicks",
            "call_button_clicks",
            "follower_count"
        ])
        
        daily_params = {
            "metric": daily_metrics,
            "period": "day",
            "since": SINCE_DATE,
            "until": UNTIL_DATE
        }
        daily_result = self._make_request(f"{ig_id}/insights", daily_params)
        
        # Métricas de conteúdo (lifetime)
        content_metrics = ",".join([
            "online_followers",
            "total_interactions",
            "accounts_engaged"
        ])
        
        content_params = {
            "metric": content_metrics,
            "period": "lifetime"
        }
        content_result = self._make_request(f"{ig_id}/insights", content_params)
        
        # Demografia
        demo_metrics = ",".join([
            "audience_gender_age",
            "audience_city",
            "audience_country",
            "audience_locale"
        ])
        
        demo_params = {
            "metric": demo_metrics,
            "period": "lifetime"
        }
        demo_result = self._make_request(f"{ig_id}/insights", demo_params)
        
        return {
            "daily": daily_result,
            "content": content_result,
            "demographics": demo_result
        }
    
    def get_instagram_media_detailed(self, ig_id: str, limit: int = 30) -> Dict:
        """Obtém posts do Instagram com TODAS as métricas."""
        fields = ",".join([
            "id",
            "caption",
            "media_url",
            "media_type",
            "media_product_type",
            "timestamp",
            "permalink",
            "username",
            "comments_count",
            "like_count",
            "owner",
            "is_comment_enabled",
            "children{media_url,media_type}",
            "insights.metric(impressions,reach,saved,video_views,engagement,exits,replies,forward,taps_back,navigation)"
        ])
        
        params = {
            "fields": fields,
            "limit": limit,
            "since": SINCE_DATE,
            "until": UNTIL_DATE
        }
        return self._make_request(f"{ig_id}/media", params)
    
    def get_instagram_stories_insights(self, ig_id: str) -> Dict:
        """Obtém insights de Stories (requer permissões especiais)."""
        # Stories têm endpoint separado
        fields = ",".join([
            "id",
            "media_url",
            "media_type",
            "timestamp",
            "expiration_timestamp",
            "insights.metric(impressions,reach,replies,exits,completion_rate)"
        ])
        
        # Nota: Stories expiram em 24h, então não usamos since/until
        params = {
            "fields": fields,
            "limit": 10
        }
        return self._make_request(f"{ig_id}/stories", params)
    
    # ========================================================================
    # ADS INSIGHTS
    # ========================================================================
    
    def get_ad_accounts(self) -> List[Dict]:
        """Obtém todas as contas de anúncios associadas."""
        fields = "adaccounts"
        result = self._make_request("me", {"fields": fields})
        
        if "adaccounts" in result and result["adaccounts"].get("data"):
            return result["adaccounts"]["data"]
        return []
    
    def get_ads_insights_detailed(self, ad_account_id: str) -> Dict:
        """
        Obtém insights detalhados de anúncios.
        """
        # Campos principais
        fields = ",".join([
            "campaign_id",
            "campaign_name",
            "adset_id",
            "adset_name",
            "ad_id",
            "ad_name",
            "impressions",
            "reach",
            "clicks",
            "ctr",
            "cpc",
            "cpm",
            "spend",
            "actions",
            "action_values",
            "conversions",
            "frequency",
            "video_p100_watched_actions",
            "video_p75_watched_actions",
            "video_p50_watched_actions",
            "video_p25_watched_actions",
            "video_avg_time_watched_actions",
            "post_engagement",
            "page_engagement",
            "post_reactions_by_type_total",
            "video_views",
            "unique_clicks",
            "unique_ctr",
            "cpp",
            "cost_per_action_type",
            "conversion_values",
            "roas"
        ])
        
        params = {
            "fields": fields,
            "time_range": json.dumps({
                "since": SINCE_DATE,
                "until": UNTIL_DATE
            }),
            "level": "ad",
            "limit": 500,
            "filtering": json.dumps([
                {"field": "impressions", "operator": "GREATER_THAN", "value": "0"}
            ])
        }
        
        insights_result = self._make_request(f"{ad_account_id}/insights", params)
        
        # Dados demográficos separados (breakdowns)
        breakdowns_data = {}
        
        # Por idade e gênero
        age_gender_params = {
            "fields": "impressions,reach,clicks,spend,actions",
            "time_range": json.dumps({
                "since": SINCE_DATE,
                "until": UNTIL_DATE
            }),
            "level": "ad",
            "breakdowns": "age,gender",
            "limit": 200
        }
        breakdowns_data["age_gender"] = self._make_request(f"{ad_account_id}/insights", age_gender_params)
        
        # Por localização
        location_params = {
            "fields": "impressions,reach,clicks,spend",
            "time_range": json.dumps({
                "since": SINCE_DATE,
                "until": UNTIL_DATE
            }),
            "level": "ad",
            "breakdowns": "country,region,city,dma",
            "limit": 200
        }
        breakdowns_data["location"] = self._make_request(f"{ad_account_id}/insights", location_params)
        
        # Por plataforma/dispositivo
        platform_params = {
            "fields": "impressions,reach,clicks,spend",
            "time_range": json.dumps({
                "since": SINCE_DATE,
                "until": UNTIL_DATE
            }),
            "level": "ad",
            "breakdowns": "platform_position,impression_device,publisher_platform",
            "limit": 200
        }
        breakdowns_data["platform"] = self._make_request(f"{ad_account_id}/insights", platform_params)
        
        return {
            "insights": insights_result,
            "breakdowns": breakdowns_data
        }
    
    def get_ad_campaigns(self, ad_account_id: str) -> Dict:
        """Obtém lista de campanhas ativas."""
        fields = ",".join([
            "id",
            "name",
            "status",
            "objective",
            "created_time",
            "start_time",
            "stop_time",
            "budget_remaining",
            "daily_budget",
            "lifetime_budget",
            "insights.metric(impressions,reach,clicks,spend,actions)"
        ])
        
        params = {
            "fields": fields,
            "limit": 100,
            "effective_status": ["ACTIVE", "PAUSED", "DELETED"]
        }
        return self._make_request(f"{ad_account_id}/campaigns", params)
    
    def get_ad_creatives(self, ad_account_id: str) -> Dict:
        """Obtém criativos dos anúncios."""
        fields = ",".join([
            "id",
            "name",
            "body",
            "headline",
            "call_to_action_type",
            "image_url",
            "video_url",
            "thumbnail_url",
            "object_story_spec",
            "status"
        ])
        
        params = {
            "fields": fields,
            "limit": 100
        }
        return self._make_request(f"{ad_account_id}/adcreatives", params)


# ============================================================================
# ANALISADOR DE DADOS
# ============================================================================

class AudienceAnalyzer:
    """Analisa e formata os dados de público coletados."""
    
    def __init__(self, client: MetaInsightsClient):
        self.client = client
    
    def _safe_get(self, data: Dict, *keys, default=None):
        """Acesso seguro a dados aninhados."""
        for key in keys:
            if isinstance(data, dict):
                data = data.get(key, default)
            else:
                return default
        return data if data is not None else default
    
    def _parse_insights_data(self, insights_data: Dict) -> Dict:
        """Processa dados de insights brutos."""
        result = {
            "daily_metrics": [],
            "totals": {},
            "averages": {}
        }
        
        if not insights_data or "error" in insights_data:
            return result
        
        # Processar dados diários
        if "daily" in insights_data and "data" in insights_data["daily"]:
            metrics_data = {}
            
            for metric in insights_data["daily"]["data"]:
                name = metric.get("name", "")
                values = metric.get("values", [])
                
                # Extrair valores
                metric_values = []
                for v in values:
                    val = v.get("value", 0)
                    if isinstance(val, (int, float)):
                        metric_values.append({
                            "date": v.get("end_time", "")[:10] if v.get("end_time") else "",
                            "value": val
                        })
                
                metrics_data[name] = metric_values
                
                # Calcular totais
                total = sum(m["value"] for m in metric_values)
                result["totals"][name] = total
                
                # Calcular médias
                if metric_values:
                    result["averages"][name] = round(total / len(metric_values), 2)
            
            result["daily_metrics"] = metrics_data
        
        # Processar dados lifetime
        if "lifetime" in insights_data and "data" in insights_data["lifetime"]:
            for metric in insights_data["lifetime"]["data"]:
                name = metric.get("name", "")
                values = metric.get("values", [])
                
                if values:
                    val = values[0].get("value", 0)
                    result["totals"][f"lifetime_{name}"] = val
                    
                    # Dados demográficos
                    if isinstance(val, dict):
                        result["demographics"] = self._parse_demographics_from_dict({name: val})
        
        return result
    
    def _parse_demographics_from_dict(self, data: Dict) -> Dict:
        """Processa dados demográficos de um dicionário."""
        result = {
            "age_gender": [],
            "countries": [],
            "cities": [],
            "languages": []
        }
        
        for key, value in data.items():
            if not isinstance(value, dict):
                continue
                
            if "gender_age" in key or key == "page_fans_gender_age":
                # Processar idade e gênero
                age_groups = {}
                for ga_key, count in value.items():
                    if "." in ga_key:
                        parts = ga_key.split(".")
                        if len(parts) == 2:
                            gender, age = parts
                            if age not in age_groups:
                                age_groups[age] = {"male": 0, "female": 0, "total": 0}
                            
                            if gender == "M":
                                age_groups[age]["male"] = count
                            elif gender == "F":
                                age_groups[age]["female"] = count
                            age_groups[age]["total"] += count
                
                total_fans = sum(ag["total"] for ag in age_groups.values())
                
                for age in sorted(age_groups.keys()):
                    counts = age_groups[age]
                    result["age_gender"].append({
                        "range": age,
                        "male": counts["male"],
                        "female": counts["female"],
                        "total": counts["total"],
                        "male_pct": round((counts["male"] / total_fans) * 100, 1) if total_fans > 0 else 0,
                        "female_pct": round((counts["female"] / total_fans) * 100, 1) if total_fans > 0 else 0
                    })
            
            elif "country" in key or key == "page_fans_country":
                total = sum(value.values())
                for country, count in sorted(value.items(), key=lambda x: x[1], reverse=True)[:20]:
                    result["countries"].append({
                        "code": country,
                        "count": count,
                        "percentage": round((count / total) * 100, 2) if total > 0 else 0
                    })
            
            elif "city" in key or key == "page_fans_city":
                total = sum(value.values())
                for city, count in sorted(value.items(), key=lambda x: x[1], reverse=True)[:30]:
                    result["cities"].append({
                        "name": city,
                        "count": count,
                        "percentage": round((count / total) * 100, 2) if total > 0 else 0
                    })
        
        return result
    
    def analyze_facebook_page(self, page_id: str) -> Dict:
        """Analisa completamente uma página do Facebook."""
        print(f"\n📘 Analisando Facebook Page: {page_id}")
        
        # Informações básicas
        page_info = self.client.get_facebook_page_info(page_id)
        
        # Insights detalhados
        insights = self.client.get_facebook_insights_detailed(page_id)
        insights_parsed = self._parse_insights_data(insights)
        
        # Posts
        posts = self.client.get_facebook_posts_detailed(page_id, limit=30)
        
        # Vídeos
        videos = self.client.get_facebook_videos(page_id, limit=20)
        
        # Fotos
        photos = self.client.get_facebook_photos(page_id, limit=20)
        
        # Processar posts
        posts_analysis = []
        if "data" in posts:
            for post in posts["data"][:20]:
                post_data = {
                    "id": post.get("id", ""),
                    "message": (post.get("message", "") or "")[:150],
                    "created_time": post.get("created_time", ""),
                    "type": post.get("type", ""),
                    "status_type": post.get("status_type", ""),
                    "permalink": post.get("permalink_url", ""),
                    "reactions": self._safe_get(post, "reactions", "summary", "total_count", default=0),
                    "comments": self._safe_get(post, "comments", "summary", "total_count", default=0),
                    "shares": self._safe_get(post, "shares", "count", default=0),
                    "impressions": 0,
                    "reach": 0,
                    "engagement_rate": 0
                }
                
                # Extrair insights do post
                if "insights" in post and "data" in post["insights"]:
                    for m in post["insights"]["data"]:
                        if m["values"]:
                            val = m["values"][0].get("value", 0)
                            if m["name"] == "post_impressions_unique":
                                post_data["reach"] = val
                            elif m["name"] == "post_impressions":
                                post_data["impressions"] = val
                
                # Calcular engajamento
                total_eng = post_data["reactions"] + post_data["comments"] + post_data["shares"]
                reach = post_data["reach"] or post_data["impressions"] or 1
                post_data["engagement_rate"] = round((total_eng / reach) * 100, 2)
                
                posts_analysis.append(post_data)
        
        # Processar vídeos
        videos_analysis = []
        if "data" in videos:
            for video in videos["data"][:10]:
                video_data = {
                    "id": video.get("id", ""),
                    "title": (video.get("title", "") or video.get("description", "") or "")[:100],
                    "created_time": video.get("created_time", ""),
                    "permalink": video.get("permalink_url", ""),
                    "length": video.get("length", 0),
                    "views": video.get("views", 0),
                    "reactions": self._safe_get(video, "reactions", "summary", "total_count", default=0),
                    "shares": self._safe_get(video, "shares", "count", default=0),
                    "comments": self._safe_get(video, "comments", "summary", "total_count", default=0)
                }
                videos_analysis.append(video_data)
        
        return {
            "platform": "Facebook",
            "page_info": page_info,
            "insights": insights_parsed,
            "content": {
                "posts": posts_analysis,
                "videos": videos_analysis
            }
        }
    
    def analyze_instagram(self, page_id: str) -> Optional[Dict]:
        """Analisa conta do Instagram conectada."""
        print(f"\n📷 Analisando Instagram conectado à página: {page_id}")
        
        # Obter conta do Instagram
        ig_account = self.client.get_instagram_account(page_id)
        
        if not ig_account or "error" in ig_account:
            print("⚠️  Nenhuma conta do Instagram encontrada ou acessível")
            return {"error": "Instagram account not found or not accessible"}
        
        ig_id = ig_account.get("id")
        print(f"✅ Instagram Business Account ID: {ig_id}")
        
        # Informações detalhadas
        ig_info = self.client.get_instagram_detailed_info(ig_id)
        
        # Insights
        insights = self.client.get_instagram_insights_detailed(ig_id)
        
        # Mídia
        media = self.client.get_instagram_media_detailed(ig_id, limit=30)
        
        # Stories (pode falhar se não tiver permissão)
        stories = self.client.get_instagram_stories_insights(ig_id)
        
        # Processar insights
        insights_parsed = self._parse_insights_data(insights)
        
        # Processar mídia
        posts_analysis = []
        if "data" in media:
            for post in media["data"][:20]:
                post_data = {
                    "id": post.get("id", ""),
                    "caption": (post.get("caption", "") or "")[:150],
                    "media_type": post.get("media_type", ""),
                    "media_product_type": post.get("media_product_type", ""),
                    "timestamp": post.get("timestamp", ""),
                    "permalink": post.get("permalink", ""),
                    "likes": post.get("like_count", 0),
                    "comments": post.get("comments_count", 0),
                    "impressions": 0,
                    "reach": 0,
                    "saves": 0,
                    "video_views": 0,
                    "engagement": 0
                }
                
                # Extrair insights
                if "insights" in post and "data" in post["insights"]:
                    for m in post["insights"]["data"]:
                        if m["values"]:
                            val = m["values"][0].get("value", 0)
                            if m["name"] == "impressions":
                                post_data["impressions"] = val
                            elif m["name"] == "reach":
                                post_data["reach"] = val
                            elif m["name"] == "saved":
                                post_data["saves"] = val
                            elif m["name"] == "video_views":
                                post_data["video_views"] = val
                            elif m["name"] == "engagement":
                                post_data["engagement"] = val
                
                posts_analysis.append(post_data)
        
        return {
            "platform": "Instagram",
            "account_id": ig_id,
            "account_info": ig_info,
            "insights": insights_parsed,
            "content": {
                "posts": posts_analysis,
                "stories": stories if "data" in stories else []
            }
        }
    
    def analyze_ads(self, page_id: str) -> Dict:
        """Analisa performance de anúncios."""
        print(f"\n📊 Analisando Ads conectados à página: {page_id}")
        
        # Obter contas de anúncios
        ad_accounts = self.client.get_ad_accounts()
        
        if not ad_accounts:
            print("⚠️  Nenhuma conta de anúncios encontrada")
            return {"error": "No ad accounts found"}
        
        results = []
        for account in ad_accounts:
            ad_account_id = account.get("id")
            print(f"✅ Ad Account ID: {ad_account_id}")
            
            # Insights detalhados
            insights_data = self.client.get_ads_insights_detailed(ad_account_id)
            
            # Campanhas
            campaigns = self.client.get_ad_campaigns(ad_account_id)
            
            # Criativos
            creatives = self.client.get_ad_creatives(ad_account_id)
            
            # Processar insights
            campaigns_data = []
            totals = {
                "spend": 0,
                "impressions": 0,
                "reach": 0,
                "clicks": 0,
                "actions": 0
            }
            
            if "insights" in insights_data and "data" in insights_data["insights"]:
                for ad in insights_data["insights"]["data"]:
                    spend = float(ad.get("spend", 0) or 0)
                    impressions = int(ad.get("impressions", 0) or 0)
                    reach = int(ad.get("reach", 0) or 0)
                    clicks = int(ad.get("clicks", 0) or 0)
                    actions = len(ad.get("actions", []) or [])
                    
                    totals["spend"] += spend
                    totals["impressions"] += impressions
                    totals["reach"] += reach
                    totals["clicks"] += clicks
                    totals["actions"] += actions
                    
                    campaigns_data.append({
                        "campaign_id": ad.get("campaign_id", ""),
                        "campaign_name": ad.get("campaign_name", ""),
                        "adset_name": ad.get("adset_name", ""),
                        "ad_name": ad.get("ad_name", ""),
                        "impressions": impressions,
                        "reach": reach,
                        "clicks": clicks,
                        "ctr": float(ad.get("ctr", 0) or 0),
                        "cpc": float(ad.get("cpc", 0) or 0),
                        "cpm": float(ad.get("cpm", 0) or 0),
                        "spend": spend,
                        "actions": actions,
                        "frequency": float(ad.get("frequency", 0) or 0)
                    })
            
            # Calcular métricas
            avg_ctr = (totals["clicks"] / totals["impressions"] * 100) if totals["impressions"] > 0 else 0
            avg_cpc = (totals["spend"] / totals["clicks"]) if totals["clicks"] > 0 else 0
            avg_cpm = (totals["spend"] / totals["impressions"] * 1000) if totals["impressions"] > 0 else 0
            
            results.append({
                "account_id": ad_account_id,
                "account_name": account.get("name", ""),
                "period": {"since": SINCE_DATE, "until": UNTIL_DATE},
                "totals": totals,
                "metrics": {
                    "avg_ctr": round(avg_ctr, 2),
                    "avg_cpc": round(avg_cpc, 2),
                    "avg_cpm": round(avg_cpm, 2)
                },
                "breakdowns": insights_data.get("breakdowns", {}),
                "campaigns": campaigns_data[:30],
                "campaigns_list": campaigns,
                "creatives": creatives
            })
        
        return {
            "platform": "Meta Ads",
            "accounts": results
        }


# ============================================================================
# GERADOR DE RELATÓRIO
# ============================================================================

def generate_report(analysis: Dict, output_path: str = None):
    """Gera relatório formatado em JSON e texto."""
    
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    
    if output_path is None:
        output_path = f"professor_lemos_audience_analysis_{timestamp}"
    
    # Salvar JSON completo
    json_path = f"{output_path}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False, default=str)
    print(f"\n💾 Dados completos salvos em: {json_path}")
    
    # Gerar relatório em texto
    report = []
    report.append("=" * 80)
    report.append(f"RELATÓRIO DE ANÁLISE DE PÚBLICO - {PROFESSOR_LEMOS_NAME}")
    report.append(f"Período: {SINCE_DATE} até {UNTIL_DATE} ({DAYS_TO_ANALYZE} dias)")
    report.append(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    report.append("=" * 80)
    
    # Facebook
    if "facebook" in analysis and analysis["facebook"]:
        fb = analysis["facebook"]
        report.append("\n" + "=" * 80)
        report.append("📘 FACEBOOK")
        report.append("=" * 80)
        
        page_info = fb.get("page_info", {})
        report.append(f"\nPágina: {page_info.get('name', 'N/A')}")
        report.append(f"Username: @{page_info.get('username', 'N/A')}")
        report.append(f"Categoria: {page_info.get('category', 'N/A')}")
        report.append(f"Seguidores: {page_info.get('followers_count', fb.get('followers', 0)):,}")
        report.append(f"Localização: {page_info.get('location', {}).get('city', 'N/A')}, {page_info.get('location', {}).get('state', 'N/A')}")
        
        # Métricas
        insights = fb.get("insights", {})
        totals = insights.get("totals", {})
        report.append("\n📊 MÉTRICAS PRINCIPAIS (últimos 90 dias):")
        report.append(f"  • Impressões: {totals.get('page_impressions', 0):,}")
        report.append(f"  • Pessoas engajadas: {totals.get('page_engaged_users', 0):,}")
        report.append(f"  • Visualizações de vídeo: {totals.get('page_video_views', 0):,}")
        report.append(f"  • Novos seguidores: {totals.get('page_fan_adds', 0):,}")
        
        # Demografia
        demo = insights.get("demographics", {})
        if demo.get("age_gender"):
            report.append("\n👥 PÚBLICO POR IDADE E GÊNERO:")
            for age in demo["age_gender"][:7]:
                report.append(
                    f"  {age['range']}: {age['male_pct']}% ♂️  {age['female_pct']}% ♀️"
                )
        
        if demo.get("cities"):
            report.append("\n🏙️ TOP CIDADES:")
            for city in demo["cities"][:10]:
                report.append(f"  {city['name']}: {city['percentage']}% ({city['count']:,})")
        
        if demo.get("countries"):
            report.append("\n🌍 TOP PAÍSES:")
            for country in demo["countries"][:5]:
                report.append(f"  {country['code']}: {country['percentage']}%")
        
        # Top posts
        posts = fb.get("content", {}).get("posts", [])
        if posts:
            report.append("\n📝 TOP POSTS (por engajamento):")
            sorted_posts = sorted(posts, key=lambda x: x.get("engagement_rate", 0), reverse=True)[:5]
            for i, post in enumerate(sorted_posts, 1):
                report.append(
                    f"  {i}. [{post['type']}] \"{post['message']}...\" - "
                    f"Engajamento: {post['engagement_rate']}% | "
                    f"Reações: {post['reactions']:,} | "
                    f"Compart.: {post['shares']:,}"
                )
        
        # Vídeos
        videos = fb.get("content", {}).get("videos", [])
        if videos:
            report.append("\n🎬 TOP VÍDEOS:")
            sorted_videos = sorted(videos, key=lambda x: x.get("views", 0), reverse=True)[:5]
            for i, video in enumerate(sorted_videos, 1):
                report.append(
                    f"  {i}. \"{video['title']}...\" - "
                    f"Views: {video['views']:,} | "
                    f"Duração: {video['length']}s"
                )
    
    # Instagram
    if "instagram" in analysis and analysis["instagram"]:
        ig = analysis["instagram"]
        
        if "error" in ig:
            report.append("\n" + "=" * 80)
            report.append("📷 INSTAGRAM")
            report.append("=" * 80)
            report.append(f"\n⚠️  {ig['error']}")
        else:
            report.append("\n" + "=" * 80)
            report.append("📷 INSTAGRAM")
            report.append("=" * 80)
            
            ig_info = ig.get("account_info", {})
            report.append(f"\nConta: @{ig_info.get('username', 'N/A')}")
            report.append(f"Nome: {ig_info.get('name', 'N/A')}")
            report.append(f"Seguidores: {ig_info.get('followers_count', 0):,}")
            report.append(f"Seguindo: {ig_info.get('follows_count', 0):,}")
            report.append(f"Total de posts: {ig_info.get('media_count', 0):,}")
            report.append(f"Bio: {ig_info.get('biography', 'N/A')[:100]}")
            
            # Métricas
            insights = ig.get("insights", {})
            totals = insights.get("totals", {})
            report.append("\n📊 MÉTRICAS PRINCIPAIS (últimos 90 dias):")
            report.append(f"  • Impressões: {totals.get('impressions', 0):,}")
            report.append(f"  • Alcance: {totals.get('reach', 0):,}")
            report.append(f"  • Visualizações de perfil: {totals.get('profile_views', 0):,}")
            report.append(f"  • Cliques no site: {totals.get('website_clicks', 0):,}")
            
            # Demografia
            demo = insights.get("demographics", {})
            if demo.get("age_gender"):
                report.append("\n👥 PÚBLICO POR IDADE E GÊNERO:")
                for age in demo["age_gender"][:7]:
                    report.append(
                        f"  {age['range']}: {age['male_pct']}% ♂️  {age['female_pct']}% ♀️"
                    )
            
            if demo.get("cities"):
                report.append("\n🏙️ TOP CIDADES:")
                for city in demo["cities"][:10]:
                    report.append(f"  {city['name']}: {city['percentage']}%")
            
            # Top posts
            posts = ig.get("content", {}).get("posts", [])
            if posts:
                report.append("\n📝 TOP POSTS (por impressões):")
                sorted_posts = sorted(posts, key=lambda x: x.get("impressions", 0), reverse=True)[:5]
                for i, post in enumerate(sorted_posts, 1):
                    report.append(
                        f"  {i}. [{post['media_type']}] \"{post['caption']}...\" - "
                        f"Impressões: {post['impressions']:,} | "
                        f"Curtidas: {post['likes']:,}"
                    )
    
    # Ads
    if "ads" in analysis and analysis["ads"]:
        ads = analysis["ads"]
        
        if "error" in ads:
            report.append("\n" + "=" * 80)
            report.append("📊 META ADS")
            report.append("=" * 80)
            report.append(f"\n⚠️  {ads['error']}")
        else:
            report.append("\n" + "=" * 80)
            report.append("📊 META ADS")
            report.append("=" * 80)
            
            for account in ads.get("accounts", []):
                report.append(f"\n📌 Conta: {account.get('account_name', account.get('account_id', 'N/A'))}")
                report.append(f"   Período: {account['period']['since']} até {account['period']['until']}")
                
                totals = account.get("totals", {})
                report.append("\n💰 MÉTRICAS DE PERFORMANCE:")
                report.append(f"  • Investimento total: R$ {totals.get('spend', 0):,.2f}")
                report.append(f"  • Impressões totais: {totals.get('impressions', 0):,}")
                report.append(f"  • Alcance total: {totals.get('reach', 0):,}")
                report.append(f"  • Cliques totais: {totals.get('clicks', 0):,}")
                
                metrics = account.get("metrics", {})
                report.append("\n📈 MÉTRICAS DE CUSTO:")
                report.append(f"  • CTR médio: {metrics.get('avg_ctr', 0)}%")
                report.append(f"  • CPC médio: R$ {metrics.get('avg_cpc', 0):.2f}")
                report.append(f"  • CPM médio: R$ {metrics.get('avg_cpm', 0):.2f}")
                
                # Top campanhas
                campaigns = account.get("campaigns", [])
                if campaigns:
                    report.append("\n📝 TOP CAMPANHAS (por investimento):")
                    sorted_camps = sorted(campaigns, key=lambda x: x.get("spend", 0), reverse=True)[:5]
                    for i, camp in enumerate(sorted_camps, 1):
                        report.append(
                            f"  {i}. {camp['campaign_name']} - "
                            f"Impressões: {camp['impressions']:,} | "
                            f"CTR: {camp['ctr']}% | "
                            f"Gasto: R$ {camp['spend']:.2f}"
                        )
    
    # Salvar relatório em texto
    txt_path = f"{output_path}.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report))
    print(f"📄 Relatório em texto salvo em: {txt_path}")
    
    # Imprimir resumo
    print("\n" + "\n".join(report))
    
    return json_path, txt_path


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Função principal."""
    print("=" * 80)
    print(f"ANÁLISE DE PÚBLICO - {PROFESSOR_LEMOS_NAME}")
    print("=" * 80)
    print(f"Page ID: {PROFESSOR_LEMOS_PAGE_ID}")
    print(f"Período: {SINCE_DATE} até {UNTIL_DATE}")
    print("=" * 80)
    
    # Verificar token
    if not FACEBOOK_ACCESS_TOKEN:
        print("\n❌ ERRO: FACEBOOK_ACCESS_TOKEN não configurado no .env")
        print("   Copie .env.example para .env e adicione seu token")
        return
    
    # Inicializar cliente
    client = MetaInsightsClient(FACEBOOK_ACCESS_TOKEN)
    
    # Verificar token
    print("\n🔐 Verificando token...")
    token_status = client.verify_token()
    if not token_status["valid"]:
        print(f"❌ ERRO: Token inválido - {token_status.get('error', 'Unknown error')}")
        print("\n💡 Dicas:")
        print("   1. Verifique se o token está correto no .env")
        print("   2. O token pode ter expirado - gere um novo em:")
        print("      https://developers.facebook.com/tools/explorer/")
        print("   3. Certifique-se de que o app tem permissões necessárias")
        return
    
    print(f"✅ Token válido! Usuário: {token_status['data'].get('name', 'N/A')}")
    
    # Verificar permissões do token
    print("\n📋 Verificando permissões do token...")
    permissions = client.get_token_info()
    if "data" in permissions:
        granted = [p for p in permissions["data"] if p.get("permission") and p.get("status") == "granted"]
        print(f"   Permissões concedidas: {len(granted)}")
        for p in granted[:10]:
            print(f"   • {p.get('permission', 'unknown')}")
    
    # Inicializar analisador
    analyzer = AudienceAnalyzer(client)
    
    # Coletar dados
    analysis = {
        "profile": PROFESSOR_LEMOS_NAME,
        "page_id": PROFESSOR_LEMOS_PAGE_ID,
        "generated_at": datetime.now().isoformat(),
        "period": {
            "since": SINCE_DATE,
            "until": UNTIL_DATE,
            "days": DAYS_TO_ANALYZE
        },
        "facebook": None,
        "instagram": None,
        "ads": None
    }
    
    try:
        # Facebook
        print("\n" + "=" * 80)
        print("COLETANDO DADOS DO FACEBOOK...")
        analysis["facebook"] = analyzer.analyze_facebook_page(PROFESSOR_LEMOS_PAGE_ID)
        
        # Instagram
        print("\n" + "=" * 80)
        print("COLETANDO DADOS DO INSTAGRAM...")
        analysis["instagram"] = analyzer.analyze_instagram(PROFESSOR_LEMOS_PAGE_ID)
        
        # Ads
        print("\n" + "=" * 80)
        print("COLETANDO DADOS DE ADS...")
        analysis["ads"] = analyzer.analyze_ads(PROFESSOR_LEMOS_PAGE_ID)
        
    except Exception as e:
        print(f"\n❌ ERRO durante coleta de dados: {e}")
        import traceback
        traceback.print_exc()
    
    # Gerar relatório
    print("\n" + "=" * 80)
    print("GERANDO RELATÓRIO...")
    generate_report(analysis)
    
    print("\n" + "=" * 80)
    print("✅ ANÁLISE CONCLUÍDA!")
    print("=" * 80)


if __name__ == "__main__":
    main()
