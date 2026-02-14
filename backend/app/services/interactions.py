import logging
import asyncio
from typing import List, Dict
from app.services.meta_api import meta_service
from app.services.interactions_ai import interactions_ai_service

logger = logging.getLogger(__name__)

class InteractionsManager:
    """
    Manages fetching and classifying social interactions (Comments & DMs).
    """

    async def get_latest_interactions(self, page_id: str = None) -> Dict:
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
                post_message = post.get("message", "No Context")
                
                # Fetch comments for this post
                post_comments = meta_service.get_post_comments(post_id)
                
                for comment in post_comments.get("data", []):
                    # Classify sentiment/intent using LangChain AI
                    comment_text = comment.get("message", "")
                    
                    # Call AI Service (Async)
                    ai_analysis = await interactions_ai_service.analyze_interaction(comment_text, post_message)
                    
                    # Extract fields with defaults
                    intent = ai_analysis.get("intent", "other")
                    priority = ai_analysis.get("priority_score", 0)
                    
                    # Tagging Logic
                    sentiment_tag = intent.upper()
                    
                    # Force "PAID" sentiment if intent is HOT/WARM and source is Paid
                    if is_paid_source and priority > 5: 
                         sentiment_tag = f"PAID {intent.upper()}"
                    
                    comments.append({
                        "id": comment.get("id"),
                        "message": comment.get("message"),
                        "from_name": comment.get("from", {}).get("name", "Unknown"),
                        "created_time": comment.get("created_time"),
                        "sentiment": sentiment_tag,
                        "source": "paid" if is_paid_source else "organic",
                        "ai_reply": ai_analysis.get("suggested_reply"),
                        "priority": priority
                    })
            
            return {"comments": comments, "messages": []} # DMs require stricter permissions
            
        except Exception as e:
            logger.error(f"Error fetching interactions: {e}")
            return {"error": str(e)}

    def _classify_intent_legacy(self, text: str) -> str:
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
