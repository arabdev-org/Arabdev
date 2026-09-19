from math import ceil
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page(BaseModel, Generic[T]):
    """Server-side pagination envelope shared by every list endpoint."""

    items: list[T]
    page: int
    limit: int
    total: int
    pages: int

    @classmethod
    def build(cls, items: list[T], page: int, limit: int, total: int) -> "Page[T]":
        return cls(items=items, page=page, limit=limit, total=total, pages=ceil(total / limit) if total else 0)


class MessageOut(BaseModel):
    detail: str


class ErrorOut(BaseModel):
    detail: str
    code: str
