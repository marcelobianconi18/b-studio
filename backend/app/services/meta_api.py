
import os
import facebook
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests

load_dotenv()

class MetaService:
    """
    Handle interactions with Facebook Graph API for posting content.
    Includes retry logic for production resilience.
    """
    def __init__(self):
        self.access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
        self.page_id = os.getenv("FACEBOOK_PAGE_ID")
        if not self.access_token or not self.page_id:
            # warn or error, but let's allow instantiation for now
            print("WARNING: FACEBOOK_ACCESS_TOKEN or FACEBOOK_PAGE_ID not set.")
            self.graph = None
        else:
            self.graph = facebook.GraphAPI(access_token=self.access_token)
            self.BASE_URL = "https://graph.facebook.com/v19.0"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(requests.exceptions.RequestException))
    def _make_request(self, method, url, params=None):
        """
        Resilient HTTP request handler.
        """
        response = requests.request(method, url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _safe_graph_call(self, func, *args, **kwargs):
        """
        Resilient SDK call handler.
        """
        return func(*args, **kwargs)

    def get_page_insights(self, page_id: str = None, period: str = "days_28"):
        """
        Fetch organic insights for a Page.
        Metrics: page_impressions, page_post_engagements, page_fans
        """
        target_page = page_id or self.page_id
        if not target_page:
            return {"error": "No Page ID provided."}
        
        url = f"{self.BASE_URL}/{target_page}/insights"
        params = {
            "metric": "page_impressions,page_post_engagements,page_fans",
            "period": period,
            "access_token": self.access_token
        }
        
        try:
            return self._make_request("GET", url, params=params)
        except Exception as e:
            return {"error": str(e)}

    def get_page_n_posts(self, limit: int = 10):
        """
        Fetch latest posts from page with performance metrics.
        Fields: id, message, full_picture (thumbnail), created_time, insights
        """
        if not self.graph: return {"data": []}
        try:
            # We request insights metrics nested within the posts call
            return self._safe_graph_call(
                self.graph.get_connections,
                self.page_id, 
                'posts', 
                limit=limit,
                fields="id,message,created_time,full_picture,shares,likes.summary(true),comments.summary(true),insights.metric(post_impressions_unique,post_engaged_users)"
            )
        except Exception as e:
            # Fallback if insights fail (e.g. permissions)
            print(f"Error fetching specific fields (Retrying simple fetch): {e}")
            try:
                 return self._safe_graph_call(self.graph.get_connections, self.page_id, 'posts', limit=limit)
            except Exception as e2:
                 return {"error": str(e2)}

    def get_post_comments(self, post_id: str):
        """Fetch comments for a specific post."""
        if not self.graph: return {"data": []}
        try:
            return self._safe_graph_call(self.graph.get_connections, post_id, 'comments')
        except Exception as e:
            return {"error": str(e)}

    def verify_token(self):
        """Check if the token is valid."""
        if not self.graph:
            return False
        try:
            # Simple call, no need for heavy retry logic on verification usually, 
            # but can use it to be safe against flakes.
            me = self._safe_graph_call(self.graph.get_object, 'me')
            return True, me
        except Exception as e:
            return False,str(e)

    def post_text(self, message: str):
        """Post a simple text status update to the page."""
        if not self.graph:
            return {"error": "Meta Service not configured"}
        try:
            # Write operation - NO RETRY to avoid duplicates
            response = self.graph.put_object(
                parent_object=self.page_id,
                connection_name='feed',
                message=message
            )
            return response
        except facebook.GraphAPIError as e:
            return {"error": str(e)}

    def post_image(self, image_url: str, message: str = ""):
        """Post an image to the page feed."""
        if not self.graph:
             return {"error": "Meta Service not configured"}
        try:
            # Write operation - NO RETRY to avoid duplicates
            response = self.graph.put_photo(
                image=image_url,
                caption=message, 
                album_path=f"{self.page_id}/photos"
            )
            return response
        except facebook.GraphAPIError as e:
            return {"error": str(e)}

meta_service = MetaService()
