
from app.core.celery_app import celery_app
from app.services.meta_api import meta_service
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="tasks.publish_post")
def publish_post_task(message: str, image_url: str = None):
    """
    Celery task to publish a post to Meta (Facebook).
    """
    logger.info(f"Starting publish_post_task for message: {message[:20]}...")
    
    if image_url:
        result = meta_service.post_image(image_url=image_url, message=message)
    else:
        result = meta_service.post_text(message=message)
    
    logger.info(f"Task finished with result: {result}")
    return result

@celery_app.task(name="tasks.periodic_intelligence_check")
def periodic_intelligence_check():
    """
    Task that runs periodically to analyze performance 24/7.
    """
    from app.core.database import SessionLocal
    from app.services.intelligence import intelligence_service
    from app.models.agent import AgentSettings

    db = SessionLocal()
    try:
        config = db.query(AgentSettings).first()
        mode = config.mode if config else "manual"
        
        if mode == "manual":
            logger.info("Intelligence check skipped (Manual Mode).")
            return
        
        logger.info(f"Starting periodic strategic analysis (Mode: {mode})")
        intelligence_service.analyze_performance(mode)
    finally:
        db.close()
