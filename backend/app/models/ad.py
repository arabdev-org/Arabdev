from datetime import datetime

from sqlalchemy import Boolean, Index, Integer, String, text, true
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.types import ID, UTCDateTime
from app.utils.time import utcnow

AD_PLACEMENTS = ("feed", "sidebar", "all")


class Ad(Base):
    __tablename__ = "ads"
    __table_args__ = (Index("ix_ads_is_active_placement", "is_active", "placement"),)

    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    sponsor: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(String(280))
    cta_label: Mapped[str] = mapped_column(String(40))
    target_url: Mapped[str] = mapped_column(String(500))
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    placement: Mapped[str] = mapped_column(String(20), default="all")
    # Null means the ad is shown regardless of the viewer's language.
    language: Mapped[str | None] = mapped_column(String(5), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    starts_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    clicks: Mapped[int] = mapped_column(Integer, default=0, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
