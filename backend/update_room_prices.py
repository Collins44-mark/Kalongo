"""
Update room prices in the database to match current rates.
Run: python update_room_prices.py

Room prices (user-specified):
- A-Cabin: 180,000 (couple) & 150,000 (single occupancy)
- Cottage: 180,000 (couple) & 150,000 (single occupancy)
- Family: 250,000 (couples) & 550,000 (5 occupants)
- Kikota: 400,000
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import PricingCategory, PricingItem

# Accommodation pricing items: (name, price_label, price_value, order)
ACCOMMODATION_ITEMS = [
    ("A-Cabin", "Couple", "TZS 180,000", 0),
    ("A-Cabin", "Single occupancy", "TZS 150,000", 1),
    ("Cottage", "Couple", "TZS 180,000", 2),
    ("Cottage", "Single occupancy", "TZS 150,000", 3),
    ("Family", "Couples", "TZS 250,000", 4),
    ("Family", "5 occupants", "TZS 550,000", 5),
    ("Kikota", "Per Night (BB)", "TZS 400,000", 6),
    ("Tents", "Single (BB)", "TZS 50,000", 7),
    ("Tents", "Double (BB)", "TZS 80,000", 8),
]


def update_room_prices():
    s = SessionLocal()
    try:
        # Find Accommodation category (by name or type)
        acc_cat = s.query(PricingCategory).filter(
            (PricingCategory.category_type == "accommodation") |
            (PricingCategory.name.ilike("%accommodation%"))
        ).first()

        if not acc_cat:
            print("⚠️  No Accommodation pricing category found.")
            print("   Run migrate_frontend_data.py first to create categories.")
            return

        # Remove existing accommodation items
        deleted = s.query(PricingItem).filter_by(category_id=acc_cat.id).delete()
        print(f"   Removed {deleted} old accommodation pricing items.")

        # Add new items
        for name, price_label, price_value, order in ACCOMMODATION_ITEMS:
            s.add(PricingItem(
                category_id=acc_cat.id,
                name=name,
                price_label=price_label,
                price_value=price_value,
                order=order,
            ))
        s.commit()
        print(f"✅ Added {len(ACCOMMODATION_ITEMS)} accommodation pricing items.")
    except Exception as e:
        s.rollback()
        raise e
    finally:
        s.close()


if __name__ == "__main__":
    print("Updating room prices in database...")
    update_room_prices()
    print("Done.")
