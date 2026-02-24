from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
from urllib.parse import urlencode, quote_plus
from typing import Optional

load_dotenv()

router = APIRouter()
FACEBOOK_GRAPH_VERSION = "v19.0"

class FacebookLoginRequest(BaseModel):
    access_token: str


def _is_placeholder(value: Optional[str]) -> bool:
    if not value:
        return True

    normalized = value.strip().lower()
    placeholder_values = {
        "your_app_id_here",
        "your_app_secret_here",
        "your_facebook_app_id",
        "your_facebook_app_secret",
        "change_me",
        "changeme",
        "replace_me",
    }
    return normalized in placeholder_values or normalized.startswith("your_") or "placeholder" in normalized


def _api_base_url(config_service) -> str:
    return config_service.get_setting("B_STUDIO_API_BASE_URL", "http://localhost:8001").rstrip("/")


def _frontend_base_url(config_service) -> str:
    return config_service.get_setting("B_STUDIO_FRONTEND_URL", "http://localhost:3000").rstrip("/")


def _facebook_redirect_uri(config_service) -> str:
    return f"{_api_base_url(config_service)}/api/auth/facebook/callback"

def _resolve_default_ad_account_id(access_token: str) -> Optional[str]:
    """
    Fetches the first accessible ad account and returns it as `act_<id>`.
    """
    try:
        response = requests.get(
            "https://graph.facebook.com/v19.0/me/adaccounts",
            params={
                "fields": "id,account_id",
                "limit": 1,
                "access_token": access_token,
            },
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
        accounts = payload.get("data", [])
        if not accounts:
            return None

        first = accounts[0]
        account_id = first.get("id") or first.get("account_id")
        if not account_id:
            return None

        account_id = str(account_id)
        return account_id if account_id.startswith("act_") else f"act_{account_id}"
    except Exception:
        return None


@router.post("/facebook")
async def facebook_auth(request: FacebookLoginRequest):
    """
    Receives a short-lived token from the frontend and exchanges it
    for a long-lived token (60 days).
    """
    from app.services.config import config_service

    app_id = config_service.get_setting("FACEBOOK_APP_ID")
    app_secret = config_service.get_setting("FACEBOOK_APP_SECRET")

    if _is_placeholder(app_id) or _is_placeholder(app_secret):
        raise HTTPException(
            status_code=400,
            detail="Meta App ID/App Secret inválidos ou não configurados. Atualize com credenciais reais no bia."
        )

    # Exchange short-lived -> long-lived token
    url = f"https://graph.facebook.com/{FACEBOOK_GRAPH_VERSION}/oauth/access_token"
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
        if not long_lived_token:
            raise HTTPException(status_code=400, detail="Meta did not return an access token.")

        default_ad_account = _resolve_default_ad_account_id(long_lived_token)

        # Keep a runtime copy and persist to DB settings.
        os.environ["FACEBOOK_ACCESS_TOKEN"] = long_lived_token
        settings_to_save = {"meta_access_token": long_lived_token}
        if default_ad_account:
            settings_to_save["meta_ad_account_id"] = default_ad_account
            os.environ["FACEBOOK_AD_ACCOUNT_ID"] = default_ad_account
        config_service.set_settings(settings_to_save)

        return {
            "status": "success",
            "message": "Long-lived token generated and saved in system settings",
            "expires_in": data.get("expires_in"),
            "meta_ad_account_id": default_ad_account,
        }

    except requests.exceptions.RequestException as e:
        response_text = e.response.text if e.response is not None else "No response"
        raise HTTPException(
            status_code=400,
            detail=f"Falha ao autenticar na Meta: {response_text}",
        )


from fastapi.responses import RedirectResponse

@router.get("/facebook/login")
def facebook_login():
    from app.services.config import config_service
    
    app_id = config_service.get_setting("FACEBOOK_APP_ID")
    app_secret = config_service.get_setting("FACEBOOK_APP_SECRET")
    if _is_placeholder(app_id) or _is_placeholder(app_secret):
        raise HTTPException(
            status_code=400,
            detail="Meta App ID/App Secret inválidos ou não configurados. Atualize com credenciais reais no bia."
        )

    redirect_uri = _facebook_redirect_uri(config_service)
    scope = "ads_management,ads_read,business_management,instagram_basic,instagram_manage_comments,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_ads,public_profile"

    query = urlencode({
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "scope": scope,
        "response_type": "code",
        "display": "page",
        "auth_type": "rerequest",
    })
    # Use non-versioned dialog URL for better compatibility on Meta frontend.
    return RedirectResponse(f"https://www.facebook.com/dialog/oauth?{query}")


@router.get("/facebook/redirect-info")
def facebook_redirect_info():
    """
    Returns the exact OAuth redirect URL that must be whitelisted on Meta app settings.
    """
    from app.services.config import config_service

    return {
        "oauth_redirect_uri": _facebook_redirect_uri(config_service),
        "frontend_success_url": f"{_frontend_base_url(config_service)}?auth_success=true",
        "note": "Add oauth_redirect_uri to Meta > App > Facebook Login > Valid OAuth Redirect URIs.",
    }

@router.get("/facebook/callback")
def facebook_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_reason: Optional[str] = None,
    error_description: Optional[str] = None,
):
    from app.services.config import config_service
    
    app_id = config_service.get_setting("FACEBOOK_APP_ID")
    app_secret = config_service.get_setting("FACEBOOK_APP_SECRET")
    frontend_base_url = _frontend_base_url(config_service)
    
    if _is_placeholder(app_id) or _is_placeholder(app_secret):
        raise HTTPException(status_code=400, detail="Meta App ID/App Secret inválidos ou não configurados.")

    if error:
        detail = error_description or error_reason or error
        return RedirectResponse(f"{frontend_base_url}?auth_error={quote_plus(detail)}")

    if not code:
        return RedirectResponse(f"{frontend_base_url}?auth_error={quote_plus('Código de autorização ausente no retorno da Meta.')}")

    redirect_uri = _facebook_redirect_uri(config_service)
    
    # 1. Exchange Code for Short-Lived Token
    token_url = f"https://graph.facebook.com/{FACEBOOK_GRAPH_VERSION}/oauth/access_token"
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
        exchange_url = f"https://graph.facebook.com/{FACEBOOK_GRAPH_VERSION}/oauth/access_token"
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
             
        # 3. Save token and first ad account automatically
        default_ad_account = _resolve_default_ad_account_id(final_token)
        settings_to_save = {"meta_access_token": final_token}
        if default_ad_account:
            settings_to_save["meta_ad_account_id"] = default_ad_account
            os.environ["FACEBOOK_AD_ACCOUNT_ID"] = default_ad_account
        config_service.set_settings(settings_to_save)
        os.environ["FACEBOOK_ACCESS_TOKEN"] = final_token

        # 4. Redirect back to Frontend
        return RedirectResponse(f"{frontend_base_url}?auth_success=true")
    except HTTPException as http_error:
        raise http_error
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
