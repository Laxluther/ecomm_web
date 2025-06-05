from flask import Blueprint, request, jsonify, current_app
from shared.models import execute_query, admin_token_required
from referral.models import ReferralModel
from datetime import datetime, timedelta
import uuid
import os
from werkzeug.utils import secure_filename
from PIL import Image

admin_bp = Blueprint('admin', __name__)

from admin.auth import admin_auth_bp
admin_bp.register_blueprint(admin_auth_bp, url_prefix='/auth')

@admin_bp.route('/dashboard', methods=['GET'])
@admin_token_required
def dashboard(admin_id):
    stats = {}
    
    user_stats = execute_query("""
        SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
        FROM users
    """, fetch_one=True)
    
    product_stats = execute_query("""
        SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
            COUNT(CASE WHEN is_featured = 1 AND status = 'active' THEN 1 END) as featured_products
        FROM products
    """, fetch_one=True)
    
    order_stats = execute_query("""
        SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as orders_30d,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total_amount END), 0) as revenue_30d
        FROM orders WHERE status != 'cancelled'
    """, fetch_one=True)
    
    referral_stats = ReferralModel.get_admin_stats()
    
    recent_orders = execute_query("""
        SELECT o.order_id, o.order_number, o.total_amount, o.status, o.created_at,
               u.first_name, u.last_name, u.email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC LIMIT 10
    """, fetch_all=True)
    
    return jsonify({
        'stats': {
            'users': user_stats,
            'products': product_stats,
            'orders': order_stats,
            'referrals': referral_stats
        },
        'recent_orders': recent_orders
    }), 200

