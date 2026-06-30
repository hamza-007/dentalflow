"""Runtime configuration, read from environment variables."""
import os


class Settings:
    def __init__(self) -> None:
        self.ai_port: int = int(os.getenv("AI_PORT", "8001"))
        self.max_image_mb: int = int(os.getenv("MAX_IMAGE_MB", "10"))
        self.log_level: str = os.getenv("LOG_LEVEL", "info")


# Single shared instance; read attributes at call time so tests can override.
settings = Settings()
