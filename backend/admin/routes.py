from flask import Blueprint, request, jsonify, current_app
from shared.models import execute_query
from shared.auth import admin_token_required
from shared.file_service import file_service
from shared.image_utils import convert_products_images, convert_product_images, convert_image_url
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/auth/login', methods=['POST'])
def admin_login():
    from shared.utils import generate_token, hash_password, verify_password
    
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    admin = execute_query("""
        SELECT admin_id, username, password_hash, full_name, role, status
        FROM admin_users 
        WHERE username = %s AND status = 'active'
    """, (username,), fetch_one=True)
    
    if not admin or not verify_password(password, admin['password_hash']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = generate_token(admin['admin_id'], 'admin')
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'admin': {
            'admin_id': admin['admin_id'],
            'username': admin['username'],
            'full_name': admin['full_name'],
            'role': admin['role']
        }
    }), 200

@admin_bp.route('/dashboard', methods=['GET'])
@admin_token_required
def get_dashboard_stats(admin_id):
    # Get date range for stats
    today = datetime.now().date()
    last_week = today - timedelta(days=7)
    last_month = today - timedelta(days=30)
    
    # Total counts
    total_products = execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active'", fetch_one=True)['count']
    total_users = execute_query("SELECT COUNT(*) as count FROM users WHERE status = 'active'", fetch_one=True)['count']
    total_orders = execute_query("SELECT COUNT(*) as count FROM orders", fetch_one=True)['count']
    
    # Revenue stats
    total_revenue = execute_query("""
        SELECT COALESCE(SUM(total_amount), 0) as revenue 
        FROM orders WHERE status IN ('completed', 'delivered')
    """, fetch_one=True)['revenue']
    
    monthly_revenue = execute_query("""
        SELECT COALESCE(SUM(total_amount), 0) as revenue 
        FROM orders 
        WHERE status IN ('completed', 'delivered') 
        AND created_at >= %s
    """, (last_month,), fetch_one=True)['revenue']
    
    # Recent orders
    recent_orders = execute_query("""
        SELECT o.order_id, o.total_amount, o.status, o.created_at,
               u.first_name, u.last_name, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC
        LIMIT 10
    """, fetch_all=True)
    
    # Low stock products
    low_stock = execute_query("""
        SELECT p.product_name, i.quantity, i.min_stock_level,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image
        FROM products p
        JOIN inventory i ON p.product_id = i.product_id
        WHERE i.quantity <= i.min_stock_level AND p.status = 'active'
        ORDER BY i.quantity ASC
        LIMIT 10
    """, fetch_all=True)
    
    # Convert image URLs for low stock products
    low_stock = convert_products_images(low_stock)
    
    return jsonify({
        'stats': {
            'total_products': total_products,
            'total_users': total_users,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue) if total_revenue else 0,
            'monthly_revenue': float(monthly_revenue) if monthly_revenue else 0
        },
        'recent_orders': recent_orders,
        'low_stock': low_stock
    }), 200

@admin_bp.route('/products', methods=['GET'])
@admin_token_required
def get_products(admin_id):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '').strip()
    status = request.args.get('status')
    
    offset = (page - 1) * per_page
    
    query = """
        SELECT p.product_id, p.product_name, p.sku, p.brand, p.price, 
               p.discount_price, p.status, p.is_featured, p.created_at,
               c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i 
                WHERE i.product_id = p.product_id) as stock_quantity
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
    
    # Convert image URLs to absolute URLs
    products = convert_products_images(products)
    
    # Get total count for pagination
    count_query = """
        SELECT COUNT(*) as total FROM products p 
        WHERE 1=1
    """
    count_params = []
    
    if search:
        count_query += " AND (p.product_name LIKE %s OR p.sku LIKE %s)"
        count_params.extend([f'%{search}%', f'%{search}%'])
    
    if status:
        count_query += " AND p.status = %s"
        count_params.append(status)
    
    total_count = execute_query(count_query, count_params, fetch_one=True)['total']
    
    return jsonify({
        'products': products,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'pages': (total_count + per_page - 1) // per_page
        }
    }), 200

@admin_bp.route('/products/<int:product_id>', methods=['GET'])
@admin_token_required
def get_product_by_id(admin_id, product_id):
    product = execute_query("""
        SELECT p.*, c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = %s
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Get product images
    images = execute_query("""
        SELECT * FROM product_images 
        WHERE product_id = %s 
        ORDER BY sort_order, is_primary DESC
    """, (product_id,), fetch_all=True)
    
    # Convert image URLs to absolute URLs
    product = convert_product_images(product)
    for img in images:
        img['image_url'] = convert_image_url(img['image_url'])
    
    product['images'] = images
    
    return jsonify({'product': product}), 200

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
    weight = float(data.get('weight', 0)) if data.get('weight') else None
    stock_quantity = int(data.get('stock_quantity', 0))
    is_featured = bool(data.get('is_featured', False))
    
    if not product_name or not category_id or not price:
        return jsonify({'error': 'Product name, category, and price are required'}), 400
    
    if not sku:
        import random
        sku = f"PRD{random.randint(100000, 999999)}"
    
    # Insert product
    product_id = execute_query("""
        INSERT INTO products 
        (product_name, description, category_id, brand, sku, price, discount_price, 
         weight, is_featured, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s)
    """, (product_name, description, category_id, brand, sku, price, discount_price, 
          weight, is_featured, datetime.now()), get_insert_id=True)
    
    # Add to inventory
    execute_query("""
        INSERT INTO inventory (product_id, quantity, min_stock_level, max_stock_level)
        VALUES (%s, %s, %s, %s)
    """, (product_id, stock_quantity, 10, stock_quantity * 3))
    
    # Clear cache
    current_app.cache.delete('featured_products')
    current_app.cache.delete('active_categories')
    
    return jsonify({
        'message': 'Product created successfully',
        'product_id': product_id
    }), 201

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@admin_token_required
def update_product(admin_id, product_id):
    data = request.get_json()
    
    update_fields = []
    params = []
    
    updatable_fields = ['product_name', 'description', 'brand', 'price', 'discount_price', 
                       'weight', 'status', 'is_featured', 'category_id']
    
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
    
    # Update inventory if stock_quantity is provided
    if 'stock_quantity' in data:
        execute_query("""
            UPDATE inventory SET quantity = %s 
            WHERE product_id = %s
        """, (data['stock_quantity'], product_id))
    
    # Clear cache
    current_app.cache.delete('featured_products')
    current_app.cache.delete(f'product_detail_{product_id}')
    
    return jsonify({'message': 'Product updated successfully'}), 200

