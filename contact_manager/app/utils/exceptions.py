class APIError(Exception):
    """Base class for handled API errors that map to a clean JSON response."""

    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self):
        body = dict(self.payload)
        body["error"] = self.message
        return body


class ValidationError(APIError):
    """Raised when request input fails validation."""

    status_code = 422

    def __init__(self, message="Validation failed", errors=None):
        super().__init__(message, status_code=422, payload={"details": errors or {}})


class NotFoundError(APIError):
    """Raised when a requested resource does not exist."""

    status_code = 404

    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404)


class DuplicateContactError(APIError):
    """Raised when a contact with the same unique field already exists."""

    status_code = 409

    def __init__(self, message="Contact already exists"):
        super().__init__(message, status_code=409)
