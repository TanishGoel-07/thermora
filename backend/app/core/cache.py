"""
Lightweight caching layer used to protect the database from repeated reads
of slow-changing data (state/district lists, ward heatmaps, KPI snapshots)
at India-scale traffic.

Uses Redis when REDIS_URL is reachable; otherwise falls back to an
in-process TTL cache so the app still works in local/dev environments
without a Redis container. This makes `@cache_response` safe to use
everywhere without special-casing environments.
"""
from __future__ import annotations

import functools
import json
import logging
import time
from typing import Any, Callable

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("thermora.cache")

_redis_client = None
_redis_checked = False

# in-process fallback: key -> (expires_at_epoch, value)
_local_cache: dict[str, tuple[float, Any]] = {}


def _get_redis():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    try:
        import redis  # optional dependency; degrade gracefully if unavailable

        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=0.5, decode_responses=True)
        client.ping()
        _redis_client = client
        logger.info("Connected to Redis at %s", settings.REDIS_URL)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Redis unavailable (%s); using in-process cache fallback.", exc)
        _redis_client = None
    return _redis_client


def cache_get(key: str) -> Any | None:
    client = _get_redis()
    if client is not None:
        raw = client.get(key)
        return json.loads(raw) if raw is not None else None

    entry = _local_cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if time.time() > expires_at:
        _local_cache.pop(key, None)
        return None
    return value


def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    client = _get_redis()
    if client is not None:
        client.setex(key, ttl_seconds, json.dumps(value, default=str))
        return
    _local_cache[key] = (time.time() + ttl_seconds, value)


def cache_delete_prefix(prefix: str) -> None:
    client = _get_redis()
    if client is not None:
        for k in client.scan_iter(f"{prefix}*"):
            client.delete(k)
        return
    for k in list(_local_cache.keys()):
        if k.startswith(prefix):
            _local_cache.pop(k, None)


def cache_response(ttl_seconds: int = 60, key: str | None = None):
    """
    Decorator for FastAPI route handlers. Builds a cache key from the base
    `key` plus the call's kwargs (query params), so distinct query
    combinations (e.g. ?state_id=3) get distinct cache entries.

    Only caches JSON-serializable responses (dicts/lists/pydantic models via
    FastAPI's response_model — this operates on the raw return value before
    serialization, so pydantic models are cached by their python identity
    within the current process for local fallback, and dict-ified for Redis).
    """

    def decorator(func: Callable):
        base_key = key or f"{func.__module__}.{func.__name__}"

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            cache_kwargs = {
                k: v for k, v in kwargs.items() if k != "db" and not hasattr(v, "query")
            }
            cache_key = f"{base_key}:{json.dumps(cache_kwargs, sort_keys=True, default=str)}"

            cached = cache_get(cache_key)
            if cached is not None:
                return cached

            result = func(*args, **kwargs)
            try:
                serializable = _to_serializable(result)
                cache_set(cache_key, serializable, ttl_seconds)
            except TypeError:
                pass  # non-serializable result (e.g. ORM objects); skip caching silently
            return result

        return wrapper

    return decorator


def _to_serializable(value: Any) -> Any:
    if isinstance(value, list):
        return [_to_serializable(v) for v in value]
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "__dict__") and hasattr(value, "__table__"):
        # SQLAlchemy ORM instance - not safely cacheable across requests; raise
        raise TypeError("ORM instances are not cached directly")
    json.dumps(value, default=str)  # will raise TypeError if not serializable
    return value
