"""Shared column types.

- ID: INTEGER primary/foreign keys (SQLite rowid aliases, so ids autoincrement).
- UTCDateTime: stores naive UTC and always returns timezone-aware UTC datetimes.
"""

from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer
from sqlalchemy.types import TypeDecorator

ID = Integer


class UTCDateTime(TypeDecorator):
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect):
        if value is None:
            return None
        if value.tzinfo is not None:
            value = value.astimezone(UTC).replace(tzinfo=None)
        return value

    def process_result_value(self, value: datetime | None, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)
