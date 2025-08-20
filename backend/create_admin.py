#!/usr/bin/env python3
"""
Simple script to create an admin user
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import Flask app to get proper context
from main import create_app
from shared.models import execute_query
from shared.utils import hash_password, generate_user_id
import uuid

def create_admin_user():
    # Create Flask app context
    app = create_app()
    with app.app_context():
        print("Creating admin user...")
        
        # Admin details
        admin_id = str(uuid.uuid4())
        username = "admin1"
        password = "admin1234"
        full_name = "System Administrator"
        email = "admin@example.com"
        role = "super_admin"
        
        # Hash the password properly
        password_hash = hash_password(password)
    
        # Check if admin already exists
        existing_admin = execute_query("""
            SELECT admin_id FROM admin_users WHERE username = %s
        """, (username,), fetch_one=True)
        
        if existing_admin:
            print(f"Admin user '{username}' already exists. Updating password...")
            execute_query("""
                UPDATE admin_users 
                SET password_hash = %s, updated_at = NOW() 
                WHERE username = %s
            """, (password_hash, username))
        else:
            print(f"Creating new admin user '{username}'...")
            execute_query("""
                INSERT INTO admin_users (admin_id, username, password_hash, full_name, email, role, status, created_at, updated_at) 
                VALUES (%s, %s, %s, %s, %s, %s, 'active', NOW(), NOW())
            """, (admin_id, username, password_hash, full_name, email, role))
        
        print(f"SUCCESS Admin user created/updated successfully!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   Role: {role}")
        print(f"   You can now login at /admin/login")
        
        # Test the password verification
        print("\nTesting password verification...")
        from shared.utils import verify_password
        test_result = verify_password(password, password_hash)
        print(f"Password verification test: {test_result}")

if __name__ == "__main__":
    try:
        create_admin_user()
    except Exception as e:
        print(f"ERROR creating admin user: {e}")
        sys.exit(1)