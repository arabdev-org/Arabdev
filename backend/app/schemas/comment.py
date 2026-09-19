from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.post import PostRef
from app.schemas.user import UserSummary

CommentText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class CommentCreate(BaseModel):
    content: CommentText
    parent_id: int | None = None


class CommentOut(BaseModel):
    id: int
    post_id: int
    parent_id: int | None
    content: str
    author: UserSummary
    created_at: datetime
    can_delete: bool = False


class ReplyOut(CommentOut):
    post: PostRef
