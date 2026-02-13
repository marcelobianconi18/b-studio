
import os
import facebook
from dotenv import load_dotenv

load_dotenv()

class MetaService:
    """
    Handle interactions with Facebook Graph API for posting content.
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

    def get_page_insights(self, page_id: str = None, period: str = "days_28"):
        """
        Fetch organic insights for a Page.
        Metrics: page_impressions, page_post_engagements, page_fans
        """
        target_page = page_id or self.page_id
        if not target_page:
            return {"error": "No Page ID provided."}
        
        # Facebook SDK doesn't support insights very well, so we use requests for this
        import requests
        url = f"{self.BASE_URL}/{target_page}/insights"
        params = {
            "metric": "page_impressions,page_post_engagements,page_fans",
            "period": period,
            "access_token": self.access_token
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            # logger.error(f"Error fetching page insights: {e}")
            return {"error": str(e)}

    def get_page_n_posts(self, limit: int = 10):
        """
        Fetch latest posts from page with performance metrics.
        Fields: id, message, full_picture (thumbnail), created_time, insights
        """
        if not self.graph: return {"data": []}
        try:
            # We request insights metrics nested within the posts call
            # Note: This might require specific Page permissions (read_insights)
            return self.graph.get_connections(
                self.page_id, 
                'posts', 
                limit=limit,
                fields="id,message,created_time,full_picture,shares,likes.summary(true),comments.summary(true),insights.metric(post_impressions_unique,post_engaged_users)"
            )
        except Exception as e:
            # Fallback if insights fail (e.g. permissions)
            print(f"Error fetching specific fields: {e}")
            return self.graph.get_connections(self.page_id, 'posts', limit=limit)

    def get_post_comments(self, post_id: str):
        """Fetch comments for a specific post."""
        if not self.graph: return {"data": []}
        try:
            return self.graph.get_connections(post_id, 'comments')
        except Exception as e:
            return {"error": str(e)}

    def verify_token(self):
        """Check if the token is valid."""
        if not self.graph:
            return False
        try:
            me = self.graph.get_object('me')
            return True, me
        except facebook.GraphAPIError as e:
            return False,str(e)

    def post_text(self, message: str):
        """Post a simple text status update to the page."""
        if not self.graph:
            return {"error": "Meta Service not configured"}
        try:
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
            response = self.graph.put_photo(
                image=image_url,
                caption=message, 
                album_path=f"{self.page_id}/photos" # optional album path if needed, usually defaults
            )
            return response
        except facebook.GraphAPIError as e:
            return {"error": str(e)}

meta_service = MetaService()
