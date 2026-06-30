import base64

import cv2
import numpy as np
from fastapi.testclient import TestClient

import config
from main import app
from shades import VITA_SHADES

client = TestClient(app)


def _image_b64(w: int = 200, h: int = 120, color=(170, 180, 200)) -> str:
    """A solid-color PNG (BGR) encoded as base64."""
    img = np.full((h, w, 3), color, dtype=np.uint8)
    ok, buffer = cv2.imencode(".png", img)
    assert ok
    return base64.b64encode(buffer.tobytes()).decode()


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_analyze_happy_path():
    res = client.post(
        "/analyze",
        json={"image_b64": _image_b64(), "tooth_rect": {"x": 10, "y": 10, "w": 40, "h": 40}},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["suggested_shade"] in VITA_SHADES
    assert body["calibrated"] is False
    assert len(body["alternatives"]) == 3


def test_analyze_calibrated_path():
    res = client.post(
        "/analyze",
        json={
            "image_b64": _image_b64(),
            "tooth_rect": {"x": 10, "y": 10, "w": 40, "h": 40},
            "tab_rect": {"x": 100, "y": 10, "w": 40, "h": 40},
            "tab_shade": "A2",
        },
    )
    assert res.status_code == 200
    assert res.json()["calibrated"] is True


def test_invalid_image():
    res = client.post(
        "/analyze",
        json={"image_b64": "@@@not-base64@@@", "tooth_rect": {"x": 0, "y": 0, "w": 10, "h": 10}},
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INVALID_IMAGE"


def test_invalid_rect():
    res = client.post(
        "/analyze",
        json={"image_b64": _image_b64(), "tooth_rect": {"x": 0, "y": 0, "w": 9999, "h": 10}},
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INVALID_RECT"


def test_unknown_shade():
    res = client.post(
        "/analyze",
        json={
            "image_b64": _image_b64(),
            "tooth_rect": {"x": 10, "y": 10, "w": 40, "h": 40},
            "tab_rect": {"x": 100, "y": 10, "w": 40, "h": 40},
            "tab_shade": "Z9",
        },
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "UNKNOWN_SHADE"


def test_image_too_large(monkeypatch):
    monkeypatch.setattr(config.settings, "max_image_mb", 0)
    res = client.post(
        "/analyze",
        json={"image_b64": _image_b64(), "tooth_rect": {"x": 10, "y": 10, "w": 40, "h": 40}},
    )
    assert res.status_code == 413
    assert res.json()["error"]["code"] == "IMAGE_TOO_LARGE"
