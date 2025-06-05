import mysql.connector
from config import Config
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from datetime import datetime, timedelta
import uuid

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
        use_pure=True  # Use pure Python implementation
    )

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Execute database query with automatic connection handling"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute(query, params or ())
    
    if fetch_one:
        result = cursor.fetchone()
    elif fetch_all:
        result = cursor.fetchall()
    else:
        result = None
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return result

def token_required(f):
    """JWT token validation decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated



class UserModel:
    @staticmethod
    def create_user(email, password_hash, first_name, last_name, phone):
        user_id = str(uuid.uuid4())
        execute_query("""
            INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, email, password_hash, first_name, last_name, phone, datetime.now()))
        return user_id
    
    @staticmethod
    def get_user_by_email(email):
        return execute_query(
            "SELECT * FROM users WHERE email = %s AND status = 'active'",
            (email,),
            fetch_one=True
        )
    
    @staticmethod
    def get_user_by_id(user_id):
        return execute_query(
            "SELECT * FROM users WHERE user_id = %s",
            (user_id,),
            fetch_one=True
        )

class ProductModel:
    @staticmethod
    def get_featured_products():
        return execute_query("""
            SELECT p.*, 
                   (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.product_id LIMIT 1) as image_url
            FROM products p 
            WHERE p.is_featured = 1 AND p.status = 'active'
            ORDER BY p.created_at DESC
            LIMIT 8
        """, fetch_all=True)
    
    @staticmethod
    def get_products(category_id=None, search_query=None, page=1, per_page=12):
        offset = (page - 1) * per_page
        
        query = """
            SELECT p.*, 
                   (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.product_id LIMIT 1) as image_url,
                   c.category_name
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.status = 'active' AND (c.status = 'active' OR c.status IS NULL)
        """
        
        params = []
        if category_id:
            query += " AND p.category_id = %s"
            params.append(category_id)
        
        if search_query:
            query += " AND (p.product_name LIKE %s OR p.description LIKE %s)"
            params.extend([f'%{search_query}%', f'%{search_query}%'])
        
        query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        return execute_query(query, params, fetch_all=True)
    
    @staticmethod
    def get_product_by_id(product_id):
        return execute_query("""
            SELECT p.*, c.category_name 
            FROM products p 
            JOIN categories c ON p.category_id = c.category_id 
            WHERE p.product_id = %s AND p.status = 'active' AND c.status = 'active'
        """, (product_id,), fetch_one=True)

class CartModel:
    @staticmethod
    def get_cart_items(user_id):
        return execute_query("""
            SELECT c.*, p.product_name, p.price, p.discount_price, p.gst_rate, p.hsn_code,
                   (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.product_id LIMIT 1) as image_url
            FROM cart c 
            JOIN products p ON c.product_id = p.product_id 
            WHERE c.user_id = %s AND p.status = 'active'
        """, (user_id,), fetch_all=True)
    
    @staticmethod
    def add_to_cart(user_id, product_id, quantity, variant_id=None):
        # First check if product is active
        product_check = execute_query("""
            SELECT product_id FROM products WHERE product_id = %s AND status = 'active'
        """, (product_id,), fetch_one=True)
        
        if not product_check:
            raise ValueError("Product not found or unavailable")
        
        existing = execute_query("""
            SELECT cart_id, quantity FROM cart 
            WHERE user_id = %s AND product_id = %s AND (variant_id = %s OR (variant_id IS NULL AND %s IS NULL))
        """, (user_id, product_id, variant_id, variant_id), fetch_one=True)
        
        if existing:
            new_quantity = existing['quantity'] + quantity
            execute_query("""
                UPDATE cart SET quantity = %s, updated_at = %s 
                WHERE cart_id = %s
            """, (new_quantity, datetime.now(), existing['cart_id']))
        else:
            execute_query("""
                INSERT INTO cart (user_id, product_id, variant_id, quantity, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, product_id, variant_id, quantity, datetime.now()))

class OrderModel:
    @staticmethod
    def create_order(order_data):
        order_id = order_data.get('order_id', str(uuid.uuid4()))
        execute_query("""
            INSERT INTO orders (
                order_id, user_id, order_number, status, subtotal, tax_amount, 
                shipping_amount, discount_amount, total_amount, payment_method, 
                payment_status, shipping_address, notes, cgst_amount, sgst_amount, 
                igst_amount, tax_rate, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            order_id, order_data['user_id'], order_data['order_number'], order_data['status'],
            order_data['subtotal'], order_data['tax_amount'], order_data['shipping_amount'],
            order_data['discount_amount'], order_data['total_amount'], order_data['payment_method'],
            order_data['payment_status'], order_data['shipping_address'], order_data['notes'],
            order_data['cgst_amount'], order_data['sgst_amount'], order_data['igst_amount'],
            order_data['tax_rate'], datetime.now()
        ))
        return order_id
    
    @staticmethod
    def get_user_orders(user_id):
        return execute_query("""
            SELECT o.*, COUNT(oi.item_id) as item_count
            FROM orders o 
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.user_id = %s 
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        """, (user_id,), fetch_all=True)

