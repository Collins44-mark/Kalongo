"""
Admin panel routes - Dashboard, CRUD for images, videos, activities, pricing, food, settings
"""
import os
from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from database import engine, SessionLocal
from sqlalchemy import text
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
)
from utils.cloudinary_upload import upload_image, upload_video

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO = {"video/mp4", "video/webm", "video/quicktime"}

admin_bp = Blueprint("admin", __name__, url_prefix="/admin", template_folder="../templates")


def get_session():
    """Get database session - optimized for fast queries"""
    return SessionLocal()


# Simple in-memory cache for settings (cleared on update)
_settings_cache = {}
_settings_cache_time = 0
CACHE_TTL = 300  # 5 minutes

def get_setting(key, default=""):
    global _settings_cache, _settings_cache_time
    import time
    current_time = time.time()
    
    # Use cache if valid
    if current_time - _settings_cache_time < CACHE_TTL and key in _settings_cache:
        return _settings_cache[key]
    
    s = get_session()
    try:
        r = s.query(SiteSettings).filter_by(key=key).first()
        value = r.value if r else default
        _settings_cache[key] = value
        _settings_cache_time = current_time
        return value
    finally:
        s.close()

def clear_settings_cache():
    global _settings_cache, _settings_cache_time
    _settings_cache = {}
    _settings_cache_time = 0


# ---------- Auth ----------


@admin_bp.route("/login", methods=["GET", "POST"])
def login():
    """Login route - prevent redirect loops"""
    # Check if already authenticated
    if current_user.is_authenticated:
        next_page = request.args.get('next')
        if next_page:
            return redirect(next_page)
        return redirect(url_for("admin.dashboard"))
    
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if not username or not password:
            flash("Username and password required.", "error")
            return render_template("admin/login.html")
        
        s = get_session()
        try:
            admin = s.query(Admin).filter_by(username=username).first()
            if admin and admin.check_password(password):
                login_user(admin, remember=True)
                flash("Welcome back!", "success")
                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                return redirect(url_for("admin.dashboard"))
            flash("Invalid username or password.", "error")
        except Exception as e:
            flash(f"Login error: {str(e)}", "error")
        finally:
            s.close()
    
    return render_template("admin/login.html")


@admin_bp.route("/logout")
def logout():
    """Logout route - accessible without login_required to prevent loops"""
    try:
        if current_user.is_authenticated:
            logout_user()
            flash("You have been logged out.", "info")
    except Exception:
        pass  # Ignore errors during logout
    return redirect(url_for("admin.login"))


@admin_bp.route("/")
@admin_bp.route("/dashboard")
@login_required
def dashboard():
    """Dashboard - requires authentication - optimized with parallel counts"""
    s = get_session()
    try:
        # Optimized: use func.count() which is faster than loading all records
        from sqlalchemy import func
        counts = {
            "hero": s.query(func.count(HeroSlide.id)).scalar() or 0,
            "rooms": s.query(func.count(Room.id)).scalar() or 0,
            "facilities": s.query(func.count(Facility.id)).scalar() or 0,
            "activities": s.query(func.count(Activity.id)).scalar() or 0,
            "pricing_cats": s.query(func.count(PricingCategory.id)).scalar() or 0,
            "food": s.query(func.count(FoodItem.id)).scalar() or 0,
            "restaurant_menu": s.query(func.count(RestaurantMenuCategory.id)).scalar() or 0,
            "videos": s.query(func.count(Video.id)).scalar() or 0,
            "reviews": s.query(func.count(Review.id)).scalar() or 0,
        }
        return render_template("admin/dashboard.html", counts=counts)
    except Exception as e:
        flash(f"Error loading dashboard: {str(e)}", "error")
        logout_user()  # Clear invalid session
        return redirect(url_for("admin.login"))
    finally:
        s.close()


# ---------- Hero Slides ----------


