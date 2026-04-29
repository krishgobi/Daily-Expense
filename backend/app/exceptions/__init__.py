"""
Custom Exceptions
"""


class AppException(Exception):
    """Base application exception."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


class AuthException(AppException):
    """Authentication-related exceptions."""

    def __init__(self, message: str, code: str = "AUTH_ERROR", status_code: int = 401):
        super().__init__(message, code, status_code)


class ValidationException(AppException):
    """Validation-related exceptions."""

    def __init__(self, message: str, code: str = "VALIDATION_ERROR", status_code: int = 400):
        super().__init__(message, code, status_code)


class NotFoundException(AppException):
    """Resource not found exceptions."""

    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND", status_code: int = 404):
        super().__init__(message, code, status_code)


class ConflictException(AppException):
    """Conflict exceptions."""

    def __init__(self, message: str, code: str = "CONFLICT", status_code: int = 409):
        super().__init__(message, code, status_code)
