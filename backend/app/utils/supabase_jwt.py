"""
Supabase JWT Validation
Supports RS256 (newer Supabase projects — validated via JWKS) and
HS256 (older projects — validated with the JWT secret).
"""

import base64
import logging
from typing import Dict, Any, Optional
import jwt
from jwt import PyJWKClient

from app.config import settings

logger = logging.getLogger(__name__)


class SupabaseJWTValidator:
    def __init__(self, supabase_url: str, jwt_secret: str):
        self._supabase_url = supabase_url.rstrip('/')
        self._jwt_secret = jwt_secret
        self._jwks_client: Optional[PyJWKClient] = None
        self._hs256_candidates = self._build_hs256_candidates(jwt_secret)

    # ------------------------------------------------------------------
    # internals
    # ------------------------------------------------------------------

    @staticmethod
    def _build_hs256_candidates(secret: str) -> list:
        """Return the raw secret string plus its base64-decoded bytes."""
        candidates: list = [secret]
        try:
            decoded = base64.b64decode(secret)
            if decoded not in candidates:
                candidates.append(decoded)
        except Exception:
            pass
        return candidates

    def _jwks(self) -> PyJWKClient:
        if self._jwks_client is None:
            url = f"{self._supabase_url}/auth/v1/.well-known/jwks.json"
            self._jwks_client = PyJWKClient(url, cache_keys=True)
        return self._jwks_client

    # ------------------------------------------------------------------
    # public API
    # ------------------------------------------------------------------

    def validate_token(self, token: str) -> Dict[str, Any]:
        try:
            header = jwt.get_unverified_header(token)
        except Exception as exc:
            raise jwt.InvalidTokenError(f"Cannot read token header: {exc}")

        alg = header.get("alg", "HS256")

        if alg in ("RS256", "ES256", "RS384", "RS512"):
            return self._validate_asymmetric(token, alg)
        return self._validate_hs256(token)

    def extract_user_id(self, token: str) -> str:
        payload = self.validate_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise jwt.InvalidTokenError("Token missing 'sub' claim")
        return user_id

    # ------------------------------------------------------------------
    # per-algorithm helpers
    # ------------------------------------------------------------------

    def _validate_asymmetric(self, token: str, alg: str) -> Dict[str, Any]:
        """Validate RS256/ES256 tokens using Supabase's JWKS endpoint."""
        try:
            signing_key = self._jwks().get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                options={"verify_aud": False},
            )
        except Exception as exc:
            logger.warning("Asymmetric JWT validation failed: %s", exc)
            raise

    def _validate_hs256(self, token: str) -> Dict[str, Any]:
        """Validate HS256 tokens, trying both raw and base64-decoded secret."""
        last_exc: Exception = jwt.InvalidTokenError("No HS256 candidates")
        for secret in self._hs256_candidates:
            try:
                return jwt.decode(
                    token, secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            except jwt.InvalidAudienceError:
                try:
                    return jwt.decode(
                        token, secret,
                        algorithms=["HS256"],
                        options={"verify_aud": False},
                    )
                except Exception as exc:
                    last_exc = exc
            except Exception as exc:
                last_exc = exc
        logger.warning("HS256 JWT validation failed: %s", last_exc)
        raise last_exc


# ------------------------------------------------------------------
# singleton
# ------------------------------------------------------------------

_validator: Optional[SupabaseJWTValidator] = None


def get_supabase_validator() -> SupabaseJWTValidator:
    global _validator
    if _validator is None:
        _validator = SupabaseJWTValidator(
            settings.SUPABASE_URL,
            settings.SUPABASE_JWT_SECRET,
        )
    return _validator
