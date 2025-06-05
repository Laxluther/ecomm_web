#!/usr/bin/env python3
"""
Standalone Admin Creation Script
Run this script to create new admin users for your e-commerce platform
"""

import mysql.connector
from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime
import os
import sys
import getpass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'password'),
    'database': os.environ.get('DB_NAME', 'ecommerce_db'),
    'port': int(os.environ.get('DB_PORT', 3306))
}

# Admin roles
ADMIN_ROLES = {
    '1': {
        'role': 'super_admin',
        'description': 'Full system access, can manage other admins',
        'permissions': ['all']
    },
    '2': {
        'role': 'product_manager',
        'description': 'Can manage products, categories, and inventory',
        'permissions': ['products', 'categories', 'inventory']
    },
    '3': {
        'role': 'order_manager',
        'description': 'Can manage orders and customer issues',
        'permissions': ['orders', 'users']
    },
    '4': {
        'role': 'customer_support',
        'description': 'Can view orders and help customers',
        'permissions': ['orders:view', 'users:view']
    }
}

def get_db_connection():
    """Create database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"❌ Database connection failed: {err}")
        sys.exit(1)

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Execute database query"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(query, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = None
        
        conn.commit()
        return result
    except mysql.connector.Error as err:
        print(f"❌ Query failed: {err}")
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()

def check_admin_table():
    """Check if admin_users table exists"""
    result = execute_query("""
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = %s AND table_name = 'admin_users'
    """, (DB_CONFIG['database'],), fetch_one=True)
    
    return result and result['count'] > 0

def list_existing_admins():
    """List all existing admin users"""
    admins = execute_query("""
        SELECT admin_id, username, email, full_name, role, status, last_login, created_at
        FROM admin_users
        ORDER BY created_at DESC
    """, fetch_all=True)
    
    if not admins:
        print("\n📭 No admin users found.")
        return
    
    print("\n📋 Existing Admin Users:")
    print("-" * 100)
    print(f"{'Username':<15} {'Full Name':<25} {'Email':<30} {'Role':<15} {'Status':<10}")
    print("-" * 100)
    
    for admin in admins:
        print(f"{admin['username']:<15} {admin['full_name']:<25} {admin['email']:<30} {admin['role']:<15} {admin['status']:<10}")
    
    print(f"\nTotal admins: {len(admins)}")

def validate_email(email):
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Validate username"""
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    if not username.replace('_', '').isalnum():
        return False, "Username can only contain letters, numbers, and underscores"
    return True, ""

def get_admin_input():
    """Get admin details from user input"""
    print("\n🔧 Create New Admin User")
    print("-" * 50)
    
    # Username
    while True:
        username = input("Username: ").strip().lower()
        valid, message = validate_username(username)
        if not valid:
            print(f"❌ {message}")
            continue
        
        # Check if username exists
        existing = execute_query(
            "SELECT admin_id FROM admin_users WHERE username = %s",
            (username,), fetch_one=True
        )
        if existing:
            print("❌ Username already exists. Please choose another.")
            continue
        break
    
    # Email
    while True:
        email = input("Email: ").strip().lower()
        if not validate_email(email):
            print("❌ Invalid email format")
            continue
        
        # Check if email exists
        existing = execute_query(
            "SELECT admin_id FROM admin_users WHERE email = %s",
            (email,), fetch_one=True
        )
        if existing:
            print("❌ Email already exists. Please use another.")
            continue
        break
    
    # Full Name
    while True:
        full_name = input("Full Name: ").strip()
        if len(full_name) < 2:
            print("❌ Please enter a valid full name")
            continue
        break
    
    # Password
    while True:
        password = getpass.getpass("Password (min 6 characters): ")
        if len(password) < 6:
            print("❌ Password must be at least 6 characters long")
            continue
        
        confirm_password = getpass.getpass("Confirm Password: ")
        if password != confirm_password:
            print("❌ Passwords do not match")
            continue
        break
    
    # Role selection
    print("\n🔑 Select Admin Role:")
    for key, role_info in ADMIN_ROLES.items():
        print(f"{key}. {role_info['role']:<20} - {role_info['description']}")
    
    while True:
        role_choice = input("\nSelect role (1-4): ").strip()
        if role_choice not in ADMIN_ROLES:
            print("❌ Invalid choice. Please select 1-4.")
            continue
        break
    
    selected_role = ADMIN_ROLES[role_choice]['role']
    
    # Confirmation
    print("\n📝 Admin Details:")
    print(f"   Username: {username}")
    print(f"   Email: {email}")
    print(f"   Full Name: {full_name}")
    print(f"   Role: {selected_role}")
    
    confirm = input("\nCreate this admin? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Admin creation cancelled.")
        return None
    
    return {
        'username': username,
        'email': email,
        'full_name': full_name,
        'password': password,
        'role': selected_role
    }