@admin_bp.route("/hero", methods=["GET", "POST"])
@login_required
def hero_list():
    s = get_session()
    try:
        if request.method == "POST":
            title = request.form.get("title", "").strip()
            subtitle = request.form.get("subtitle", "").strip()
            order = int(request.form.get("order") or 0)
            f = request.files.get("image")
            url = request.form.get("image_url", "").strip()
            if f and f.filename:
                ext = os.path.splitext(secure_filename(f.filename))[1].lower()
                if f.content_type in ALLOWED_IMAGE:
                    url = upload_image(f, folder="kalongo/hero")
                else:
                    flash("Invalid image type.", "error")
                    return redirect(url_for("admin.hero_list"))
            if not url:
                flash("Image or URL required.", "error")
                return redirect(url_for("admin.hero_list"))
            slide = HeroSlide(image_url=url, title=title or None, subtitle=subtitle or None, order=order)
            s.add(slide)
            s.commit()
            flash("Hero slide added.", "success")
            return redirect(url_for("admin.hero_list"))
        # Pagination - optimized with single count query
        page = request.args.get('page', 1, type=int)
        per_page = 20
        # Use subquery for faster count
        from sqlalchemy import func
        total = s.query(func.count(HeroSlide.id)).scalar() or 0
        items = s.query(HeroSlide).order_by(HeroSlide.order, HeroSlide.id).offset((page - 1) * per_page).limit(per_page).all()
        pages = (total + per_page - 1) // per_page if total > 0 else 1
        pagination = {
            'page': page,
            'pages': pages,
            'per_page': per_page,
            'total': total,
            'has_prev': page > 1,
            'has_next': page < pages,
            'prev_num': page - 1 if page > 1 else None,
            'next_num': page + 1 if page < pages else None,
            'items': items
        }
        return render_template("admin/hero.html", slides=items, pagination=pagination)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.hero_list"))
    finally:
        s.close()


@admin_bp.route("/hero/<int:pk>/delete", methods=["POST"])
@login_required
def hero_delete(pk):
    s = get_session()
    try:
        slide = s.query(HeroSlide).get(pk)
        if slide:
            s.delete(slide)
            s.commit()
            flash("Slide removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.hero_list"))


# ---------- Facilities ----------


@admin_bp.route("/facilities", methods=["GET", "POST"])
@login_required
def facilities_list():
    s = get_session()
    try:
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            desc = request.form.get("description", "").strip()
            order = int(request.form.get("order") or 0)
            url = request.form.get("image_url", "").strip()
            f = request.files.get("image")
            if f and f.filename and f.content_type in ALLOWED_IMAGE:
                url = upload_image(f, folder="kalongo/facilities")
            if not name:
                flash("Name required.", "error")
                return redirect(url_for("admin.facilities_list"))
            fac = Facility(name=name, description=desc or None, image_url=url or None, order=order)
            s.add(fac)
            s.commit()
            flash("Facility added.", "success")
            return redirect(url_for("admin.facilities_list"))
        # Pagination - optimized
        page = request.args.get('page', 1, type=int)
        per_page = 30
        from sqlalchemy import func
        total = s.query(func.count(Facility.id)).scalar() or 0
        items = s.query(Facility).order_by(Facility.order, Facility.id).offset((page - 1) * per_page).limit(per_page).all()
        pages = (total + per_page - 1) // per_page if total > 0 else 1
        pagination = {
            'page': page,
            'pages': pages,
            'per_page': per_page,
            'total': total,
            'has_prev': page > 1,
            'has_next': page < pages,
            'prev_num': page - 1 if page > 1 else None,
            'next_num': page + 1 if page < pages else None,
            'items': items
        }
        return render_template("admin/facilities.html", items=items, pagination=pagination)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.facilities_list"))
    finally:
        s.close()


