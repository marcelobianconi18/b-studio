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
        from app.services.config import config_service

        self.config = config_service
        self.BASE_URL = "https://graph.facebook.com/v19.0"

    def _get_access_token(self):
        return self.config.get_setting("FACEBOOK_ACCESS_TOKEN")

    def _get_page_id(self, page_id: str = None):
        return page_id or self.config.get_setting("FACEBOOK_PAGE_ID") or os.getenv("FACEBOOK_PAGE_ID")

    def _get_graph(self):
        token = self._get_access_token()
        if not token:
            return None
        return facebook.GraphAPI(access_token=token)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), retry=retry_if_exception_type(requests.exceptions.RequestException))
    def _make_request(self, method, url, params=None):
        """
        Resilient HTTP request handler.
        """
        params = params or {}
        if "access_token" not in params:
            token = self._get_access_token()
            if token:
                params["access_token"] = token
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
        target_page = self._get_page_id(page_id)
        access_token = self._get_access_token()
        if not target_page:
            return {"error": "No Page ID provided."}
        if not access_token:
            return {"error": "No Access Token configured."}

        url = f"{self.BASE_URL}/{target_page}/insights"
        params = {
            "metric": "page_impressions,page_post_engagements,page_fans",
            "period": period,
            "access_token": access_token,
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
        graph = self._get_graph()
        page_id = self._get_page_id()
        if not graph or not page_id:
            return {"data": []}
        try:
            # We request insights metrics nested within the posts call
            return self._safe_graph_call(
                graph.get_connections,
                page_id,
                "posts",
                limit=limit,
                fields="id,message,created_time,full_picture,shares,likes.summary(true),comments.summary(true),insights.metric(post_impressions_unique,post_engaged_users)"
            )
        except Exception as e:
            # Fallback if insights fail (e.g. permissions)
            print(f"Error fetching specific fields (Retrying simple fetch): {e}")
            try:
                 return self._safe_graph_call(graph.get_connections, page_id, "posts", limit=limit)
            except Exception as e2:
                 return {"error": str(e2)}

    def get_post_comments(self, post_id: str):
        """Fetch comments for a specific post."""
        graph = self._get_graph()
        if not graph:
            return {"data": []}
        try:
            return self._safe_graph_call(graph.get_connections, post_id, "comments")
        except Exception as e:
            return {"error": str(e)}

    def verify_token(self):
        """Check if the token is valid."""
        graph = self._get_graph()
        if not graph:
            return False, "Meta Service not configured"
        try:
            # Simple call, no need for heavy retry logic on verification usually, 
            # but can use it to be safe against flakes.
            me = self._safe_graph_call(graph.get_object, "me")
            return True, me
        except Exception as e:
            return False, str(e)

    def post_text(self, message: str):
        """Post a simple text status update to the page."""
        graph = self._get_graph()
        page_id = self._get_page_id()
        if not graph or not page_id:
            return {"error": "Meta Service not configured"}
        try:
            # Write operation - NO RETRY to avoid duplicates
            response = graph.put_object(
                parent_object=page_id,
                connection_name="feed",
                message=message
            )
            return response
        except facebook.GraphAPIError as e:
            return {"error": str(e)}

    def post_image(self, image_url: str, message: str = ""):
        """Post an image to the page feed."""
        graph = self._get_graph()
        page_id = self._get_page_id()
        if not graph or not page_id:
            return {"error": "Meta Service not configured"}
        try:
            # Write operation - NO RETRY to avoid duplicates
            response = graph.put_photo(
                image=image_url,
                caption=message,
                album_path=f"{page_id}/photos"
            )
            return response
        except facebook.GraphAPIError as e:
            return {"error": str(e)}

meta_service = MetaService()
