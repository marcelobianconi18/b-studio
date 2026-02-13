
import os
import requests
import json
from typing import List, Dict, Any
from app.services.meta_ads import meta_ads_service
from app.services.financial import financial_service
from app.models.agent import AgentMode, Recommendation, AutonomousAction
from app.core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

class StrategistAgent:
    """
    The brain of B-Studio. Analyzes data and decides on actions or recommendations.
    """
    def __init__(self):
        self.provider_url = os.getenv("BIA_AI_URL", "http://localhost:11434/api/generate") # Default to Ollama
        self.model = os.getenv("BIA_AI_MODEL", "qwen2.5-coder:7b")

    def analyze_performance(self, mode: str):
        """
        Main loop for performance analysis.
        """
        logger.info(f"Agent starting analysis in {mode} mode...")
        
        # 1. Gather Data
        campaigns = meta_ads_service.get_campaigns()
        if "error" in campaigns:
            logger.error(f"Could not fetch campaigns for analysis: {campaigns['error']}")
            return

        # 2. Build Context for IA
        context = self._prepare_context(campaigns)
        
        # 3. Ask the Strategist
        decision = self._ask_llm(context)
        
        if not decision:
            return

        # 4. Process Decision based on Mode
        self._execute_decision(decision, mode)

    def _prepare_context(self, campaigns: Dict):
        """Build a clean string for the LLM."""
        data_summary = []
        for camp in campaigns.get("data", []):
            insights = camp.get("insights", {"data": [{}]})["data"][0]
            data_summary.append({
                "id": camp["id"],
                "name": camp["name"],
                "status": camp["status"],
                "spend": insights.get("spend", 0),
                "cpc": insights.get("cpc", 0),
                "ctr": insights.get("ctr", 0),
                "clicks": insights.get("clicks", 0)
            })
        
        return json.dumps(data_summary, indent=2)

    def _ask_llm(self, context: str):
        """Call the local LLM to get strategic insights."""
        prompt = f"""
        Você é o Strategist Agent do B-Studio. Sua missão é analisar as campanhas de Meta Ads abaixo e decidir o que fazer.
        
        REGRAS:
        - Se o CTR for menor que 0.5% e o Spend > 50, considere o desempenho RUIM e sugira PAUSAR.
        - Se o CPC for menor que 0.20 e o CTR > 2%, considere o desempenho EXCELENTE e sugira ESCALAR (aumentar orçamento).
        
        CONTEXTO DAS CAMPANHAS:
        {context}
        
        RESPONDA APENAS EM JSON no seguinte formato:
        {{
            "actions": [
                {{
                    "campaign_id": "ID",
                    "action": "PAUSE" | "SCALE_UP" | "NOTHING",
                    "reason": "Explicação curta em português",
                    "impact": 1-10
                }}
            ]
        }}
        """
        
        try:
            response = requests.post(self.provider_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                return json.loads(result.get("response", "{}"))
            return None
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            return None

    def _execute_decision(self, decision: Dict, mode: str):
        db = SessionLocal()
        try:
            for action in decision.get("actions", []):
                if action["action"] == "NOTHING":
                    continue

                if mode == AgentMode.AUTOMATIC.value:
                    # Execute directly on Meta
                    logger.info(f"AUTONOMOUS ACTION: {action['action']} on {action['campaign_id']}")
                    if action["action"] == "PAUSE":
                        meta_ads_service.toggle_campaign_status(action["campaign_id"], "PAUSED")
                    
                    # Log action
                    log = AutonomousAction(
                        action_type=action["action"],
                        campaign_id=action["campaign_id"],
                        reason=action["reason"]
                    )
                    db.add(log)
                
                elif mode == AgentMode.HYBRID.value:
                    # Create recommendation for Dashboard
                    logger.info(f"NEW RECOMMENDATION for {action['campaign_id']}")
                    rec = Recommendation(
                        title=f"Sugestão para {action['campaign_id']}",
                        content=action["reason"],
                        campaign_id=action["campaign_id"],
                        impact_score=action.get("impact", 5)
                    )
                    db.add(rec)
            
            db.commit()
        finally:
            db.close()

    def get_financial_health(self, fixed_costs: float = 2000.0):
        """
        Analyzes the financial health of the ad account using 'True ROI' logic.
        """
        # Fetch last 30 days insights
        insights = meta_ads_service.get_historical_insights(days=30)
        
        total_spend = 0.0
        total_conversions = 0 # Approximated by clicks for now if no purchase event
        
        for month in insights.get("data", []):
            total_spend += float(month.get("spend", 0))
            # Fallback: using Clicks as proxy for conversion if purchase data missing in this scope
            # In production, we'd query 'actions' field for 'purchase'
            total_conversions += int(month.get("clicks", 0)) 

        # Calculate Blended Metrics
        metrics = financial_service.calculate_blended_metrics(
            ad_spend=total_spend,
            fixed_costs=fixed_costs,
            conversions=total_conversions
        )
        
        return metrics

    def generate_historical_audit(self, days: int = 365):
        """
        Analyzes historical data to create a deep strategic retrospective.
        """
        logger.info(f"Starting Historical Audit for the last {days} days...")
        
        # 1. Fetch Historical Data
        data = meta_ads_service.get_historical_insights(days=days)
        if "error" in data:
            return {"error": data["error"]}

        insights_data = data.get("data", [])
        
        # 2. Build Prompt
        prompt = f"""
        Você é o Chief Strategy Officer do B-Studio. Analise o histórico de performance de Meta Ads dos últimos {days} dias apresentado abaixo.
        O histórico está agrupado em períodos de 30 dias.
        
        HISTÓRICO:
        {json.dumps(insights_data, indent=2)}
        
        Sua tarefa é gerar um relatório executivo:
        1. Identifique a tendência de custo (CPC/CPM).
        2. Identifique quais meses foram picos de performance e por que (se houver dados).
        3. Dê 3 conselhos estratégicos baseados NO PASSADO para NÃO serem repetidos ou para serem ESCALADOS no futuro.
        
        ESCREVA EM PORTUGUÊS DE FORMA PROFISSIONAL E EXECUTIVA.
        """

        try:
            response = requests.post(self.provider_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }, timeout=90)
            
            if response.status_code == 200:
                result = response.json()
                summary = result.get("response", "Erro ao gerar sumário.")
                
                # Save to DB
                from app.models.agent import HistoricalAudit
                db = SessionLocal()
                audit = HistoricalAudit(
                    report_json=insights_data,
                    summary_text=summary,
                    period_days=days
                )
                db.add(audit)
                db.commit()
                db.refresh(audit)
                db.close()
                
                return {"id": audit.id, "summary": summary}
            return {"error": "LLM failed to respond."}
        except Exception as e:
            logger.error(f"Error generating audit: {e}")
            return {"error": str(e)}

    def analyze_social_growth(self):
        """
        Analyzes organic growth and compares with paid efforts.
        """
        from app.services.meta_api import meta_service
        
        # 1. Fetch Organic Data
        organic_data = meta_service.get_page_insights()
        if "error" in organic_data:
            return {"error": organic_data["error"]}

        # 2. Fetch Paid Data (Last 28 days for comparison)
        paid_data = meta_ads_service.get_historical_insights(days=28)
        
        # 3. Build Context
        context = {
            "organic": organic_data.get("data", []),
            "paid": paid_data.get("data", [])
        }
        
        prompt = f"""
        Você é o Estrategista de Crescimento do B-Studio.
        Analise os dados de crescimento ORGÂNICO vs PAGO dos últimos 28 dias.
        
        DADOS:
        {json.dumps(context, indent=2)}
        
        Sua missão:
        1. Calcule o "Blended Reach" (Alcance Total = Orgânico + Pago).
        2. Identifique se o tráfego pago está canibalizando ou impulsionando o orgânico.
        3. Dê uma sugestão de conteúdo orgânico que poderia ser impulsionado para baixar o custo por resultado.
        
        Responda em JSON:
        {{
            "blended_reach": 0,
            "organic_growth_rate": "0%",
            "insight": "Texto curto",
            "suggestion": "Texto curto"
        }}
        """
        
        try:
            response = requests.post(self.provider_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }, timeout=60)
            
            if response.status_code == 200:
                return json.loads(response.json().get("response", "{}"))
            return None
        except Exception as e:
            logger.error(f"Error analyzing social growth: {e}")
            return None

    def check_creative_fatigue(self):
        """
        Identifies ads with dropping CTR or high frequency (Saturation/Fatigue).
        Returns a list of 'Fatigued Assets' and suggested Organic Replacements.
        """
        # 1. Fetch Daily Data
        data = meta_ads_service.get_ad_creative_insights(days=3)
        if "error" in data:
            return {"error": data["error"]}
            
        # Group by Ad ID
        ads_history = {}
        for day_stat in data.get("data", []):
            ad_id = day_stat.get("ad_id")
            if ad_id not in ads_history:
                ads_history[ad_id] = []
            ads_history[ad_id].append(day_stat)
            
        fatigued_ads = []
        
        # 2. Analyze Trends
        for ad_id, days in ads_history.items():
            # Sort by date
            days.sort(key=lambda x: x['date_start'])
            
            if len(days) < 2:
                continue # Not enough data
                
            first_day_ctr = float(days[0].get("ctr", 0))
            last_day_ctr = float(days[-1].get("ctr", 0))
            last_day_freq = float(days[-1].get("frequency", 0))
            ad_name = days[0].get("ad_name")
            
            # Pattern 1: CTR Drop > 20%
            if first_day_ctr > 0 and last_day_ctr < (first_day_ctr * 0.8):
                fatigued_ads.append({
                    "ad_id": ad_id,
                    "ad_name": ad_name,
                    "reason": "CTR Drop > 20%",
                    "metrics": f"CTR: {first_day_ctr:.2%} -> {last_day_ctr:.2%}",
                    "severity": "HIGH"
                })
            
            # Pattern 2: High Frequency Saturation
            elif last_day_freq > 2.5 and last_day_ctr < first_day_ctr:
                fatigued_ads.append({
                    "ad_id": ad_id,
                    "ad_name": ad_name,
                    "reason": "Audience Saturation (Freq > 2.5)",
                    "metrics": f"Freq: {last_day_freq} | CTR Drop",
                    "severity": "MEDIUM"
                })
                
        # 3. Find Replacements (Bench)
        replacements = []
        if fatigued_ads:
            from app.services.meta_api import meta_service
            organic = meta_service.get_page_n_posts(limit=5)
            # Simple heuristic: Top liked post
            # In production, sort by engagement rate
            for post in organic.get("data", []):
                replacements.append({
                    "id": post.get("id"),
                    "message": post.get("message", "No text"),
                    "thumbnail": post.get("full_picture") # If available
                })
                
        return {
            "fatigued_ads": fatigued_ads,
            "replacements": replacements,
            "checked_count": len(ads_history)
        }

    def detect_viral_anomalies(self):
        """
        Scans recent organic posts to find Viral Candidates (High Engagement Rate).
        """
        from app.services.meta_api import meta_service
        
        # 1. Fetch Organic Posts with Data
        posts = meta_service.get_page_n_posts(limit=10)
        if "error" in posts:
            return {"error": posts["error"]}
            
        data = posts.get("data", [])
        analyzed_posts = []
        total_er = 0.0
        valid_count = 0
        
        # 2. Calculate Engagement Rate for each
        for post in data:
            try:
                # Extract Metrics
                insights_data = post.get("insights", {}).get("data", [])
                impressions = 0
                engaged_users = 0
                
                for metric in insights_data:
                    if metric["name"] == "post_impressions_unique":
                        impressions = metric["values"][0]["value"]
                    elif metric["name"] == "post_engaged_users":
                        engaged_users = metric["values"][0]["value"]
                
                # Check soft metrics if insights missing (fallback)
                if impressions == 0:
                    likes = post.get("likes", {}).get("summary", {}).get("total_count", 0)
                    comments = post.get("comments", {}).get("summary", {}).get("total_count", 0)
                    shares = post.get("shares", {}).get("count", 0)
                    engaged_users = likes + comments + shares
                    impressions = 100 # Arbitrary floor to avoid div by zero if unknown
                
                er = 0.0
                if impressions > 0:
                    er = engaged_users / impressions
                    
                analyzed_posts.append({
                    "id": post.get("id"),
                    "message": post.get("message", "No text"),
                    "thumbnail": post.get("full_picture"),
                    "created_time": post.get("created_time"),
                    "metrics": {
                        "impressions": impressions,
                        "engagement": engaged_users,
                        "er": er
                    }
                })
                
                if impressions > 50: # Only count stats from posts with min distribution
                    total_er += er
                    valid_count += 1
                    
            except Exception as e:
                logger.error(f"Error analyzing post {post.get('id')}: {e}")
                continue

        # 3. Identify Outliers
        avg_er = (total_er / valid_count) if valid_count > 0 else 0.0
        viral_candidates = []
        
        # Threshold: 1.5x the Average ER
        threshold = avg_er * 1.5
        
        for p in analyzed_posts:
            # Must have minimal engagement to be considered
            if p["metrics"]["engagement"] > 5 and p["metrics"]["er"] > threshold:
                lift = (p["metrics"]["er"] / avg_er) if avg_er > 0 else 0
                viral_candidates.append({
                    **p,
                    "reason": f"Viral Alert! ER is {lift:.1f}x higher than avg.",
                    "lift": lift
                })
        
        # Sort by Lift
        viral_candidates.sort(key=lambda x: x["lift"], reverse=True)
        
        return {
            "avg_er": avg_er,
            "candidates": viral_candidates,
            "checked_count": len(analyzed_posts)
        }

intelligence_service = StrategistAgent()
