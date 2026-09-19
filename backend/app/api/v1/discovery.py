from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.deps import DbSession, OptionalUser
from app.core.rate_limit import rate_limit
from app.schemas.misc import SearchOut, TagDetail
from app.schemas.post import TagStat
from app.schemas.user import InterestOut
from app.services import discovery_service
from app.services.discovery_service import SearchType
from app.utils.pagination import PageParams, page_params

search_router = APIRouter(tags=["Search"])
tags_router = APIRouter(prefix="/tags", tags=["Tags"])
interests_router = APIRouter(prefix="/interests", tags=["Interests"])


@search_router.get(
    "/search",
    response_model=SearchOut,
    summary="Search posts, developers and tags",
    description="type=all returns a short preview of each group; a specific type returns a full paginated list.",
    dependencies=[Depends(rate_limit("search", limit=120, window=60))],
)
def search(
    db: DbSession,
    viewer: OptionalUser,
    params: Annotated[PageParams, Depends(page_params)],
    q: Annotated[str, Query(max_length=100)] = "",
    type: SearchType = "all",
) -> SearchOut:
    return discovery_service.search(db, q, type, params, viewer)


@tags_router.get("/popular", response_model=list[TagStat], summary="Most used tags recently")
def popular_tags(
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=30)] = 12,
    days: Annotated[int, Query(ge=1, le=365)] = 30,
) -> list[TagStat]:
    return discovery_service.popular_tags(db, limit, days)


@tags_router.get("/{slug}", response_model=TagDetail, summary="A tag and how many posts use it")
def tag_detail(slug: str, db: DbSession) -> TagDetail:
    return discovery_service.tag_detail(db, slug)


@interests_router.get("", response_model=list[InterestOut], summary="All interests users can pick")
def interests(db: DbSession) -> list[InterestOut]:
    return discovery_service.list_interests(db)
