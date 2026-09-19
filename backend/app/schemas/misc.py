"""Schemas for search, media and ads."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import Page
from app.schemas.post import PostOut, TagStat
from app.schemas.user import UserCard
from app.utils.validators import normalize_http_url


class SearchOut(BaseModel):
    query: str
    type: Literal["all", "posts", "users", "tags"]
    posts: Page[PostOut] | None = None
    users: Page[UserCard] | None = None
    tags: Page[TagStat] | None = None


class TagDetail(TagStat):
    interest_slug: str | None = None


class MediaOut(BaseModel):
    id: int
    kind: str
    url: str
    width: int
    height: int
    content_type: str
    size_bytes: int


class AdOut(BaseModel):
    id: int
    sponsor: str
    title: str
    body: str
    cta_label: str
    target_url: str
    image_url: str | None
    placement: str


class AdAdminOut(AdOut):
    language: str | None
    is_active: bool
    starts_at: datetime | None
    ends_at: datetime | None
    impressions: int
    clicks: int
    created_at: datetime


class AdWrite(BaseModel):
    sponsor: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=280)
    cta_label: str = Field(min_length=1, max_length=40)
    target_url: str = Field(min_length=1, max_length=500)
    image_url: str | None = None
    placement: Literal["feed", "sidebar", "all"] = "all"
    language: Literal["ar", "en"] | None = None
    is_active: bool = True
    starts_at: datetime | None = None
    ends_at: datetime | None = None

    @field_validator("target_url")
    @classmethod
    def _target(cls, value: str) -> str:
        # Internal paths ("/create") are allowed so house ads can point inside the product.
        if value.startswith("/") and not value.startswith("//"):
            return value
        return normalize_http_url(value) or value

    @field_validator("image_url")
    @classmethod
    def _image(cls, value: str | None) -> str | None:
        return normalize_http_url(value)
