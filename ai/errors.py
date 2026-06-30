"""Typed domain error carrying a stable error code for the API envelope."""


class AnalyzeError(Exception):
    """Raised by the pipeline; mapped to the standard error envelope in main.py.

    Codes: INVALID_IMAGE, INVALID_RECT, UNKNOWN_SHADE, IMAGE_TOO_LARGE.
    """

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
