from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.post import PostRef
from app.schemas.user import UserSummary


class NotificationOut(BaseModel):
    id: int
    type: Literal["like", "comment", "follow", "repost", "mention"]
    actor: UserSummary
    post: PostRef | None = None
    comment_excerpt: str | None = None
    is_read: bool
    created_at: datetime


class UnreadCount(BaseModel):
    count: int
