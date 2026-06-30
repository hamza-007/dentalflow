"""White-balance correction from a VITA reference tab in the photo."""


def calibrate(
    tooth_lab: list[float],
    tab_measured: list[float],
    tab_reference: list[float],
) -> list[float]:
    """Correct the tooth Lab using the bias measured on a known reference tab.

    correction = tab_reference - tab_measured ; corrected = tooth_lab + correction
    """
    correction = [ref - measured for ref, measured in zip(tab_reference, tab_measured)]
    return [value + corr for value, corr in zip(tooth_lab, correction)]
