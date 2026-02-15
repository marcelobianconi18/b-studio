
from fastapi import APIRouter
from app.models.schemas import PostCreate, PostResponse
from app.worker import publish_post_task
from app.services.meta_api import meta_service
from datetime import datetime, timezone

router = APIRouter()

@router.post("/schedule", response_model=PostResponse)
async def schedule_post(post: PostCreate):
    """
    Schedule a post for Meta (Facebook).
    If scheduled_time is in the future, it queues the task.
    Otherwise, it executes immediately (async in worker).
    """
    
    # Simple logic: if scheduled_time is provided and in future --> use celery eta
    # else --> run immediately in celery
    
    if post.scheduled_time:
         # Ensure scheduled_time is UTC-aware or handle timezone logic
         now_utc = datetime.now(timezone.utc)
         # Assuming input is naive UTC or already UTC aware. 
         # For simplicity let's assume client sends UTC ISO string.
         if post.scheduled_time.tzinfo is None:
             post.scheduled_time = post.scheduled_time.replace(tzinfo=timezone.utc)
             
         delay_seconds = (post.scheduled_time - now_utc).total_seconds()
         if delay_seconds > 0:
             # Schedule with ETA
             task = publish_post_task.apply_async(args=[post.message, post.image_url], eta=post.scheduled_time)
             return PostResponse(id=task.id, status="scheduled", message="Post scheduled successfully")
    
    # Immediate execution via worker
    task = publish_post_task.delay(post.message, post.image_url)
    return PostResponse(id=task.id, status="queued", message="Post queued for immediate publishing")

@router.get("/status")
def get_service_status():
    """Check connection with Meta and Redis."""
    is_valid, detail = meta_service.verify_token()
    meta_status = "ok" if is_valid else f"error: {detail}"
    # Could check celery/redis status here too
    return {"meta_api": meta_status}