@admin_bp.route('/products', methods=['GET'])
@admin_token_required
def get_products(admin_id):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status = request.args.get('status')
    search = request.args.get('search', '').strip()
    
    offset = (page - 1) * per_page
    
    query = """
        SELECT p.*, c.category_name,
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.product_id AND pi.is_primary = 1 LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (p.product_name LIKE %s OR p.sku LIKE %s)"
        search_param = f'%{search}%'
        params.extend([search_param, search_param])
    
    if status:
        query += " AND p.status = %s"
        params.append(status)
    
    query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    products = execute_query(query, params, fetch_all=True)
    
    total_count = execute_query("""
        SELECT COUNT(*) as total FROM products p 
        WHERE 1=1 {} {}
    """.format(
        "AND (p.product_name LIKE %s OR p.sku LIKE %s)" if search else "",
        f"AND p.status = '{status}'" if status else ""
    ), [f'%{search}%', f'%{search}%'] if search else [], fetch_one=True)['total']
    
    return jsonify({
        'products': products,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'pages': (total_count + per_page - 1) // per_page
        }
    }), 200

@admin_bp.route('/products', methods=['POST'])
@admin_token_required
def create_product(admin_id):
    data = request.get_json()
    
    product_name = data.get('product_name', '').strip()
    description = data.get('description', '').strip()
    category_id = data.get('category_id')
    brand = data.get('brand', '').strip()
    price = float(data.get('price', 0))
    discount_price = float(data.get('discount_price', 0)) if data.get('discount_price') else None
    sku = data.get('sku', '').strip()
    
    if not sku:
        import random
        sku = f"PRD{random.randint(100000, 999999)}"
    
    execute_query("""
        INSERT INTO products 
        (product_name, description, category_id, brand, sku, price, discount_price, 
         status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', %s)
    """, (product_name, description, category_id, brand, sku, price, discount_price, datetime.now()))
    
    current_app.cache.delete('featured_products')
    current_app.cache.delete('active_categories')
    
    return jsonify({'message': 'Product created successfully'}), 201

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@admin_token_required
def update_product(admin_id, product_id):
    data = request.get_json()
    
    update_fields = []
    params = []
    
    updatable_fields = ['product_name', 'description', 'brand', 'price', 'discount_price', 'status', 'is_featured']
    
    for field in updatable_fields:
        if field in data:
            update_fields.append(f"{field} = %s")
            params.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    
    update_fields.append("updated_at = %s")
    params.append(datetime.now())
    params.append(product_id)
    
    query = f"UPDATE products SET {', '.join(update_fields)} WHERE product_id = %s"
    execute_query(query, params)
    
    current_app.cache.delete('featured_products')
    current_app.cache.delete(f'product_detail_{product_id}')
    
    return jsonify({'message': 'Product updated successfully'}), 200

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@admin_token_required
def delete_product(admin_id, product_id):
    execute_query("""
        UPDATE products SET status = 'inactive', updated_at = %s 
        WHERE product_id = %s
    """, (datetime.now(), product_id))
    
    execute_query("DELETE FROM cart WHERE product_id = %s", (product_id,))
    execute_query("DELETE FROM wishlist WHERE product_id = %s", (product_id,))
    
    current_app.cache.delete('featured_products')
    current_app.cache.delete(f'product_detail_{product_id}')
    
    return jsonify({'message': 'Product deleted successfully'}), 200

@admin_bp.route('/categories', methods=['GET'])
@admin_token_required
def get_categories(admin_id):
    categories = execute_query("""
        SELECT c.*, 
               (SELECT COUNT(*) FROM products WHERE category_id = c.category_id AND status = 'active') as product_count
        FROM categories c
        ORDER BY c.sort_order, c.category_name
    """, fetch_all=True)
    
    return jsonify({'categories': categories}), 200

@admin_bp.route('/categories', methods=['POST'])
@admin_token_required
def create_category(admin_id):
    data = request.get_json()
    
    category_name = data.get('category_name', '').strip()
    description = data.get('description', '').strip()
    sort_order = data.get('sort_order', 0)
    
    if not category_name:
        return jsonify({'error': 'Category name is required'}), 400
    
    execute_query("""
        INSERT INTO categories (category_name, description, sort_order, created_at)
        VALUES (%s, %s, %s, %s)
    """, (category_name, description, sort_order, datetime.now()))
    
    current_app.cache.delete('active_categories')
    
    return jsonify({'message': 'Category created successfully'}), 201

@admin_bp.route('/users', methods=['GET'])
@admin_token_required
def get_users(admin_id):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '').strip()
    status = request.args.get('status')
    
    offset = (page - 1) * per_page
    
    query = """
        SELECT user_id, email, first_name, last_name, phone, status, 
               email_verified, created_at
        FROM users WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (first_name LIKE %s OR last_name LIKE %s OR email LIKE %s)"
        search_param = f'%{search}%'
        params.extend([search_param, search_param, search_param])
    
    if status:
        query += " AND status = %s"
        params.append(status)
    
    query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    users = execute_query(query, params, fetch_all=True)
    
    return jsonify({'users': users}), 200

@admin_bp.route('/orders', methods=['GET'])
@admin_token_required
def get_orders(admin_id):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status = request.args.get('status')
    
    offset = (page - 1) * per_page
    
    query = """
        SELECT o.*, u.first_name, u.last_name, u.email,
               COUNT(oi.item_id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE 1=1
    """
    params = []
    
    if status:
        query += " AND o.status = %s"
        params.append(status)
    
    query += " GROUP BY o.order_id ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    orders = execute_query(query, params, fetch_all=True)
    
    return jsonify({'orders': orders}), 200

@admin_bp.route('/orders/<order_id>/status', methods=['PUT'])
@admin_token_required
def update_order_status(admin_id, order_id):
    data = request.get_json()
    status = data.get('status')
    
    valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    execute_query("""
        UPDATE orders SET status = %s, updated_at = %s WHERE order_id = %s
    """, (status, datetime.now(), order_id))
    
    return jsonify({'message': 'Order status updated successfully'}), 200

@admin_bp.route('/referrals/stats', methods=['GET'])
@admin_token_required
def get_referral_stats(admin_id):
    stats = ReferralModel.get_admin_stats()
    top_referrers = ReferralModel.get_top_referrers(20)
    
    recent_referrals = execute_query("""
        SELECT 
            u1.first_name as referrer_name, u1.email as referrer_email,
            u2.first_name as referred_name, u2.email as referred_email,
            ru.created_at, ru.reward_given, ru.first_purchase_date,
            rc.code
        FROM referral_uses ru
        JOIN referral_codes rc ON ru.referral_code_id = rc.id
        JOIN users u1 ON rc.user_id = u1.user_id
        JOIN users u2 ON ru.referred_user_id = u2.user_id
        ORDER BY ru.created_at DESC
        LIMIT 50
    """, fetch_all=True)
    
    return jsonify({
        'stats': stats,
        'top_referrers': top_referrers,
        'recent_referrals': recent_referrals
    }), 200

@admin_bp.route('/analytics/sales', methods=['GET'])
@admin_token_required
def get_sales_analytics(admin_id):
    period = request.args.get('period', '30d')
    
    if period == '7d':
        date_filter = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    elif period == '30d':
        date_filter = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
    elif period == '90d':
        date_filter = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)"
    else:
        date_filter = "1=1"
    
    daily_sales = execute_query(f"""
        SELECT DATE(created_at) as date, 
               COUNT(*) as orders,
               SUM(total_amount) as revenue
        FROM orders 
        WHERE {date_filter} AND status != 'cancelled'
        GROUP BY DATE(created_at)
        ORDER BY date
    """, fetch_all=True)
    
    top_products = execute_query(f"""
        SELECT oi.product_name, SUM(oi.quantity) as quantity_sold, 
               SUM(oi.total_price) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE {date_filter.replace('created_at', 'o.created_at')} AND o.status != 'cancelled'
        GROUP BY oi.product_id, oi.product_name
        ORDER BY quantity_sold DESC
        LIMIT 10
    """, fetch_all=True)
    
    return jsonify({
        'daily_sales': daily_sales,
        'top_products': top_products,
        'period': period
    }), 200

@admin_bp.route('/cache/clear', methods=['POST'])
@admin_token_required
def clear_cache(admin_id):
    data = request.get_json() or {}
    cache_type = data.get('type', 'all')
    
    if cache_type == 'all':
        current_app.cache.clear()
        message = 'All cache cleared'
    elif cache_type == 'products':
        current_app.cache.delete('featured_products')
        current_app.cache.delete('active_categories')
        message = 'Product cache cleared'
    
    return jsonify({'message': message}), 200