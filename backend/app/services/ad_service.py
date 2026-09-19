"""Ad serving.

Placement is predictable, not random: the feed shows an ad after every 8 posts, and which ad
fills a slot rotates deterministically with the page number (see GET /ads?offset=).
"""

from sqlalchemy import or_, select, update
from sqlalchemy.orm import Session

from app.core.errors import NotFound
from app.models import Ad
from app.schemas.misc import AdAdminOut, AdOut, AdWrite
from app.utils.time import utcnow


def _active_stmt(placement: str, language: str | None):
    now = utcnow()
    stmt = select(Ad).where(
        Ad.is_active.is_(True),
        Ad.placement.in_([placement, "all"]),
        or_(Ad.starts_at.is_(None), Ad.starts_at <= now),
        or_(Ad.ends_at.is_(None), Ad.ends_at > now),
    )
    if language:
        stmt = stmt.where(or_(Ad.language.is_(None), Ad.language == language))
    return stmt.order_by(Ad.id)


def serve(db: Session, placement: str, language: str | None, limit: int, offset: int) -> list[AdOut]:
    ads = list(db.scalars(_active_stmt(placement, language)))
    if not ads:
        return []
    count = min(limit, len(ads))
    picked = [ads[(offset + index) % len(ads)] for index in range(count)]
    db.execute(update(Ad).where(Ad.id.in_([ad.id for ad in picked])).values(impressions=Ad.impressions + 1))
    db.commit()
    return [AdOut.model_validate(ad, from_attributes=True) for ad in picked]


def record_click(db: Session, ad_id: int) -> None:
    result = db.execute(update(Ad).where(Ad.id == ad_id).values(clicks=Ad.clicks + 1))
    if not result.rowcount:
        raise NotFound("Ad not found", "ad_not_found")
    db.commit()


def list_all(db: Session) -> list[AdAdminOut]:
    return [AdAdminOut.model_validate(ad, from_attributes=True) for ad in db.scalars(select(Ad).order_by(Ad.id))]


def create(db: Session, data: AdWrite) -> AdAdminOut:
    ad = Ad(**data.model_dump())
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return AdAdminOut.model_validate(ad, from_attributes=True)


def update_ad(db: Session, ad_id: int, data: AdWrite) -> AdAdminOut:
    ad = db.get(Ad, ad_id)
    if ad is None:
        raise NotFound("Ad not found", "ad_not_found")
    for field, value in data.model_dump().items():
        setattr(ad, field, value)
    db.commit()
    db.refresh(ad)
    return AdAdminOut.model_validate(ad, from_attributes=True)


def delete(db: Session, ad_id: int) -> None:
    ad = db.get(Ad, ad_id)
    if ad is None:
        raise NotFound("Ad not found", "ad_not_found")
    db.delete(ad)
    db.commit()
