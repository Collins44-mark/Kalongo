"""
Kalongo Farm - Flask backend
"""
import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS
from database import test_connection, engine, Base, SessionLocal
from sqlalchemy import text
from sqlalchemy.orm import joinedload
from models import (
    Admin,
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

load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload
app.config["TEMPLATES_AUTO_RELOAD"] = False  # Disable auto-reload for faster rendering
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 300  # Cache static files
CORS(app)  # Enable CORS for frontend API calls

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "admin.login"
login_manager.login_message = "Please log in to access the admin panel."
login_manager.session_protection = "basic"  # Use basic to avoid redirect loops


@login_manager.user_loader
def load_user(user_id):
    """Load user from database - must return None if user doesn't exist"""
    s = SessionLocal()
    try:
        if not user_id:
            return None
        admin = s.query(Admin).get(int(user_id))
        return admin
    except (ValueError, TypeError, Exception):
        return None
    finally:
        s.close()


from routes.admin_routes import admin_bp

app.register_blueprint(admin_bp)


def get_session():
    """Get database session"""
    return SessionLocal()


@app.route("/")
def index():
    return {"message": "Kalongo Farm API", "status": "ok"}


@app.route("/health")
def health():
    db_status = "connected" if test_connection() else "disconnected"
    return {"status": "healthy", "database": db_status}


@app.route("/api/db/test")
def db_test():
    try:
        if test_connection():
            with engine.connect() as conn:
                r = conn.execute(text("SELECT current_database(), current_user, version()"))
                row = r.fetchone()
                return jsonify({
                    "status": "success",
                    "message": "Database connection successful",
                    "database": row[0],
                    "user": row[1],
                    "version": row[2].split(",")[0],
                })
        return jsonify({"status": "error", "message": "Database connection failed"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# PUBLIC API ROUTES - All routes explicitly defined here
# ============================================================================

@app.route("/api/hero-slides")
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


@app.route("/api/rooms")
def get_rooms():
    """Get all rooms with their images - optimized with eager loading"""
    s = get_session()
    try:
        rooms = s.query(Room).options(joinedload(Room.images)).order_by(Room.order, Room.id).all()
        result = []
        for room in rooms:
            # Filter out images with null or empty URLs
            valid_images = [
                {
                    "id": img.id,
                    "image_url": img.image_url,
                    "caption": img.caption or "",
                    "order": img.order or 0,
                }
                for img in room.images
                if img.image_url and img.image_url.strip()  # Only include images with valid URLs
            ]
            result.append({
                "id": room.id,
                "name": room.name,
                "slug": room.slug,
                "description": room.description or "",
                "capacity": room.capacity or "",
                "features": room.features or [],
                "images": sorted(valid_images, key=lambda x: (x["order"], x["id"])),
            })
        return jsonify(result)
    finally:
        s.close()


@app.route("/api/facilities")
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


@app.route("/api/activities")
def get_activities():
    """Get all activities"""
    s = get_session()
    try:
        activities = s.query(Activity).order_by(Activity.order, Activity.id).all()
        result = []
        for a in activities:
            # Only include activities with valid data
            if a.name:  # Ensure activity has a name
                result.append({
                    "id": a.id,
                    "name": a.name,
                    "description": a.description or "",
                    "image_url": a.image_url if a.image_url and a.image_url.strip() else None,
                    "order": a.order or 0,
                })
        return jsonify(result)
    finally:
        s.close()


@app.route("/api/pricing")
def get_pricing():
    """Get all pricing categories with items - optimized"""
    s = get_session()
    try:
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


@app.route("/api/food")
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


@app.route("/api/videos")
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


@app.route("/api/reviews")
def get_reviews():
    """Get all reviews"""
    s = get_session()
    try:
        reviews = s.query(Review).order_by(Review.order, Review.id).all()
        result = []
        for r in reviews:
            # Only include reviews with valid data
            if r.customer_name or r.quote:  # Ensure review has at least name or quote
                result.append({
                    "id": r.id,
                    "customer_name": r.customer_name or "Guest",
                    "image_url": r.image_url if r.image_url and r.image_url.strip() else None,
                    "quote": r.quote or "",
                    "rating": r.rating if r.rating else 5,
                    "order": r.order or 0,
                })
        return jsonify(result)
    finally:
        s.close()


@app.route("/api/settings")
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


@app.route("/api/restaurant-menu")
def get_restaurant_menu():
    """Get all restaurant menu categories with items - optimized"""
    s = get_session()
    try:
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


@app.route("/api/gallery-images")
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


@app.route("/api/homepage-data")
def get_homepage_data():
    """Combined endpoint for homepage data - faster loading"""
    s = get_session()
    try:
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
                "description": room.description or "",
                "capacity": room.capacity or "",
                "features": room.features or [],
                "images": sorted([
                    {
                        "id": img.id,
                        "image_url": img.image_url,
                        "caption": img.caption or "",
                        "order": img.order or 0,
                    }
                    for img in room.images
                    if img.image_url and img.image_url.strip()  # Only include images with valid URLs
                ], key=lambda x: (x["order"], x["id"])),
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
                "customer_name": r.customer_name or "Guest",
                "image_url": r.image_url if r.image_url and r.image_url.strip() else None,
                "quote": r.quote or "",
                "rating": r.rating if r.rating else 5,
                "order": r.order or 0,
            } for r in reviews if r.customer_name or r.quote],  # Only include reviews with valid data
            "settings": settings_dict,
        })
    finally:
        s.close()


if __name__ == "__main__":
    app.run(host="127.0.0.1", debug=os.getenv("FLASK_ENV") == "development", port=5001)
