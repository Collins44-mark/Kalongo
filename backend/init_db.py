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
    """Seed default rooms (A-Cabin, Cottage, Kikota)"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    defaults = [
        ("A-Cabin", "a-cabin", "Cozy cabin for 2-3 people.", "2 Adults or Small Family", ["Comfortable beds", "Private bathroom", "Farm view", "Air conditioning", "Sitting area"]),
        ("Cottage", "cottage", "Family cottage for 4-6 people.", "Family (4-6 people)", ["Multiple bedrooms", "Living area", "Kitchenette", "Private veranda"]),
        ("Kikota", "kikota", "Traditional Kikota design for 2-4 adults.", "2-4 Adults", ["Unique design", "Garden access", "Modern amenities"]),
    ]
    try:
        for name, slug, desc, cap, features in defaults:
            if session.query(Room).filter_by(slug=slug).first():
                continue
            session.add(Room(name=name, slug=slug, description=desc, capacity=cap, features=features))
        session.commit()
        print("✅ Default rooms seeded.")
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding rooms: {e}")
    finally:
        session.close()


def seed_site_settings():
    """Seed default site settings"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    defaults = [
        ("phone", "+255 xxx xxx xxx"),
        ("email", "info@kalongofarm.com"),
        ("address", "KIWIRA TUKUYU, Mbeya Region, Tanzania"),
        ("instagram", "https://instagram.com/kalongofarm"),
        ("facebook", "https://facebook.com/kalongofarm"),
        ("logo_url", "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769261545/logo_xgfgcj.jpg"),
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
    print("\n✅ Database initialization complete.")
