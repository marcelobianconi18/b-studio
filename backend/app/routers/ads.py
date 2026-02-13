
from fastapi import APIRouter, HTTPException, Query
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
