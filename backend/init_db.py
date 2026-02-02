"""
Create all database tables and seed default admin.
Run: python init_db.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from models import (
    Admin,
    SiteSettings,
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
    RestaurantMenuCategory,
    RestaurantMenuItem,
    GalleryImage,
)


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully.")


def seed_admin():
    """Create default admin if none exists"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        if session.query(Admin).first():
            print("ℹ️  Admin user already exists. Skipping seed.")
            return
        username = os.getenv("ADMIN_USERNAME", "Kalongo")
        password = os.getenv("ADMIN_PASSWORD", "kalongo@95")
        admin = Admin(username=username)
        admin.set_password(password)
        session.add(admin)
        session.commit()
        print(f"✅ Default admin created. Username: {username}, Password: {password}")
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding admin: {e}")
    finally:
        session.close()


def seed_rooms():
    """Seed default rooms: A-Cabin, Cottage, Kikota, Family House (all under Accommodation)"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    defaults = [
        ("A-Cabin", "a-cabin", "Cozy cabin for 2-3 people.", "2 Adults or Small Family", ["Comfortable beds", "Private bathroom", "Farm view", "Air conditioning", "Sitting area"]),
        ("Cottage", "cottage", "Family cottage for 4-6 people.", "Family (4-6 people)", ["Multiple bedrooms", "Living area", "Kitchenette", "Private veranda"]),
        ("Kikota", "kikota", "Traditional Kikota design for 2-4 adults.", "2-4 Adults", ["Unique design", "Garden access", "Modern amenities"]),
        ("Family House", "family-house", "Spacious family house for longer stays.", "Family (6-8 people)", ["Multiple bedrooms", "Living area", "Kitchen", "Private veranda", "Full amenities"]),
    ]
    try:
        for name, slug, desc, cap, features in defaults:
            if session.query(Room).filter_by(slug=slug).first():
                continue
            session.add(Room(name=name, slug=slug, description=desc, capacity=cap, features=features))
        session.commit()
        print("✅ Default rooms seeded (A-Cabin, Cottage, Kikota, Family House).")
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding rooms: {e}")
    finally:
        session.close()


def seed_reviews():
    """Seed sample reviews so the reviews section shows content"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    # Use Cloudinary placeholder or generic image if you have one
    default_img = "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769261545/logo_xgfgcj.jpg"
    defaults = [
        ("Sarah M.", default_img, "A wonderful escape! The farm, the rooms, and the food were perfect. We'll be back.", 5, 0),
        ("John K.", default_img, "Kalongo Farm is a hidden gem. Peaceful, clean, and the staff went above and beyond.", 5, 1),
        ("Grace T.", None, "Best family getaway. The kids loved the animals and the pool. Highly recommend.", 5, 2),
    ]
    try:
        if session.query(Review).first():
            print("ℹ️  Reviews already exist. Skipping seed.")
            return
        for name, img, quote, rating, order in defaults:
            session.add(Review(customer_name=name, image_url=img, quote=quote, rating=rating, order=order))
        session.commit()
        print("✅ Sample reviews seeded.")
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding reviews: {e}")
    finally:
        session.close()


def seed_room_images():
    """Seed one placeholder image per room so room section shows images"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    # Placeholder image per room (replace with real photos via Admin > Rooms > Images)
    placeholder_url = "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769261545/logo_xgfgcj.jpg"
    placeholders = {
        "a-cabin": placeholder_url,
        "cottage": placeholder_url,
        "kikota": placeholder_url,
        "family-house": placeholder_url,
    }
    try:
        for slug, url in placeholders.items():
            room = session.query(Room).filter_by(slug=slug).first()
            if not room:
                continue
            if session.query(RoomImage).filter_by(room_id=room.id).first():
                continue
            session.add(RoomImage(room_id=room.id, image_url=url, caption=room.name, order=0))
        session.commit()
        print("✅ Room placeholder images seeded (replace via Admin > Rooms > Images).")
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding room images: {e}")
    finally:
        session.close()


def seed_site_settings():
    """Seed default site settings"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    defaults = [
        ("phone", "+255 798 924 280"),
        ("email", "info@kalongofarm.com"),
        ("address", "ibulla village, Kiwira, Tukuyu -Mbeya, Tanzania"),
        ("instagram", "https://instagram.com/kalongofarm"),
        ("facebook", "https://facebook.com/kalongofarm"),
        ("logo_url", "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769261545/logo_xgfgcj.jpg"),
        ("show_prices", "false"),  # Admin toggle: false = prices hidden on web by default
        ("map_coordinates", "-9.1379842,33.5286078"),  # For "Visit Us" Google Maps directions link
    ]
    try:
        for key, value in defaults:
            existing = session.query(SiteSettings).filter_by(key=key).first()
            if not existing:
                session.add(SiteSettings(key=key, value=value))
        session.commit()
        print("✅ Site settings seeded.")
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding site settings: {e}")
    finally:
        session.close()


if __name__ == "__main__":
    print("Creating database tables...")
    create_tables()
    print("\nSeeding default admin...")
    seed_admin()
    print("\nSeeding site settings...")
    seed_site_settings()
    print("\nSeeding default rooms...")
    seed_rooms()
    print("\nSeeding sample reviews...")
    seed_reviews()
    print("\nSeeding room images (placeholders)...")
    seed_room_images()
    print("\n✅ Database initialization complete.")
