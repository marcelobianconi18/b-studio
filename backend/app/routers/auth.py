
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

