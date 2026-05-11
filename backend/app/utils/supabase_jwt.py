"""
Supabase JWT Validation
Validates JWT tokens from Supabase Auth using JWKS endpoint
"""

import logging
from typing import Dict, Any
import httpx
import jwt
from jwt import PyJWKClient

from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseJWTValidator:
    """Validates Supabase JWT tokens using JWKS."""

    def __init__(self, supabase_url: str, jwt_secret: str = ""):
        """
        Initialize validator with Supabase project URL.
        
        Args:
            supabase_url: Supabase project URL (e.g., https://your-project.supabase.co)
        """
        self.supabase_url = supabase_url.rstrip('/')
        self.jwks_url = f"{self.supabase_url}/auth/v1/keys"
        self.issuer = f"{self.supabase_url}/auth/v1"
        self.jwt_secret = jwt_secret
        
        # Initialize JWKS client with caching
        self.jwks_client = PyJWKClient(self.jwks_url)

    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate Supabase JWT token and return decoded payload.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded JWT payload
            
        Raises:
            jwt.InvalidTokenError: If token is invalid
            jwt.ExpiredSignatureError: If token is expired
        """
        try:
            header = jwt.get_unverified_header(token)
            algorithm = header.get("alg")

            if algorithm == "HS256":
                if not self.jwt_secret:
                    return self.validate_token_with_supabase(token)
                payload = jwt.decode(
                    token,
                    self.jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                    issuer=self.issuer,
                )
            else:
                signing_key = self.jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256", "ES256"],
                    audience="authenticated",
                    issuer=self.issuer,
                )
            
            return payload
            
        except jwt.ExpiredSignatureError as e:
            logger.warning("Token has expired")
            raise
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            try:
                return self.validate_token_with_supabase(token)
            except Exception:
                raise
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            try:
                return self.validate_token_with_supabase(token)
            except Exception as fallback_error:
                raise jwt.InvalidTokenError(f"Token validation failed: {str(fallback_error)}")

    def validate_token_with_supabase(self, token: str) -> Dict[str, Any]:
        """Validate a user access token through Supabase Auth."""
        response = httpx.get(
            f"{self.supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_KEY,
            },
            timeout=10,
        )

        if response.status_code != 200:
            raise jwt.InvalidTokenError("Supabase rejected the access token")

        user = response.json()
        user_id = user.get("id")
        if not user_id:
            raise jwt.InvalidTokenError("Supabase user response missing id")

        return {
            "sub": user_id,
            "email": user.get("email"),
            "aud": user.get("aud", "authenticated"),
            "user_metadata": user.get("user_metadata") or {},
        }

    def extract_user_id(self, token: str) -> str:
        """
        Extract user ID (sub claim) from Supabase JWT.
        
        Args:
            token: JWT token string
            
        Returns:
            User ID from 'sub' claim
            
        Raises:
            jwt.InvalidTokenError: If token is invalid or missing 'sub'
        """
        try:
            payload = self.validate_token(token)
            user_id = payload.get("sub")
            
            if not user_id:
                raise jwt.InvalidTokenError("Token missing 'sub' (user ID) claim")
            
            return user_id
            
        except Exception as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            raise


# Singleton validator instance
_validator = None


def get_supabase_validator() -> SupabaseJWTValidator:
    """Get or create the Supabase JWT validator instance."""
    global _validator
    if _validator is None:
        _validator = SupabaseJWTValidator(settings.SUPABASE_URL, settings.SUPABASE_JWT_SECRET)
    return _validator
