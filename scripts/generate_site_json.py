#!/usr/bin/env python3
"""Build frontend/data/site.json from the existing seed/migration content."""
import json
from pathlib import Path

CLOUD = "https://res.cloudinary.com/dae3rpnmg/image/upload"

MENU = [
    ("Breakfast", [("Chicken soup", "TZS 10,000"), ("Beef soup", "TZS 10,000"), ("Fish soup", "TZS 15,000"),
        ("Eggs", "TZS 3,000"), ("Toasted bread", "TZS 2,000"), ("Mchemcho chicken", "TZS 13,000"),
        ("Mchemcho ng'ombe", "TZS 13,000"), ("Mchemcho samaki", "TZS 18,000"), ("Mtoli", "TZS 5,000")]),
    ("Main Course", [("Chicken ¼", "TZS 10,000"), ("Beef ¼", "TZS 10,000"), ("Samaki", "TZS 15,000"),
        ("Sungura", "TZS 40,000"), ("Mbogamboga", "TZS 5,000"), ("Maharage", "TZS 5,000"),
        ("Chips", "TZS 3,000"), ("Ugali", "TZS 3,000"), ("Wali", "TZS 3,000"),
        ("Spaghetti", "TZS 4,000"), ("Macaron", "TZS 7,000"), ("Ndizi", "TZS 3,000"),
        ("Potato wedges", "TZS 3,000"), ("Chips zege", "TZS 5,000")]),
    ("Burgers & Pizza", [("Beef burger", "TZS 17,000"), ("Chicken burger", "TZS 17,000"), ("Veggie burger", "TZS 15,000"),
        ("King beef burger", "TZS 22,000"), ("Beef pizza", "TZS 20,000"), ("Chicken pizza", "TZS 20,000"),
        ("Margherita pizza", "TZS 15,000"), ("Four season pizza", "TZS 30,000")]),
    ("BBQ", [("Family platter", "TZS 140,000"), ("Friends platter", "TZS 100,000"), ("BBQ wings", "TZS 30,000"),
        ("Chicken Wings portion", "TZS 5,000"), ("Mishikaki", "TZS 3,000")]),
    ("Salads and Juices", [("Fruit salad", "TZS 5,000"), ("Vegetable salad", "TZS 5,000"), ("Fruit smooth", "TZS 7,000"),
        ("Special salad", "TZS 5,000"), ("Coffee", "TZS 3,000"), ("Tea", "TZS 3,000")]),
    ("Other Dishes", [("Chapati portion", "TZS 10,000"), ("Chapati maji", "TZS 5,000"), ("Vegetable crunch", "TZS 10,000"),
        ("Vegetable wrap", "TZS 5,000"), ("Chicken biriani", "TZS 20,000"), ("Vegetable rice", "TZS 5,000"),
        ("Samosa", "TZS 10,000")]),
    ("Soft Drinks", [("Maji madogo", "TZS 1,000"), ("Soda", "TZS 2,000"), ("Bavaria", "TZS 6,000"),
        ("Grandmalta", "TZS 4,000"), ("Redbull", "TZS 5,000"), ("Basil seeds fruit juice", "TZS 6,000"),
        ("Ceres", "TZS 10,000"), ("Azam box", "TZS 7,000")]),
    ("Vodka", [("Smirnoff vodka 750mls", "TZS 50,000"), ("Captain Morgan 750mls", "TZS 40,000"),
        ("Beefeater 750mls", "TZS 45,000"), ("Gordon 750mls", "TZS 60,000"),
        ("Absolute vodka 750mls", "TZS 45,000"), ("Zunchi 750mls", "TZS 30,000"),
        ("Camino 750mls", "TZS 60,000")]),
    ("Liquor", [("Amarula 750mls", "TZS 50,000"), ("Amarula 350mls", "TZS 30,000"),
        ("Zanzi 750mls", "TZS 40,000"), ("Zanzi 250mls", "TZS 10,000")]),
    ("Beer", [("Flying fish", "TZS 4,000"), ("Heineken", "TZS 6,000"), ("Savannah", "TZS 6,000"),
        ("Windock", "TZS 7,000"), ("Budweiser", "TZS 6,000"), ("Desperado", "TZS 6,000"),
        ("Reds chupa", "TZS 3,000"), ("Kilimanjaro lager", "TZS 3,000"), ("Kilimanjaro lite", "TZS 3,000"),
        ("Safari larger", "TZS 3,000"), ("Serengeti lite", "TZS 3,000"), ("Serengeti lemon", "TZS 3,000"),
        ("Serengeti larger", "TZS 3,000"), ("Castle lite", "TZS 3,000"), ("Castle larger", "TZS 4,000")]),
    ("Gin", [("K-vant 750mls", "TZS 20,000"), ("K-vant 200mls", "TZS 7,000"),
        ("Konyagi 750mls", "TZS 20,000"), ("Konyagi 200mls", "TZS 7,000"),
        ("Value 750mls", "TZS 20,000"), ("Value 200mls", "TZS 7,000")]),
    ("Wine", [("Kwv 750mls", "TZS 40,000"), ("Saint anna 750mls", "TZS 30,000"), ("Drostoff 750mls", "TZS 30,000"),
        ("Roberson 750mls", "TZS 30,000"), ("Dodoma 750mls", "TZS 30,000"), ("Dompo 750mls", "TZS 30,000"),
        ("Bone Esperance 750mls", "TZS 30,000"), ("Four couns 750mls", "TZS 30,000"), ("Image 250mls", "TZS 8,000"),
        ("Pearly bay 750mls", "TZS 30,000"), ("Twelve apostle 5ls", "TZS 100,000")]),
    ("Whiskey", [("Grant 750mls", "TZS 50,000"), ("Grand 250mls", "TZS 25,000"), ("Gridifidich 750mls", "TZS 160,000"),
        ("Hanson choice 250mls", "TZS 8,000"), ("Hanson choice 750mls", "TZS 25,000"), ("Hennessy 750mls", "TZS 150,000"),
        ("Jack danies 750mls", "TZS 150,000"), ("Jager master 750mls", "TZS 70,000"), ("Jager master 200mls", "TZS 30,000"),
        ("Jameson 750mls", "TZS 90,000"), ("Red label 750mls", "TZS 80,000"), ("Black label 750mls", "TZS 150,000"),
        ("J&b 750mls", "TZS 90,000")]),
    ("Other Drinks", [("Provetto 750mls", "TZS 40,000"), ("Freixenent 750mls", "TZS 70,000"), ("Grants 350mls", "TZS 30,000"),
        ("Roman off 750mls", "TZS 30,000"), ("Southen comfort 750mls", "TZS 60,000"), ("Aperol 750mls", "TZS 60,000"),
        ("Mohans 750mls", "TZS 30,000"), ("Saaga 750MLS", "TZS 30,000"), ("Sierra 750mls", "TZS 60,000"),
        ("Hennesy 500ml", "TZS 70,000"), ("Serengeti wine 750mls", "TZS 40,000"), ("Spiers 750mls", "TZS 50,000"),
        ("Demands 750mls", "TZS 40,000"), ("Class 21 vodka 750mls", "TZS 20,000"), ("Parrot bay 750mls", "TZS 45,000"),
        ("Huntng lodge 750mls", "TZS 40,000"), ("Kiprinsk 750mls", "TZS 40,000"), ("Absolute vodka 200mls", "TZS 30,000")]),
]

