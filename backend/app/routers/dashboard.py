from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.intelligence import intelligence_service
from app.services.config import config_service
import random
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/plan-status")
def get_plan_status(db: Session = Depends(get_db)):
    """
    Returns data for the Plan Status Card.
    """
    total_managed = 0.0
    # In a real scenario, fetch total spend from all AdAccounts
    
    # Calculate Savings
    # Mock for now or we can implement a query to AutonomousAction table
    savings = 4300.20
    
    # Token Status - Check real config
    has_token = config_service.get_setting("FACEBOOK_ACCESS_TOKEN")
    token_status = "active" if has_token else "expired"
    
    return {
        "plan": "ENTERPRISE",
        "status": token_status,
        "expires_in_days": 12, # Hardcoded for demo/MVP as requested
        "total_managed": 450000.00, # Hardcoded demo value
        "guardian_savings": savings
    }

@router.get("/timeline")
def get_timeline(db: Session = Depends(get_db)):
    """
    Returns timeline items for the Action Timeline Card.
    """
    # Mock Timeline matching the frontend interface
    return [
        { "id": "1", "time": "14:00", "platform": "Instagram", "title": "Post Carrossel", "status": "scheduled", "description": "Agendado" },
        { "id": "2", "time": "16:30", "platform": "Meta Ads", "title": "Escalar Campanha Vencedores", "status": "processing", "description": "Regra Automática" },
        { "id": "3", "time": "19:00", "platform": "TikTok", "title": "Vídeo Reels", "status": "draft", "description": "Rascunho - Falta Mídia" },
    ]

@router.get("/audience")
async def get_audience_metrics():
    """
    Returns data for Audience Radar Card.
    """
    try:
        metrics = await intelligence_service.analyze_social_growth()
        # Ensure metrics matches structure expected by frontend or return mock if service fails/returns empty
        if not metrics:
             return {
                "followers": "407k",
                "growth": "+1.2%",
                "sentiment_positive": 80,
                "sentiment_neutral": 15,
                "sentiment_negative": 5,
                "best_time": "18:45"
            }
        return metrics
    except Exception:
        # Fallback Mock
        return {
            "followers": "407k",
            "growth": "+1.2%",
            "sentiment_positive": 80,
            "sentiment_neutral": 15,
            "sentiment_negative": 5,
            "best_time": "18:45"
        }

@router.get("/finance")
def get_finance_metrics():
    """
    Returns data for Blended Metrics Card.
    """
    try:
        finance = intelligence_service.get_financial_health()
        if not finance:
             return {
                "roas": 3.4,
                "spend_today": 1250.00,
                "revenue_today": 4250.00,
                "nc_cpa": 45.00,
                "fb_spend": 800.00,
                "google_spend": 450.00
            }
        return finance
    except Exception:
         return {
                "roas": 3.4,
                "spend_today": 1250.00,
                "revenue_today": 4250.00,
                "nc_cpa": 45.00,
                "fb_spend": 800.00,
                "google_spend": 450.00
            }

@router.get("/war-room")
def get_war_room_logs(db: Session = Depends(get_db)):
    from app.models.agent import AutonomousAction
    
    try:
        actions = db.query(AutonomousAction).order_by(AutonomousAction.created_at.desc()).limit(10).all()
        
        logs = []
        for action in actions:
            log_type = "GUARDIAN"
            val = action.action_type.upper()
            if "PAUSE" in val:
                log_type = "GUARDIAN"
            elif "SCALE" in val or "OPP" in val:
                log_type = "OPPORTUNITY"
            elif "ERROR" in action.status.lower() or "FAIL" in action.status.lower():
                log_type = "CRITICAL"
            elif "DISMISS" in val:
                log_type = "SYSTEM"
            
            logs.append({
                "time": action.created_at.strftime("%I:%M %p"),
                "type": log_type,
                "message": f"{action.reason}"
            })
            
        if not logs:
             return [
                { "time": "10:42 AM", "type": "CRITICAL", "message": "Token do Facebook expirou. Reconecte agora para não parar os ads." },
                { "time": "10:30 AM", "type": "GUARDIAN", "message": 'Anúncio "Promoção Verão" pausado. CPA > R$ 50,00. Economia: R$ 200,00.' },
                { "time": "09:15 AM", "type": "OPPORTUNITY", "message": "Criativo #4 está com ROAS 5x. Sugestão: Aumentar orçamento em 20%." },
                { "time": "08:00 AM", "type": "SYSTEM", "message": "Relatório diário enviado para o seu e-mail." }
            ]
        return logs
    except Exception:
         return [
            { "time": "10:42 AM", "type": "CRITICAL", "message": "Token do Facebook expirou. Reconecte agora para não parar os ads." },
            { "time": "10:30 AM", "type": "GUARDIAN", "message": 'Anúncio "Promoção Verão" pausado. CPA > R$ 50,00. Economia: R$ 200,00.' },
            { "time": "09:15 AM", "type": "OPPORTUNITY", "message": "Criativo #4 está com ROAS 5x. Sugestão: Aumentar orçamento em 20%." },
            { "time": "08:00 AM", "type": "SYSTEM", "message": "Relatório diário enviado para o seu e-mail." }
        ]
