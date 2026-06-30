from pipeline.calibration import calibrate
from shades import VITA_SHADES


def test_calibration_recovers_original():
    original_tooth = [70.0, 3.0, 18.0]
    bias = [5.0, -2.0, 3.0]  # camera/lighting shift applied to the whole frame

    tab_reference = VITA_SHADES["A2"]
    tab_measured = [ref + b for ref, b in zip(tab_reference, bias)]
    tooth_measured = [val + b for val, b in zip(original_tooth, bias)]

    corrected = calibrate(tooth_measured, tab_measured, tab_reference)

    for got, expected in zip(corrected, original_tooth):
        assert abs(got - expected) < 1e-6
