"""Storage abstraction for uploaded media.

Only a local-disk backend ships today. An S3-compatible backend only needs to implement
StorageBackend (save/delete/url) and be returned from get_storage(); nothing else changes.
"""

from functools import lru_cache
from pathlib import Path
from typing import Protocol

from app.core.config import settings


class StorageBackend(Protocol):
    def save(self, key: str, data: bytes, content_type: str) -> None: ...

    def delete(self, key: str) -> None: ...

    def url(self, key: str) -> str: ...


class LocalStorage:
    def __init__(self, root: Path, base_url: str) -> None:
        self.root = root
        self.base_url = base_url.rstrip("/")

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if self.root.resolve() not in path.parents:
            raise ValueError("Invalid storage key")
        return path

    def save(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete(self, key: str) -> None:
        try:
            self._path(key).unlink(missing_ok=True)
        except (OSError, ValueError):
            pass

    def url(self, key: str) -> str:
        return f"{self.base_url}/{key}"


@lru_cache
def get_storage() -> StorageBackend:
    return LocalStorage(settings.media_root, settings.media_url)
