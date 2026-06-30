"""Delta-E (CIE76) matching of a measured Lab against the VITA references."""
import math

from shades import VITA_SHADES


def delta_e(lab1: list[float], lab2: list[float]) -> float:
    """CIE76 Euclidean distance between two L*a*b* colors."""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(lab1, lab2)))


def confidence(de: float) -> float:
    """Transparent confidence mapping: 1 at ΔE=0, 0 at ΔE>=20."""
    return max(0.0, round(1 - de / 20, 2))


def match_shade(tooth_lab: list[float]) -> list[dict]:
    """Rank all 16 VITA shades by ΔE ascending.

    Returns a list of {shade, delta_e, confidence}; element 0 is the suggestion.
    """
    ranked = sorted(
        (
            {"shade": name, "delta_e": round(delta_e(tooth_lab, ref), 2)}
            for name, ref in VITA_SHADES.items()
        ),
        key=lambda item: item["delta_e"],
    )
    for item in ranked:
        item["confidence"] = confidence(item["delta_e"])
    return ranked
