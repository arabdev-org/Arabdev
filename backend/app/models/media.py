from datetime import datetime

from sqlalchemy import ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.types import ID, UTCDateTime
from app.utils.time import utcnow


class Media(Base):
    """An uploaded, validated and re-encoded image. storage_key is resolved by the storage backend."""

    __tablename__ = "media"

    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(ID, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(20))  # "avatar" | "post_image"
    storage_key: Mapped[str] = mapped_column(String(255), unique=True)
    content_type: Mapped[str] = mapped_column(String(50))
    size_bytes: Mapped[int] = mapped_column(Integer)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
    # The image itself when STORAGE_BACKEND=database (hosts without a disk, such as Vercel).
    # Deferred, so listing posts or profiles never loads image bytes.
    data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True, deferred=True)
