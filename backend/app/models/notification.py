from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.types import ID, UTCDateTime
from app.utils.time import utcnow

if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.post import Post
    from app.models.user import User

NOTIFICATION_TYPES = ("like", "comment", "follow", "repost", "mention")


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_recipient_id_created_at", "recipient_id", "created_at"),
        Index("ix_notifications_recipient_id_is_read", "recipient_id", "is_read"),
    )

    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    recipient_id: Mapped[int] = mapped_column(ID, ForeignKey("users.id", ondelete="CASCADE"))
    actor_id: Mapped[int] = mapped_column(ID, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(20))
    post_id: Mapped[int | None] = mapped_column(
        ID, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    comment_id: Mapped[int | None] = mapped_column(
        ID, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    actor: Mapped["User"] = relationship(foreign_keys=[actor_id], lazy="joined", innerjoin=True)
    post: Mapped["Post | None"] = relationship(lazy="select")
    comment: Mapped["Comment | None"] = relationship(lazy="select")
