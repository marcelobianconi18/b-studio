
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PostCreate(BaseModel):
    message: str
    image_url: Optional[str] = None
    scheduled_time: Optional[datetime] = None  # If None, post immediately

class PostResponse(BaseModel):
    id: str  # Task ID or Post ID
    status: str
    message: str
