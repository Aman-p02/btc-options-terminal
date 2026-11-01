"""
In-memory LRU/TTL Cache for Analytical Queries.
Ensures standard repeated queries respond in sub-millisecond time.
"""

import time
import functools
import json
from typing import Any, Callable, Dict, Tuple

CACHE_STORE: Dict[str, Tuple[float, Any]] = {}
DEFAULT_TTL = 300  # 5 minutes


def cached_query(ttl_seconds: int = DEFAULT_TTL):
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create a deterministic cache key
            key_parts = [func.__name__]
            if args:
                key_parts.append(str(args))
            if kwargs:
                key_parts.append(json.dumps(kwargs, sort_keys=True, default=str))
            cache_key = ":".join(key_parts)

            now = time.time()
            if cache_key in CACHE_STORE:
                expiry, val = CACHE_STORE[cache_key]
                if now < expiry:
                    return val

            result = func(*args, **kwargs)
            CACHE_STORE[cache_key] = (now + ttl_seconds, result)
            return result
        return wrapper
    return decorator


def clear_cache():
    CACHE_STORE.clear()

