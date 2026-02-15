
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.agent import AgentSettings, AgentMode, Recommendation, AutonomousAction
from app.services.intelligence import intelligence_service
from app.services.meta_ads import meta_ads_service
from pydantic import BaseModel

router = APIRouter()

class ModeUpdate(BaseModel):
    mode: str # manual, hybrid, automatic


def _get_or_create_agent_settings(db: Session) -> AgentSettings:
    rows = db.query(AgentSettings).order_by(AgentSettings.id.asc()).all()
    if not rows:
        settings = AgentSettings(mode=AgentMode.MANUAL.value)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        return settings

    primary = rows[0]
    if len(rows) > 1:
        for duplicate in rows[1:]:
            db.delete(duplicate)
        db.commit()
        db.refresh(primary)
    return primary


def _infer_recommendation_action(rec: Recommendation) -> str:
    text = f"{rec.title or ''} {rec.content or ''}".lower()
    if "paus" in text:
        return "PAUSE"
    if "escal" in text or "aument" in text:
        return "SCALE_UP"
    return "REVIEW"


@router.get("/config")
def get_config(db: Session = Depends(get_db)):
    return _get_or_create_agent_settings(db)

@router.post("/mode")
def update_mode(update: ModeUpdate, db: Session = Depends(get_db)):
    if update.mode not in [m.value for m in AgentMode]:
        raise HTTPException(status_code=400, detail="Invalid mode")

    config = _get_or_create_agent_settings(db)
    config.mode = update.mode
    db.commit()
    return {"status": "success", "new_mode": update.mode}

@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    return (
        db.query(Recommendation)
        .filter(Recommendation.is_executed.is_(False))
        .order_by(Recommendation.created_at.desc())
        .limit(10)
        .all()
    )


@router.post("/recommendations/{recommendation_id}/execute")
def execute_recommendation(recommendation_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.is_executed:
        return {"status": "already_executed", "recommendation_id": recommendation_id}

    action_type = _infer_recommendation_action(rec)
    provider_result = None
    execution_status = "completed"

    if rec.campaign_id and action_type in {"PAUSE", "SCALE_UP"}:
        target_status = "PAUSED" if action_type == "PAUSE" else "ACTIVE"
        provider_result = meta_ads_service.toggle_campaign_status(rec.campaign_id, target_status)
        if isinstance(provider_result, dict) and provider_result.get("error"):
            execution_status = "failed"

    log = AutonomousAction(
        action_type=action_type,
        campaign_id=rec.campaign_id or "N/A",
        reason=rec.content or rec.title or "Recommendation executed",
        status=execution_status,
    )
    rec.is_executed = True
    db.add(log)
    db.commit()

    return {
        "status": execution_status,
        "recommendation_id": recommendation_id,
        "action_type": action_type,
        "result": provider_result,
    }


@router.post("/recommendations/{recommendation_id}/dismiss")
def dismiss_recommendation(recommendation_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.is_executed:
        return {"status": "already_executed", "recommendation_id": recommendation_id}

    rec.is_executed = True
    log = AutonomousAction(
        action_type="DISMISS",
        campaign_id=rec.campaign_id or "N/A",
        reason=f"Dismissed recommendation: {rec.content or rec.title or recommendation_id}",
        status="completed",
    )
    db.add(log)
    db.commit()
    return {"status": "dismissed", "recommendation_id": recommendation_id}

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(AutonomousAction).order_by(AutonomousAction.created_at.desc()).limit(20).all()

@router.post("/trigger-analysis")
async def trigger_analysis(db: Session = Depends(get_db)):
    """Manually trigger the agent to analyze right now."""
    config = _get_or_create_agent_settings(db)
    mode = config.mode if config else AgentMode.MANUAL.value
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
