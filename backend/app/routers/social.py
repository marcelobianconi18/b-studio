from fastapi import APIRouter, HTTPException
from app.services.interactions import interactions_manager

router = APIRouter(
    prefix="/social",
    tags=["social"],
    responses={404: {"description": "Not found"}},
)

@router.get("/inbox")
async def get_inbox():
    """Get the latest classified interactions (comments/DMs)."""
    return interactions_manager.get_latest_interactions()
