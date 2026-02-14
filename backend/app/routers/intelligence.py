
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.agent import AgentSettings, AgentMode, Recommendation, AutonomousAction
from app.services.intelligence import intelligence_service
from pydantic import BaseModel

router = APIRouter()

class ModeUpdate(BaseModel):
    mode: str # manual, hybrid, automatic

@router.get("/config")
def get_config(db: Session = Depends(get_db)):
    config = db.query(AgentSettings).first()
    if not config:
        config = AgentSettings(mode=AgentMode.MANUAL.value)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.post("/mode")
def update_mode(update: ModeUpdate, db: Session = Depends(get_db)):
    if update.mode not in [m.value for m in AgentMode]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    
    config = db.query(AgentSettings).first()
    if not config:
        config = AgentSettings(mode=update.mode)
        db.add(config)
    else:
        config.mode = update.mode
    
    db.commit()
    return {"status": "success", "new_mode": update.mode}

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    return db.query(Recommendation).order_by(Recommendation.created_at.desc()).limit(10).all()

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(AutonomousAction).order_by(AutonomousAction.created_at.desc()).limit(20).all()

@router.post("/trigger-analysis")
async def trigger_analysis(db: Session = Depends(get_db)):
    """Manually trigger the agent to analyze right now."""
    config = db.query(AgentSettings).first()
    mode = config.mode if config else "manual"
    if mode == "manual":
        return {"status": "skipped", "message": "Agent is in Manual mode."}
    
    await intelligence_service.analyze_performance(mode)
    return {"status": "analysis_triggered"}

@router.post("/generate-audit")
async def generate_audit(days: int = 365):
    """Triggers the long-term historical audit."""
    return await intelligence_service.generate_historical_audit(days)

@router.get("/audits")
def get_audits(db: Session = Depends(get_db)):
    from app.models.agent import HistoricalAudit
    return db.query(HistoricalAudit).order_by(HistoricalAudit.created_at.desc()).all()

@router.get("/social-analysis")
async def get_social_analysis():
    """Get the latest social growth analysis."""
    return await intelligence_service.analyze_social_growth()

@router.get("/financial-health")
async def get_financial_health(fixed_costs: float = 2000.0):
    """Calculates True ROI (Blended CAC)."""
    return intelligence_service.get_financial_health(fixed_costs)

@router.get("/fatigue-monitor")
async def get_fatigue_monitor():
    """Checks for ad creative fatigue (CTR drops)."""
    return intelligence_service.check_creative_fatigue()

@router.get("/viral-monitor")
async def get_viral_monitor():
    """Checks for organic posts with abnormal engagement (Viral Candidates)."""
    return intelligence_service.detect_viral_anomalies()
