from flask import Blueprint, request, jsonify, current_app
from shared.models import execute_query
from shared.auth import admin_token_required
from shared.file_service import file_service
from shared.image_utils import convert_products_images, convert_product_images, convert_image_url
from datetime import datetime, timedelta
from cache_utils import invalidate_product_cache
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
    
    if not admin:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Handle password verification with error handling for hash type issues
    try:
        password_valid = verify_password(password, admin['password_hash'])
    except Exception as e:
        current_app.logger.error(f"Password verification error: {e}")
        # If hash verification fails due to incompatible format, check for plain text match (temporary fix)
        password_valid = (password == admin['password_hash'])
    
    if not password_valid:
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
    """Get dashboard statistics for admin panel"""
    # Get date ranges
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Get user stats
    total_users = execute_query("SELECT COUNT(*) as count FROM users", fetch_one=True)
    new_users_week = execute_query("""
        SELECT COUNT(*) as count FROM users 
        WHERE DATE(created_at) >= %s
    """, (week_ago,), fetch_one=True)
    
    new_users_month = execute_query("""
        SELECT COUNT(*) as count FROM users 
        WHERE DATE(created_at) >= %s
    """, (month_ago,), fetch_one=True)
    
    # Get product stats
    total_products = execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active'", fetch_one=True)
    featured_products = execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active' AND is_featured = 1", fetch_one=True)
    low_stock = execute_query("""
        SELECT COUNT(*) as count FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.quantity <= i.min_stock_level AND p.status = 'active'
    """, fetch_one=True)
    
    # Get order stats
    total_orders = execute_query("SELECT COUNT(*) as count FROM orders", fetch_one=True)
    orders_week = execute_query("""
        SELECT COUNT(*) as count FROM orders 
        WHERE DATE(created_at) >= %s
    """, (week_ago,), fetch_one=True)
    
    pending_orders = execute_query("""
        SELECT COUNT(*) as count FROM orders 
        WHERE status IN ('pending', 'confirmed')
    """, fetch_one=True)
    
    # Get revenue stats
    total_revenue = execute_query("""
        SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders 
        WHERE status NOT IN ('cancelled', 'refunded')
    """, fetch_one=True)
    
    revenue_month = execute_query("""
        SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders 
        WHERE DATE(created_at) >= %s AND status NOT IN ('cancelled', 'refunded')
    """, (month_ago,), fetch_one=True)
    
    # Get referral stats
    referral_stats = execute_query("""
        SELECT 
            COUNT(DISTINCT rc.id) as total_codes,
            COUNT(ru.id) as total_uses,
            SUM(CASE WHEN ru.reward_given = 1 THEN 1 ELSE 0 END) as successful_referrals,
            SUM(CASE WHEN ru.reward_given = 1 THEN 50 ELSE 0 END) as total_rewards_paid
        FROM referral_codes rc
        LEFT JOIN referral_uses ru ON rc.id = ru.referral_code_id
        WHERE rc.status = 'active'
    """, fetch_one=True)
    
    # Get recent orders for dashboard
    recent_orders = execute_query("""
        SELECT o.order_id, o.total_amount as total, o.status, o.created_at,
               CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC
        LIMIT 5
    """, fetch_all=True)
    
    # Format recent orders
    formatted_recent_orders = []
    for order in recent_orders:
        formatted_recent_orders.append({
            'order_id': order['order_id'],
            'total': float(order['total']),
            'status': order['status'],
            'customer_name': order['customer_name'],
            'created_at': order['created_at'].strftime('%Y-%m-%d %H:%M:%S') if order['created_at'] else ''
        })
    
    # Return data in the format expected by frontend
    return jsonify({
        'stats': {
            'users': {
                'total_users': total_users['count'] if total_users else 0,
                'new_users_30d': new_users_month['count'] if new_users_month else 0,
                'new_users_7d': new_users_week['count'] if new_users_week else 0
            },
            'products': {
                'total_products': total_products['count'] if total_products else 0,
                'featured_products': featured_products['count'] if featured_products else 0,
                'low_stock': low_stock['count'] if low_stock else 0
            },
            'orders': {
                'total_orders': total_orders['count'] if total_orders else 0,
                'orders_this_week': orders_week['count'] if orders_week else 0,
                'pending_orders': pending_orders['count'] if pending_orders else 0,
                'total_revenue': float(total_revenue['revenue']) if total_revenue else 0.0,
                'revenue_this_month': float(revenue_month['revenue']) if revenue_month else 0.0
            },
            'referrals': {
                'total_codes': referral_stats['total_codes'] if referral_stats else 0,
                'total_uses': referral_stats['total_uses'] if referral_stats else 0,
                'successful_referrals': referral_stats['successful_referrals'] if referral_stats else 0,
                'total_rewards_paid': float(referral_stats['total_rewards_paid']) if referral_stats else 0.0
            }
        },
        'recent_orders': formatted_recent_orders
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
        SELECT p.product_id, p.product_name, p.price, p.discount_price, 
               p.status, p.is_featured, p.sku, p.created_at,
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
               (SELECT i.quantity FROM inventory i 
                WHERE i.product_id = p.product_id) as stock_quantity
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = %s
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    images = execute_query("""
        SELECT * FROM product_images 
        WHERE product_id = %s 
        ORDER BY sort_order, is_primary DESC
    """, (product_id,), fetch_all=True)
    
    # Convert image URLs to absolute URLs
    product = convert_product_images(product)
    for img in images:
        img['image_url'] = convert_image_url(img['image_url'])
    
    return jsonify({
        'product': product,
        'images': images
    }), 200

@admin_bp.route('/products', methods=['POST'])
@admin_token_required
def create_product(admin_id):
    data = request.get_json()
    
    product_name = data.get('product_name', '').strip()
    description = data.get('description', '').strip()
    price = data.get('price')
    discount_price = data.get('discount_price')
    weight = data.get('weight', 0)
    brand = data.get('brand', '').strip()
    category_id = data.get('category_id')
    sku = data.get('sku', '').strip()
    stock_quantity = data.get('stock_quantity', 0)
    is_featured = data.get('is_featured', False)
    
    if not product_name or not price or not discount_price or not category_id:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not sku:
        sku = f"SKU{int(datetime.now().timestamp())}"
    
    product_id = execute_query("""
        INSERT INTO products (product_name, description, price, discount_price, 
                            weight, brand, category_id, sku, is_featured, status, created_at)
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
    stock_quantity = None
    if 'stock_quantity' in data:
        stock_quantity = data['stock_quantity']
        execute_query("""
            UPDATE inventory SET quantity = %s 
            WHERE product_id = %s
        """, (stock_quantity, product_id))
    
    # FIXED: Pass stock_quantity for WebSocket broadcast
    invalidate_product_cache(product_id, stock_quantity)
    
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
    image_url = data.get('image_url', '').strip()
    status = data.get('status', 'active')
    
    if not category_name:
        return jsonify({'error': 'Category name is required'}), 400
    
    execute_query("""
        INSERT INTO categories (category_name, description, sort_order, image_url, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (category_name, description, sort_order, image_url, status, datetime.now()))
    
    current_app.cache.delete('active_categories')
    
    return jsonify({'message': 'Category created successfully'}), 201

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
    # Get force parameter from query string
    force = request.args.get('force', 'false').lower() == 'true'
    
    print(f"Delete category request: category_id={category_id}, force={force}, admin_id={admin_id}")
    
    # Validate category exists
    existing_category = execute_query("""
        SELECT category_id, category_name FROM categories WHERE category_id = %s
    """, (category_id,), fetch_one=True)
    
    if not existing_category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Check if category has products
    product_count = execute_query("""
        SELECT COUNT(*) as count FROM products 
        WHERE category_id = %s AND status != 'inactive'
    """, (category_id,), fetch_one=True)
    
    print(f"Category {category_id} has {product_count['count']} products")
    
    if product_count['count'] > 0:
        if not force:
            # Normal delete - reject if has products
            return jsonify({
                'error': f'Cannot delete category. It contains {product_count["count"]} products. Please move or delete the products first.',
                'product_count': product_count['count']
            }), 400
        else:
            # Force delete - MAKE PRODUCTS INACTIVE INSTEAD OF MOVING TO UNCATEGORIZED
            print(f"Force deleting category {category_id} with {product_count['count']} products")
            
            # Set all products in this category to inactive status
            try:
                execute_query("""
                    UPDATE products 
                    SET status = 'inactive', updated_at = %s 
                    WHERE category_id = %s AND status != 'inactive'
                """, (datetime.now(), category_id))
                
                print(f"Set {product_count['count']} products to inactive status")
                
                # Clean up related data for inactive products
                inactive_products = execute_query("""
                    SELECT product_id FROM products 
                    WHERE category_id = %s AND status = 'inactive'
                """, (category_id,), fetch_all=True)
                
                for product in inactive_products:
                    product_id = product['product_id']
                    # Remove from carts and wishlists
                    execute_query("DELETE FROM cart WHERE product_id = %s", (product_id,))
                    execute_query("DELETE FROM wishlist WHERE product_id = %s", (product_id,))
                
                print(f"Cleaned up cart and wishlist entries for inactive products")
                
            except Exception as e:
                print(f"Error setting products inactive: {e}")
                return jsonify({'error': 'Failed to update products status'}), 500
    
    # Now delete the category (change status to inactive)
    try:
        execute_query("""
            UPDATE categories 
            SET status = 'inactive', updated_at = %s 
            WHERE category_id = %s
        """, (datetime.now(), category_id))
        
        print(f"Successfully deleted category {category_id}")
        
    except Exception as e:
        print(f"Error deleting category: {e}")
        return jsonify({'error': 'Failed to delete category'}), 500
    
    # Clear cache
    try:
        current_app.cache.delete('active_categories')
        current_app.cache.delete('featured_products')
        # Clear product caches for affected products
        if product_count['count'] > 0:
            for product in inactive_products:
                current_app.cache.delete(f'product_detail_{product["product_id"]}')
    except:
        pass  # Cache delete is not critical
    
    success_message = 'Category deleted successfully'
    if product_count['count'] > 0 and force:
        success_message += f' ({product_count["count"]} products set to inactive)'
    
    return jsonify({
        'message': success_message,
        'products_affected': product_count['count'] if force else 0
    }), 200

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
               COUNT(oi.item_id) as item_count
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

@admin_bp.route('/orders/<string:order_id>/status', methods=['PUT'])
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

@admin_bp.route('/referrals', methods=['GET'])
@admin_token_required
def get_all_referrals(admin_id):
    """Get all referrals with pagination and filtering"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip()
    
    # Base query to get referral data
    base_query = """
        SELECT 
            r.user_id as referral_id,
            referrer.first_name as referrer_name,
            referrer.last_name as referrer_last_name,
            referrer.email as referrer_email,
            referred.first_name as referred_name,
            referred.last_name as referred_last_name,
            referred.email as referred_email,
            referrer.referral_code as code,
            referred.created_at as date,
            CASE 
                WHEN referred.status = 'active' THEN 'approved'
                WHEN referred.status = 'inactive' THEN 'rejected'
                ELSE 'pending'
            END as status,
            '50.00' as reward
        FROM users r
        JOIN users referrer ON r.referred_by = referrer.user_id
        JOIN users referred ON r.user_id = referred.user_id
        WHERE r.referred_by IS NOT NULL
    """
    
    # Add search filter
    if search:
        base_query += """ AND (
            referrer.first_name LIKE %s OR 
            referrer.last_name LIKE %s OR 
            referrer.email LIKE %s OR
            referred.first_name LIKE %s OR 
            referred.last_name LIKE %s OR 
            referred.email LIKE %s OR
            referrer.referral_code LIKE %s
        )"""
        search_param = f"%{search}%"
        search_params = [search_param] * 7
    else:
        search_params = []
    
    # Add status filter
    if status_filter and status_filter != 'all':
        if status_filter == 'approved':
            base_query += " AND referred.status = 'active'"
        elif status_filter == 'rejected':
            base_query += " AND referred.status = 'inactive'"
        elif status_filter == 'pending':
            base_query += " AND referred.status NOT IN ('active', 'inactive')"
    
    # Get total count
    count_query = f"SELECT COUNT(*) as total FROM ({base_query}) as referral_count"
    total_result = execute_query(count_query, search_params, fetch_one=True)
    total = total_result['total'] if total_result else 0
    
    # Add pagination
    offset = (page - 1) * per_page
    base_query += f" ORDER BY referred.created_at DESC LIMIT {per_page} OFFSET {offset}"
    
    # Execute main query
    referrals = execute_query(base_query, search_params, fetch_all=True)
    
    # Format the results
    formatted_referrals = []
    for ref in referrals:
        formatted_referrals.append({
            'referral_id': ref['referral_id'],
            'referrer_name': f"{ref['referrer_name']} {ref['referrer_last_name']}",
            'referrer_email': ref['referrer_email'],
            'referred_name': f"{ref['referred_name']} {ref['referred_last_name']}",
            'referred_email': ref['referred_email'],
            'code': ref['code'],
            'date': ref['date'].strftime('%Y-%m-%d') if ref['date'] else '',
            'status': ref['status'],
            'reward': ref['reward']
        })
    
    # Calculate stats
    stats = {
        'total': total,
        'pending': len([r for r in formatted_referrals if r['status'] == 'pending']),
        'approved': len([r for r in formatted_referrals if r['status'] == 'approved']),
        'rejected': len([r for r in formatted_referrals if r['status'] == 'rejected']),
        'total_rewards': sum(float(r['reward']) for r in formatted_referrals if r['status'] == 'approved')
    }
    
    return jsonify({
        'referrals': formatted_referrals,
        'stats': stats,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }
    }), 200

@admin_bp.route('/referrals/<int:referral_id>/status', methods=['PUT'])
@admin_token_required
def update_referral_status(admin_id, referral_id):
    """Update referral status (approve/reject)"""
    data = request.get_json()
    new_status = data.get('status', '').strip().lower()
    
    if new_status not in ['approved', 'rejected', 'pending']:
        return jsonify({'error': 'Invalid status. Must be approved, rejected, or pending'}), 400
    
    # Map frontend status to database status
    db_status_map = {
        'approved': 'active',
        'rejected': 'inactive', 
        'pending': 'pending'
    }
    db_status = db_status_map[new_status]
    
    # Update the referred user's status
    execute_query("""
        UPDATE users 
        SET status = %s, updated_at = NOW()
        WHERE user_id = %s AND referred_by IS NOT NULL
    """, (db_status, referral_id))
    
    # If approved, add wallet bonus
    if new_status == 'approved':
        # Add bonus to referrer's wallet
        referrer = execute_query("""
            SELECT referred_by FROM users WHERE user_id = %s
        """, (referral_id,), fetch_one=True)
        
        if referrer:
            execute_query("""
                UPDATE wallet 
                SET balance = balance + 50, updated_at = NOW()
                WHERE user_id = %s
            """, (referrer['referred_by'],))
            
            # Log the transaction
            execute_query("""
                INSERT INTO wallet_transactions (user_id, type, amount, description, created_at)
                VALUES (%s, 'credit', 50.00, 'Referral bonus', NOW())
            """, (referrer['referred_by'],))
    
    return jsonify({'message': f'Referral status updated to {new_status}'}), 200

@admin_bp.route('/referrals/stats', methods=['GET'])
@admin_token_required  
def get_referral_stats(admin_id):
    """Get referral statistics for admin dashboard"""
    stats = execute_query("""
        SELECT 
            COUNT(*) as total_referrals,
            SUM(CASE WHEN referred.status = 'active' THEN 1 ELSE 0 END) as approved_referrals,
            SUM(CASE WHEN referred.status = 'inactive' THEN 1 ELSE 0 END) as rejected_referrals,
            SUM(CASE WHEN referred.status NOT IN ('active', 'inactive') THEN 1 ELSE 0 END) as pending_referrals,
            SUM(CASE WHEN referred.status = 'active' THEN 50 ELSE 0 END) as total_rewards_paid
        FROM users referrer
        JOIN users referred ON referrer.user_id = referred.referred_by
        WHERE referred.referred_by IS NOT NULL
    """, fetch_one=True)
    
    return jsonify({
        'total_referrals': stats['total_referrals'] or 0,
        'approved_referrals': stats['approved_referrals'] or 0,
        'rejected_referrals': stats['rejected_referrals'] or 0, 
        'pending_referrals': stats['pending_referrals'] or 0,
        'total_rewards_paid': float(stats['total_rewards_paid'] or 0)
    }), 200