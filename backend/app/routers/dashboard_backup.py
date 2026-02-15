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
    # Calculate Total Managed Lifetime (Simulated or from Ads Service)
    # Get Guardian Savings (from AutonomousActions where action=PAUSE/SCALE_UP)
    
    # Mock data for now to match UI perfectly, can be replaced with real DB queries
    savings = 4300.00 # This should ideally come from summing up `saved_amount` in DB if we tracked it
    
    # Check Token Expiry
    token_status = "active"
    days_left = 12
    # Logic to check token expiry from config_service or system.py logic could be here
    
    return {
        "plan": "ENTERPRISE",
        "status": token_status,
        "expires_in_days": days_left,
        "total_managed": 450000.00,
        "guardian_savings": savings
    }

@router.get("/timeline")
def get_timeline(db: Session = Depends(get_db)):
    """
    Returns timeline items for the Action Timeline Card.
    """
    # In a real scenario, this would query a 'ScheduledPosts' table and 'AdsQueue' table.
    # For now, we return the structure expected by the frontend.
    
    # Mock Timeline
    return [
        { "id": "1", "time": "14:00", "platform": "Instagram", "title": "Post Carrossel", "status": "scheduled", "description": "Agendado" },
        { "id": "2", "time": "16:30", "platform": "Meta Ads", "title": "Escalar Campanha Vencedores", "status": "processing", "description": "Regra Automática" },
        { "id": "3", "time": "19:00", "platform": "TikTok", "title": "Vídeo Reels", "status": "draft", "description": "Rascunho - Falta Mídia" },
    ]

@router.get("/audience")
async def get_audience_metrics():
    """
    Returns data for Audience Radar Card.
    Wraps intelligence_service.analyze_social_growth but formats for the card.
    """
    # This service already exists and likely returns what we need or close to it.
    metrics = await intelligence_service.analyze_social_growth()
    
    # Transform to match frontend props if needed
    return metrics

@router.get("/finance")
def get_finance_metrics():
    """
    Returns data for Blended Metrics Card.
    """
    # Uses intelligence_service.get_financial_health()
    return intelligence_service.get_financial_health()

@router.get("/war-room")
def get_war_room_logs(db: Session = Depends(get_db)):
    """
    Returns logs for the War Room Terminal.
    Queries AutonomousAction table and formats as logs.
    """
    from app.models.agent import AutonomousAction
    
    actions = db.query(AutonomousAction).order_by(AutonomousAction.created_at.desc()).limit(10).all()
    
    logs = []
    for action in actions:
        log_type = "GUARDIAN"
        if "paused" in action.action_type.lower():
            log_type = "GUARDIAN"
        elif "scale" in action.action_type.lower():
             log_type = "OPPORTUNITY"
        elif "error" in action.status.lower():
             log_type = "CRITICAL"
        
        logs.append({
            "time": action.created_at.strftime("%I:%M %p"),
            "type": log_type,
            "message": f"{action.reason} ({action.status})"
        })
        
    # If empty, return initial mock logs to not break UI looking empty
    if not logs:
        return [
            { "time": "10:42 AM", "type": "CRITICAL", "message": "Token do Facebook expirou. Reconecte agora para não parar os ads." },
            { "time": "10:30 AM", "type": "GUARDIAN", "message": 'Anúncio "Promoção Verão" pausado. CPA > R$ 50,00. Economia: R$ 200,00.' },
            { "time": "09:15 AM", "type": "OPPORTUNITY", "message": "Criativo #4 está com ROAS 5x. Sugestão: Aumentar orçamento em 20%." },
            { "time": "08:00 AM", "type": "SYSTEM", "message": "Relatório diário enviado para o seu e-mail." }
        ]
        
    return logs
