# Kalongo Farm Backend

Flask backend API and **Admin Panel** for Kalongo Farm website.

## Setup

1. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

2. **Configure `.env`** (copy from `.env.example` if needed).

3. **Create tables and seed data:**
   ```bash
   python init_db.py
   ```
   This creates all tables and seeds:
   - Default admin: **username** `admin`, **password** `admin123`
   - Site settings (phone, email, address, etc.)
   - Default rooms: A-Cabin, Cottage, Kikota

4. **Run the app:**
   ```bash
   python app.py
   ```

## Admin Panel

- **URL:** http://localhost:5000/admin
- **Login:** `admin` / `admin123` (change via `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`)

### Admin sections

| Section | Description |
|--------|-------------|
| **Dashboard** | Overview counts (hero, rooms, facilities, etc.) |
| **Hero Slides** | Add/edit/delete homepage hero carousel images |
| **Rooms & Images** | Manage room images for A-Cabin, Cottage, Kikota |
| **Facilities** | Add/edit facilities (Swimming Pool, Nature Trails, etc.) |
| **Activities** | Add/edit activities (Farm Tour, etc.) |
| **Pricing** | Categories + items (Accommodation, Food, Activities) |
| **Food** | Food items (Half Board, Full Board, etc.) |
| **Videos** | Upload videos, set captions and section |
| **Reviews** | Customer reviews and photos |
| **Settings** | Phone, email, address, logo URL, social links, about text |

Images and videos can be **uploaded via file** or **pasted as URL**. Uploads use **Cloudinary** (configure `CLOUDINARY_*` in `.env`).

## Database

- **PostgreSQL** (e.g. Render)
- **Tables:** `admins`, `site_settings`, `hero_slides`, `rooms`, `room_images`, `facilities`, `activities`, `pricing_categories`, `pricing_items`, `food_items`, `videos`, `reviews`

## API endpoints

- `GET /` – API info  
- `GET /health` – Health check + DB status  
- `GET /api/db/test` – DB connection test  

## Project structure

```
backend/
├── app.py                 # Flask app, Flask-Login, blueprints
├── config.py             # Config from env
├── database.py            # SQLAlchemy engine, session, Base
├── models.py              # All DB models
├── init_db.py             # Create tables + seed admin/settings/rooms
├── routes/
│   └── admin_routes.py    # Admin panel routes
├── utils/
│   └── cloudinary_upload.py
├── templates/admin/       # Admin UI (Jinja2)
├── requirements.txt
├── .env
└── .env.example
```
