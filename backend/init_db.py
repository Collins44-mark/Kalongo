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
    RoomCategory,
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


def migrate_room_category_column():
    """Add category_id to rooms table if it doesn't exist"""
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE rooms ADD COLUMN category_id INTEGER"))
            conn.commit()
            print("✅ Added category_id to rooms table.")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("ℹ️  rooms.category_id already exists.")
            else:
                print(f"⚠️  Migration category_id: {e}")
            conn.rollback()


def seed_room_categories():
    """Seed room categories: Rooms, Family Houses"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    defaults = [
        ("Rooms", "rooms", 0),
        ("Family Houses", "family-houses", 1),
    ]
    try:
        for name, slug, order in defaults:
            if session.query(RoomCategory).filter_by(slug=slug).first():
                continue
            session.add(RoomCategory(name=name, slug=slug, order=order))
        session.commit()
        print("✅ Room categories seeded.")
    except Exception as e:
        session.rollback()
        print(f"❌ Error seeding room categories: {e}")
    finally:
        session.close()


def seed_rooms():
    """Seed default rooms (A-Cabin, Cottage, Kikota) under 'Rooms' category"""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    session = Session()
    rooms_category = session.query(RoomCategory).filter_by(slug="rooms").first()
    defaults = [
        ("A-Cabin", "a-cabin", "Cozy cabin for 2-3 people.", "2 Adults or Small Family", ["Comfortable beds", "Private bathroom", "Farm view", "Air conditioning", "Sitting area"]),
        ("Cottage", "cottage", "Family cottage for 4-6 people.", "Family (4-6 people)", ["Multiple bedrooms", "Living area", "Kitchenette", "Private veranda"]),
        ("Kikota", "kikota", "Traditional Kikota design for 2-4 adults.", "2-4 Adults", ["Unique design", "Garden access", "Modern amenities"]),
    ]
    try:
        for name, slug, desc, cap, features in defaults:
            if session.query(Room).filter_by(slug=slug).first():
                continue
            r = Room(name=name, slug=slug, description=desc, capacity=cap, features=features)
            if rooms_category:
                r.category_id = rooms_category.id
            session.add(r)
        session.commit()
        # Assign existing rooms without category to 'Rooms'
        if rooms_category:
            session.query(Room).filter(Room.category_id == None).update({Room.category_id: rooms_category.id})
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
    print("\nSeeding room categories...")
    seed_room_categories()
    print("\nMigrating rooms table (category_id)...")
    migrate_room_category_column()
    print("\nSeeding default rooms...")
    seed_rooms()
    print("\n✅ Database initialization complete.")
