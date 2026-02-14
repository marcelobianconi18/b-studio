import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
import requests

router = APIRouter(tags=["System"])

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    """
    Checks the health of external integrations (Meta, OpenAI/Ollama) and DB.
    Returns status for the Connectivity Hub.
    """
    status = {
        "database": "disconnected",
        "meta_api": "disconnected",
        "ai_model": "disconnected",
        "meta_token_expiry_days": 0
    }

    # 1. Check Database
    try:
        db.execute(text("SELECT 1"))
        status["database"] = "connected"
    except Exception:
        status["database"] = "error"

    # 2. Check Meta API (Token Validity)
    from app.services.config import config_service
    
    access_token = config_service.get_setting("FACEBOOK_ACCESS_TOKEN")
    app_id = config_service.get_setting("FACEBOOK_APP_ID")
    app_secret = config_service.get_setting("FACEBOOK_APP_SECRET")
    
    if access_token and app_id and app_secret:
        try:
            # Debug Token Endpoint to check expiry
            url = f"https://graph.facebook.com/debug_token?input_token={access_token}&access_token={app_id}|{app_secret}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("data", {}).get("is_valid"):
                    status["meta_api"] = "connected"
                    expires_at = data["data"].get("expires_at", 0)
                    if expires_at > 0:
                        import time
                        days = (expires_at - time.time()) / 86400
                        status["meta_token_expiry_days"] = int(days)
                    else:
                         status["meta_token_expiry_days"] = 999 # Never expires (System User)
                else:
                    status["meta_api"] = "expired"
            else:
                 status["meta_api"] = "error"
        except Exception:
             status["meta_api"] = "error"
    else:
        status["meta_api"] = "missing_config"

    # 3. Check AI Model (Ollama)
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") # URL is likely still Env based for now
    # We could check OpenAI key validity here too if we wanted, but for now just Ollama ping
    openai_key = config_service.get_setting("OPENAI_API_KEY")
    try:
        resp = requests.get(f"{ollama_url}/api/tags", timeout=2)
        if resp.status_code == 200:
            status["ai_model"] = "connected"
        else:
            status["ai_model"] = "error"
    except Exception:
        status["ai_model"] = "disconnected"

    return status


from typing import Optional
from pydantic import BaseModel

class CredentialsUpdate(BaseModel):
    meta_access_token: Optional[str] = None
    meta_ad_account_id: Optional[str] = None
    meta_app_id: Optional[str] = None
    meta_app_secret: Optional[str] = None
    openai_api_key: Optional[str] = None

@router.post("/credentials")
def update_credentials(creds: CredentialsUpdate, db: Session = Depends(get_db)):
    """
    Updates system credentials in the database.
    """
    from app.services.config import config_service
    # Update config
    data = creds.dict(exclude_unset=True)
    
    # Filter out masked values to prevent overwriting real keys with asterisks
    filtered_data = {k: v for k, v in data.items() if v != "********"}
    
    success = config_service.set_settings(filtered_data)
    
    if success:
        return {"status": "success", "message": "Credentials updated successfully"}
    else:
        return {"status": "error", "message": "Failed to update credentials"}

@router.get("/credentials")
def get_credentials(db: Session = Depends(get_db)):
    """
    Returns masked credentials for the UI.
    """
    from app.services.config import config_service
    
    return {
        "meta_access_token": "********" if config_service.get_setting("FACEBOOK_ACCESS_TOKEN") else None,
        "meta_ad_account_id": config_service.get_setting("FACEBOOK_AD_ACCOUNT_ID"),
        "meta_app_id": config_service.get_setting("FACEBOOK_APP_ID"),
        "meta_app_secret": "********" if config_service.get_setting("FACEBOOK_APP_SECRET") else None,
        "openai_api_key": "********" if config_service.get_setting("OPENAI_API_KEY") else None,
    }
