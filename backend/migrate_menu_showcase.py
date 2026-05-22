#!/usr/bin/env python3
"""Add restaurant menu showcase columns (subtitle, image_url, icon_key)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import engine

COLUMNS = [
    ("subtitle", "VARCHAR(300)"),
    ("image_url", "VARCHAR(500)"),
    ("icon_key", "VARCHAR(50)"),
]

DEFAULTS_SQL = """
UPDATE restaurant_menu_categories SET
  subtitle = COALESCE(NULLIF(subtitle, ''), :subtitle),
  image_url = COALESCE(NULLIF(image_url, ''), :image_url),
  icon_key = COALESCE(NULLIF(icon_key, ''), :icon_key)
WHERE LOWER(TRIM(name)) = :name
"""

SEEDS = [
    ("breakfast", "Fresh farm breakfast selections", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg", "breakfast"),
    ("main course", "Hearty local and international meals", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247284/hero-slide2_f67kon.jpg", "main"),
    ("burgers & pizza", "Crispy, cheesy and delicious", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247205/activities_im4edt.jpg", "burger"),
    ("bbq", "Smoked and grilled favorites", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247205/activities_im4edt.jpg", "bbq"),
    ("salads and juices", "Fresh organic healthy choices", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg", "salad"),
    ("other dishes", "Tasty side dishes and specials", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247541/cottage-inside1_b6zcxz.jpg", "other-dish"),
    ("soft drinks", "Refreshing chilled beverages", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247489/customer1_expjr7.jpg", "soft-drink"),
    ("vodka", "Premium vodka collection", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247595/kalongo-surroundings1_iha0us.jpg", "vodka"),
    ("liquor", "Smooth premium liquor", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247597/kalongo-surroundings2_k0rfgu.jpg", "liquor"),
    ("beer", "Local and imported beers", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247489/customer1_expjr7.jpg", "beer"),
    ("gin", "Classic gin selections", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247598/kalongo-surroundings3_urxadi.jpg", "gin"),
    ("wine", "Fine wine collection", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247395/our-kalongo-hero-background_sedoxy.jpg", "wine"),
    ("whiskey", "Premium whiskey collection", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247595/kalongo-surroundings1_iha0us.jpg", "whiskey"),
    ("other drinks", "Special drinks and collections", "https://res.cloudinary.com/dae3rpnmg/image/upload/c_fill,w_900,h_600,q_auto/v1769247283/booking-hero-background_idfar7.jpg", "other-drink"),
]


def ensure_columns():
    with engine.connect() as conn:
        for name, typ in COLUMNS:
            try:
                conn.execute(text(f"ALTER TABLE restaurant_menu_categories ADD COLUMN {name} {typ}"))
                conn.commit()
                print(f"  ✅ Added column {name}")
            except Exception as e:
                err = str(e).lower()
                if "duplicate" in err or "already exists" in err:
                    print(f"  ⚠️  Column {name} already exists")
                else:
                    print(f"  ⚠️  {name}: {e}")


def seed_defaults():
    with engine.connect() as conn:
        for name, subtitle, image_url, icon_key in SEEDS:
            conn.execute(
                text(DEFAULTS_SQL),
                {"name": name, "subtitle": subtitle, "image_url": image_url, "icon_key": icon_key},
            )
        conn.commit()
        print(f"  ✅ Seeded defaults for {len(SEEDS)} categories")


if __name__ == "__main__":
    print("Migrating menu showcase fields...")
    ensure_columns()
    seed_defaults()
    print("Done.")
