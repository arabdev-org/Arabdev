from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.types import ID

user_interests = Table(
    "user_interests",
    Base.metadata,
    Column("user_id", ID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("interest_id", ID, ForeignKey("interests.id", ondelete="CASCADE"), primary_key=True, index=True),
)


class Interest(Base):
    """Curated topics users pick during onboarding. Post tags can map to an interest."""

    __tablename__ = "interests"

    id: Mapped[int] = mapped_column(ID, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    name_en: Mapped[str] = mapped_column(String(60))
    name_ar: Mapped[str] = mapped_column(String(60))
    position: Mapped[int] = mapped_column(Integer, default=0)
