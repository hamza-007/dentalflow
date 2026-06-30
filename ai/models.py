"""Pydantic request/response models for the AI Shade Service."""
from pydantic import BaseModel, field_validator

from shades import VITA_SHADES


class Rect(BaseModel):
    x: int
    y: int
    w: int
    h: int


class AnalyzeRequest(BaseModel):
    image_b64: str
    tooth_rect: Rect
    tab_rect: Rect | None = None
    tab_shade: str | None = None

    @field_validator("tab_shade")
    @classmethod
    def _validate_tab_shade(cls, v: str | None) -> str | None:
        if v is not None and v not in VITA_SHADES:
            raise ValueError(f"unknown VITA shade: {v}")
        return v


class Alternative(BaseModel):
    shade: str
    delta_e: float
    confidence: float


class AnalyzeResponse(BaseModel):
    suggested_shade: str
    confidence: float
    delta_e: float
    calibrated: bool
    alternatives: list[Alternative]


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
