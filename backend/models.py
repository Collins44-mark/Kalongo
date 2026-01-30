"""
Database models for Kalongo Farm
"""
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base


class Admin(UserMixin, Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=True)

    # Common keys: phone, email, address, instagram, facebook, logo_url, about_text


class HeroSlide(Base):
    __tablename__ = "hero_slides"

    id = Column(Integer, primary_key=True, autoincrement=True)
    image_url = Column(String(500), nullable=False)
    title = Column(String(200), nullable=True)
    subtitle = Column(String(300), nullable=True)
    order = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)  # A-Cabin, Cottage, Kikota, Family House
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    capacity = Column(String(100), nullable=True)
    features = Column(JSON, nullable=True)  # ["Comfortable beds", "Private bathroom", ...]
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = relationship("RoomImage", back_populates="room", cascade="all, delete-orphan", order_by="RoomImage.order")


class RoomImage(Base):
    __tablename__ = "room_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(200), nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="images")


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PricingCategory(Base):
    """e.g. Accommodation (BB), Food (Per Person), Activities"""
    __tablename__ = "pricing_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category_type = Column(String(50), nullable=True)  # accommodation, food, activity
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("PricingItem", back_populates="category", cascade="all, delete-orphan", order_by="PricingItem.order")


class PricingItem(Base):
    """e.g. Cabin - Per Night (BB) - TZS 180,000"""
    __tablename__ = "pricing_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("pricing_categories.id"), nullable=False)
    name = Column(String(150), nullable=False)  # Cabin, Cottage, Half Board
    price_label = Column(String(100), nullable=True)  # Per Night (BB), 2 People (BB)
    price_value = Column(String(100), nullable=False)  # TZS 180,000
    description = Column(Text, nullable=True)
    featured = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("PricingCategory", back_populates="items")


class FoodItem(Base):
    """Food menu items - Half Board, Full Board, etc."""
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(String(100), nullable=False)
    featured = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String(500), nullable=False)
    caption = Column(String(300), nullable=True)
    section = Column(String(100), nullable=True)  # gallery, homepage, our-kalongo
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_name = Column(String(150), nullable=True)
    image_url = Column(String(500), nullable=True)
    quote = Column(Text, nullable=True)
    rating = Column(Integer, default=5)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RestaurantMenuCategory(Base):
    """Restaurant menu categories: Breakfast, Main Course, Burgers & Pizza, etc."""
    __tablename__ = "restaurant_menu_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("RestaurantMenuItem", back_populates="category", cascade="all, delete-orphan", order_by="RestaurantMenuItem.order")


class RestaurantMenuItem(Base):
    """Individual menu items: Chicken soup, Beef burger, etc."""
    __tablename__ = "restaurant_menu_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("restaurant_menu_categories.id"), nullable=False)
    name = Column(String(150), nullable=False)
    price = Column(String(100), nullable=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("RestaurantMenuCategory", back_populates="items")


class GalleryImage(Base):
    """Gallery images for 'our kalongo' section"""
    __tablename__ = "gallery_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(300), nullable=True)
    section = Column(String(100), nullable=True)  # our-kalongo, gallery, etc.
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
