import numpy as np

from pipeline.color import crop, mean_lab


class _Rect:
    def __init__(self, x: int, y: int, w: int, h: int) -> None:
        self.x, self.y, self.w, self.h = x, y, w, h


def test_mean_lab_white_patch():
    patch = np.full((10, 10, 3), 255, dtype=np.uint8)  # pure white
    lab_l, lab_a, lab_b = mean_lab(patch)
    assert abs(lab_l - 100.0) < 1.0
    assert abs(lab_a) < 1.0
    assert abs(lab_b) < 1.0


def test_mean_lab_black_patch():
    patch = np.zeros((8, 8, 3), dtype=np.uint8)  # pure black
    lab_l, _, _ = mean_lab(patch)
    assert abs(lab_l) < 1.0


def test_crop_returns_correct_subregion():
    image = np.zeros((20, 20, 3), dtype=np.uint8)
    image[5:8, 5:9] = (10, 20, 30)
    region = crop(image, _Rect(5, 5, 4, 3))
    assert region.shape == (3, 4, 3)
    assert (region == (10, 20, 30)).all()
