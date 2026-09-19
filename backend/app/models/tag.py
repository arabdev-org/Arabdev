from datetime import datetime

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.interest import Interest
from app.models.types import ID, UTCDateTime
from app.utils.time import utcnow

post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ID, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ID, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True, index=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(40))
    interest_id: Mapped[int | None] = mapped_column(
        ID, ForeignKey("interests.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)

    interest: Mapped[Interest | None] = relationship(lazy="select")