MENU_META = {
    "Breakfast": ("Fresh farm breakfast selections", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg", "breakfast"),
    "Main Course": ("Hearty local and international meals", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg", "main"),
    "Burgers & Pizza": ("Crispy, cheesy and delicious", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247205/activities_im4edt.jpg", "burger"),
    "BBQ": ("Smoked and grilled favorites", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247205/activities_im4edt.jpg", "bbq"),
    "Salads and Juices": ("Fresh organic healthy choices", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247200/farm-fresh-food_tkrtak.jpg", "salad"),
    "Other Dishes": ("Tasty side dishes and specials", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247541/cottage-inside1_b6zcxz.jpg", "other-dish"),
    "Soft Drinks": ("Refreshing chilled beverages", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247489/customer1_expjr7.jpg", "soft-drink"),
    "Vodka": ("Premium vodka collection", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247595/kalongo-surroundings1_iha0us.jpg", "vodka"),
    "Liquor": ("Smooth premium liquor", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247597/kalongo-surroundings2_k0rfgu.jpg", "liquor"),
    "Beer": ("Local and imported beers", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247489/customer1_expjr7.jpg", "beer"),
    "Gin": ("Classic gin selections", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247598/kalongo-surroundings3_urxadi.jpg", "gin"),
    "Wine": ("Fine wine collection", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247395/our-kalongo-hero-background_sedoxy.jpg", "wine"),
    "Whiskey": ("Premium whiskey collection", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247595/kalongo-surroundings1_iha0us.jpg", "whiskey"),
    "Other Drinks": ("Special drinks and collections", f"{CLOUD}/c_fill,w_900,h_600,q_auto/v1769247283/booking-hero-background_idfar7.jpg", "other-drink"),
}

nid = {"n": 1}

def next_id():
    i = nid["n"]
    nid["n"] += 1
    return i


def main():
    rooms = [
        {
            "id": next_id(), "name": "A-Cabin", "slug": "a-cabin",
            "description": "Cozy cabin for 2-3 people.",
            "capacity": "2 Adults or Small Family",
            "features": ["Comfortable beds", "Private bathroom", "Farm view", "Air conditioning", "Sitting area"],
            "order": 0,
            "images": [
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247539/a-cabin_fpmuuz.jpg", "caption": "A-Cabin", "order": 0},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247537/a-cabin-inside1_bigacm.jpg", "caption": "", "order": 1},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247538/a-cabin-inside2_vl8uoz.jpg", "caption": "", "order": 2},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247535/a-cabin-bathroom_gb17ya.jpg", "caption": "", "order": 3},
            ],
        },
        {
            "id": next_id(), "name": "Cottage", "slug": "cottage",
            "description": "Family cottage for 4-6 people.",
            "capacity": "Family (4-6 people)",
            "features": ["Multiple bedrooms", "Living area", "Kitchenette", "Private veranda"],
            "order": 1,
            "images": [
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247546/cottage_fzxdif.jpg", "caption": "Cottage", "order": 0},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247541/cottage-inside1_b6zcxz.jpg", "caption": "", "order": 1},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247543/cottage-inside2_gykjie.jpg", "caption": "", "order": 2},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247540/cottage-bathroom_d75jxs.jpg", "caption": "", "order": 3},
            ],
        },
        {
            "id": next_id(), "name": "Kikota", "slug": "kikota",
            "description": "Traditional Kikota design for 2-4 adults.",
            "capacity": "2-4 Adults",
            "features": ["Unique design", "Garden access", "Modern amenities"],
            "order": 2,
            "images": [
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247549/kikota_zwpblm.jpg", "caption": "Kikota", "order": 0},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247547/kikota-inside1_utwfgn.jpg", "caption": "", "order": 1},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247548/kikota-inside2_irf1i3.jpg", "caption": "", "order": 2},
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247545/kikota-bathroom_oclgvo.jpg", "caption": "", "order": 3},
            ],
        },
        {
            "id": next_id(), "name": "Family House", "slug": "family-house",
            "description": "Spacious family house for longer stays.",
            "capacity": "Family (6-8 people)",
            "features": ["Multiple bedrooms", "Living area", "Kitchen", "Private veranda", "Full amenities"],
            "order": 3,
            "images": [
                {"id": next_id(), "image_url": f"{CLOUD}/v1769247541/cottage-inside1_b6zcxz.jpg", "caption": "Family House", "order": 0},
            ],
        },
    ]

    acc_id = next_id()
    food_cat_id = next_id()
    act_cat_id = next_id()
    pricing = [
        {
            "id": acc_id, "name": "Accommodation (Bed & Breakfast)",
            "description": "Comfortable rooms with breakfast included",
            "category_type": "accommodation", "order": 0,
            "items": [
                {"id": next_id(), "name": "A-Cabin", "price_label": "Couple", "price_value": "TZS 180,000", "description": "", "featured": False, "order": 0},
                {"id": next_id(), "name": "A-Cabin", "price_label": "Single occupancy", "price_value": "TZS 150,000", "description": "", "featured": False, "order": 1},
                {"id": next_id(), "name": "Cottage", "price_label": "Couple", "price_value": "TZS 180,000", "description": "", "featured": False, "order": 2},
                {"id": next_id(), "name": "Cottage", "price_label": "Single occupancy", "price_value": "TZS 150,000", "description": "", "featured": False, "order": 3},
                {"id": next_id(), "name": "Family", "price_label": "Couples", "price_value": "TZS 250,000", "description": "", "featured": True, "order": 4},
                {"id": next_id(), "name": "Family", "price_label": "5 occupants", "price_value": "TZS 550,000", "description": "", "featured": True, "order": 5},
                {"id": next_id(), "name": "Kikota", "price_label": "Per Night (BB)", "price_value": "TZS 400,000", "description": "", "featured": False, "order": 6},
                {"id": next_id(), "name": "Tents", "price_label": "Single (BB)", "price_value": "TZS 50,000", "description": "", "featured": False, "order": 7},
                {"id": next_id(), "name": "Tents", "price_label": "Double (BB)", "price_value": "TZS 80,000", "description": "", "featured": False, "order": 8},
            ],
        },
        {
            "id": food_cat_id, "name": "Food (Per Person)",
            "description": "Delicious meals to complement your stay",
            "category_type": "food", "order": 1,
            "items": [
                {"id": next_id(), "name": "Half Board", "price_label": "1 Meal Included", "price_value": "TZS 30,000", "description": "", "featured": False, "order": 0},
                {"id": next_id(), "name": "Full Board", "price_label": "2 Meals Included", "price_value": "TZS 50,000", "description": "", "featured": True, "order": 1},
            ],
        },
        {
            "id": act_cat_id, "name": "Activities (Per Person)",
            "description": "Exciting activities to enhance your farm experience",
            "category_type": "activity", "order": 2,
            "items": [
                {"id": next_id(), "name": "Quad Bike", "price_label": "30 Minutes", "price_value": "TZS 30,000", "description": "", "featured": False, "order": 0},
                {"id": next_id(), "name": "Sports Bike", "price_label": "1 Hour", "price_value": "TZS 20,000", "description": "", "featured": False, "order": 1},
                {"id": next_id(), "name": "Bonfire", "price_label": "Evening Activity", "price_value": "Free", "description": "", "featured": False, "order": 2},
                {"id": next_id(), "name": "Farm Tour", "price_label": "Guided Tour", "price_value": "Free", "description": "", "featured": False, "order": 3},
            ],
        },
    ]

    restaurant_menu = []
    for idx, (name, items) in enumerate(MENU):
        sub, img, icon = MENU_META[name]
        cat_id = next_id()
        restaurant_menu.append({
            "id": cat_id, "name": name, "subtitle": sub, "image_url": img, "icon_key": icon, "order": idx,
            "items": [{"id": next_id(), "name": n, "price": p, "order": i} for i, (n, p) in enumerate(items)],
        })

    data = {
        "hero_slides": [
            {"id": next_id(), "image_url": f"{CLOUD}/v1769247285/hero-background_xprz3b.jpg", "title": "Welcome to KALONGO FARM", "subtitle": "Experience the Perfect Blend of Nature, Comfort & Farm Life", "order": 0, "active": True},
            {"id": next_id(), "image_url": f"{CLOUD}/v1769247284/hero-slide2_f67kon.jpg", "title": "", "subtitle": "", "order": 1, "active": True},
            {"id": next_id(), "image_url": f"{CLOUD}/v1769247293/hero-slide3_photno.jpg", "title": "", "subtitle": "", "order": 2, "active": True},
            {"id": next_id(), "image_url": f"{CLOUD}/v1769247286/hero-slide4_e7hiiy.jpg", "title": "", "subtitle": "", "order": 3, "active": True},
        ],
        "rooms": rooms,
        "facilities": [
            {"id": next_id(), "name": "Swimming Pool", "description": "Relax and cool off in our refreshing swimming pool", "image_url": f"{CLOUD}/v1769247203/swimming-pool_hk8isg.jpg", "order": 0},
            {"id": next_id(), "name": "Natural Farm", "description": "Experience authentic farm life with our natural farming practices and organic produce", "image_url": f"{CLOUD}/v1769247201/natural-farm_difqzg.jpg", "order": 1},
            {"id": next_id(), "name": "Domestic Animals", "description": "Interact with our friendly domestic animals including cows, goats, chickens, and more", "image_url": f"{CLOUD}/v1769247209/domestic-animals_wmsykl.jpg", "order": 2},
            {"id": next_id(), "name": "Farm-Fresh Food", "description": "Enjoy delicious meals made from fresh, locally sourced ingredients from our farm", "image_url": f"{CLOUD}/v1769247200/farm-fresh-food_tkrtak.jpg", "order": 3},
            {"id": next_id(), "name": "Nature Trails", "description": "Explore our beautiful surroundings through guided nature walks and trails", "image_url": f"{CLOUD}/v1769247202/nature-trails_qtkau3.jpg", "order": 4},
            {"id": next_id(), "name": "Activities", "description": "Participate in various farm activities, animal feeding, and educational programs", "image_url": f"{CLOUD}/v1769247205/activities_im4edt.jpg", "order": 5},
        ],
        "activities": [
            {"id": next_id(), "name": "Farm Tours", "description": "Guided farm experience through Kalongo’s fields and livestock.", "image_url": f"{CLOUD}/v1769247201/natural-farm_difqzg.jpg", "order": 0},
            {"id": next_id(), "name": "Planting", "description": "Hands-on planting and farm activities.", "image_url": f"{CLOUD}/v1769247205/activities_im4edt.jpg", "order": 1},
            {"id": next_id(), "name": "Nature Walks", "description": "Scenic trails around the farm and surrounding hills.", "image_url": f"{CLOUD}/v1769247202/nature-trails_qtkau3.jpg", "order": 2},
            {"id": next_id(), "name": "Campfire", "description": "Evening under the stars with a farm campfire.", "image_url": f"{CLOUD}/v1769247395/our-kalongo-hero-background_sedoxy.jpg", "order": 3},
        ],
        "pricing": pricing,
        "food": [
            {"id": next_id(), "name": "Half Board", "description": "1 Meal Included", "price": "TZS 30,000", "featured": False, "order": 0},
            {"id": next_id(), "name": "Full Board", "description": "2 Meals Included", "price": "TZS 50,000", "featured": True, "order": 1},
        ],
        "restaurant_menu": restaurant_menu,
        "videos": [
            {"id": next_id(), "url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769248628/kalongo-video1_bcmr2y.mp4", "caption": "Kalongo Farm Experience", "section": "our-kalongo", "order": 0},
            {"id": next_id(), "url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769250514/kalongo-video2_sg6y1a.mp4", "caption": "Poultry", "section": "our-kalongo", "order": 1},
            {"id": next_id(), "url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769251250/kalongo-video3_narnrr.mp4", "caption": "Natural Surroundings", "section": "our-kalongo", "order": 2},
            {"id": next_id(), "url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769252256/kalongo-video4_gn8xce.mp4", "caption": "Farm Life", "section": "our-kalongo", "order": 3},
            {"id": next_id(), "url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769252596/kalongo-video5_aym8e8.mp4", "caption": "Personal Experience & Admiration", "section": "our-kalongo", "order": 4},
            {"id": next_id(), "url": "https://res.cloudinary.com/dae3rpnmg/video/upload/v1769252820/kalongo-video6_exghpp.mp4", "caption": "Food and Nature", "section": "our-kalongo", "order": 5},
        ],
        "gallery_images": [
            {"id": next_id(), "image_url": f"{CLOUD}/v1769247595/kalongo-surroundings1_iha0us.jpg", "caption": "Kalongo surroundings", "section": "our-kalongo", "order": 0},
            {"id": next_id(), "image_url": f"{CLOUD}/v1769247597/kalongo-surroundings2_k0rfgu.jpg", "caption": "Farm landscape", "section": "our-kalongo", "order": 1},
            {"id": next_id(), "image_url": f"{CLOUD}/v1769247598/kalongo-surroundings3_urxadi.jpg", "caption": "Nature around Kalongo", "section": "our-kalongo", "order": 2},
        ],
        "reviews": [
            {"id": next_id(), "customer_name": "", "image_url": f"{CLOUD}/v1769247489/customer1_expjr7.jpg", "quote": "", "rating": 5, "order": 0},
            {"id": next_id(), "customer_name": "", "image_url": f"{CLOUD}/v1769247490/customer2_lanxjd.jpg", "quote": "", "rating": 5, "order": 1},
            {"id": next_id(), "customer_name": "", "image_url": f"{CLOUD}/v1769247495/customer3_yv86ii.jpg", "quote": "", "rating": 5, "order": 2},
            {"id": next_id(), "customer_name": "", "image_url": f"{CLOUD}/v1769247493/customer4_u1p98k.jpg", "quote": "", "rating": 5, "order": 3},
        ],
        "settings": {
            "phone": "+255 798 924 280",
            "whatsapp": "+255 653 626 410",
            "email": "info@kalongogroup.co.tz",
            "address": "ibulla village, Kiwira, Tukuyu -Mbeya, Tanzania",
            "instagram": "https://instagram.com/kalongofarm",
            "facebook": "https://facebook.com/kalongofarm",
            "logo_url": f"{CLOUD}/v1769261545/logo_xgfgcj.jpg",
            "about_text": "KALONGO FARM is an ecosystem farm lodge located in KIWIRA TUKUYU, Mbeya Region, Tanzania, combining sustainable agriculture with hospitality services. Founded on agro-ecology and environmental conservation principles, the facility offers accommodation in A-Cabins, Cottages, and Kikota structures, providing guests with farm-to-table dining experiences and immersive agricultural activities.",
            "show_prices": "false",
            "map_coordinates": "-9.1379842,33.5286078",
            "hero_services": "",
            "hero_booking": "",
            "hero_activities": "",
            "hero_kalongo": "",
            "hero_pricing": "",
        },
    }

    out = Path(__file__).resolve().parents[1] / "frontend" / "data" / "site.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
