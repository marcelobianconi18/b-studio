import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.campaign_analysis import CampaignAnalysisReport, CampaignKpiDaily
from app.services.meta_ads import meta_ads_service

logger = logging.getLogger(__name__)


class CampaignAnalysisService:
    SUPPORTED_GOAL_TYPES = {"sales", "lead_gen", "growth", "awareness", "advocacy"}

    LEAD_ACTION_TYPES = {
        "lead",
        "onsite_conversion.lead_grouped",
        "onsite_web_lead",
        "offsite_conversion.fb_pixel_lead",
        "omni_lead",
    }
    PURCHASE_ACTION_TYPES = {
        "purchase",
        "omni_purchase",
        "offsite_conversion.fb_pixel_purchase",
    }

    def analyze_campaign(
        self,
        db: Session,
        campaign_id: str,
        goal_type: str = "sales",
        analysis_mode: str = "manual",
    ) -> Dict[str, Any]:
        normalized_goal = self._normalize_goal(goal_type)
        normalized_mode = (analysis_mode or "manual").strip().lower() or "manual"

        campaign = meta_ads_service.get_campaign(campaign_id)
        if "error" in campaign:
            return {"error": campaign["error"]}

        insights = meta_ads_service.get_campaign_insights(campaign_id, time_increment=1)
        if "error" in insights:
            return {"error": insights["error"]}

        raw_daily_rows = insights.get("data", [])
        if not raw_daily_rows:
            fallback = meta_ads_service.get_campaign_insights(campaign_id, time_increment=0)
            if "error" in fallback:
                return {"error": fallback["error"]}
            raw_daily_rows = fallback.get("data", [])

        if not raw_daily_rows:
            return {"error": "Campanha sem insights disponíveis para análise."}

        daily_metrics = [self._parse_daily_metric(row) for row in raw_daily_rows]
        metrics = self._aggregate_metrics(daily_metrics)
        scores = self._calculate_scores(metrics, normalized_goal)
        success_points, attention_points = self._build_findings(metrics, normalized_goal, scores["final"])
        recommended_actions = self._build_recommendations(metrics, normalized_goal, attention_points)
        executive_summary = self._build_executive_summary(
            campaign=campaign,
            metrics=metrics,
            scores=scores,
            success_points=success_points,
            attention_points=attention_points,
        )

        report = CampaignAnalysisReport(
            campaign_id=campaign_id,
            campaign_name=campaign.get("name") or raw_daily_rows[0].get("campaign_name"),
            objective=campaign.get("objective"),
            campaign_status=campaign.get("status") or campaign.get("effective_status"),
            ad_account_id=campaign.get("account_id") or meta_ads_service.ad_account_id,
            goal_type=normalized_goal,
            analysis_mode=normalized_mode,
            amount_spent=metrics["amount_spent"],
            impressions=metrics["impressions"],
            reach=metrics["reach"],
            frequency=metrics["frequency"],
            clicks=metrics["clicks"],
            link_clicks=metrics["link_clicks"],
            outbound_clicks=metrics["outbound_clicks"],
            ctr=metrics["ctr"],
            cpc=metrics["cpc"],
            cpm=metrics["cpm"],
            leads=metrics["leads"],
            purchases=metrics["purchases"],
            purchase_value=metrics["purchase_value"],
            cost_per_lead=metrics["cost_per_lead"],
            cost_per_purchase=metrics["cost_per_purchase"],
            roas=metrics["roas"],
            delivery_score=scores["delivery"],
            efficiency_score=scores["efficiency"],
            goal_score=scores["goal"],
            final_score=scores["final"],
            success_points=success_points,
            attention_points=attention_points,
            recommended_actions=recommended_actions,
            executive_summary=executive_summary,
            raw_metrics={
                "goal_type": normalized_goal,
                "campaign": {
                    "id": campaign_id,
                    "name": campaign.get("name"),
                    "status": campaign.get("status") or campaign.get("effective_status"),
                    "objective": campaign.get("objective"),
                    "start_time": campaign.get("start_time"),
                    "stop_time": campaign.get("stop_time"),
                },
            },
        )
        db.add(report)
        db.flush()

        for metric in daily_metrics:
            db.add(
                CampaignKpiDaily(
                    report_id=report.id,
                    campaign_id=campaign_id,
                    date_start=metric["date_start"],
                    date_stop=metric["date_stop"],
                    amount_spent=metric["amount_spent"],
                    impressions=metric["impressions"],
                    reach=metric["reach"],
                    frequency=metric["frequency"],
                    clicks=metric["clicks"],
                    link_clicks=metric["link_clicks"],
                    outbound_clicks=metric["outbound_clicks"],
                    ctr=metric["ctr"],
                    cpc=metric["cpc"],
                    cpm=metric["cpm"],
                    leads=metric["leads"],
                    purchases=metric["purchases"],
                    purchase_value=metric["purchase_value"],
                    raw_metrics=metric["raw_metrics"],
                )
            )

        db.commit()
        db.refresh(report)

        persisted_daily_metrics = (
            db.query(CampaignKpiDaily)
            .filter(CampaignKpiDaily.report_id == report.id)
            .order_by(CampaignKpiDaily.date_start.asc(), CampaignKpiDaily.id.asc())
            .all()
        )
        return self._serialize_report(report, persisted_daily_metrics)

    def get_latest_report(self, db: Session, campaign_id: str) -> Optional[Dict[str, Any]]:
        report = (
            db.query(CampaignAnalysisReport)
            .filter(CampaignAnalysisReport.campaign_id == campaign_id)
            .order_by(CampaignAnalysisReport.created_at.desc(), CampaignAnalysisReport.id.desc())
            .first()
        )
        if not report:
            return None

        daily_metrics = (
            db.query(CampaignKpiDaily)
            .filter(CampaignKpiDaily.report_id == report.id)
            .order_by(CampaignKpiDaily.date_start.asc(), CampaignKpiDaily.id.asc())
            .all()
        )
        return self._serialize_report(report, daily_metrics)

    def _normalize_goal(self, goal_type: str) -> str:
        normalized_goal = (goal_type or "sales").strip().lower()
        if normalized_goal not in self.SUPPORTED_GOAL_TYPES:
            return "sales"
        return normalized_goal

    def _serialize_report(
        self,
        report: CampaignAnalysisReport,
        daily_metrics: List[CampaignKpiDaily],
    ) -> Dict[str, Any]:
        return {
            "report_id": report.id,
            "campaign_id": report.campaign_id,
            "campaign_name": report.campaign_name,
            "objective": report.objective,
            "status": report.campaign_status,
            "goal_type": report.goal_type,
            "analysis_mode": report.analysis_mode,
            "analyzed_at": report.created_at,
            "days_analyzed": len(daily_metrics),
            "scores": {
                "delivery": round(float(report.delivery_score or 0), 2),
                "efficiency": round(float(report.efficiency_score or 0), 2),
                "goal": round(float(report.goal_score or 0), 2),
                "final": round(float(report.final_score or 0), 2),
            },
            "metrics": {
                "amount_spent": round(float(report.amount_spent or 0), 2),
                "impressions": int(report.impressions or 0),
                "reach": int(report.reach or 0),
                "frequency": round(float(report.frequency or 0), 2),
                "clicks": int(report.clicks or 0),
                "link_clicks": int(report.link_clicks or 0),
                "outbound_clicks": int(report.outbound_clicks or 0),
                "ctr": round(float(report.ctr or 0), 2),
                "cpc": round(float(report.cpc or 0), 2),
                "cpm": round(float(report.cpm or 0), 2),
                "leads": int(report.leads or 0),
                "purchases": int(report.purchases or 0),
                "purchase_value": round(float(report.purchase_value or 0), 2),
                "cost_per_lead": self._round_or_none(report.cost_per_lead),
                "cost_per_purchase": self._round_or_none(report.cost_per_purchase),
                "roas": self._round_or_none(report.roas),
            },
            "success_points": report.success_points or [],
            "attention_points": report.attention_points or [],
            "recommended_actions": report.recommended_actions or [],
            "executive_summary": report.executive_summary or "",
            "daily_metrics": [
                {
                    "date_start": metric.date_start,
                    "date_stop": metric.date_stop,
                    "amount_spent": round(float(metric.amount_spent or 0), 2),
                    "impressions": int(metric.impressions or 0),
                    "reach": int(metric.reach or 0),
                    "clicks": int(metric.clicks or 0),
                    "ctr": round(float(metric.ctr or 0), 2),
                    "cpc": round(float(metric.cpc or 0), 2),
                    "cpm": round(float(metric.cpm or 0), 2),
                    "leads": int(metric.leads or 0),
                    "purchases": int(metric.purchases or 0),
                }
                for metric in daily_metrics
            ],
        }

    def _parse_daily_metric(self, row: Dict[str, Any]) -> Dict[str, Any]:
        actions = row.get("actions") or []
        action_values = row.get("action_values") or []
        outbound_clicks_raw = row.get("outbound_clicks") or []

        amount_spent = self._safe_float(row.get("spend"))
        impressions = self._safe_int(row.get("impressions"))
        reach = self._safe_int(row.get("reach"))
        clicks = self._safe_int(row.get("clicks"))
        link_clicks = int(self._sum_action_values(actions, {"link_click"}))
        outbound_clicks = int(self._sum_action_values(outbound_clicks_raw, {"outbound_click"}))
        if outbound_clicks == 0:
            outbound_clicks = int(self._sum_action_values(actions, {"outbound_click"}))
        leads = int(self._sum_action_values(actions, self.LEAD_ACTION_TYPES))
        purchases = int(self._sum_action_values(actions, self.PURCHASE_ACTION_TYPES))
        purchase_value = self._sum_action_values(action_values, self.PURCHASE_ACTION_TYPES)

        ctr = self._safe_float(row.get("ctr"))
        if ctr <= 0 and impressions > 0:
            ctr = (clicks / impressions) * 100.0

        cpc = self._safe_float(row.get("cpc"))
        if cpc <= 0 and clicks > 0:
            cpc = amount_spent / clicks

        cpm = self._safe_float(row.get("cpm"))
        if cpm <= 0 and impressions > 0:
            cpm = (amount_spent / impressions) * 1000.0

        frequency = self._safe_float(row.get("frequency"))
        if frequency <= 0 and reach > 0:
            frequency = impressions / reach

        return {
            "date_start": self._parse_date(row.get("date_start")),
            "date_stop": self._parse_date(row.get("date_stop")),
            "amount_spent": amount_spent,
            "impressions": impressions,
            "reach": reach,
            "frequency": frequency,
            "clicks": clicks,
            "link_clicks": link_clicks,
            "outbound_clicks": outbound_clicks,
            "ctr": ctr,
            "cpc": cpc,
            "cpm": cpm,
            "leads": leads,
            "purchases": purchases,
            "purchase_value": purchase_value,
            "raw_metrics": row,
        }

    def _aggregate_metrics(self, daily_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_spend = sum(item["amount_spent"] for item in daily_metrics)
        total_impressions = sum(item["impressions"] for item in daily_metrics)
        total_reach = max((item["reach"] for item in daily_metrics), default=0)
        total_clicks = sum(item["clicks"] for item in daily_metrics)
        total_link_clicks = sum(item["link_clicks"] for item in daily_metrics)
        total_outbound_clicks = sum(item["outbound_clicks"] for item in daily_metrics)
        total_leads = sum(item["leads"] for item in daily_metrics)
        total_purchases = sum(item["purchases"] for item in daily_metrics)
        total_purchase_value = sum(item["purchase_value"] for item in daily_metrics)

        ctr = (total_clicks / total_impressions * 100.0) if total_impressions > 0 else 0.0
        cpc = (total_spend / total_clicks) if total_clicks > 0 else 0.0
        cpm = (total_spend / total_impressions * 1000.0) if total_impressions > 0 else 0.0
        frequency = (total_impressions / total_reach) if total_reach > 0 else 0.0
        cost_per_lead = (total_spend / total_leads) if total_leads > 0 else None
        cost_per_purchase = (total_spend / total_purchases) if total_purchases > 0 else None
        roas = (total_purchase_value / total_spend) if total_spend > 0 else None

        return {
            "amount_spent": total_spend,
            "impressions": total_impressions,
            "reach": total_reach,
            "frequency": frequency,
            "clicks": total_clicks,
            "link_clicks": total_link_clicks,
            "outbound_clicks": total_outbound_clicks,
            "ctr": ctr,
            "cpc": cpc,
            "cpm": cpm,
            "leads": total_leads,
            "purchases": total_purchases,
            "purchase_value": total_purchase_value,
            "cost_per_lead": cost_per_lead,
            "cost_per_purchase": cost_per_purchase,
            "roas": roas,
        }

    def _calculate_scores(self, metrics: Dict[str, Any], goal_type: str) -> Dict[str, float]:
        delivery_score = 50.0
        if metrics["impressions"] > 0:
            delivery_score += 15
        if metrics["reach"] > 0:
            delivery_score += 10
        if metrics["ctr"] >= 1.5:
            delivery_score += 20
        elif metrics["ctr"] >= 1.0:
            delivery_score += 10
        elif metrics["ctr"] < 0.5:
            delivery_score -= 15
        if metrics["frequency"] > 3.5:
            delivery_score -= 15
        elif metrics["frequency"] < 1.1 and metrics["impressions"] > 0:
            delivery_score -= 5
        delivery_score = self._clamp(delivery_score)

        efficiency_score = 50.0
        if metrics["cpc"] > 0:
            if metrics["cpc"] <= 1.0:
                efficiency_score += 20
            elif metrics["cpc"] <= 2.0:
                efficiency_score += 10
            elif metrics["cpc"] > 4.0:
                efficiency_score -= 15
        if metrics["cpm"] > 0:
            if metrics["cpm"] <= 25:
                efficiency_score += 10
            elif metrics["cpm"] > 60:
                efficiency_score -= 10
        if metrics["roas"] is not None:
            if metrics["roas"] >= 3:
                efficiency_score += 20
            elif metrics["roas"] >= 2:
                efficiency_score += 10
            elif metrics["roas"] < 1:
                efficiency_score -= 20
        if metrics["cost_per_lead"] is not None:
            if metrics["cost_per_lead"] <= 25:
                efficiency_score += 12
            elif metrics["cost_per_lead"] > 45:
                efficiency_score -= 10
        efficiency_score = self._clamp(efficiency_score)

        goal_score = 50.0
        if goal_type == "sales":
            if metrics["purchases"] > 0:
                goal_score += 20
            else:
                goal_score -= 10

            roas = metrics["roas"] or 0
            if roas >= 2:
                goal_score += 25
            elif roas >= 1:
                goal_score += 10
            else:
                goal_score -= 20

        elif goal_type == "lead_gen":
            if metrics["leads"] >= 10:
                goal_score += 25
            elif metrics["leads"] > 0:
                goal_score += 12
            else:
                goal_score -= 20

            cpl = metrics["cost_per_lead"]
            if cpl is not None:
                if cpl <= 25:
                    goal_score += 20
                elif cpl <= 45:
                    goal_score += 8
                else:
                    goal_score -= 12
        else:
            if metrics["reach"] >= 10000:
                goal_score += 15
            elif metrics["reach"] > 0:
                goal_score += 5
            if metrics["ctr"] >= 1:
                goal_score += 15
            elif metrics["ctr"] < 0.5:
                goal_score -= 10
            if metrics["outbound_clicks"] > 0:
                goal_score += 10

        goal_score = self._clamp(goal_score)
        final_score = self._clamp((delivery_score * 0.35) + (efficiency_score * 0.35) + (goal_score * 0.30))

        return {
            "delivery": round(delivery_score, 2),
            "efficiency": round(efficiency_score, 2),
            "goal": round(goal_score, 2),
            "final": round(final_score, 2),
        }

    def _build_findings(
        self,
        metrics: Dict[str, Any],
        goal_type: str,
        final_score: float,
    ) -> Tuple[List[str], List[str]]:
        success_points: List[str] = []
        attention_points: List[str] = []

        if metrics["ctr"] >= 1.5:
            success_points.append(f"CTR forte ({metrics['ctr']:.2f}%), indicando criativo e mensagem aderentes.")
        if metrics["cpc"] > 0 and metrics["cpc"] <= 1.5:
            success_points.append(f"CPC eficiente (R$ {metrics['cpc']:.2f}), com bom custo de tráfego.")
        if metrics["reach"] >= 10000:
            success_points.append(f"Alcance relevante ({metrics['reach']:,}) para escala da campanha.")
        if goal_type == "sales" and metrics["roas"] is not None and metrics["roas"] >= 2:
            success_points.append(f"ROAS positivo ({metrics['roas']:.2f}x), com retorno acima do investimento.")
        if goal_type == "lead_gen" and metrics["leads"] > 0:
            success_points.append(f"Captação de leads ativa ({metrics['leads']} leads no período).")
        if goal_type in {"growth", "awareness", "advocacy"} and metrics["outbound_clicks"] > 0:
            success_points.append(
                f"Resposta de audiência consistente ({metrics['outbound_clicks']} outbound clicks)."
            )

        if metrics["frequency"] > 3.5:
            attention_points.append(
                f"Frequência alta ({metrics['frequency']:.2f}) com risco de fadiga criativa."
            )
        if metrics["ctr"] < 0.7 and metrics["impressions"] > 0:
            attention_points.append(f"CTR abaixo do ideal ({metrics['ctr']:.2f}%), sugerindo ajuste de criativo/público.")
        if metrics["cpc"] > 3.0:
            attention_points.append(f"CPC elevado (R$ {metrics['cpc']:.2f}), reduzindo eficiência de aquisição.")
        if metrics["amount_spent"] > 0 and metrics["clicks"] == 0:
            attention_points.append("Campanha com gasto sem geração de cliques.")
        if goal_type == "sales":
            if metrics["purchases"] == 0:
                attention_points.append("Sem compras atribuídas no período analisado.")
            if metrics["roas"] is not None and metrics["roas"] < 1:
                attention_points.append(f"ROAS abaixo de 1 ({metrics['roas']:.2f}x), investimento sem retorno.")
        if goal_type == "lead_gen" and metrics["leads"] == 0:
            attention_points.append("Sem leads capturados; revisar formulário, oferta e segmentação.")

        if not success_points:
            success_points.append(f"Score geral {final_score:.1f}/100 com base consistente para otimização incremental.")
        if not attention_points:
            attention_points.append("Nenhum alerta crítico detectado no período analisado.")

        return success_points[:5], attention_points[:5]

    def _build_recommendations(
        self,
        metrics: Dict[str, Any],
        goal_type: str,
        attention_points: List[str],
    ) -> List[Dict[str, str]]:
        recommendations: List[Dict[str, str]] = []

        if metrics["frequency"] > 3.5:
            recommendations.append(
                {
                    "priority": "alta",
                    "title": "Rotacionar criativos",
                    "description": "Criar 2 a 3 novas variações de anúncio e redistribuir orçamento para reduzir saturação.",
                    "expected_impact": "Reduzir frequência e recuperar CTR em 7 dias.",
                }
            )

        if goal_type == "sales" and (metrics["roas"] is None or metrics["roas"] < 1.5):
            recommendations.append(
                {
                    "priority": "alta",
                    "title": "Revisar público e evento de conversão",
                    "description": "Priorizar públicos com maior intenção e validar rastreamento de compra para otimizar entrega.",
                    "expected_impact": "Aumentar taxa de compra e ROAS.",
                }
            )

        if goal_type == "lead_gen" and metrics["leads"] == 0:
            recommendations.append(
                {
                    "priority": "alta",
                    "title": "Ajustar oferta e formulário",
                    "description": "Testar headline, benefício principal e reduzir fricção no formulário de lead.",
                    "expected_impact": "Destravar captação de leads com melhor taxa de envio.",
                }
            )

        if metrics["ctr"] < 1.0:
            recommendations.append(
                {
                    "priority": "media",
                    "title": "Teste A/B de mensagem",
                    "description": "Testar ao menos 2 ganchos e 2 thumbnails para elevar taxa de clique.",
                    "expected_impact": "Melhorar CTR e reduzir CPC.",
                }
            )

        if not recommendations:
            recommendations.append(
                {
                    "priority": "media",
                    "title": "Escalar combinações vencedoras",
                    "description": "Aumentar investimento gradualmente nos melhores criativos e públicos do período.",
                    "expected_impact": "Ganhar volume mantendo eficiência.",
                }
            )

        if len(attention_points) > 2 and len(recommendations) < 3:
            recommendations.append(
                {
                    "priority": "baixa",
                    "title": "Revisão semanal de baseline",
                    "description": "Comparar este relatório com as últimas campanhas para ajustar metas realistas por objetivo.",
                    "expected_impact": "Tomada de decisão mais previsível nas próximas ativações.",
                }
            )

        return recommendations[:3]

    def _build_executive_summary(
        self,
        campaign: Dict[str, Any],
        metrics: Dict[str, Any],
        scores: Dict[str, float],
        success_points: List[str],
        attention_points: List[str],
    ) -> str:
        campaign_name = campaign.get("name") or "Campanha"
        objective = campaign.get("objective") or "N/A"
        return (
            f"{campaign_name} ({objective}) foi analisada com score final {scores['final']:.1f}/100. "
            f"Gasto de R$ {metrics['amount_spent']:.2f}, alcance de {metrics['reach']:,} e CTR de {metrics['ctr']:.2f}%. "
            f"Principal destaque: {success_points[0]} "
            f"Principal ponto de atenção: {attention_points[0]}"
        )

    def _sum_action_values(self, actions: Any, supported_types: set) -> float:
        total = 0.0
        if not isinstance(actions, list):
            return total

        for item in actions:
            if not isinstance(item, dict):
                continue
            action_type = str(item.get("action_type", ""))
            if action_type in supported_types:
                total += self._safe_float(item.get("value"))
        return total

    def _parse_date(self, value: Any) -> Optional[date]:
        if not value:
            return None
        try:
            return datetime.strptime(str(value), "%Y-%m-%d").date()
        except ValueError:
            return None

    def _safe_float(self, value: Any) -> float:
        try:
            return float(value or 0)
        except (TypeError, ValueError):
            return 0.0

    def _safe_int(self, value: Any) -> int:
        try:
            return int(float(value or 0))
        except (TypeError, ValueError):
            return 0

    def _clamp(self, value: float, low: float = 0.0, high: float = 100.0) -> float:
        return max(low, min(high, value))

    def _round_or_none(self, value: Optional[float]) -> Optional[float]:
        if value is None:
            return None
        return round(float(value), 2)


campaign_analysis_service = CampaignAnalysisService()
