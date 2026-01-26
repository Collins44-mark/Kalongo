#!/usr/bin/env python3
"""
Script to run the Kalongo Farm backend server
"""
import os
import sys
from pathlib import Path

# Change to backend directory
backend_dir = Path(__file__).parent / "backend"
os.chdir(backend_dir)

# Activate virtual environment if it exists
venv_python = backend_dir / "venv" / "bin" / "python"
if venv_python.exists():
    # Use venv Python
    os.execv(str(venv_python), [str(venv_python), "app.py"])
else:
    # Use system Python
    print("⚠️  Virtual environment not found. Using system Python.")
    print("   Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
    sys.exit(1)
