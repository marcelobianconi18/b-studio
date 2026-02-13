
import os
import requests
import logging

logger = logging.getLogger(__name__)

class MetaAdsService:
    """
    Service for interacting with Meta Marketing API (Ads Manager).
    """
    BASE_URL = "https://graph.facebook.com/v19.0"

    def __init__(self):
        self.access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
        # Optional: You can hardcode an Ad Account ID or fetch the first one available
        self.ad_account_id = os.getenv("FACEBOOK_AD_ACCOUNT_ID") 

    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def list_ad_accounts(self):
        """
        List all Ad Accounts the user has access to.
        Important for selecting which account to manage.
        """
        if not self.access_token:
            return {"error": "Missing Access Token"}

        url = f"{self.BASE_URL}/me/adaccounts"
        params = {
            "fields": "name,account_id,currency,account_status,balance",
            "limit": 10
        }
        
        try:
            response = requests.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching ad accounts: {e}")
            return {"error": str(e), "details": response.text if response else "No response"}

    def get_campaigns(self, account_id: str = None):
        """
        Get all campaigns for a specific ad account.
        Includes basic metrics like status, objective, and spend.
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
            response = requests.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching campaigns for {target_account}: {e}")
            return {"error": str(e)}

    def toggle_campaign_status(self, campaign_id: str, new_status: str):
        """
        Enable/Disable a campaign.
        new_status: 'ACTIVE' or 'PAUSED'
        """
        if new_status not in ['ACTIVE', 'PAUSED']:
             return {"error": "Invalid status. Use ACTIVE or PAUSED"}

        url = f"{self.BASE_URL}/{campaign_id}"
        payload = {
            "status": new_status
        }
        
        try:
            response = requests.post(url, headers=self._get_headers(), json=payload)
            response.raise_for_status()
            return {"success": True, "campaign_id": campaign_id, "new_status": new_status}
        except requests.exceptions.RequestException as e:
            logger.error(f"Error updating campaign {campaign_id}: {e}")
            return {"error": str(e)}

    def get_historical_insights(self, ad_account_id: str = None, days: int = 365):
        """
        Fetch aggregate insights for the entire account over a period.
        Used for historical auditing.
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
            "fields": "spend,cpc,ctr,impressions,clicks,reach,objective",
            "time_increment": "30", # Monthly buckets for the LLM to process easily
            "limit": 50
        }

        try:
            response = requests.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching historical insights for {target_account}: {e}")
            return {"error": str(e)}

    def get_active_ad_posts(self, account_id: str = None):
        """
        Fetch all active ads and return their 'effective_object_story_id' (Post ID).
        This allows us to track comments on ads (Dark Posts).
        """
        target_account = account_id or self.ad_account_id
        if not target_account:
            return {"data": []} # Fail silently for inbox polling

        if not target_account.startswith("act_"):
            target_account = f"act_{target_account}"
            
        url = f"{self.BASE_URL}/{target_account}/ads"
        params = {
            "fields": "name,creative{effective_object_story_id},status",
            "filtering": "[{'field':'status','operator':'IN','value':['ACTIVE']}]",
            "limit": 50
        }
        
        try:
            response = requests.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            
            # Extract just the Post IDs
            ads = response.json().get("data", [])
            post_ids = []
            for ad in ads:
                story_id = ad.get("creative", {}).get("effective_object_story_id")
                if story_id:
                    post_ids.append(story_id)
            
            return list(set(post_ids)) # Deduplicate
            
        except requests.exceptions.RequestException as e:
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
            "date_preset": "last_3d", # Variable days not supported in preset, using 3d as standard
            "time_increment": "1", # Daily breakdown
            "fields": "ad_id,ad_name,spend,cpc,ctr,frequency,reach,impressions",
            "filtering": "[{'field':'ad.delivery_info','operator':'IN','value':['active', 'limited']}]",
            "limit": 100
        }
        
        try:
            response = requests.get(url, headers=self._get_headers(), params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching ad insights: {e}")
            return {"error": str(e)}

meta_ads_service = MetaAdsService()