@admin_bp.route("/facilities/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def facility_edit(pk):
    s = get_session()
    try:
        fac = s.query(Facility).get(pk)
        if not fac:
            flash("Facility not found.", "error")
            return redirect(url_for("admin.facilities_list"))
        if request.method == "POST":
            fac.name = request.form.get("name", "").strip() or fac.name
            fac.description = request.form.get("description", "").strip() or None
            fac.order = int(request.form.get("order") or 0)
            url = request.form.get("image_url", "").strip()
            f = request.files.get("image")
            if f and f.filename and f.content_type in ALLOWED_IMAGE:
                url = upload_image(f, folder="kalongo/facilities")
            if url:
                fac.image_url = url
            s.commit()
            flash("Facility updated.", "success")
            return redirect(url_for("admin.facilities_list"))
        return render_template("admin/facility_edit.html", item=fac)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.facilities_list"))
    finally:
        s.close()


@admin_bp.route("/facilities/<int:pk>/delete", methods=["POST"])
@login_required
def facility_delete(pk):
    s = get_session()
    try:
        fac = s.query(Facility).get(pk)
        if fac:
            s.delete(fac)
            s.commit()
            flash("Facility removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.facilities_list"))


# ---------- Activities ----------


@admin_bp.route("/activities", methods=["GET", "POST"])
@login_required
def activities_list():
    s = get_session()
    try:
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            desc = request.form.get("description", "").strip()
            order = int(request.form.get("order") or 0)
            url = request.form.get("image_url", "").strip()
            f = request.files.get("image")
            if f and f.filename and f.content_type in ALLOWED_IMAGE:
                url = upload_image(f, folder="kalongo/activities")
            if not name:
                flash("Name required.", "error")
                return redirect(url_for("admin.activities_list"))
            act = Activity(name=name, description=desc or None, image_url=url or None, order=order)
            s.add(act)
            s.commit()
            flash("Activity added.", "success")
            return redirect(url_for("admin.activities_list"))
        # Pagination - optimized
        page = request.args.get('page', 1, type=int)
        per_page = 30
        from sqlalchemy import func
        total = s.query(func.count(Activity.id)).scalar() or 0
        items = s.query(Activity).order_by(Activity.order, Activity.id).offset((page - 1) * per_page).limit(per_page).all()
        pages = (total + per_page - 1) // per_page if total > 0 else 1
        pagination = {
            'page': page,
            'pages': pages,
            'per_page': per_page,
            'total': total,
            'has_prev': page > 1,
            'has_next': page < pages,
            'prev_num': page - 1 if page > 1 else None,
            'next_num': page + 1 if page < pages else None,
            'items': items
        }
        return render_template("admin/activities.html", items=items, pagination=pagination)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.activities_list"))
    finally:
        s.close()


@admin_bp.route("/activities/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def activity_edit(pk):
    s = get_session()
    try:
        act = s.query(Activity).get(pk)
        if not act:
            flash("Activity not found.", "error")
            return redirect(url_for("admin.activities_list"))
        if request.method == "POST":
            act.name = request.form.get("name", "").strip() or act.name
            act.description = request.form.get("description", "").strip() or None
            act.order = int(request.form.get("order") or 0)
            url = request.form.get("image_url", "").strip()
            f = request.files.get("image")
            if f and f.filename and f.content_type in ALLOWED_IMAGE:
                url = upload_image(f, folder="kalongo/activities")
            if url:
                act.image_url = url
            s.commit()
            flash("Activity updated.", "success")
            return redirect(url_for("admin.activities_list"))
        return render_template("admin/activity_edit.html", item=act)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.activities_list"))
    finally:
        s.close()


@admin_bp.route("/activities/<int:pk>/delete", methods=["POST"])
@login_required
def activity_delete(pk):
    s = get_session()
    try:
        act = s.query(Activity).get(pk)
        if act:
            s.delete(act)
            s.commit()
            flash("Activity removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.activities_list"))


# ---------- Pricing Categories & Items ----------