@admin_bp.route('/products/<int:product_id>/images', methods=['POST'])
@admin_token_required
def upload_product_image(admin_id, product_id):
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    is_primary = request.form.get('is_primary', 'false').lower() == 'true'
    alt_text = request.form.get('alt_text', '')
    
    # Upload image
    result, message = file_service.save_image(file, 'products')
    if not result:
        return jsonify({'error': message}), 400
    
    # If this is set as primary, unset others
    if is_primary:
        execute_query("""
            UPDATE product_images SET is_primary = FALSE 
            WHERE product_id = %s
        """, (product_id,))
    
    # Get next sort order
    sort_order = execute_query("""
        SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
        FROM product_images WHERE product_id = %s
    """, (product_id,), fetch_one=True)['next_order']
    
    # Save to database (store relative URL)
    relative_url = result['main_url'].replace(file_service.get_base_url(), '')
    
    execute_query("""
        INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
        VALUES (%s, %s, %s, %s, %s)
    """, (product_id, relative_url, alt_text, sort_order, is_primary))
    
    # Update product primary_image if this is primary
    if is_primary:
        execute_query("""
            UPDATE products SET primary_image = %s 
            WHERE product_id = %s
        """, (relative_url, product_id))
    
    return jsonify({
        'message': 'Image uploaded successfully',
        'image_url': result['main_url']  # Return absolute URL
    }), 201

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@admin_token_required
def delete_product(admin_id, product_id):
    # Get product images for deletion
    images = execute_query("""
        SELECT image_url FROM product_images WHERE product_id = %s
    """, (product_id,), fetch_all=True)
    
    # Delete image files
    for img in images:
        file_service.delete_image(img['image_url'], 'products')
    
    # Soft delete product
    execute_query("""
        UPDATE products SET status = 'inactive', updated_at = %s 
        WHERE product_id = %s
    """, (datetime.now(), product_id))
    
    # Clean up related data
    execute_query("DELETE FROM cart WHERE product_id = %s", (product_id,))
    execute_query("DELETE FROM wishlist WHERE product_id = %s", (product_id,))
    execute_query("DELETE FROM product_images WHERE product_id = %s", (product_id,))
    
    # Clear cache
    current_app.cache.delete('featured_products')
    current_app.cache.delete(f'product_detail_{product_id}')
    
    return jsonify({'message': 'Product deleted successfully'}), 200

