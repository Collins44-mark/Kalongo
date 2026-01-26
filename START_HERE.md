# 🚀 START HERE - How to Run Kalongo Farm Website

## Quick Start (Easiest Way)

### 1️⃣ Run Frontend Website (Customer Site)

Simply run:
```bash
python3 run_frontend.py
```

This will:
- ✅ Start a web server
- ✅ Open your browser automatically
- ✅ Show the customer-facing website at http://localhost:8000

**That's it!** The website will open and you can browse it.

---

### 2️⃣ Run Backend (For Full Functionality)

**In a separate terminal**, run:
```bash
python3 run_backend.py
```

Or manually:
```bash
cd backend
source venv/bin/activate
python app.py
```

This starts the backend API server on http://localhost:5001

---

## 📋 What Each Does

### Frontend (`run_frontend.py`)
- Shows the **customer website**
- Displays rooms, facilities, activities, pricing
- Works even without backend (but shows limited content)
- **Best for**: Viewing the website, testing design

### Backend (`run_backend.py`)
- Powers the **admin panel** at http://localhost:5001/admin
- Provides API data for frontend
- **Best for**: Managing content, uploading images

---

## 🎯 Recommended Setup

**For full functionality, run BOTH:**

**Terminal 1:**
```bash
python3 run_backend.py
```

**Terminal 2:**
```bash
python3 run_frontend.py
```

Then:
- **Customer site**: http://localhost:8000 (auto-opens)
- **Admin panel**: http://localhost:5001/admin (login: admin/admin123)

---

## ❓ Troubleshooting

### "Directory listing" instead of website?
- Use `python3 run_frontend.py` (don't open files directly)

### Website shows but no content?
- Make sure backend is running: `python3 run_backend.py`
- Check: http://localhost:5001/health

### Can't find the scripts?
- Make sure you're in the project root: `/Users/Prisca/Documents/KALONGOWEB`
- Files: `run_frontend.py` and `run_backend.py` should be in this folder

---

## 📁 File Locations

- **Frontend website**: `frontend/index.html`
- **Admin panel**: http://localhost:5001/admin (after running backend)
- **Run scripts**: `run_frontend.py` and `run_backend.py` (in project root)
