#!/usr/bin/env python3
"""
Fix admin password hash in database
"""

import mysql.connector
from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime

def fix_admin_password():
    """Fix the admin password hash in database"""
    
    # Database connection (update with your credentials)
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='Sanidhya@28',  # UPDATE THIS
            database='ecommerce_db'
        )
        cursor = conn.cursor(dictionary=True)
        
        print("🔑 Fixing admin password hash...")
        
        # Check current admin user
        cursor.execute("SELECT admin_id, username, password_hash FROM admin_users WHERE username = 'admin'")
        admin = cursor.fetchone()
        
        if admin:
            print(f"📋 Found admin user: {admin['username']}")
            print(f"   Current hash: {admin['password_hash'][:50]}...")
            
            # Generate new correct password hash for 'admin123'
            new_password = 'admin123'
            correct_hash = generate_password_hash(new_password)
            
            print(f"🔧 Generating new hash for password: {new_password}")
            print(f"   New hash: {correct_hash[:50]}...")
            
            # Update the admin password hash
            cursor.execute("""
                UPDATE admin_users 
                SET password_hash = %s, updated_at = %s 
                WHERE username = 'admin'
            """, (correct_hash, datetime.now()))
            
            conn.commit()
            print("✅ Admin password hash updated successfully!")
            
        else:
            print("❌ Admin user not found. Creating new admin user...")
            
            # Create new admin user
            admin_id = str(uuid.uuid4())
            password_hash = generate_password_hash('admin123')
            
            cursor.execute("""
                INSERT INTO admin_users (admin_id, username, email, password_hash, full_name, role, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (admin_id, 'admin', 'admin@yourstore.com', password_hash, 'System Administrator', 'super_admin', 'active', datetime.now()))
            
            conn.commit()
            print("✅ New admin user created successfully!")
        
        # Test the new hash
        from werkzeug.security import check_password_hash
        cursor.execute("SELECT password_hash FROM admin_users WHERE username = 'admin'")
        updated_admin = cursor.fetchone()
        
        if updated_admin and check_password_hash(updated_admin['password_hash'], 'admin123'):
            print("🧪 Password verification test: ✅ PASSED")
        else:
            print("🧪 Password verification test: ❌ FAILED")
        
        cursor.close()
        conn.close()
        
        print("\n🎯 Admin Login Details:")
        print("   Username: admin")
        print("   Password: admin123")
        print("\n🚀 You can now test admin login!")
        
    except mysql.connector.Error as e:
        print(f"❌ Database error: {e}")
        print("💡 Make sure to update the database password in this script")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_admin_password()