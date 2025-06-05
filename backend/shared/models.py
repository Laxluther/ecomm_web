import mysql.connector
from config import Config
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from datetime import datetime
import uuid

def get_db_connection():
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT,
        charset='utf8mb4',
        collation='utf8mb4_unicode_ci',
        auth_plugin='mysql_native_password',
        use_pure=True
    )

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params or ())
    
    if fetch_one:
        result = cursor.fetchone()
    elif fetch_all:
        result = cursor.fetchall()
    else:
        result = cursor.lastrowid
    
    conn.commit()
    cursor.close()
    conn.close()
    return result

def user_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        if token.startswith('Bearer '):
            token = token[7:]
        
        data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        current_user_id = data['user_id']
        return f(current_user_id, *args, **kwargs)
    return decorated

def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Admin token missing'}), 401
        if token.startswith('Bearer '):
            token = token[7:]
        
        data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        admin_id = data.get('admin_id')
        if not admin_id:
            return jsonify({'error': 'Admin access required'}), 403
        
        admin = execute_query(
            "SELECT * FROM admin_users WHERE admin_id = %s AND status = 'active'",
            (admin_id,), fetch_one=True
        )
        if not admin:
            return jsonify({'error': 'Invalid admin access'}), 403
        return f(admin_id, *args, **kwargs)
    return decorated

class BaseModel:
    @staticmethod
    def create_id():
        return str(uuid.uuid4())
    
    @staticmethod
    def current_time():
        return datetime.now()

class ProductModel(BaseModel):
    @staticmethod
    def get_all_active():
        return execute_query("""
            SELECT p.*, c.category_name,
                   (SELECT pi.image_url FROM product_images pi 
                    WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                    LIMIT 1) as primary_image,
                   (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.status = 'active' AND c.status = 'active'
            ORDER BY p.created_at DESC
        """, fetch_all=True)
    
    @staticmethod
    def get_featured():
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
        return execute_query("""
            SELECT p.*, c.category_name,
                   (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock
            FROM products p 
            JOIN categories c ON p.category_id = c.category_id 
            WHERE p.product_id = %s AND p.status = 'active'
        """, (product_id,), fetch_one=True)

class UserModel(BaseModel):
    @staticmethod
    def create(email, password_hash, first_name, last_name, phone, referral_code=None):
        user_id = UserModel.create_id()
        
        execute_query("""
            INSERT INTO users (user_id, email, password_hash, first_name, last_name, phone, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, email, password_hash, first_name, last_name, phone, UserModel.current_time()))
        
        if referral_code:
            referrer = execute_query("""
                SELECT user_id FROM referral_codes WHERE code = %s AND status = 'active'
            """, (referral_code,), fetch_one=True)
            
            if referrer:
                execute_query("""
                    INSERT INTO referral_uses (referral_code_id, referred_user_id, created_at)
                    SELECT rc.id, %s, %s
                    FROM referral_codes rc WHERE rc.code = %s
                """, (user_id, UserModel.current_time(), referral_code))
        
        return user_id
    
    @staticmethod
    def get_by_email(email):
        return execute_query(
            "SELECT * FROM users WHERE email = %s AND status = 'active'",
            (email,), fetch_one=True
        )
    
    @staticmethod
    def get_by_id(user_id):
        return execute_query(
            "SELECT * FROM users WHERE user_id = %s",
            (user_id,), fetch_one=True
        )

class AdminModel(BaseModel):
    @staticmethod
    def get_by_username(username):
        return execute_query(
            "SELECT * FROM admin_users WHERE username = %s AND status = 'active'",
            (username,), fetch_one=True
        )
    
    @staticmethod
    def get_by_id(admin_id):
        return execute_query(
            "SELECT * FROM admin_users WHERE admin_id = %s",
            (admin_id,), fetch_one=True
        )