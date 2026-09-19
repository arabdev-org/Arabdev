"""Lazily-connected Redis client. Returns None when Redis is not configured or unreachable."""

import logging
import time

from app.core.config import settings

logger = logging.getLogger("arabdev.redis")

_client = None
_last_failure: float = 0.0
_RETRY_AFTER_SECONDS = 30


def get_redis():
    global _client, _last_failure
    if not settings.redis_url:
        return None
    if _client is not None:
        return _client
    if time.monotonic() - _last_failure < _RETRY_AFTER_SECONDS:
        return None
    try:
        import redis

        client = redis.Redis.from_url(settings.redis_url, socket_timeout=0.5, socket_connect_timeout=0.5)
        client.ping()
        _client = client
        logger.info("Connected to Redis")
        return _client
    except Exception:
        _last_failure = time.monotonic()
        logger.warning("Redis unavailable at %s; using in-memory fallback", settings.redis_url)
        return None
