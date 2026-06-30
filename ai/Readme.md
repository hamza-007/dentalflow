# DentalFlow — AI Shade Service 🦷🎨

AI microservice that determines the **VITA tooth shade** from a photo, for the
DentalFlow platform (dentist ↔ lab). Built with **Python + FastAPI**.

> ⚠️ **Status: V2 module.** This is not part of the MVP. The MVP ships without it.
> Build this only once the core platform has real labs using it. It is documented
> here so the architecture is ready when the time comes.

---

## What It Does

Given a photo of a tooth, the service returns the closest VITA Classical shade
(`A1`, `A2`, ... `D4`) with a confidence score and alternatives.

```
Input : photo of a tooth (+ optional VITA reference tab in the frame)
Output: { "suggested_shade": "A2", "confidence": 0.87, "alternatives": [...] }
```

The shade is an **assistance tool** for the technician — never a final medical
decision. The human always validates.

---

## How It Works

This is **color science**, not heavy machine learning. No GPU, no dataset needed
for the baseline.

```
Photo
  │
  ▼  1. CALIBRATION   white-balance correction using the VITA tab in the frame
  │
  ▼  2. SEGMENTATION  isolate the tooth region (rectangle in MVP, SAM in V2)
  │
  ▼  3. EXTRACTION    convert RGB → CIE L*a*b*, average the tooth region
  │
  ▼  4. MATCHING      compute Delta-E vs the 16 reference VITA shades
  │
  ▼
Result: closest shade + top-3 alternatives
```

**Why L\*a\*b\*?** It is a device-independent color space, so a measured shade is
comparable regardless of the camera. **Delta-E** is the standard distance between
two colors.

### The calibration trick
Asking the dentist to include a **VITA reference tab** (e.g. an `A2` tab) in the
photo lets the service correct for lighting/camera bias automatically:

```
correction      = real_lab["A2"] - measured_lab(tab_region)
calibrated_tooth = measured_lab(tooth_region) + correction
```

This makes the result reliable even without a trained model.

---

## Two Approaches

| | Approach A — Color Science | Approach B — Deep Learning |
|---|---|---|
| Used in | **V2 baseline** | V3 (later) |
| Data needed | **None** | 300–500 labeled photos |
| Hardware | CPU only | GPU recommended |
| Robust to lighting | With calibration tab | Yes (if well trained) |
| Explainable | Yes (Delta-E values) | No (black box) |
| Model | `colormath` + Delta-E | EfficientNet fine-tuned |

Start with A. Move to B only if A's accuracy isn't enough and you have data.

---

## Tech Stack

- **Python** 3.11+
- **FastAPI** — HTTP API
- **Uvicorn** — ASGI server
- **OpenCV** — image processing
- **scikit-image** — RGB → L\*a\*b\* conversion
- **NumPy** — math
- *(V3 only)* **PyTorch** + **EfficientNet** for the deep-learning variant

---

## Project Structure

```
/ai
  main.py                 # FastAPI app + /analyze endpoint
  shades.py               # VITA reference L*a*b* values
  pipeline/
    calibration.py        # white-balance correction
    segmentation.py       # isolate tooth region
    color.py              # RGB → Lab, mean color
    matching.py           # Delta-E + ranking
  models/                 # (V3) trained weights, ignored by git
  tests/
    test_matching.py
    test_pipeline.py
  requirements.txt
  Dockerfile
  .env.example
  README.md               # this file
```

---

## Setup

### Requirements
```txt
fastapi==0.111.0
uvicorn==0.29.0
numpy==1.26.4
opencv-python==4.9.0.80
scikit-image==0.23.2
pydantic==2.7.0
python-multipart==0.0.9
```

### Install & run (local)
```bash
cd ai
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Run with Docker
```bash
docker build -t dentalflow-ai .
docker run -p 8001:8001 --env-file .env dentalflow-ai
```

### Environment (`.env.example`)
```
AI_PORT=8001
MAX_IMAGE_MB=10
LOG_LEVEL=info
```

---

## API

Base URL: `http://localhost:8001`

### `GET /health`
```json
{ "status": "ok" }
```

### `POST /analyze`
Analyze a tooth photo and return the suggested VITA shade.

**Request**
```json
{
  "image_b64": "<base64 of the photo>",
  "tooth_rect": { "x": 120, "y": 80, "w": 60, "h": 90 },
  "tab_rect":   { "x": 300, "y": 80, "w": 50, "h": 90 },
  "tab_shade":  "A2"
}
```
| Field | Required | Description |
|-------|:--------:|-------------|
| `image_b64` | yes | Photo encoded in base64 |
| `tooth_rect` | yes | Bounding box of the tooth region |
| `tab_rect` | no | Bounding box of the VITA reference tab |
| `tab_shade` | no | Shade of the reference tab (enables calibration) |

**Response**
```json
{
  "suggested_shade": "A2",
  "confidence": 0.87,
  "delta_e": 1.1,
  "calibrated": true,
  "alternatives": [
    { "shade": "B1", "delta_e": 2.3, "confidence": 0.71 },
    { "shade": "A1", "delta_e": 2.8, "confidence": 0.65 },
    { "shade": "A3", "delta_e": 3.4, "confidence": 0.58 }
  ]
}
```

**Errors** — standard envelope, matching the Go API:
```json
{ "error": { "code": "INVALID_IMAGE", "message": "Image could not be decoded" } }
```

---

## How the Go API Calls This Service

The Go backend calls `/analyze` after a photo is uploaded to a case, then stores
the result in the `teinte_analyses` table.

```
Dentist uploads photo
        │
        ▼
Go API  ──POST /analyze──▶  Python AI service
        ◀──── result ──────
        │
        ▼
Store in teinte_analyses + show in case detail
```

Set `AI_SERVICE_URL` in the Go API env to reach this service.

---

## Delta-E Interpretation

| ΔE | Meaning | Confidence shown |
|----|---------|------------------|
| < 1   | Imperceptible difference | very high |
| 1 – 2 | Slight (expert only) | high |
| 2 – 3 | Visible difference | medium |
| > 3   | Clearly different | low |

`confidence = max(0, 1 - ΔE / 20)` — a simple, transparent mapping.

---

## Accuracy & Limits

- **Best results require the VITA tab in the frame.** Without it, lighting bias
  reduces accuracy.
- Photos must be reasonably in focus and not over/under-exposed.
- The service returns a **suggestion + alternatives**, never a single forced answer.
- It does **not** handle multi-tooth gradients, translucency, or characterizations
  in the baseline — those need the deep-learning variant (V3).

---

## Roadmap

- [x] V2 — Color-science baseline (Delta-E + calibration tab)
- [ ] V2.1 — Auto tab detection (no manual `tab_rect`)
- [ ] V2.2 — SAM-based automatic tooth segmentation
- [ ] V3 — EfficientNet model fine-tuned on labeled photos (needs dataset)
- [ ] V3.1 — Translucency / multi-zone shade mapping

---

## Safety & Data

- This is a **decision-support tool**, not a diagnostic device. The dental
  professional validates every result.
- Photos may contain patient-related data — treat them as **sensitive**:
  encrypt in transit (HTTPS), do not log raw images, and follow the platform's
  data-handling rules.
- No image is stored by this service; it processes and returns. Persistence is the
  Go API's responsibility.

---

## Tests

```bash
pytest                       # run all tests
pytest tests/test_matching.py -v
```

Cover at minimum: Delta-E correctness, calibration math, and ranking order.

---

*DentalFlow AI Shade Service · Python + FastAPI · V2 module (post-MVP)*
*Color-science baseline — no GPU, no dataset required to start.*