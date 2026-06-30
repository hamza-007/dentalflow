from pipeline.matching import confidence, delta_e, match_shade
from shades import VITA_SHADES


def test_delta_e_cie76():
    assert delta_e([0, 0, 0], [3, 4, 0]) == 5.0


def test_confidence_mapping():
    assert confidence(0.0) == 1.0
    assert confidence(20.0) == 0.0
    assert confidence(40.0) == 0.0  # clamped


def test_match_exact_reference():
    ranked = match_shade(list(VITA_SHADES["A2"]))
    assert ranked[0]["shade"] == "A2"
    assert ranked[0]["delta_e"] < 0.01
    assert ranked[0]["confidence"] >= 0.99
    assert len(ranked) == len(VITA_SHADES)


def test_results_sorted_ascending():
    ranked = match_shade([70.0, 3.0, 18.0])
    distances = [item["delta_e"] for item in ranked]
    assert distances == sorted(distances)
