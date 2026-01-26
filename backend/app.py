"""
Kalongo Farm - Flask backend
"""
import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS
from database import test_connection, engine, Base
from sqlalchemy import text
from models import Admin

load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload
app.config["TEMPLATES_AUTO_RELOAD"] = False  # Disable auto-reload for faster rendering
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 300  # Cache static files
CORS(app)  # Enable CORS for frontend API calls

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "admin.login"
login_manager.login_message = "Please log in to access the admin panel."
login_manager.session_protection = "basic"  # Use basic to avoid redirect loops


@login_manager.user_loader
def load_user(user_id):
    """Load user from database - must return None if user doesn't exist"""
    from database import SessionLocal
    s = SessionLocal()
    try:
        if not user_id:
            return None
        admin = s.query(Admin).get(int(user_id))
        return admin
    except (ValueError, TypeError, Exception):
        return None
    finally:
        s.close()


from routes.admin_routes import admin_bp
from routes.api_routes import api_bp

app.register_blueprint(admin_bp)
app.register_blueprint(api_bp)


@app.route("/")
def index():
    return {"message": "Kalongo Farm API", "status": "ok"}


@app.route("/health")
def health():
    db_status = "connected" if test_connection() else "disconnected"
    return {"status": "healthy", "database": db_status}


@app.route("/api/db/test")
def db_test():
    try:
        if test_connection():
            with engine.connect() as conn:
                r = conn.execute(text("SELECT current_database(), current_user, version()"))
                row = r.fetchone()
                return jsonify({
                    "status": "success",
                    "message": "Database connection successful",
                    "database": row[0],
                    "user": row[1],
                    "version": row[2].split(",")[0],
                })
        return jsonify({"status": "error", "message": "Database connection failed"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", debug=os.getenv("FLASK_ENV") == "development", port=5001)
