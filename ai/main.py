"""DentalFlow AI Shade Service — FastAPI app.

Thin wiring layer: routes call the pure pipeline functions and map domain
errors to the standard envelope { "error": { "code", "message" } }.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from config import settings
from errors import AnalyzeError
from models import Alternative, AnalyzeRequest, AnalyzeResponse
from pipeline.calibration import calibrate
from pipeline.color import crop, mean_lab
from pipeline.decode import decode_image
from pipeline.matching import match_shade
from shades import VITA_SHADES

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))

app = FastAPI(title="DentalFlow AI Shade Service", version="1.0.0")

# HTTP status per error code.
_STATUS = {
    "INVALID_IMAGE": 400,
    "INVALID_RECT": 400,
    "UNKNOWN_SHADE": 400,
    "IMAGE_TOO_LARGE": 413,
    "INVALID_REQUEST": 422,
}


def _envelope(code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=_STATUS.get(code, 400),
        content={"error": {"code": code, "message": message}},
    )


@app.exception_handler(AnalyzeError)
async def _on_analyze_error(_: Request, exc: AnalyzeError) -> JSONResponse:
    return _envelope(exc.code, exc.message)


@app.exception_handler(RequestValidationError)
async def _on_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    # A bad tab_shade is the one validation case with a dedicated code.
    if any("tab_shade" in err.get("loc", ()) for err in exc.errors()):
        return _envelope("UNKNOWN_SHADE", "tab_shade must be a valid VITA shade")
    return _envelope("INVALID_REQUEST", "Invalid request body")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    image = decode_image(req.image_b64)

    tooth_lab = mean_lab(crop(image, req.tooth_rect))

    calibrated = False
    if req.tab_rect is not None and req.tab_shade is not None:
        tab_measured = mean_lab(crop(image, req.tab_rect))
        tooth_lab = calibrate(tooth_lab, tab_measured, VITA_SHADES[req.tab_shade])
        calibrated = True

    ranked = match_shade(tooth_lab)
    top = ranked[0]

    return AnalyzeResponse(
        suggested_shade=top["shade"],
        confidence=top["confidence"],
        delta_e=top["delta_e"],
        calibrated=calibrated,
        alternatives=[Alternative(**item) for item in ranked[1:4]],
    )
