"""
FastAPI Dependencies
Dependency injection for routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from app.utils.supabase_jwt import get_supabase_validator
from app.config import settings

security = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Validate Supabase JWT token and return user ID.
    
    This dependency:
    1. Extracts the JWT from Authorization header
    2. Validates signature using Supabase JWKS
    3. Verifies expiration and issuer
    4. Returns the user ID (sub claim)
    
    Args:
        credentials: HTTP Bearer token
        
    Returns:
        User ID (UUID string) from token
        
    Raises:
        HTTPException: If token is invalid, expired, or missing required claims
    """
    token = credentials.credentials

    try:
        validator = get_supabase_validator()
        user_id = validator.extract_user_id(token)
        return user_id
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Alias for backward compatibility (routes can use either)
get_current_user = get_current_user_id
