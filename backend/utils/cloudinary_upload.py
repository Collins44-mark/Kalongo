"""
Cloudinary upload helpers for images and videos
"""
import os
import cloudinary
import cloudinary.uploader
from flask import current_app


def config_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def upload_image(file, folder="kalongo"):
    """Upload image file to Cloudinary. Returns dict with 'url' or raises."""
    config_cloudinary()
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type="image",
        overwrite=True,
    )
    return result.get("secure_url")


def upload_video(file, folder="kalongo/videos"):
    """Upload video file to Cloudinary. Returns dict with 'url' or raises."""
    config_cloudinary()
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type="video",
        overwrite=True,
    )
    return result.get("secure_url")


def upload_image_url(url, folder="kalongo"):
    """Upload from URL (e.g. form pasted URL). Returns secure_url."""
    config_cloudinary()
    result = cloudinary.uploader.upload(url, folder=folder, resource_type="image")
    return result.get("secure_url")