@admin_bp.route("/pricing", methods=["GET", "POST"])
@login_required
def pricing_list():
    s = get_session()
    try:
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            desc = request.form.get("description", "").strip()
            cat_type = request.form.get("category_type", "").strip() or None
            order = int(request.form.get("order") or 0)
            if not name:
                flash("Category name required.", "error")
                return redirect(url_for("admin.pricing_list"))
            cat = PricingCategory(name=name, description=desc or None, category_type=cat_type, order=order)
            s.add(cat)
            s.commit()
            flash("Pricing category added.", "success")
            return redirect(url_for("admin.pricing_list"))
        from sqlalchemy.orm import joinedload
        # Limit to 50 categories with eager loading for items
        cats = s.query(PricingCategory).options(joinedload(PricingCategory.items)).order_by(PricingCategory.order, PricingCategory.id).limit(50).all()
        return render_template("admin/pricing.html", categories=cats)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.pricing_list"))
    finally:
        s.close()


@admin_bp.route("/pricing/category/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def pricing_category_edit(pk):
    s = get_session()
    try:
        cat = s.query(PricingCategory).get(pk)
        if not cat:
            flash("Category not found.", "error")
            return redirect(url_for("admin.pricing_list"))
        if request.method == "POST":
            cat.name = request.form.get("name", "").strip() or cat.name
            cat.description = request.form.get("description", "").strip() or None
            cat.category_type = request.form.get("category_type", "").strip() or None
            cat.order = int(request.form.get("order") or 0)
            s.commit()
            flash("Category updated.", "success")
            return redirect(url_for("admin.pricing_list"))
        return render_template("admin/pricing_category_edit.html", category=cat)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.pricing_list"))
    finally:
        s.close()


@admin_bp.route("/pricing/category/<int:pk>/delete", methods=["POST"])
@login_required
def pricing_category_delete(pk):
    s = get_session()
    try:
        cat = s.query(PricingCategory).get(pk)
        if cat:
            s.delete(cat)
            s.commit()
            flash("Category removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.pricing_list"))


@admin_bp.route("/pricing/category/<int:pk>/items", methods=["GET", "POST"])
@login_required
def pricing_items(pk):
    s = get_session()
    try:
        cat = s.query(PricingCategory).get(pk)
        if not cat:
            flash("Category not found.", "error")
            return redirect(url_for("admin.pricing_list"))
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            price_label = request.form.get("price_label", "").strip() or None
            price_value = request.form.get("price_value", "").strip()
            desc = request.form.get("description", "").strip() or None
            featured = request.form.get("featured") == "on"
            order = int(request.form.get("order") or 0)
            if not name or not price_value:
                flash("Name and price required.", "error")
                return redirect(url_for("admin.pricing_items", pk=pk))
            item = PricingItem(
                category_id=pk,
                name=name,
                price_label=price_label,
                price_value=price_value,
                description=desc,
                featured=featured,
                order=order,
            )
            s.add(item)
            s.commit()
            flash("Pricing item added.", "success")
            return redirect(url_for("admin.pricing_items", pk=pk))
        items = s.query(PricingItem).filter_by(category_id=pk).order_by(PricingItem.order, PricingItem.id).limit(100).all()
        return render_template("admin/pricing_items.html", category=cat, items=items)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.pricing_list"))
    finally:
        s.close()


