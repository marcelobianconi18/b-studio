from fastapi import APIRouter
from app.services.interactions import interactions_manager

router = APIRouter(
    tags=["social"],
    responses={404: {"description": "Not found"}},
)

@router.get("/inbox")
async def get_inbox():
    """Get the latest classified interactions (comments/DMs)."""
    return await interactions_manager.get_latest_interactions()
