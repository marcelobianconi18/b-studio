
import logging
from app.services.meta_api import meta_service
from app.services.intelligence import intelligence_service
from typing import List, Dict

logger = logging.getLogger(__name__)

class InteractionsManager:
    """
    Manages fetching and classifying social interactions (Comments & DMs).
    """

    def get_latest_interactions(self, page_id: str = None) -> Dict:
        """
        Fetches latest comments and classifies them using AI.
        NOTE: Since we don't have webhooks on localhost, we pool the latest posts.
        """
        try:
            # 1. Fetch latest organic posts
            posts = meta_service.get_page_n_posts(limit=5)
            all_posts = posts.get("data", [])

            # 2. Fetch Active Ads (Paid Posts) to get comments from them
            # This is the "Sales Desk" logic
            from app.services.meta_ads import meta_ads_service
            ad_post_ids = meta_ads_service.get_active_ad_posts()
            
            # Combine organic and paid posts
            # Mark paid posts with a flag
            for pid in ad_post_ids:
                # Avoid duplicates if the ad post is also in the organic feed
                if not any(p['id'] == pid for p in all_posts):
                    all_posts.append({"id": pid, "is_paid": True})
                else:
                    # Mark existing organic post as paid source too if it's being advertised
                    for p in all_posts:
                        if p['id'] == pid:
                            p['is_paid'] = True

            comments = []
            
            for post in all_posts:
                post_id = post.get("id")
                is_paid_source = post.get("is_paid", False)
                
                # Fetch comments for this post
                post_comments = meta_service.get_post_comments(post_id)
                
                for comment in post_comments.get("data", []):
                    # Classify sentiment/intent
                    intent = self._classify_intent(comment.get("message", ""))
                    
                    # Force "PAID" sentiment if intent is HOT/WARM and source is Paid
                    # We prioritize Paid interactions that have business value
                    if is_paid_source: 
                        sentiment_tag = "PAID" # Special tag for inbox sorting
                    else:
                        sentiment_tag = intent

                    comments.append({
                        "id": comment.get("id"),
                        "message": comment.get("message"),
                        "from_name": comment.get("from", {}).get("name", "Unknown"),
                        "created_time": comment.get("created_time"),
                        "sentiment": sentiment_tag,
                        "source": "paid" if is_paid_source else "organic"
                    })
            
            return {"comments": comments, "messages": []} # DMs require stricter permissions
            
        except Exception as e:
            logger.error(f"Error fetching interactions: {e}")
            return {"error": str(e)}

    def _classify_intent(self, text: str) -> str:
        """
        Uses simple heuristic or AI to classify intent.
        Categories: HOT (Sale), WARM (Question), COLD (Generic), SPAM
        """
        text = text.lower()
        if any(x in text for x in ["preço", "valor", "comprar", "quanto", "envia"]):
            return "HOT"
        if any(x in text for x in ["dúvida", "onde", "funciona", "ajuda"]):
            return "WARM"
        if any(x in text for x in ["lindo", "top", "amei", "legal"]):
            return "COLD"
        return "NEUTRAL"

interactions_manager = InteractionsManager()
