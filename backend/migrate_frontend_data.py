"""
Migration script: Import existing data from frontend HTML to database
Run: python migrate_frontend_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
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
)

s = SessionLocal()


def migrate_hero_slides():
    """Migrate hero slides from frontend"""
    print("Migrating hero slides...")
    existing = s.query(HeroSlide).count()
    if existing > 0:
        print(f"  ⚠️  {existing} hero slides already exist. Skipping.")
        return
    
    slides = [
        {"image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247285/hero-background_xprz3b.jpg", "title": "Welcome to KALONGO FARM", "subtitle": "Experience the Perfect Blend of Nature, Comfort & Farm Life", "order": 0},
        {"image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247284/hero-slide2_f67kon.jpg", "title": None, "subtitle": None, "order": 1},
        {"image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247293/hero-slide3_photno.jpg", "title": None, "subtitle": None, "order": 2},
        {"image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247286/hero-slide4_e7hiiy.jpg", "title": None, "subtitle": None, "order": 3},
    ]
    for slide_data in slides:
        s.add(HeroSlide(**slide_data))
    s.commit()
    print(f"  ✅ Added {len(slides)} hero slides")


def migrate_room_images():
    """Migrate room images"""
    print("Migrating room images...")
    rooms_data = {
        "a-cabin": [
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247539/a-cabin_fpmuuz.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247537/a-cabin-inside1_bigacm.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247538/a-cabin-inside2_vl8uoz.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247535/a-cabin-bathroom_gb17ya.jpg",
        ],
        "cottage": [
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247546/cottage_fzxdif.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247541/cottage-inside1_b6zcxz.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247543/cottage-inside2_gykjie.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247540/cottage-bathroom_d75jxs.jpg",
        ],
        "kikota": [
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247549/kikota_zwpblm.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247547/kikota-inside1_utwfgn.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247548/kikota-inside2_irf1i3.jpg",
            "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247545/kikota-bathroom_oclgvo.jpg",
        ],
    }
    for slug, urls in rooms_data.items():
        room = s.query(Room).filter_by(slug=slug).first()
        if not room:
            print(f"  ⚠️  Room '{slug}' not found. Run init_db.py first.")
            continue
        existing = s.query(RoomImage).filter_by(room_id=room.id).count()
        if existing > 0:
            print(f"  ⚠️  {existing} images already exist for {slug}. Skipping.")
            continue
        for idx, url in enumerate(urls):
            s.add(RoomImage(room_id=room.id, image_url=url, order=idx))
        s.commit()
        print(f"  ✅ Added {len(urls)} images for {slug}")


def migrate_facilities():
    """Migrate facilities"""
    print("Migrating facilities...")
    existing = s.query(Facility).count()
    if existing > 0:
        print(f"  ⚠️  {existing} facilities already exist. Skipping.")
        return
    
    facilities = [
        {"name": "Swimming Pool", "description": "Relax and cool off in our refreshing swimming pool", "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247203/swimming-pool_hk8isg.jpg", "order": 0},
        {"name": "Natural Farm", "description": "Experience authentic farm life with our natural farming practices and organic produce", "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247201/natural-farm_difqzg.jpg", "order": 1},
        {"name": "Domestic Animals", "description": "Interact with our friendly domestic animals including cows, goats, chickens, and more", "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247209/domestic-animals_wmsykl.jpg", "order": 2},
        {"name": "Farm-Fresh Food", "description": "Enjoy delicious meals made from fresh, locally sourced ingredients from our farm", "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247200/farm-fresh-food_tkrtak.jpg", "order": 3},
        {"name": "Nature Trails", "description": "Explore our beautiful surroundings through guided nature walks and trails", "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247202/nature-trails_qtkau3.jpg", "order": 4},
        {"name": "Activities", "description": "Participate in various farm activities, animal feeding, and educational programs", "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247205/activities_im4edt.jpg", "order": 5},
    ]
    for fac_data in facilities:
        s.add(Facility(**fac_data))
    s.commit()
    print(f"  ✅ Added {len(facilities)} facilities")


def migrate_pricing():
    """Migrate pricing categories and items"""
    print("Migrating pricing...")
    existing = s.query(PricingCategory).count()
    if existing > 0:
        print(f"  ⚠️  {existing} pricing categories already exist. Skipping.")
        return
    
    # Accommodation category
    acc_cat = PricingCategory(name="Accommodation (Bed & Breakfast)", description="Comfortable rooms with breakfast included", category_type="accommodation", order=0)
    s.add(acc_cat)
    s.flush()
    
    acc_items = [
        {"name": "A-Cabin", "price_label": "Couple", "price_value": "TZS 180,000", "order": 0},
        {"name": "A-Cabin", "price_label": "Single occupancy", "price_value": "TZS 150,000", "order": 1},
        {"name": "Cottage", "price_label": "Couple", "price_value": "TZS 180,000", "order": 2},
        {"name": "Cottage", "price_label": "Single occupancy", "price_value": "TZS 150,000", "order": 3},
        {"name": "Family", "price_label": "Couples", "price_value": "TZS 250,000", "featured": True, "order": 4},
        {"name": "Family", "price_label": "5 occupants", "price_value": "TZS 550,000", "featured": True, "order": 5},
        {"name": "Kikota", "price_label": "Per Night (BB)", "price_value": "TZS 400,000", "order": 6},
        {"name": "Tents", "price_label": "Single (BB)", "price_value": "TZS 50,000", "order": 7},
        {"name": "Tents", "price_label": "Double (BB)", "price_value": "TZS 80,000", "order": 8},
    ]
    for item_data in acc_items:
        item_data["category_id"] = acc_cat.id
        if "featured" not in item_data:
            item_data["featured"] = False
        s.add(PricingItem(**item_data))
    
    # Food category
    food_cat = PricingCategory(name="Food (Per Person)", description="Delicious meals to complement your stay", category_type="food", order=1)
    s.add(food_cat)
    s.flush()
    
    food_items = [
        {"name": "Half Board", "price_label": "1 Meal Included", "price_value": "TZS 30,000", "order": 0},
        {"name": "Full Board", "price_label": "2 Meals Included", "price_value": "TZS 50,000", "featured": True, "order": 1},
    ]
    for item_data in food_items:
        item_data["category_id"] = food_cat.id
        item_data["featured"] = item_data.get("featured", False)
        s.add(PricingItem(**item_data))
    
    # Activities category
    act_cat = PricingCategory(name="Activities (Per Person)", description="Exciting activities to enhance your farm experience", category_type="activity", order=2)
    s.add(act_cat)
    s.flush()
    
    act_items = [
        {"name": "Quad Bike", "price_label": "30 Minutes", "price_value": "TZS 30,000", "order": 0},
        {"name": "Sports Bike", "price_label": "1 Hour", "price_value": "TZS 20,000", "order": 1},
        {"name": "Bonfire", "price_label": "Evening Activity", "price_value": "Free", "order": 2},
        {"name": "Farm Tour", "price_label": "Guided Tour", "price_value": "Free", "order": 3},
    ]
    for item_data in act_items:
        item_data["category_id"] = act_cat.id
        item_data["featured"] = False
        s.add(PricingItem(**item_data))
    
    s.commit()
    print(f"  ✅ Added 3 pricing categories with items")


def migrate_food():
    """Migrate food items"""
    print("Migrating food items...")
    existing = s.query(FoodItem).count()
    if existing > 0:
        print(f"  ⚠️  {existing} food items already exist. Skipping.")
        return
    
    food_items = [
        {"name": "Half Board", "description": "1 Meal Included", "price": "TZS 30,000", "featured": False, "order": 0},
        {"name": "Full Board", "description": "2 Meals Included", "price": "TZS 50,000", "featured": True, "order": 1},
    ]
    for item_data in food_items:
        s.add(FoodItem(**item_data))
    s.commit()
    print(f"  ✅ Added {len(food_items)} food items")


def migrate_reviews():
    """Migrate reviews"""
    print("Migrating reviews...")
    existing = s.query(Review).count()
    if existing > 0:
        print(f"  ⚠️  {existing} reviews already exist. Skipping.")
        return
    
    reviews = [
        {"customer_name": None, "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247489/customer1_expjr7.jpg", "quote": None, "rating": 5, "order": 0},
        {"customer_name": None, "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247490/customer2_lanxjd.jpg", "quote": None, "rating": 5, "order": 1},
        {"customer_name": None, "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247495/customer3_yv86ii.jpg", "quote": None, "rating": 5, "order": 2},
        {"customer_name": None, "image_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769247493/customer4_u1p98k.jpg", "quote": None, "rating": 5, "order": 3},
    ]
    for review_data in reviews:
        s.add(Review(**review_data))
    s.commit()
    print(f"  ✅ Added {len(reviews)} reviews")


def migrate_restaurant_menu():
    """Migrate restaurant menu categories and items"""
    print("Migrating restaurant menu...")
    existing = s.query(RestaurantMenuCategory).count()
    if existing > 0:
        print(f"  ⚠️  {existing} menu categories already exist. Skipping.")
        return
    
    menu_data = [
        {
            "name": "Breakfast",
            "items": [
                ("Chicken soup", "TZS 10,000"), ("Beef soup", "TZS 10,000"), ("Fish soup", "TZS 15,000"),
                ("Eggs", "TZS 3,000"), ("Toasted bread", "TZS 2,000"), ("Mchemcho chicken", "TZS 13,000"),
                ("Mchemcho ng'ombe", "TZS 13,000"), ("Mchemcho samaki", "TZS 18,000"), ("Mtoli", "TZS 5,000"),
            ]
        },
        {
            "name": "Main Course",
            "items": [
                ("Chicken ¼", "TZS 10,000"), ("Beef ¼", "TZS 10,000"), ("Samaki", "TZS 15,000"),
                ("Sungura", "TZS 40,000"), ("Mbogamboga", "TZS 5,000"), ("Maharage", "TZS 5,000"),
                ("Chips", "TZS 3,000"), ("Ugali", "TZS 3,000"), ("Wali", "TZS 3,000"),
                ("Spaghetti", "TZS 4,000"), ("Macaron", "TZS 7,000"), ("Ndizi", "TZS 3,000"),
                ("Potato wedges", "TZS 3,000"), ("Chips zege", "TZS 5,000"),
            ]
        },
        {
            "name": "Burgers & Pizza",
            "items": [
                ("Beef burger", "TZS 17,000"), ("Chicken burger", "TZS 17,000"), ("Veggie burger", "TZS 15,000"),
                ("King beef burger", "TZS 22,000"), ("Beef pizza", "TZS 20,000"), ("Chicken pizza", "TZS 20,000"),
                ("Margherita pizza", "TZS 15,000"), ("Four season pizza", "TZS 30,000"),
            ]
        },
        {
            "name": "BBQ",
            "items": [
                ("Family platter", "TZS 140,000"), ("Friends platter", "TZS 100,000"), ("BBQ wings", "TZS 30,000"),
                ("Chicken Wings portion", "TZS 5,000"), ("Mishikaki", "TZS 3,000"),
            ]
        },
        {
            "name": "Salads and Juices",
            "items": [
                ("Fruit salad", "TZS 5,000"), ("Vegetable salad", "TZS 5,000"), ("Fruit smooth", "TZS 7,000"),
                ("Special salad", "TZS 5,000"), ("Coffee", "TZS 3,000"), ("Tea", "TZS 3,000"),
            ]
        },
        {
            "name": "Other Dishes",
            "items": [
                ("Chapati portion", "TZS 10,000"), ("Chapati maji", "TZS 5,000"), ("Vegetable crunch", "TZS 10,000"),
                ("Vegetable wrap", "TZS 5,000"), ("Chicken biriani", "TZS 20,000"), ("Vegetable rice", "TZS 5,000"),
                ("Samosa", "TZS 10,000"),
            ]
        },
        {
            "name": "Soft Drinks",
            "items": [
                ("Maji madogo", "TZS 1,000"), ("Soda", "TZS 2,000"), ("Bavaria", "TZS 6,000"),
                ("Grandmalta", "TZS 4,000"), ("Redbull", "TZS 5,000"), ("Basil seeds fruit juice", "TZS 6,000"),
                ("Ceres", "TZS 10,000"), ("Azam box", "TZS 7,000"),
            ]
        },
        {
            "name": "Vodka",
            "items": [
                ("Smirnoff vodka 750mls", "TZS 50,000"), ("Captain Morgan 750mls", "TZS 40,000"),
                ("Beefeater 750mls", "TZS 45,000"), ("Gordon 750mls", "TZS 60,000"),
                ("Absolute vodka 750mls", "TZS 45,000"), ("Zunchi 750mls", "TZS 30,000"),
                ("Camino 750mls", "TZS 60,000"),
            ]
        },
        {
            "name": "Liquor",
            "items": [
                ("Amarula 750mls", "TZS 50,000"), ("Amarula 350mls", "TZS 30,000"),
                ("Zanzi 750mls", "TZS 40,000"), ("Zanzi 250mls", "TZS 10,000"),
            ]
        },
        {
            "name": "Beer",
            "items": [
                ("Flying fish", "TZS 4,000"), ("Heineken", "TZS 6,000"), ("Savannah", "TZS 6,000"),
                ("Windock", "TZS 7,000"), ("Budweiser", "TZS 6,000"), ("Desperado", "TZS 6,000"),
                ("Reds chupa", "TZS 3,000"), ("Kilimanjaro lager", "TZS 3,000"), ("Kilimanjaro lite", "TZS 3,000"),
                ("Safari larger", "TZS 3,000"), ("Serengeti lite", "TZS 3,000"), ("Serengeti lemon", "TZS 3,000"),
                ("Serengeti larger", "TZS 3,000"), ("Castle lite", "TZS 3,000"), ("Castle larger", "TZS 4,000"),
            ]
        },
        {
            "name": "Gin",
            "items": [
                ("K-vant 750mls", "TZS 20,000"), ("K-vant 200mls", "TZS 7,000"),
                ("Konyagi 750mls", "TZS 20,000"), ("Konyagi 200mls", "TZS 7,000"),
                ("Value 750mls", "TZS 20,000"), ("Value 200mls", "TZS 7,000"),
            ]
        },
        {
            "name": "Wine",
            "items": [
                ("Kwv 750mls", "TZS 40,000"), ("Saint anna 750mls", "TZS 30,000"), ("Drostoff 750mls", "TZS 30,000"),
                ("Roberson 750mls", "TZS 30,000"), ("Dodoma 750mls", "TZS 30,000"), ("Dompo 750mls", "TZS 30,000"),
                ("Bone Esperance 750mls", "TZS 30,000"), ("Four couns 750mls", "TZS 30,000"), ("Image 250mls", "TZS 8,000"),
                ("Pearly bay 750mls", "TZS 30,000"), ("Twelve apostle 5ls", "TZS 100,000"),
            ]
        },
        {
            "name": "Whiskey",
            "items": [
                ("Grant 750mls", "TZS 50,000"), ("Grand 250mls", "TZS 25,000"), ("Gridifidich 750mls", "TZS 160,000"),
                ("Hanson choice 250mls", "TZS 8,000"), ("Hanson choice 750mls", "TZS 25,000"), ("Hennessy 750mls", "TZS 150,000"),
                ("Jack danies 750mls", "TZS 150,000"), ("Jager master 750mls", "TZS 70,000"), ("Jager master 200mls", "TZS 30,000"),
                ("Jameson 750mls", "TZS 90,000"), ("Red label 750mls", "TZS 80,000"), ("Black label 750mls", "TZS 150,000"),
                ("J&b 750mls", "TZS 90,000"),
            ]
        },
        {
            "name": "Other Drinks",
            "items": [
                ("Provetto 750mls", "TZS 40,000"), ("Freixenent 750mls", "TZS 70,000"), ("Grants 350mls", "TZS 30,000"),
                ("Roman off 750mls", "TZS 30,000"), ("Southen comfort 750mls", "TZS 60,000"), ("Aperol 750mls", "TZS 60,000"),
                ("Mohans 750mls", "TZS 30,000"), ("Saaga 750MLS", "TZS 30,000"), ("Sierra 750mls", "TZS 60,000"),
                ("Hennesy 500ml", "TZS 70,000"), ("Serengeti wine 750mls", "TZS 40,000"), ("Spiers 750mls", "TZS 50,000"),
                ("Demands 750mls", "TZS 40,000"), ("Class 21 vodka 750mls", "TZS 20,000"), ("Parrot bay 750mls", "TZS 45,000"),
                ("Huntng lodge 750mls", "TZS 40,000"), ("Kiprinsk 750mls", "TZS 40,000"), ("Absolute vodka 200mls", "TZS 30,000"),
            ]
        },
    ]
    
    for idx, cat_data in enumerate(menu_data):
        cat = RestaurantMenuCategory(name=cat_data["name"], order=idx)
        s.add(cat)
        s.flush()
        for item_idx, (name, price) in enumerate(cat_data["items"]):
            s.add(RestaurantMenuItem(category_id=cat.id, name=name, price=price, order=item_idx))
        s.commit()
    
    print(f"  ✅ Added {len(menu_data)} menu categories with items")


def migrate_videos():
    """Migrate videos from our-kalongo.html"""
    print("Migrating videos...")
    existing = s.query(Video).count()
    if existing > 0:
        print(f"  ⚠️  {existing} videos already exist. Skipping.")
        return
    
    videos = [
        {"url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769248628/kalongo-video1_bcmr2y.mp4", "caption": "Kalongo Farm Experience", "section": "our-kalongo", "order": 0},
        {"url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769250514/kalongo-video2_sg6y1a.mp4", "caption": "Poultry", "section": "our-kalongo", "order": 1},
        {"url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769251250/kalongo-video3_narnrr.mp4", "caption": "Natural Surroundings", "section": "our-kalongo", "order": 2},
        {"url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769252256/kalongo-video4_gn8xce.mp4", "caption": "Farm Life", "section": "our-kalongo", "order": 3},
        {"url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769252596/kalongo-video5_aym8e8.mp4", "caption": "Personal Experience & Admiration", "section": "our-kalongo", "order": 4},
        {"url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769252820/kalongo-video6_exghpp.mp4", "caption": "Food and Nature", "section": "our-kalongo", "order": 5},
    ]
    for v_data in videos:
        s.add(Video(**v_data))
    s.commit()
    print(f"  ✅ Added {len(videos)} videos")


def migrate_site_settings():
    """Update site settings with logo URL, phone, email, etc."""
    print("Updating site settings...")
    settings_to_update = {
        "logo_url": "https://res.cloudinary.com/dae3rpnmg/image/upload/v1769261545/logo_xgfgcj.jpg",
        "phone": "+255 714 706 101",
        "whatsapp": "+255 653 626 410",
        "email": "info@kalongogroup.co.tz",
        "address": "ibulla village, Kiwira, Tukuyu -Mbeya, Tanzania",
        "about_text": "KALONGO FARM is an ecosystem farm lodge located in KIWIRA TUKUYU, Mbeya Region, Tanzania, combining sustainable agriculture with hospitality services. Founded on agro-ecology and environmental conservation principles, the facility offers accommodation in A-Cabins, Cottages, and Kikota structures, providing guests with farm-to-table dining experiences and immersive agricultural activities.",
    }
    
    for key, value in settings_to_update.items():
        setting = s.query(SiteSettings).filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            s.add(SiteSettings(key=key, value=value))
    s.commit()
    print(f"  ✅ Updated {len(settings_to_update)} site settings")


if __name__ == "__main__":
    print("=" * 60)
    print("Migrating Frontend Data to Database")
    print("=" * 60)
    try:
        migrate_hero_slides()
        migrate_room_images()
        migrate_facilities()
        migrate_pricing()
        migrate_food()
        migrate_reviews()
        migrate_restaurant_menu()
        migrate_videos()
        migrate_site_settings()
        print("\n" + "=" * 60)
        print("✅ Migration complete!")
        print("=" * 60)
    except Exception as e:
        s.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        s.close()
