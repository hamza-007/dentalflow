"""Decode a base64 image into an RGB numpy array, with validation."""
import base64
import binascii

import cv2
import numpy as np

from config import settings
from errors import AnalyzeError


def decode_image(image_b64: str) -> np.ndarray:
    """Decode base64 (optionally a data URL) into an HxWx3 RGB uint8 array.

    Raises AnalyzeError(INVALID_IMAGE) for bad base64 / undecodable images and
    AnalyzeError(IMAGE_TOO_LARGE) when the decoded bytes exceed MAX_IMAGE_MB.
    """
    raw = image_b64.split(",", 1)[1] if image_b64.startswith("data:") else image_b64

    try:
        data = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise AnalyzeError("INVALID_IMAGE", "Image could not be decoded from base64")

    max_bytes = settings.max_image_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise AnalyzeError("IMAGE_TOO_LARGE", f"Image exceeds {settings.max_image_mb} MB")

    buffer = np.frombuffer(data, dtype=np.uint8)
    bgr = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if bgr is None:
        raise AnalyzeError("INVALID_IMAGE", "Image could not be decoded")

    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
