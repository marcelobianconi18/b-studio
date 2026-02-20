
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import (
    CampaignAnalyzeRequest,
    CampaignAnalysisReportResponse,
)
from app.services.campaign_analysis import campaign_analysis_service
from app.services.meta_ads import meta_ads_service
from typing import Optional

router = APIRouter()

@router.get("/accounts")
def list_ad_accounts():
    """List available Meta Ad Accounts."""
    result = meta_ads_service.list_ad_accounts()
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/campaigns")
def list_campaigns(account_id: Optional[str] = None):
    """
    List campaigns with performance metrics.
    If account_id is not provided, it tries to use the default one.
    """
    result = meta_ads_service.get_campaigns(account_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/campaigns/{campaign_id}/toggle")
def toggle_campaign(campaign_id: str, status: str = Query(..., regex="^(ACTIVE|PAUSED)$")):
    """
    Pause or Activate a campaign.
    """
    result = meta_ads_service.toggle_campaign_status(campaign_id, status)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/campaigns/{campaign_id}/analyze", response_model=CampaignAnalysisReportResponse)
def analyze_campaign(
    campaign_id: str,
    payload: CampaignAnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze one campaign and persist a report snapshot.
    """
    result = campaign_analysis_service.analyze_campaign(
        db=db,
        campaign_id=campaign_id,
        goal_type=payload.goal_type,
        analysis_mode=payload.analysis_mode,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/campaigns/{campaign_id}/report", response_model=CampaignAnalysisReportResponse)
def get_campaign_report(campaign_id: str, db: Session = Depends(get_db)):
    """
    Get latest analysis report for one campaign.
    """
    result = campaign_analysis_service.get_latest_report(db=db, campaign_id=campaign_id)
    if not result:
        raise HTTPException(status_code=404, detail="No analysis report found for this campaign.")
    return result