@admin_bp.route("/pricing/item/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def pricing_item_edit(pk):
    s = get_session()
    try:
        item = s.query(PricingItem).get(pk)
        if not item:
            flash("Item not found.", "error")
            return redirect(url_for("admin.pricing_list"))
        if request.method == "POST":
            item.name = request.form.get("name", "").strip() or item.name
            item.price_label = request.form.get("price_label", "").strip() or None
            item.price_value = request.form.get("price_value", "").strip() or item.price_value
            item.description = request.form.get("description", "").strip() or None
            item.featured = request.form.get("featured") == "on"
            item.order = int(request.form.get("order") or 0)
            s.commit()
            flash("Item updated.", "success")
            return redirect(url_for("admin.pricing_items", pk=item.category_id))
        return render_template("admin/pricing_item_edit.html", item=item)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.pricing_list"))
    finally:
        s.close()


@admin_bp.route("/pricing/item/<int:pk>/delete", methods=["POST"])
@login_required
def pricing_item_delete(pk):
    s = get_session()
    try:
        item = s.query(PricingItem).get(pk)
        cid = item.category_id if item else None
        if item:
            s.delete(item)
            s.commit()
            flash("Item removed.", "success")
        if cid:
            return redirect(url_for("admin.pricing_items", pk=cid))
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.pricing_list"))


# ---------- Food ----------


@admin_bp.route("/food", methods=["GET", "POST"])
@login_required
def food_list():
    s = get_session()
    try:
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            desc = request.form.get("description", "").strip()
            price = request.form.get("price", "").strip()
            featured = request.form.get("featured") == "on"
            order = int(request.form.get("order") or 0)
            if not name or not price:
                flash("Name and price required.", "error")
                return redirect(url_for("admin.food_list"))
            f = FoodItem(name=name, description=desc or None, price=price, featured=featured, order=order)
            s.add(f)
            s.commit()
            flash("Food item added.", "success")
            return redirect(url_for("admin.food_list"))
        # Pagination - optimized
        page = request.args.get('page', 1, type=int)
        per_page = 30
        from sqlalchemy import func
        total = s.query(func.count(FoodItem.id)).scalar() or 0
        items = s.query(FoodItem).order_by(FoodItem.order, FoodItem.id).offset((page - 1) * per_page).limit(per_page).all()
        pages = (total + per_page - 1) // per_page if total > 0 else 1
        pagination = {
            'page': page,
            'pages': pages,
            'per_page': per_page,
            'total': total,
            'has_prev': page > 1,
            'has_next': page < pages,
            'prev_num': page - 1 if page > 1 else None,
            'next_num': page + 1 if page < pages else None,
            'items': items
        }
        return render_template("admin/food.html", items=items, pagination=pagination)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.food_list"))
    finally:
        s.close()


@admin_bp.route("/food/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def food_edit(pk):
    s = get_session()
    try:
        item = s.query(FoodItem).get(pk)
        if not item:
            flash("Food item not found.", "error")
            return redirect(url_for("admin.food_list"))
        if request.method == "POST":
            item.name = request.form.get("name", "").strip() or item.name
            item.description = request.form.get("description", "").strip() or None
            item.price = request.form.get("price", "").strip() or item.price
            item.featured = request.form.get("featured") == "on"
            item.order = int(request.form.get("order") or 0)
            s.commit()
            flash("Food item updated.", "success")
            return redirect(url_for("admin.food_list"))
        return render_template("admin/food_edit.html", item=item)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.food_list"))
    finally:
        s.close()


@admin_bp.route("/food/<int:pk>/delete", methods=["POST"])
@login_required
def food_delete(pk):
    s = get_session()
    try:
        item = s.query(FoodItem).get(pk)
        if item:
            s.delete(item)
            s.commit()
            flash("Food item removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.food_list"))


# ---------- Videos ----------


@admin_bp.route("/videos", methods=["GET", "POST"])
@login_required
def videos_list():
    s = get_session()
    try:
        if request.method == "POST":
            caption = request.form.get("caption", "").strip()
            section = request.form.get("section", "").strip() or "gallery"
            order = int(request.form.get("order") or 0)
            url = request.form.get("video_url", "").strip()
            f = request.files.get("video")
            if f and f.filename and f.content_type in ALLOWED_VIDEO:
                url = upload_video(f, folder="kalongo/videos")
            if not url:
                flash("Video file or URL required.", "error")
                return redirect(url_for("admin.videos_list"))
            v = Video(url=url, caption=caption or None, section=section, order=order)
            s.add(v)
            s.commit()
            flash("Video added.", "success")
            return redirect(url_for("admin.videos_list"))
        # Pagination - optimized
        page = request.args.get('page', 1, type=int)
        per_page = 30
        from sqlalchemy import func
        total = s.query(func.count(Video.id)).scalar() or 0
        items = s.query(Video).order_by(Video.order, Video.id).offset((page - 1) * per_page).limit(per_page).all()
        pages = (total + per_page - 1) // per_page if total > 0 else 1
        pagination = {
            'page': page,
            'pages': pages,
            'per_page': per_page,
            'total': total,
            'has_prev': page > 1,
            'has_next': page < pages,
            'prev_num': page - 1 if page > 1 else None,
            'next_num': page + 1 if page < pages else None,
            'items': items
        }
        return render_template("admin/videos.html", items=items, pagination=pagination)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.videos_list"))
    finally:
        s.close()


@admin_bp.route("/videos/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def video_edit(pk):
    s = get_session()
    try:
        v = s.query(Video).get(pk)
        if not v:
            flash("Video not found.", "error")
            return redirect(url_for("admin.videos_list"))
        if request.method == "POST":
            v.caption = request.form.get("caption", "").strip() or None
            v.section = request.form.get("section", "").strip() or "gallery"
            v.order = int(request.form.get("order") or 0)
            url = request.form.get("video_url", "").strip()
            f = request.files.get("video")
            if f and f.filename and f.content_type in ALLOWED_VIDEO:
                url = upload_video(f, folder="kalongo/videos")
            if url:
                v.url = url
            s.commit()
            flash("Video updated.", "success")
            return redirect(url_for("admin.videos_list"))
        return render_template("admin/video_edit.html", item=v)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.videos_list"))
    finally:
        s.close()


@admin_bp.route("/videos/<int:pk>/delete", methods=["POST"])
@login_required
def video_delete(pk):
    s = get_session()
    try:
        v = s.query(Video).get(pk)
        if v:
            s.delete(v)
            s.commit()
            flash("Video removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.videos_list"))


# ---------- Reviews ----------


@admin_bp.route("/reviews", methods=["GET", "POST"])
@login_required
def reviews_list():
    s = get_session()
    try:
        if request.method == "POST":
            customer_name = request.form.get("customer_name", "").strip()
            quote = request.form.get("quote", "").strip()
            rating = int(request.form.get("rating") or 5)
            order = int(request.form.get("order") or 0)
            url = request.form.get("image_url", "").strip()
            f = request.files.get("image")
            if f and f.filename and f.content_type in ALLOWED_IMAGE:
                url = upload_image(f, folder="kalongo/reviews")
            r = Review(customer_name=customer_name or None, image_url=url or None, quote=quote or None, rating=rating, order=order)
            s.add(r)
            s.commit()
            flash("Review added.", "success")
            return redirect(url_for("admin.reviews_list"))
        # Pagination - optimized
        page = request.args.get('page', 1, type=int)
        per_page = 30
        from sqlalchemy import func
        total = s.query(func.count(Review.id)).scalar() or 0
        items = s.query(Review).order_by(Review.order, Review.id).offset((page - 1) * per_page).limit(per_page).all()
        pages = (total + per_page - 1) // per_page if total > 0 else 1
        pagination = {
            'page': page,
            'pages': pages,
            'per_page': per_page,
            'total': total,
            'has_prev': page > 1,
            'has_next': page < pages,
            'prev_num': page - 1 if page > 1 else None,
            'next_num': page + 1 if page < pages else None,
            'items': items
        }
        return render_template("admin/reviews.html", items=items, pagination=pagination)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.reviews_list"))
    finally:
        s.close()


@admin_bp.route("/reviews/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def review_edit(pk):
    s = get_session()
    try:
        r = s.query(Review).get(pk)
        if not r:
            flash("Review not found.", "error")
            return redirect(url_for("admin.reviews_list"))
        if request.method == "POST":
            r.customer_name = request.form.get("customer_name", "").strip() or None
            r.quote = request.form.get("quote", "").strip() or None
            r.rating = int(request.form.get("rating") or 5)
            r.order = int(request.form.get("order") or 0)
            url = request.form.get("image_url", "").strip()
            f = request.files.get("image")
            if f and f.filename and f.content_type in ALLOWED_IMAGE:
                url = upload_image(f, folder="kalongo/reviews")
            if url:
                r.image_url = url
            s.commit()
            flash("Review updated.", "success")
            return redirect(url_for("admin.reviews_list"))
        return render_template("admin/review_edit.html", item=r)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.reviews_list"))
    finally:
        s.close()


@admin_bp.route("/reviews/<int:pk>/delete", methods=["POST"])
@login_required
def review_delete(pk):
    s = get_session()
    try:
        r = s.query(Review).get(pk)
        if r:
            s.delete(r)
            s.commit()
            flash("Review removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.reviews_list"))


# ---------- Site Settings ----------


@admin_bp.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    s = get_session()
    try:
        keys = ["phone", "whatsapp", "email", "address", "instagram", "facebook", "logo_url", "about_text"]
        if request.method == "POST":
            clear_settings_cache()  # Clear cache on update
            for k in keys:
                v = request.form.get(k, "").strip()
                row = s.query(SiteSettings).filter_by(key=k).first()
                if row:
                    row.value = v or None
                else:
                    s.add(SiteSettings(key=k, value=v or None))
            s.commit()
            flash("Settings saved.", "success")
            return redirect(url_for("admin.settings"))
        # Optimized: single query for all settings
        settings_rows = s.query(SiteSettings).filter(SiteSettings.key.in_(keys)).all()
        settings_map = {row.key: row.value for row in settings_rows}
        # Fill missing keys with empty strings
        for key in keys:
            if key not in settings_map:
                settings_map[key] = ""
        return render_template("admin/settings.html", settings=settings_map, keys=keys)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.settings"))
    finally:
        s.close()


# ---------- Rooms (simple list + images) ----------


@admin_bp.route("/rooms", methods=["GET"])
@login_required
def rooms_list():
    s = get_session()
    try:
        from sqlalchemy.orm import joinedload
        # Eager load images to avoid N+1 queries
        rooms = s.query(Room).options(joinedload(Room.images)).order_by(Room.order, Room.id).limit(50).all()
        return render_template("admin/rooms.html", rooms=rooms)
    finally:
        s.close()


@admin_bp.route("/rooms/<int:pk>/images", methods=["GET", "POST"])
@login_required
def room_images(pk):
    s = get_session()
    try:
        room = s.query(Room).get(pk)
        if not room:
            flash("Room not found.", "error")
            return redirect(url_for("admin.rooms_list"))
        if request.method == "POST":
            url = request.form.get("image_url", "").strip()
            f = request.files.get("image")
            if f and f.filename and f.content_type in ALLOWED_IMAGE:
                url = upload_image(f, folder=f"kalongo/rooms/{room.slug}")
            caption = request.form.get("caption", "").strip() or None
            order = int(request.form.get("order") or 0)
            if not url:
                flash("Image or URL required.", "error")
                return redirect(url_for("admin.room_images", pk=pk))
            img = RoomImage(room_id=pk, image_url=url, caption=caption, order=order)
            s.add(img)
            s.commit()
            flash("Image added.", "success")
            return redirect(url_for("admin.room_images", pk=pk))
        images = s.query(RoomImage).filter_by(room_id=pk).order_by(RoomImage.order, RoomImage.id).limit(50).all()
        return render_template("admin/room_images.html", room=room, images=images)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.rooms_list"))
    finally:
        s.close()


@admin_bp.route("/rooms/<int:room_id>/images/<int:img_id>/delete", methods=["POST"])
@login_required
def room_image_delete(room_id, img_id):
    s = get_session()
    try:
        img = s.query(RoomImage).filter_by(id=img_id, room_id=room_id).first()
        if img:
            s.delete(img)
            s.commit()
            flash("Image removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.room_images", pk=room_id))