def create_admin(admin_data):
    """Create admin user in database"""
    admin_id = str(uuid.uuid4())
    password_hash = generate_password_hash(admin_data['password'])
    
    # Set permissions based on role
    permissions = ADMIN_ROLES[next(k for k, v in ADMIN_ROLES.items() if v['role'] == admin_data['role'])]['permissions']
    permissions_json = str(permissions).replace("'", '"')  # Convert to JSON format
    
    try:
        result = execute_query("""
            INSERT INTO admin_users (
                admin_id, username, email, password_hash, 
                full_name, role, permissions, status, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', %s)
        """, (
            admin_id, admin_data['username'], admin_data['email'],
            password_hash, admin_data['full_name'], admin_data['role'],
            permissions_json, datetime.now()
        ))
        
        if result is not None:
            print("\n✅ Admin created successfully!")
            print(f"   Admin ID: {admin_id}")
            print(f"   Username: {admin_data['username']}")
            print(f"   Email: {admin_data['email']}")
            print(f"   Role: {admin_data['role']}")
            return True
        else:
            print("❌ Failed to create admin.")
            return False
            
    except Exception as e:
        print(f"❌ Error creating admin: {str(e)}")
        return False

def update_admin_status():
    """Enable/Disable admin user"""
    print("\n🔄 Update Admin Status")
    print("-" * 50)
    
    username = input("Enter username to update: ").strip().lower()
    
    admin = execute_query(
        "SELECT admin_id, username, full_name, status FROM admin_users WHERE username = %s",
        (username,), fetch_one=True
    )
    
    if not admin:
        print("❌ Admin not found.")
        return
    
    print(f"\nCurrent Status: {admin['status']}")
    new_status = 'inactive' if admin['status'] == 'active' else 'active'
    
    confirm = input(f"Change status to '{new_status}'? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Status update cancelled.")
        return
    
    execute_query(
        "UPDATE admin_users SET status = %s, updated_at = %s WHERE admin_id = %s",
        (new_status, datetime.now(), admin['admin_id'])
    )
    
    print(f"✅ Admin status updated to '{new_status}'")

def reset_admin_password():
    """Reset admin password"""
    print("\n🔐 Reset Admin Password")
    print("-" * 50)
    
    username = input("Enter username: ").strip().lower()
    
    admin = execute_query(
        "SELECT admin_id, username, full_name FROM admin_users WHERE username = %s",
        (username,), fetch_one=True
    )
    
    if not admin:
        print("❌ Admin not found.")
        return
    
    print(f"\nResetting password for: {admin['full_name']} ({admin['username']})")
    
    while True:
        password = getpass.getpass("New Password (min 6 characters): ")
        if len(password) < 6:
            print("❌ Password must be at least 6 characters long")
            continue
        
        confirm_password = getpass.getpass("Confirm Password: ")
        if password != confirm_password:
            print("❌ Passwords do not match")
            continue
        break
    
    password_hash = generate_password_hash(password)
    
    execute_query(
        "UPDATE admin_users SET password_hash = %s, updated_at = %s WHERE admin_id = %s",
        (password_hash, datetime.now(), admin['admin_id'])
    )
    
    print("✅ Password reset successfully!")

def delete_admin():
    """Delete admin user"""
    print("\n🗑️  Delete Admin User")
    print("-" * 50)
    
    username = input("Enter username to delete: ").strip().lower()
    
    if username == 'admin':
        print("❌ Cannot delete the default admin user.")
        return
    
    admin = execute_query(
        "SELECT admin_id, username, full_name, email FROM admin_users WHERE username = %s",
        (username,), fetch_one=True
    )
    
    if not admin:
        print("❌ Admin not found.")
        return
    
    print(f"\n⚠️  This will permanently delete:")
    print(f"   Username: {admin['username']}")
    print(f"   Full Name: {admin['full_name']}")
    print(f"   Email: {admin['email']}")
    
    confirm = input("\nAre you sure? Type 'DELETE' to confirm: ").strip()
    if confirm != 'DELETE':
        print("❌ Deletion cancelled.")
        return
    
    execute_query(
        "DELETE FROM admin_users WHERE admin_id = %s",
        (admin['admin_id'],)
    )
    
    print("✅ Admin deleted successfully!")

def main_menu():
    """Main menu"""
    while True:
        print("\n" + "="*50)
        print("🔧 E-Commerce Admin Management Tool")
        print("="*50)
        print("1. List existing admins")
        print("2. Create new admin")
        print("3. Update admin status (enable/disable)")
        print("4. Reset admin password")
        print("5. Delete admin")
        print("6. Exit")
        print("-"*50)
        
        choice = input("Select option (1-6): ").strip()
        
        if choice == '1':
            list_existing_admins()
        elif choice == '2':
            admin_data = get_admin_input()
            if admin_data:
                create_admin(admin_data)
        elif choice == '3':
            update_admin_status()
        elif choice == '4':
            reset_admin_password()
        elif choice == '5':
            delete_admin()
        elif choice == '6':
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")
        
        input("\nPress Enter to continue...")

def main():
    """Main function"""
    print("🔧 E-Commerce Admin Management Tool")
    print("="*50)
    
    # Check database connection
    print("📡 Checking database connection...")
    try:
        conn = get_db_connection()
        conn.close()
        print("✅ Database connected successfully!")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    # Check if admin table exists
    if not check_admin_table():
        print("❌ Admin users table not found. Please run the database schema first.")
        sys.exit(1)
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--quick':
            # Quick mode - create admin with minimal input
            admin_data = get_admin_input()
            if admin_data:
                create_admin(admin_data)
        elif sys.argv[1] == '--list':
            list_existing_admins()
        elif sys.argv[1] == '--help':
            print("\nUsage:")
            print("  python create_admin.py          - Interactive mode")
            print("  python create_admin.py --quick  - Quick create mode")
            print("  python create_admin.py --list   - List existing admins")
    else:
        # Interactive menu mode
        main_menu()

if __name__ == "__main__":
    main()