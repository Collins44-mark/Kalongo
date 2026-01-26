"""
Test script to verify database connection
"""
from database import test_connection, engine
from sqlalchemy import text
import sys


def test_basic_connection():
    """Test basic connection"""
    print("=" * 50)
    print("Testing PostgreSQL Database Connection")
    print("=" * 50)
    
    if test_connection():
        print("✅ Basic connection test: PASSED")
        return True
    else:
        print("❌ Basic connection test: FAILED")
        return False


def test_database_info():
    """Get database version and info"""
    try:
        with engine.connect() as connection:
            # Get PostgreSQL version
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"\n📊 PostgreSQL Version:")
            print(f"   {version}")
            
            # Get current database name
            result = connection.execute(text("SELECT current_database()"))
            db_name = result.fetchone()[0]
            print(f"\n📁 Current Database: {db_name}")
            
            # Get current user
            result = connection.execute(text("SELECT current_user"))
            user = result.fetchone()[0]
            print(f"👤 Current User: {user}")
            
            # List all tables
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = result.fetchall()
            
            if tables:
                print(f"\n📋 Tables in database ({len(tables)}):")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("\n📋 No tables found in database (empty database)")
            
            return True
    except Exception as e:
        print(f"\n❌ Error getting database info: {e}")
        return False


if __name__ == "__main__":
    print("\n")
    
    # Test 1: Basic connection
    if not test_basic_connection():
        print("\n❌ Cannot proceed with further tests. Please check your connection string.")
        sys.exit(1)
    
    # Test 2: Database info
    print("\n" + "=" * 50)
    print("Getting Database Information")
    print("=" * 50)
    test_database_info()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("=" * 50 + "\n")
