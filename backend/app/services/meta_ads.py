
import os
import requests
import logging
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, RetryError

logger = logging.getLogger(__name__)

class MetaAdsService:
    """
    Service for interacting with Meta Marketing API (Ads Manager).
    Includes retry logic for production resilience.
    """
    BASE_URL = "https://graph.facebook.com/v19.0"

    def __init__(self):
        from app.services.config import config_service
        self.config = config_service

    @property
    def access_token(self):
        return self.config.get_setting("FACEBOOK_ACCESS_TOKEN")

    @property
    def ad_account_id(self):
        return self.config.get_setting("FACEBOOK_AD_ACCOUNT_ID") 

    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def _normalize_meta_error(self, error: Exception) -> str:
        """
        Converts low-level request/retry exceptions into user-friendly messages.
        """
        root_error: Exception = error
        if isinstance(error, RetryError):
            last_error = error.last_attempt.exception()
            if isinstance(last_error, Exception):
                root_error = last_error

        if isinstance(root_error, requests.HTTPError):
            response = root_error.response
            status_code = response.status_code if response is not None else None

            meta_message = ""
            if response is not None:
                try:
                    payload = response.json()
                    meta_message = payload.get("error", {}).get("message", "")
                except Exception:
                    meta_message = ""

            if status_code in (400, 401, 403):
                detail = meta_message or "Token expirado, inválido, ou sem permissões suficientes."
                return f"Falha ao autenticar com Meta Ads. {detail} Reconecte sua conta no B-Studio."

            if meta_message:
                return f"Erro da API Meta Ads: {meta_message}"

        if isinstance(root_error, requests.RequestException):
            return "Não foi possível acessar a API da Meta no momento. Tente novamente em instantes."

        return str(root_error)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(requests.exceptions.RequestException))
    def _make_request(self, method, url, params=None, json=None):
        """
        Centralized request handler with Retry logic.
        """
        response = requests.request(method, url, headers=self._get_headers(), params=params, json=json, timeout=30)
        response.raise_for_status()
        return response.json()

    def list_ad_accounts(self):
        """
        List all Ad Accounts the user has access to.
        """
        if not self.access_token:
            return {"error": "Missing Access Token"}

        url = f"{self.BASE_URL}/me/adaccounts"
        params = {
            "fields": "name,account_id,currency,account_status,balance",
            "limit": 10
        }
        
        try:
            return self._make_request("GET", url, params=params)
        except Exception as e:
            logger.error(f"Error fetching ad accounts: {e}")
            return {"error": self._normalize_meta_error(e)}

    def get_campaigns(self, account_id: str = None):
        """
        Get all campaigns for a specific ad account.
        """
        target_account = account_id or self.ad_account_id
        if not target_account:
             # If no account provided and none in env, try to fetch first one
             accounts = self.list_ad_accounts()
             if "data" in accounts and len(accounts["data"]) > 0:
                 target_account = accounts["data"][0]["id"]
             else:
                 return {"error": "No Ad Account ID provided and none found automatically."}

        # Ensure account_id starts with 'act_'
        if not target_account.startswith("act_"):
            target_account = f"act_{target_account}"

        url = f"{self.BASE_URL}/{target_account}/campaigns"
        params = {
            "fields": "name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights{spend,cpc,ctr,cpp,impressions,clicks}",
            "limit": 50,
            "effective_status": "['ACTIVE','PAUSED']" # Filter only relevant campaigns
        }

        try:
            return self._make_request("GET", url, params=params)
        except Exception as e:
            logger.error(f"Error fetching campaigns for {target_account}: {e}")
            return {"error": self._normalize_meta_error(e)}

    def toggle_campaign_status(self, campaign_id: str, new_status: str):
        """
        Enable/Disable a campaign.
        """
        if new_status not in ['ACTIVE', 'PAUSED']:
             return {"error": "Invalid status. Use ACTIVE or PAUSED"}

        url = f"{self.BASE_URL}/{campaign_id}"
        payload = {
            "status": new_status
        }
        
        try:
            return self._make_request("POST", url, json=payload)
        except Exception as e:
            logger.error(f"Error updating campaign {campaign_id}: {e}")
            return {"error": self._normalize_meta_error(e)}

    def get_historical_insights(self, ad_account_id: str = None, days: int = 365):
        """
        Fetch aggregate insights for the entire account over a period.
        """
        target_account = ad_account_id or self.ad_account_id
        if not target_account:
            return {"error": "No Ad Account ID provided."}

        if not target_account.startswith("act_"):
            target_account = f"act_{target_account}"

        url = f"{self.BASE_URL}/{target_account}/insights"
        
        # We fetch month by month or as a pre-set range
        params = {
            "date_preset": "maximum" if days > 900 else ("last_year" if days > 90 else "last_90d"),
            "fields": "spend,cpc,ctr,impressions,clicks,reach,objective,actions,action_values",
            "time_increment": "30", # Monthly buckets for the LLM to process easily
            "limit": 50
        }

        try:
            return self._make_request("GET", url, params=params)
        except Exception as e:
            logger.error(f"Error fetching historical insights for {target_account}: {e}")
            return {"error": self._normalize_meta_error(e)}

    def get_active_ad_posts(self, account_id: str = None):
        """
        Fetch all active ads and return their 'effective_object_story_id' (Post ID).
        """
        target_account = account_id or self.ad_account_id
        if not target_account:
            return {"data": []}

        if not target_account.startswith("act_"):
            target_account = f"act_{target_account}"
            
        url = f"{self.BASE_URL}/{target_account}/ads"
        params = {
            "fields": "name,creative{effective_object_story_id},status",
            "filtering": "[{'field':'status','operator':'IN','value':['ACTIVE']}]",
            "limit": 50
        }
        
        try:
            # We call _make_request but we need to process the result to return a list
            data = self._make_request("GET", url, params=params)
            
            # Extract just the Post IDs
            ads = data.get("data", [])
            post_ids = []
            for ad in ads:
                story_id = ad.get("creative", {}).get("effective_object_story_id")
                if story_id:
                    post_ids.append(story_id)
            
            return list(set(post_ids)) # Deduplicate
            
        except Exception as e:
            logger.error(f"Error fetching ad posts: {e}")
            return []

    def get_ad_creative_insights(self, days: int = 3):
        """
        Fetch daily insights for all ACTIVE ads to detect fatigue.
        """
        target_account = self.ad_account_id
        if not target_account:
            return {"data": []}

        if not target_account.startswith("act_"):
            target_account = f"act_{target_account}"
            
        url = f"{self.BASE_URL}/{target_account}/insights"
        params = {
            "level": "ad",
            "date_preset": "last_3d", 
            "time_increment": "1", 
            "fields": "ad_id,ad_name,spend,cpc,ctr,frequency,reach,impressions",
            "filtering": "[{'field':'ad.delivery_info','operator':'IN','value':['active', 'limited']}]",
            "limit": 100
        }
        
        try:
            return self._make_request("GET", url, params=params)
        except Exception as e:
            logger.error(f"Error fetching ad insights: {e}")
            return {"error": self._normalize_meta_error(e)}

meta_ads_service = MetaAdsService()
