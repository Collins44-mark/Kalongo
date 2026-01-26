# 🌿 KALONGO FARM - Website & Admin Panel

A modern farm lodge website with full admin panel for content management.

## 🚀 Quick Start

### Option 1: Run Frontend Website (Customer-Facing)

**Simple way:**
```bash
python3 run_frontend.py
```
This will:
- Start a web server on http://localhost:8000
- Open the website in your browser automatically
- Serve the customer-facing frontend

### Option 2: Run Backend Server (Required for Full Functionality)

```bash
python3 run_backend.py
```
Or manually:
```bash
cd backend
source venv/bin/activate
python app.py
```

Backend runs on: http://localhost:5001

### Option 3: Run Both (Recommended)

**Terminal 1 - Backend:**
```bash
python3 run_backend.py
```

**Terminal 2 - Frontend:**
```bash
python3 run_frontend.py
```

## 📁 Project Structure

```
KALONGOWEB/
├── frontend/          # Customer-facing website (HTML, CSS, JS)
│   ├── index.html     # Homepage
│   ├── packages.html   # Packages & Pricing
│   ├── activities.html # Activities
│   ├── our-kalongo.html # Gallery & Videos
│   ├── booking.html    # Booking page
│   ├── pricing.html    # Pricing details
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript (API client, scripts)
│
├── backend/           # Flask backend & Admin Panel
│   ├── app.py        # Main Flask application
│   ├── models.py     # Database models
│   ├── routes/       # API & Admin routes
│   ├── templates/    # Admin panel templates
│   └── venv/         # Python virtual environment
│
├── run_frontend.py   # Quick frontend server
└── run_backend.py    # Quick backend server
```

## 🌐 Access Points

### Customer Website
- **URL**: http://localhost:8000/index.html
- **Run**: `python3 run_frontend.py`
- Shows: Rooms, Facilities, Activities, Pricing, Gallery

### Admin Panel
- **URL**: http://localhost:5001/admin
- **Login**: `admin` / `admin123`
- **Run**: `python3 run_backend.py`
- Manage: All website content, images, videos, pricing, menu

### API Endpoints
- **Base**: http://localhost:5001/api
- **Endpoints**: `/hero-slides`, `/rooms`, `/facilities`, `/activities`, `/pricing`, `/food`, `/restaurant-menu`, `/videos`, `/reviews`, `/settings`

## 📝 Features

### Frontend
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Dynamic content from database
- ✅ Fast loading with optimized images
- ✅ Modern UI/UX

### Backend
- ✅ PostgreSQL database
- ✅ Cloudinary image/video hosting
- ✅ Full admin panel
- ✅ RESTful API
- ✅ Fast performance with caching

## 🔧 Requirements

### Backend
- Python 3.8+
- PostgreSQL database (configured in `.env`)
- Cloudinary account (configured in `.env`)

### Frontend
- Modern web browser
- Backend server running (for API data)

## 📚 Documentation

- `COMPLETE_MIGRATION_SUMMARY.md` - Data migration details
- `FRONTEND_BACKEND_LINKING.md` - API integration guide
- `OPTIMIZATION_SUMMARY.md` - Performance optimizations
- `REDIRECT_LOOP_FIX.md` - Admin panel troubleshooting

## 🆘 Troubleshooting

### Frontend shows directory listing
- Use `python3 run_frontend.py` instead of opening files directly

### Backend not connecting
- Check if PostgreSQL is running
- Verify `.env` file has correct `DATABASE_URL`
- Run: `cd backend && python test_db.py`

### Images not loading
- Ensure backend is running
- Check Cloudinary URLs in database
- Verify API endpoints: http://localhost:5001/api/hero-slides

### Admin panel redirect loop
- Clear browser cookies for localhost:5001
- Restart backend server
- See `REDIRECT_LOOP_FIX.md` for details

## 📞 Support

For issues or questions, check the documentation files or verify:
1. Backend server is running (http://localhost:5001/health)
2. Frontend server is running (http://localhost:8000)
3. Database connection is working
4. All environment variables are set
