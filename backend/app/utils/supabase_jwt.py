"""
Supabase JWT Validation
Validates JWT tokens issued by Supabase Auth using the JWT secret (HS256).
"""

import logging
from typing import Dict, Any
import jwt

from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseJWTValidator:
    def __init__(self, jwt_secret: str):
        self.jwt_secret = jwt_secret

    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Decode and validate a Supabase JWT using the project JWT secret.
        Supabase issues HS256 tokens signed with the JWT secret.
        """
        if not self.jwt_secret:
            raise jwt.InvalidTokenError("SUPABASE_JWT_SECRET is not configured in .env")

        try:
            # Try with audience check first
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload
        except jwt.InvalidAudienceError:
            # Some Supabase tokens omit the audience claim — decode without it
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return payload

    def extract_user_id(self, token: str) -> str:
        payload = self.validate_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise jwt.InvalidTokenError("Token missing 'sub' claim")
        return user_id


_validator = None


def get_supabase_validator() -> SupabaseJWTValidator:
    global _validator
    if _validator is None:
        _validator = SupabaseJWTValidator(settings.SUPABASE_JWT_SECRET)
    return _validator
