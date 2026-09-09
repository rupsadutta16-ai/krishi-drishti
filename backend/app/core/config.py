import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = os.getenv("APP_NAME")
    APP_VERSION: str = os.getenv("APP_VERSION")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    JWT_SECRET: str = os.getenv("JWT_SECRET")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7")
    )

    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: str | None = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str | None = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str | None = os.getenv("CLOUDINARY_API_SECRET")
    CLOUDINARY_URL: str | None = os.getenv("CLOUDINARY_URL")    # Image Quality Threshold Configs
    IMAGE_QUALITY_MIN_WIDTH: int = int(os.getenv("IMAGE_QUALITY_MIN_WIDTH", "200"))
    IMAGE_QUALITY_MIN_HEIGHT: int = int(os.getenv("IMAGE_QUALITY_MIN_HEIGHT", "200"))
    IMAGE_QUALITY_BLUR_THRESHOLD: float = float(os.getenv("IMAGE_QUALITY_BLUR_THRESHOLD", "50.0"))
    IMAGE_QUALITY_ACCEPT_SCORE: float = float(os.getenv("IMAGE_QUALITY_ACCEPT_SCORE", "50.0"))


settings = Settings()


