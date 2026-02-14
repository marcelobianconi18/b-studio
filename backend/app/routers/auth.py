
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv, set_key

load_dotenv()

router = APIRouter()

class FacebookLoginRequest(BaseModel):
    access_token: str

@router.post("/facebook")
async def facebook_auth(request: FacebookLoginRequest):
    """
    Receives a short-lived token from the frontend and exchanges it
    for a long-lived token (60 days).
    """
    app_id = os.getenv("FACEBOOK_APP_ID")
    app_secret = os.getenv("FACEBOOK_APP_SECRET")

    if not app_id or not app_secret:
        raise HTTPException(
            status_code=500, 
            detail="FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not configured in backend."
        )

    # Exchange short-lived -> long-lived token
    url = "https://graph.facebook.com/v19.0/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": request.access_token
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        long_lived_token = data.get("access_token")
        
        # Update .env file automatically
        env_path = os.path.join(os.getcwd(), ".env")
        set_key(env_path, "FACEBOOK_ACCESS_TOKEN", long_lived_token)
        
        # Also update os.environ for immediate use
        os.environ["FACEBOOK_ACCESS_TOKEN"] = long_lived_token

        return {
            "status": "success",
            "message": "Long-lived token generated and saved in .env",
            "expires_in": data.get("expires_in")
        }

    except requests.exceptions.RequestException as e:
        return {"error": str(e), "details": response.text if response else "No response"}


from fastapi.responses import RedirectResponse

@router.get("/facebook/login")
def facebook_login():
    from app.services.config import config_service
    
    app_id = config_service.get_setting("FACEBOOK_APP_ID")
    if not app_id:
        raise HTTPException(status_code=400, detail="Facebook App ID not configured")
        
    redirect_uri = "http://localhost:8001/api/auth/facebook/callback"
    scope = "ads_management,ads_read,read_insights,pages_show_list,pages_read_engagement,pages_manage_metadata,public_profile"
    
    return RedirectResponse(
        f"https://www.facebook.com/v19.0/dialog/oauth?client_id={app_id}&redirect_uri={redirect_uri}&scope={scope}"
    )

@router.get("/facebook/callback")
def facebook_callback(code: str):
    from app.services.config import config_service
    
    app_id = config_service.get_setting("FACEBOOK_APP_ID")
    app_secret = config_service.get_setting("FACEBOOK_APP_SECRET")
    
    if not app_id or not app_secret:
        raise HTTPException(status_code=400, detail="App Credentials missing")
        
    redirect_uri = "http://localhost:8001/api/auth/facebook/callback"
    
    # 1. Exchange Code for Short-Lived Token
    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    params = {
        "client_id": app_id,
        "client_secret": app_secret,
        "redirect_uri": redirect_uri,
        "code": code
    }
    
    try:
        resp = requests.get(token_url, params=params)
        data = resp.json()
        
        if "error" in data:
            raise HTTPException(status_code=400, detail=f"Auth Failed: {data['error'].get('message')}")
            
        short_token = data["access_token"]
        
        # 2. Exchange Short-Lived for Long-Lived Token
        exchange_url = "https://graph.facebook.com/v19.0/oauth/access_token"
        exchange_params = {
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": short_token
        }
        
        exch_resp = requests.get(exchange_url, params=exchange_params)
        exch_data = exch_resp.json()
        
        if "error" in exch_data:
             # Fallback to short token if exchange fails (rare)
             final_token = short_token
        else:
             final_token = exch_data.get("access_token", short_token)
             
        # 3. Save to DB via ConfigServer
        config_service.set_settings({"meta_access_token": final_token})
        
        # 4. Redirect back to Frontend
        return RedirectResponse("http://localhost:3000?auth_success=true")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
