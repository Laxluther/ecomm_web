import mysql.connector
from datetime import datetime
import uuid
import os
import re
# Database connection configuration
class Config:
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_NAME = os.environ.get('DB_NAME', 'ecommerce')
    DB_PORT = int(os.environ.get('DB_PORT', 3306))

def get_db_connection():
    """Get database connection"""
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT,
        charset='utf8mb4',
        collation='utf8mb4_unicode_ci',
        auth_plugin='mysql_native_password',
        use_pure=True,
        autocommit=False
    )
# ADD THIS FUNCTION
def validate_query_security(query):
    """Check for dangerous SQL patterns"""
    dangerous_patterns = [
        r';\s*(drop|delete|update|insert|alter|create)\s+',
        r'union\s+select',
        r'--\s*',
        r'/\*.*?\*/',
    ]
    
    query_lower = query.lower()
    for pattern in dangerous_patterns:
        if re.search(pattern, query_lower):
            raise ValueError(f"Potentially dangerous SQL pattern detected")
def execute_query(query, params=None, fetch_one=False, fetch_all=False, get_insert_id=False):
    """
    Execute database query with various return options
    
    Args:
        query: SQL query string
        params: Query parameters tuple/list
        fetch_one: Return single row as dict
        fetch_all: Return all rows as list of dicts
        get_insert_id: Return the inserted row ID (for INSERT queries)
    
    Returns:
        - If fetch_one: dict or None
        - If fetch_all: list of dicts
        - If get_insert_id: integer ID of inserted row
        - Default: lastrowid (for INSERT) or rowcount (for UPDATE/DELETE)
    """
    validate_query_security(query)
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(query, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        elif get_insert_id:
            result = cursor.lastrowid
        else:
            result = cursor.lastrowid if query.strip().upper().startswith('INSERT') else cursor.rowcount
        
        conn.commit()
        return result
        
    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        print(f"Database error: {e}")
        raise e
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Unexpected error: {e}")
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

class BaseModel:
    """Base model with common utilities"""
    
    @staticmethod
    def create_id():
        """Generate unique UUID"""
        return str(uuid.uuid4())
    
    @staticmethod
    def current_time():
        """Get current timestamp"""
        return datetime.now()

class ProductModel(BaseModel):
    """Product model with database operations"""
    
    @staticmethod
    def get_all_active():
        """Get all active products"""
        return execute_query("""
            SELECT p.*, c.category_name,
                   (SELECT pi.image_url FROM product_images pi 
                    WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                    LIMIT 1) as primary_image,
                   (SELECT i.quantity FROM inventory i 
                    WHERE i.product_id = p.product_id) as stock
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.status = 'active' AND c.status = 'active'
            ORDER BY p.created_at DESC
        """, fetch_all=True)
    
    @staticmethod
    def get_featured():
        """Get featured products"""
        return execute_query("""
            SELECT p.*, c.category_name,
                   (SELECT pi.image_url FROM product_images pi 
                    WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                    LIMIT 1) as primary_image
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_featured = 1 AND p.status = 'active' AND c.status = 'active'
            ORDER BY p.created_at DESC LIMIT 8
        """, fetch_all=True)
    
    @staticmethod
    def get_by_id(product_id):
        """Get product by ID"""
        return execute_query("""
            SELECT p.*, c.category_name,
                   (SELECT i.quantity FROM inventory i 
                    WHERE i.product_id = p.product_id) as stock
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id 
            WHERE p.product_id = %s AND p.status = 'active'
        """, (product_id,), fetch_one=True)

class UserModel(BaseModel):
    """User model with database operations"""
    
    @staticmethod
    def create(email, password_hash, first_name, last_name, phone, referral_code=None):
        """Create new user"""
        user_id = UserModel.create_id()
        
        execute_query("""
            INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, email, password_hash, first_name, last_name, phone, UserModel.current_time()))
        
        # Handle referral if provided
        if referral_code:
            referrer = execute_query("""
                SELECT user_id FROM users WHERE referral_code = %s AND status = 'active'
            """, (referral_code,), fetch_one=True)
            
            if referrer:
                execute_query("""
                    INSERT INTO referral_uses (referrer_id, referred_user_id, created_at)
                    VALUES (%s, %s, %s)
                """, (referrer['user_id'], user_id, UserModel.current_time()))
        
        return user_id
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        return execute_query(
            "SELECT * FROM users WHERE email = %s AND status = 'active'",
            (email,), fetch_one=True
        )
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        return execute_query(
            "SELECT * FROM users WHERE user_id = %s",
            (user_id,), fetch_one=True
        )

class AdminModel(BaseModel):
    """Admin model with database operations"""
    
    @staticmethod
    def get_by_username(username):
        """Get admin by username"""
        return execute_query(
            "SELECT * FROM admin_users WHERE username = %s AND status = 'active'",
            (username,), fetch_one=True
        )
    
    @staticmethod
    def get_by_id(admin_id):
        """Get admin by ID"""
        return execute_query(
            "SELECT * FROM admin_users WHERE admin_id = %s",
            (admin_id,), fetch_one=True
        )

class CategoryModel(BaseModel):
    """Category model with database operations"""
    
    @staticmethod
    def get_all_active():
        """Get all active categories"""
        return execute_query("""
            SELECT c.*, 
                   (SELECT COUNT(*) FROM products p 
                    WHERE p.category_id = c.category_id AND p.status = 'active') as product_count
            FROM categories c
            WHERE c.status = 'active' 
            ORDER BY c.sort_order, c.category_name
        """, fetch_all=True)
    
    @staticmethod
    def get_by_id(category_id):
        """Get category by ID"""
        return execute_query(
            "SELECT * FROM categories WHERE category_id = %s",
            (category_id,), fetch_one=True
        )

class OrderModel(BaseModel):
    """Order model with database operations"""
    
    @staticmethod
    def create_order(user_id, order_data):
        """Create new order"""
        order_id = OrderModel.create_id()
        
        execute_query("""
            INSERT INTO orders (
                order_id, user_id, order_number, status, subtotal, 
                shipping_amount, total_amount, payment_method, 
                payment_status, shipping_address, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            order_id, user_id, order_data['order_number'], 'pending',
            order_data['subtotal'], order_data['shipping_amount'], 
            order_data['total_amount'], order_data['payment_method'],
            'pending', order_data['shipping_address'], OrderModel.current_time()
        ))
        
        return order_id
    
    @staticmethod
    def get_by_user(user_id):
        """Get orders by user ID"""
        return execute_query("""
            SELECT o.*, COUNT(oi.item_id) as item_count
            FROM orders o 
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.user_id = %s
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        """, (user_id,), fetch_all=True)

# Legacy authentication decorators (kept for compatibility)
# Note: These are now moved to shared/auth.py but kept here for backward compatibility
def user_token_required(f):
    """Deprecated: Use shared.auth.user_token_required instead"""
    from shared.auth import user_token_required as new_decorator
    return new_decorator(f)

def admin_token_required(f):
    """Deprecated: Use shared.auth.admin_token_required instead"""
    from shared.auth import admin_token_required as new_decorator
    return new_decorator(f)