# ---------- Restaurant Menu ----------


@admin_bp.route("/restaurant-menu", methods=["GET", "POST"])
@login_required
def restaurant_menu_list():
    s = get_session()
    try:
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            order = int(request.form.get("order") or 0)
            if not name:
                flash("Category name required.", "error")
                return redirect(url_for("admin.restaurant_menu_list"))
            cat = RestaurantMenuCategory(name=name, order=order)
            s.add(cat)
            s.commit()
            flash("Menu category added.", "success")
            return redirect(url_for("admin.restaurant_menu_list"))
        from sqlalchemy.orm import joinedload
        # Eager load items to avoid N+1 queries
        categories = s.query(RestaurantMenuCategory).options(joinedload(RestaurantMenuCategory.items)).order_by(RestaurantMenuCategory.order, RestaurantMenuCategory.id).limit(50).all()
        return render_template("admin/restaurant_menu.html", categories=categories)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.restaurant_menu_list"))
    finally:
        s.close()


@admin_bp.route("/restaurant-menu/category/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def restaurant_menu_category_edit(pk):
    s = get_session()
    try:
        cat = s.query(RestaurantMenuCategory).get(pk)
        if not cat:
            flash("Category not found.", "error")
            return redirect(url_for("admin.restaurant_menu_list"))
        if request.method == "POST":
            cat.name = request.form.get("name", "").strip() or cat.name
            cat.order = int(request.form.get("order") or 0)
            s.commit()
            flash("Category updated.", "success")
            return redirect(url_for("admin.restaurant_menu_list"))
        return render_template("admin/restaurant_menu_category_edit.html", category=cat)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.restaurant_menu_list"))
    finally:
        s.close()


@admin_bp.route("/restaurant-menu/category/<int:pk>/delete", methods=["POST"])
@login_required
def restaurant_menu_category_delete(pk):
    s = get_session()
    try:
        cat = s.query(RestaurantMenuCategory).get(pk)
        if cat:
            s.delete(cat)
            s.commit()
            flash("Category removed.", "success")
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.restaurant_menu_list"))


@admin_bp.route("/restaurant-menu/category/<int:pk>/items", methods=["GET", "POST"])
@login_required
def restaurant_menu_items(pk):
    s = get_session()
    try:
        cat = s.query(RestaurantMenuCategory).get(pk)
        if not cat:
            flash("Category not found.", "error")
            return redirect(url_for("admin.restaurant_menu_list"))
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            price = request.form.get("price", "").strip()
            order = int(request.form.get("order") or 0)
            if not name or not price:
                flash("Name and price required.", "error")
                return redirect(url_for("admin.restaurant_menu_items", pk=pk))
            item = RestaurantMenuItem(category_id=pk, name=name, price=price, order=order)
            s.add(item)
            s.commit()
            flash("Menu item added.", "success")
            return redirect(url_for("admin.restaurant_menu_items", pk=pk))
        items = s.query(RestaurantMenuItem).filter_by(category_id=pk).order_by(RestaurantMenuItem.order, RestaurantMenuItem.id).limit(200).all()
        return render_template("admin/restaurant_menu_items.html", category=cat, items=items)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.restaurant_menu_list"))
    finally:
        s.close()


@admin_bp.route("/restaurant-menu/item/<int:pk>/edit", methods=["GET", "POST"])
@login_required
def restaurant_menu_item_edit(pk):
    s = get_session()
    try:
        item = s.query(RestaurantMenuItem).get(pk)
        if not item:
            flash("Item not found.", "error")
            return redirect(url_for("admin.restaurant_menu_list"))
        if request.method == "POST":
            item.name = request.form.get("name", "").strip() or item.name
            item.price = request.form.get("price", "").strip() or item.price
            item.order = int(request.form.get("order") or 0)
            s.commit()
            flash("Item updated.", "success")
            return redirect(url_for("admin.restaurant_menu_items", pk=item.category_id))
        return render_template("admin/restaurant_menu_item_edit.html", item=item)
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
        return redirect(url_for("admin.restaurant_menu_list"))
    finally:
        s.close()


@admin_bp.route("/restaurant-menu/item/<int:pk>/delete", methods=["POST"])
@login_required
def restaurant_menu_item_delete(pk):
    s = get_session()
    try:
        item = s.query(RestaurantMenuItem).get(pk)
        cid = item.category_id if item else None
        if item:
            s.delete(item)
            s.commit()
            flash("Item removed.", "success")
        if cid:
            return redirect(url_for("admin.restaurant_menu_items", pk=cid))
    except Exception as e:
        s.rollback()
        flash(str(e), "error")
    finally:
        s.close()
    return redirect(url_for("admin.restaurant_menu_list"))
