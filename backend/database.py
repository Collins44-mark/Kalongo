"""
Database configuration and connection setup
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Verify connections before using
    pool_recycle=300,        # Recycle connections after 5 minutes
    pool_size=10,            # Number of connections to maintain
    max_overflow=20,         # Max connections beyond pool_size
    pool_timeout=30,         # Timeout for getting connection
    echo=False,              # Set to True for SQL query logging
    connect_args={"connect_timeout": 5}  # Connection timeout
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """
    Test database connection
    Returns True if connection successful, False otherwise
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()
            return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False


if __name__ == "__main__":
    print("Testing database connection...")
    if test_connection():
        print("✅ Database connection successful!")
    else:
        print("❌ Database connection failed!")
