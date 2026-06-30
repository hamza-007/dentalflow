"""Crop a region and extract its mean CIE L*a*b* color."""
import numpy as np
from skimage.color import rgb2lab

from errors import AnalyzeError


def crop(image: np.ndarray, rect) -> np.ndarray:
    """Return the sub-region image[y:y+h, x:x+w].

    Raises AnalyzeError(INVALID_RECT) if the rectangle is empty or falls
    outside the image bounds. `rect` is any object with x/y/w/h attributes.
    """
    h, w = image.shape[:2]
    if (
        rect.w <= 0
        or rect.h <= 0
        or rect.x < 0
        or rect.y < 0
        or rect.x + rect.w > w
        or rect.y + rect.h > h
    ):
        raise AnalyzeError("INVALID_RECT", "Rectangle is outside the image bounds")
    return image[rect.y : rect.y + rect.h, rect.x : rect.x + rect.w]


def mean_lab(region: np.ndarray) -> list[float]:
    """Convert an RGB region (uint8) to CIE L*a*b* and return its mean [L, a, b]."""
    normalized = region.astype(np.float64) / 255.0
    lab = rgb2lab(normalized)
    return [
        float(lab[..., 0].mean()),
        float(lab[..., 1].mean()),
        float(lab[..., 2].mean()),
    ]
