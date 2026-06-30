FROM python:3.11-slim

# OpenCV (opencv-python) needs these shared libraries at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV AI_PORT=8001
EXPOSE 8001

# Shell form so ${AI_PORT} is expanded from the environment.
CMD uvicorn main:app --host 0.0.0.0 --port ${AI_PORT}
