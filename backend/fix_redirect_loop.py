#!/usr/bin/env python3
"""
Script to clear Flask session cookies and fix redirect loops
Run this if you experience ERR_TOO_MANY_REDIRECTS
"""
import os
from dotenv import load_dotenv
from database import SessionLocal
from models import Admin

load_dotenv()

def check_admin_exists():
    """Verify admin user exists"""
    s = SessionLocal()
    try:
        admin = s.query(Admin).first()
        if admin:
            print(f"✅ Admin user found: {admin.username}")
            return True
        else:
            print("❌ No admin user found. Run init_db.py first.")
            return False
    finally:
        s.close()

if __name__ == "__main__":
    print("Checking admin setup...")
    check_admin_exists()
    print("\nTo fix redirect loops:")
    print("1. Clear your browser cookies for localhost:5001")
    print("2. Restart the Flask server")
print("3. Try logging in again with: Kalongo / kalongo@95")
