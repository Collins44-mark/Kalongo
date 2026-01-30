"""
Public API routes - Frontend will fetch data from these endpoints
"""
from flask import Blueprint, jsonify
from sqlalchemy.orm import sessionmaker
from database import engine, SessionLocal
from models import (
    HeroSlide,
    Room,
    RoomImage,
    Facility,
    Activity,
    PricingCategory,
    PricingItem,
    FoodItem,
    Video,
    Review,
    SiteSettings,
    RestaurantMenuCategory,
    RestaurantMenuItem,
    GalleryImage,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")


def get_session():
    return SessionLocal()


@api_bp.route("/hero-slides")
def get_hero_slides():
    """Get all active hero slides - admin controls via active flag"""
    s = get_session()
    try:
        # Get active slides for frontend display
        slides = s.query(HeroSlide).filter_by(active=True).order_by(HeroSlide.order, HeroSlide.id).limit(50).all()
        # If no active slides, get all slides as fallback
        if not slides:
            slides = s.query(HeroSlide).order_by(HeroSlide.order, HeroSlide.id).limit(50).all()
        return jsonify([{
            "id": slide.id,
            "image_url": slide.image_url,
            "title": slide.title,
            "subtitle": slide.subtitle,
            "order": slide.order,
        } for slide in slides])
    finally:
        s.close()


@api_bp.route("/rooms")
def get_rooms():
    """Get all rooms with their images - A-Cabin, Cottage, Kikota, Family House"""
    s = get_session()
    try:
        from sqlalchemy.orm import joinedload
        rooms = s.query(Room).options(joinedload(Room.images)).order_by(Room.order, Room.id).all()
        result = []
        for room in rooms:
            result.append({
                "id": room.id,
                "name": room.name,
                "slug": room.slug,
                "description": room.description,
                "capacity": room.capacity,
                "features": room.features or [],
                "images": sorted([{
                    "id": img.id,
                    "image_url": img.image_url,
                    "caption": img.caption,
                    "order": img.order,
                } for img in room.images], key=lambda x: (x["order"], x["id"])),
            })
        return jsonify(result)
    finally:
        s.close()


@api_bp.route("/facilities")
def get_facilities():
    """Get all facilities"""
    s = get_session()
    try:
        facilities = s.query(Facility).order_by(Facility.order, Facility.id).all()
        return jsonify([{
            "id": f.id,
            "name": f.name,
            "description": f.description,
            "image_url": f.image_url,
            "order": f.order,
        } for f in facilities])
    finally:
        s.close()


@api_bp.route("/activities")
def get_activities():
    """Get all activities"""
    s = get_session()
    try:
        activities = s.query(Activity).order_by(Activity.order, Activity.id).all()
        return jsonify([{
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "image_url": a.image_url,
            "order": a.order,
        } for a in activities])
    finally:
        s.close()


@api_bp.route("/pricing")
def get_pricing():
    """Get all pricing categories with items - optimized"""
    s = get_session()
    try:
        from sqlalchemy.orm import joinedload
        categories = s.query(PricingCategory).options(joinedload(PricingCategory.items)).order_by(PricingCategory.order, PricingCategory.id).all()
        result = []
        for cat in categories:
            result.append({
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "category_type": cat.category_type,
                "order": cat.order,
                "items": sorted([{
                    "id": item.id,
                    "name": item.name,
                    "price_label": item.price_label,
                    "price_value": item.price_value,
                    "description": item.description,
                    "featured": item.featured,
                    "order": item.order,
                } for item in cat.items], key=lambda x: (x["order"], x["id"])),
            })
        return jsonify(result)
    finally:
        s.close()


@api_bp.route("/food")
def get_food():
    """Get all food items"""
    s = get_session()
    try:
        food = s.query(FoodItem).order_by(FoodItem.order, FoodItem.id).all()
        return jsonify([{
            "id": f.id,
            "name": f.name,
            "description": f.description,
            "price": f.price,
            "featured": f.featured,
            "order": f.order,
        } for f in food])
    finally:
        s.close()


@api_bp.route("/videos")
def get_videos():
    """Get all videos"""
    s = get_session()
    try:
        videos = s.query(Video).order_by(Video.order, Video.id).all()
        return jsonify([{
            "id": v.id,
            "url": v.url,
            "caption": v.caption,
            "section": v.section,
            "order": v.order,
        } for v in videos])
    finally:
        s.close()


@api_bp.route("/gallery-images")
def get_gallery_images():
    """Get all gallery images"""
    s = get_session()
    try:
        # Check if table exists, if not return empty array
        try:
            images = s.query(GalleryImage).order_by(GalleryImage.order, GalleryImage.id).all()
            return jsonify([{
                "id": img.id,
                "image_url": img.image_url,
                "caption": img.caption,
                "section": img.section,
                "order": img.order,
            } for img in images])
        except Exception as e:
            # Table might not exist yet, return empty array
            print(f"⚠️ Gallery images table might not exist: {e}")
            return jsonify([])
    finally:
        s.close()


@api_bp.route("/reviews")
def get_reviews():
    """Get all reviews"""
    s = get_session()
    try:
        reviews = s.query(Review).order_by(Review.order, Review.id).all()
        return jsonify([{
            "id": r.id,
            "customer_name": r.customer_name,
            "image_url": r.image_url,
            "quote": r.quote,
            "rating": r.rating,
            "order": r.order,
        } for r in reviews])
    finally:
        s.close()


@api_bp.route("/settings")
def get_settings():
    """Get all site settings"""
    s = get_session()
    try:
        settings = s.query(SiteSettings).all()
        result = {}
        for setting in settings:
            result[setting.key] = setting.value
        return jsonify(result)
    finally:
        s.close()


@api_bp.route("/restaurant-menu")
def get_restaurant_menu():
    """Get all restaurant menu categories with items - optimized"""
    s = get_session()
    try:
        from sqlalchemy.orm import joinedload
        categories = s.query(RestaurantMenuCategory).options(joinedload(RestaurantMenuCategory.items)).order_by(RestaurantMenuCategory.order, RestaurantMenuCategory.id).all()
        result = []
        for cat in categories:
            result.append({
                "id": cat.id,
                "name": cat.name,
                "order": cat.order,
                "items": sorted([{
                    "id": item.id,
                    "name": item.name,
                    "price": item.price,
                    "order": item.order,
                } for item in cat.items], key=lambda x: (x["order"], x["id"])),
            })
        return jsonify(result)
    finally:
        s.close()


@api_bp.route("/homepage-data")
def get_homepage_data():
    """Combined endpoint for homepage data - faster loading"""
    s = get_session()
    try:
        from sqlalchemy.orm import joinedload
        
        # Fetch all data in parallel queries
        hero_slides = s.query(HeroSlide).filter_by(active=True).order_by(HeroSlide.order, HeroSlide.id).limit(20).all()
        rooms = s.query(Room).options(joinedload(Room.images)).order_by(Room.order, Room.id).all()
        facilities = s.query(Facility).order_by(Facility.order, Facility.id).all()
        reviews = s.query(Review).order_by(Review.order, Review.id).all()
        settings = s.query(SiteSettings).all()
        
        # Build response
        settings_dict = {s.key: s.value for s in settings}
        
        return jsonify({
            "hero_slides": [{
                "id": slide.id,
                "image_url": slide.image_url,
                "title": slide.title,
                "subtitle": slide.subtitle,
                "order": slide.order,
            } for slide in hero_slides],
            "rooms": [{
                "id": room.id,
                "name": room.name,
                "slug": room.slug,
                "description": room.description,
                "capacity": room.capacity,
                "features": room.features or [],
                "images": sorted([{
                    "id": img.id,
                    "image_url": img.image_url,
                    "caption": img.caption,
                    "order": img.order,
                } for img in room.images], key=lambda x: (x["order"], x["id"])),
            } for room in rooms],
            "facilities": [{
                "id": f.id,
                "name": f.name,
                "description": f.description,
                "image_url": f.image_url,
                "order": f.order,
            } for f in facilities],
            "reviews": [{
                "id": r.id,
                "customer_name": r.customer_name,
                "image_url": r.image_url,
                "quote": r.quote,
                "rating": r.rating,
                "order": r.order,
            } for r in reviews],
            "settings": settings_dict,
        })
    finally:
        s.close()