@admin_bp.route('/categories', methods=['GET'])
@admin_token_required
def get_categories(admin_id):
    categories = execute_query("""
        SELECT c.category_id, c.category_name, c.description, c.status, 
               c.sort_order, c.created_at, c.image_url,
               (SELECT COUNT(*) FROM products 
                WHERE category_id = c.category_id AND status = 'active') as product_count
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
               email_verified, created_at,
               (SELECT COUNT(*) FROM orders WHERE user_id = u.user_id) as order_count
        FROM users u WHERE 1=1
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
        SELECT o.order_id, o.total_amount, o.status, o.created_at,
               u.first_name, u.last_name, u.email,
               COUNT(oi.order_item_id) as item_count
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE 1=1
    """
    params = []
    
    if status:
        query += " AND o.status = %s"
        params.append(status)
    
    query += """
        GROUP BY o.order_id
        ORDER BY o.created_at DESC 
        LIMIT %s OFFSET %s
    """
    params.extend([per_page, offset])
    
    orders = execute_query(query, params, fetch_all=True)
    
    return jsonify({'orders': orders}), 200

@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@admin_token_required
def update_order_status(admin_id, order_id):
    data = request.get_json()
    new_status = data.get('status')
    
    valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    execute_query("""
        UPDATE orders SET status = %s, updated_at = %s 
        WHERE order_id = %s
    """, (new_status, datetime.now(), order_id))
    
    return jsonify({'message': 'Order status updated successfully'}), 200

@admin_bp.route('/analytics/sales', methods=['GET'])
@admin_token_required
def get_sales_analytics(admin_id):
    period = request.args.get('period', '7')  # days
    
    try:
        days = int(period)
    except ValueError:
        days = 7
    
    start_date = datetime.now() - timedelta(days=days)
    date_filter = f"created_at >= '{start_date.strftime('%Y-%m-%d')}'"
    
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
# Add these routes to your backend/admin/routes.py file
# Add them after your existing category routes

@admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
@admin_token_required
def update_category(admin_id, category_id):
    data = request.get_json()
    
    # Validate category exists
    existing_category = execute_query("""
        SELECT category_id FROM categories WHERE category_id = %s
    """, (category_id,), fetch_one=True)
    
    if not existing_category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Get update data
    category_name = data.get('category_name', '').strip()
    description = data.get('description', '').strip()
    sort_order = data.get('sort_order', 0)
    image_url = data.get('image_url', '').strip()
    status = data.get('status', 'active')
    
    if not category_name:
        return jsonify({'error': 'Category name is required'}), 400
    
    # Check for duplicate name (excluding current category)
    existing_name = execute_query("""
        SELECT category_id FROM categories 
        WHERE category_name = %s AND category_id != %s
    """, (category_name, category_id), fetch_one=True)
    
    if existing_name:
        return jsonify({'error': 'Category name already exists'}), 400
    
    # Update category
    execute_query("""
        UPDATE categories 
        SET category_name = %s, description = %s, sort_order = %s, 
            image_url = %s, status = %s, updated_at = %s
        WHERE category_id = %s
    """, (category_name, description, sort_order, image_url, status, datetime.now(), category_id))
    
    # Clear cache
    current_app.cache.delete('active_categories')
    
    return jsonify({'message': 'Category updated successfully'}), 200

@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@admin_token_required
def delete_category(admin_id, category_id):
    # Validate category exists
    existing_category = execute_query("""
        SELECT category_id, category_name FROM categories WHERE category_id = %s
    """, (category_id,), fetch_one=True)
    
    if not existing_category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Check if category has products
    product_count = execute_query("""
        SELECT COUNT(*) as count FROM products 
        WHERE category_id = %s AND status != 'deleted'
    """, (category_id,), fetch_one=True)
    
    if product_count['count'] > 0:
        return jsonify({
            'error': f'Cannot delete category. It contains {product_count["count"]} products. Please move or delete the products first.'
        }), 400
    
    # Delete category (soft delete)
    execute_query("""
        UPDATE categories 
        SET status = 'deleted', updated_at = %s 
        WHERE category_id = %s
    """, (datetime.now(), category_id))
    
    # Alternative: Hard delete if you prefer
    # execute_query("DELETE FROM categories WHERE category_id = %s", (category_id,))
    
    # Clear cache
    current_app.cache.delete('active_categories')
    
    return jsonify({'message': 'Category deleted successfully'}), 200

@admin_bp.route('/categories/<int:category_id>', methods=['GET'])
@admin_token_required
def get_category_by_id(admin_id, category_id):
    """Get a single category by ID"""
    category = execute_query("""
        SELECT c.category_id, c.category_name, c.description, c.status, 
               c.sort_order, c.created_at, c.updated_at, c.image_url,
               (SELECT COUNT(*) FROM products 
                WHERE category_id = c.category_id AND status = 'active') as product_count
        FROM categories c
        WHERE c.category_id = %s AND c.status != 'deleted'
    """, (category_id,), fetch_one=True)
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify({'category': category}), 200

@admin_bp.route('/categories/<int:category_id>/products', methods=['GET'])
@admin_token_required
def get_category_products(admin_id, category_id):
    """Get all products in a specific category"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset = (page - 1) * per_page
    
    # Validate category exists
    category = execute_query("""
        SELECT category_name FROM categories WHERE category_id = %s AND status != 'deleted'
    """, (category_id,), fetch_one=True)
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Get products in category
    products = execute_query("""
        SELECT p.product_id, p.product_name, p.price, p.discount_price, 
               p.status, p.is_featured, p.primary_image, p.sku,
               i.quantity as stock_quantity
        FROM products p
        LEFT JOIN inventory i ON p.product_id = i.product_id
        WHERE p.category_id = %s AND p.status != 'deleted'
        ORDER BY p.product_name
        LIMIT %s OFFSET %s
    """, (category_id, per_page, offset), fetch_all=True)
    
    # Get total count
    total_count = execute_query("""
        SELECT COUNT(*) as count FROM products 
        WHERE category_id = %s AND status != 'deleted'
    """, (category_id,), fetch_one=True)
    
    return jsonify({
        'products': products,
        'category': category,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count['count'],
            'pages': (total_count['count'] + per_page - 1) // per_page
        }
    }), 200