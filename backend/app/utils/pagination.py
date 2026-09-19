from dataclasses import dataclass

from fastapi import Query
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

FEED_PAGE_SIZE = 20


@dataclass(frozen=True)
class PageParams:
    page: int
    limit: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


def page_params(
    page: int = Query(1, ge=1, le=10_000, description="1-based page number"),
    limit: int = Query(FEED_PAGE_SIZE, ge=1, le=FEED_PAGE_SIZE, description="Items per page (max 20)"),
) -> PageParams:
    return PageParams(page=page, limit=limit)


def count_rows(db: Session, stmt: Select) -> int:
    return db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0


def paginate_scalars(db: Session, stmt: Select, params: PageParams) -> tuple[list, int]:
    total = count_rows(db, stmt)
    if total == 0:
        return [], 0
    items = list(db.scalars(stmt.limit(params.limit).offset(params.offset)).unique().all())
    return items, total
