"""
Security and Authentication for Analytics API.
Enforces shared-secret validation for internal microservice calls.
"""

import os
from fastapi import Header, HTTPException, status

INTERNAL_SECRET = os.getenv("ANALYTICS_API_SECRET", "super-secret-internal-terminal-key-2026")


def verify_internal_secret(
    x_internal_secret: str = Header(None, alias="x-internal-secret")
):
    """
    Validates that incoming requests contain the authorized microservice shared secret.
    Allows unauthenticated requests only if specifically running in relaxed local test mode.
    """
    # Allow local development/testing bypass if explicitly set
    if os.getenv("BYPASS_INTERNAL_AUTH", "false").lower() == "true":
        return True

    if not x_internal_secret or x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing internal API secret.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return True

