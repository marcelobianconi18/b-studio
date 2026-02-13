from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SocialComment(BaseModel):
    id: str
    message: str
    from_name: str
    created_time: str
    sentiment: str = "neutral"  # hot, warm, cold, spam, paid

class SocialMessage(BaseModel):
    id: str
    message: str
    from_name: str
    created_time: str
    sentiment: str = "neutral"

class InteractionResponse(BaseModel):
    comments: List[SocialComment]
    messages: List[SocialMessage]
