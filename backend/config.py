"""Flask configuration"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DATABASE_URL = os.getenv("DATABASE_URL")
    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
    # Admin
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "Kalongo")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "kalongo@95")  # Change in production!
