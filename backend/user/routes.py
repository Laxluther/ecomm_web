from flask import Blueprint, request, jsonify, current_app
from shared.models import execute_query
from shared.auth import user_token_required
from shared.utils import APIResponse, validate_email, send_email
from shared.image_utils import convert_products_images, convert_product_images, convert_category_images, convert_image_url
from datetime import datetime, timedelta
import uuid
import json

user_bp = Blueprint('user', __name__)

# Authentication Routes
@user_bp.route('/auth/register', methods=['POST'])
def user_register():
    from shared.utils import generate_token, hash_password
    
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()
    referral_code = data.get('referral_code', '').strip()
    
    if not all([email, password, first_name, last_name, phone]):
        return APIResponse.error('All fields are required', 400)
    
    if not validate_email(email):
        return APIResponse.error('Invalid email format', 400)
    
    if len(password) < 6:
        return APIResponse.error('Password must be at least 6 characters', 400)
    
    # Check if user already exists
    existing_user = execute_query("""
        SELECT user_id FROM users WHERE email = %s
    """, (email,), fetch_one=True)
    
    if existing_user:
        return APIResponse.error('Email already registered', 400)
    
    # Handle referral
    referral_bonus = 0
    referrer_user_id = None
    if referral_code:
        referrer = execute_query("""
            SELECT user_id FROM users WHERE referral_code = %s AND status = 'active'
        """, (referral_code,), fetch_one=True)
        if referrer:
            referrer_user_id = referrer['user_id']
            referral_bonus = 50  # ₹50 bonus
    
    # Create user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    user_referral_code = f"REF{uuid.uuid4().hex[:8].upper()}"
    
    execute_query("""
        INSERT INTO users (
            user_id, email, password_hash, first_name, last_name, phone,
            referral_code, referred_by, status, email_verified, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active', FALSE, %s)
    """, (user_id, email, password_hash, first_name, last_name, phone,
          user_referral_code, referrer_user_id, datetime.now()))
    
    # Create wallet with referral bonus
    execute_query("""
        INSERT INTO wallet (user_id, balance, created_at)
        VALUES (%s, %s, %s)
    """, (user_id, referral_bonus, datetime.now()))
    
    # Record referral transaction if applicable
    if referral_bonus > 0:
        execute_query("""
            INSERT INTO wallet_transactions (
                user_id, transaction_type, amount, description, created_at
            ) VALUES (%s, 'credit', %s, 'Referral signup bonus', %s)
        """, (user_id, referral_bonus, datetime.now()))
    
    token = generate_token(user_id, 'user')
    
    return APIResponse.success({
        'token': token,
        'user': {
            'user_id': user_id,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'referral_code': user_referral_code
        }
    }, 'Registration successful', 201)

@user_bp.route('/auth/login', methods=['POST'])
def user_login():
    from shared.utils import generate_token, verify_password
    
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return APIResponse.error('Email and password required', 400)
    
    user = execute_query("""
        SELECT user_id, email, password_hash, first_name, last_name, 
               referral_code, status, email_verified
        FROM users 
        WHERE email = %s
    """, (email,), fetch_one=True)
    
    if not user or user['status'] != 'active':
        return APIResponse.error('User not found or inactive', 404)
    
    if not verify_password(password, user['password_hash']):
        return APIResponse.error('Invalid credentials', 401)
    
    token = generate_token(user['user_id'], 'user')
    
    return APIResponse.success({
        'token': token,
        'user': {
            'user_id': user['user_id'],
            'email': user['email'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'referral_code': user['referral_code'],
            'email_verified': bool(user['email_verified'])
        }
    }, 'Login successful')

@user_bp.route('/auth/me', methods=['GET'])
@user_token_required
def get_current_user(user_id):
    user = execute_query("""
        SELECT user_id, email, first_name, last_name, phone, 
               referral_code, email_verified, created_at
        FROM users 
        WHERE user_id = %s
    """, (user_id,), fetch_one=True)
    
    if not user:
        return APIResponse.not_found('User not found')
    
    return APIResponse.success({'user': user})

# Product Routes
@user_bp.route('/products', methods=['GET'])
def get_products():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    category_id = request.args.get('category_id')
    search_query = request.args.get('search', '').strip()
    sort_by = request.args.get('sort_by', 'created_at')  # ADD THIS LINE
    
    if category_id:
        try:
            category_id = int(category_id)
        except (ValueError, TypeError):
            category_id = None  
    
    offset = (page - 1) * per_page
    
    # CHANGE THIS LINE - add sort_by to cache key
    cache_key = f'user_products_{page}_{per_page}_{category_id}_{search_query}_{sort_by}'
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify(cached_data), 200  # CHANGE: return cached_data directly
    
    query = """
        SELECT p.product_id, p.product_name, p.description, p.price, 
               p.discount_price, p.brand, p.sku, p.weight, p.created_at,
               c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i 
                WHERE i.product_id = p.product_id) as stock_quantity
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.status = 'active' AND c.status = 'active'
    """
    
    params = []
    
    if category_id:
        query += " AND p.category_id = %s"
        params.append(category_id)
    
    if search_query:
        query += " AND (p.product_name LIKE %s OR p.description LIKE %s)"
        params.extend([f'%{search_query}%', f'%{search_query}%'])
    
    # ADD THIS ENTIRE SECTION FOR SORTING
    sort_mapping = {
        'name': 'p.product_name ASC',
        'price_low': 'p.discount_price ASC, p.price ASC',
        'price_high': 'p.discount_price DESC, p.price DESC',
        'newest': 'p.created_at DESC',
        'created_at': 'p.created_at DESC'
    }
    
    order_clause = sort_mapping.get(sort_by, 'p.created_at DESC')
    query += f" ORDER BY {order_clause}"
    
    # ADD THIS SECTION FOR TOTAL COUNT
    count_query = """
        SELECT COUNT(*) as total
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.status = 'active' AND c.status = 'active'
    """
    
    count_params = []
    if category_id:
        count_query += " AND p.category_id = %s"
        count_params.append(category_id)
    
    if search_query:
        count_query += " AND (p.product_name LIKE %s OR p.description LIKE %s)"
        count_params.extend([f'%{search_query}%', f'%{search_query}%'])
    
    total_count = execute_query(count_query, count_params, fetch_one=True)['total']
    
    # KEEP THIS EXISTING SECTION BUT MODIFY THE RETURN
    query += " LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    products = execute_query(query, params, fetch_all=True)
    
    for product in products:
        product['in_stock'] = (product.get('stock_quantity') or 0) > 0
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
        else:
            product['savings'] = 0
        
        if product.get('primary_image'):
            product['primary_image'] = convert_image_url(product['primary_image'])
    
    # REPLACE YOUR EXISTING RETURN WITH THIS
    response_data = {
        'products': products,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'pages': (total_count + per_page - 1) // per_page,
            'has_next': page < ((total_count + per_page - 1) // per_page),
            'has_prev': page > 1
        },
        'cached': False
    }
    
    current_app.cache.set(cache_key, response_data, timeout=300)
    
    return jsonify(response_data), 200

@user_bp.route('/products/featured', methods=['GET'])
def get_featured_products():
    cache_key = 'user_featured_products'
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({'products': cached_data, 'cached': True}), 200
    
    products = execute_query("""
        SELECT p.product_id, p.product_name, p.price, p.discount_price, p.brand,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image
        FROM products p 
        WHERE p.is_featured = 1 AND p.status = 'active'
        ORDER BY p.created_at DESC 
        LIMIT 8
    """, fetch_all=True)
    
    for product in products:
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
        else:
            product['savings'] = 0
    
    # Convert image URLs to absolute URLs
    products = convert_products_images(products)
    
    current_app.cache.set(cache_key, products, timeout=600)
    return jsonify({'products': products, 'cached': False}), 200

@user_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    cache_key = f'user_product_detail_{product_id}'
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({**cached_data, 'cached': True}), 200
    
    product = execute_query("""
        SELECT p.*, c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i 
                WHERE i.product_id = p.product_id) as stock
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = %s AND p.status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    images = execute_query("""
        SELECT * FROM product_images 
        WHERE product_id = %s 
        ORDER BY sort_order, is_primary DESC
    """, (product_id,), fetch_all=True)
    
    reviews = execute_query("""
        SELECT r.rating, r.comment, r.created_at, 
               u.first_name, u.last_name
        FROM reviews r 
        JOIN users u ON r.user_id = u.user_id 
        WHERE r.product_id = %s AND r.status = 'approved'
        ORDER BY r.created_at DESC LIMIT 10
    """, (product_id,), fetch_all=True)
    
    avg_rating = execute_query("""
        SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
        FROM reviews 
        WHERE product_id = %s AND status = 'approved'
    """, (product_id,), fetch_one=True)
    
    # Convert image URLs to absolute URLs
    product = convert_product_images(product)
    for img in images:
        img['image_url'] = convert_image_url(img['image_url'])
    
    product['in_stock'] = (product.get('stock') or 0) > 0
    if product.get('discount_price') and product.get('price'):
        product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
    else:
        product['savings'] = 0
    
    product_data = {
        'product': product,
        'images': images,
        'reviews': reviews,
        'rating': {
            'average': round(float(avg_rating['avg_rating'] or 0), 1),
            'total_reviews': avg_rating['total_reviews']
        },
        'cached': False
    }
    
    current_app.cache.set(cache_key, product_data, timeout=900)
    return jsonify(product_data), 200

@user_bp.route('/categories', methods=['GET'])
def get_categories():
    cache_key = 'user_categories'
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({'categories': cached_data, 'cached': True}), 200
    
    categories = execute_query("""
        SELECT c.*, 
               (SELECT COUNT(*) FROM products p 
                WHERE p.category_id = c.category_id AND p.status = 'active') as product_count
        FROM categories c
        WHERE c.status = 'active' 
        ORDER BY c.sort_order, c.category_name
    """, fetch_all=True)
    
    # Convert image URLs to absolute URLs
    categories = convert_category_images(categories)
    
    current_app.cache.set(cache_key, categories, timeout=3600)
    return jsonify({'categories': categories, 'cached': False}), 200

# Cart Routes
@user_bp.route('/cart', methods=['GET'])
@user_token_required
def get_cart(user_id):
    cart_items = execute_query("""
        SELECT c.*, p.product_name, p.price, p.discount_price,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as image_url
        FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.user_id = %s AND p.status = 'active'
    """, (user_id,), fetch_all=True)
    
    # Convert image URLs to absolute URLs
    for item in cart_items:
        item['image_url'] = convert_image_url(item['image_url'])
    
    subtotal = sum([
        (float(item['discount_price']) if item['discount_price'] else float(item['price'])) * item['quantity']
        for item in cart_items
    ])
    
    return jsonify({
        'cart_items': cart_items,
        'summary': {
            'subtotal': round(subtotal, 2),
            'total_items': sum([item['quantity'] for item in cart_items])
        }
    }), 200

@user_bp.route('/cart/add', methods=['POST'])
@user_token_required
def add_to_cart(user_id):
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id or quantity <= 0:
        return APIResponse.error('Invalid product or quantity', 400)
    
    product = execute_query("""
        SELECT product_id FROM products 
        WHERE product_id = %s AND status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return APIResponse.error('Product not found', 404)
    
    existing = execute_query("""
        SELECT cart_id, quantity FROM cart 
        WHERE user_id = %s AND product_id = %s
    """, (user_id, product_id), fetch_one=True)
    
    if existing:
        new_quantity = existing['quantity'] + quantity
        execute_query("""
            UPDATE cart SET quantity = %s, updated_at = %s 
            WHERE cart_id = %s
        """, (new_quantity, datetime.now(), existing['cart_id']))
    else:
        execute_query("""
            INSERT INTO cart (user_id, product_id, quantity, created_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, product_id, quantity, datetime.now()))
    
    return APIResponse.success(None, 'Item added to cart')

@user_bp.route('/cart/update', methods=['PUT'])
@user_token_required
def update_cart(user_id):
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    
    if not product_id or quantity < 0:
        return APIResponse.error('Invalid product or quantity', 400)
    
    if quantity == 0:
        execute_query("""
            DELETE FROM cart WHERE user_id = %s AND product_id = %s
        """, (user_id, product_id))
    else:
        execute_query("""
            UPDATE cart SET quantity = %s, updated_at = %s 
            WHERE user_id = %s AND product_id = %s
        """, (quantity, datetime.now(), user_id, product_id))
    
    return APIResponse.success(None, 'Cart updated')

@user_bp.route('/cart/remove/<int:product_id>', methods=['DELETE'])
@user_token_required
def remove_from_cart(user_id, product_id):
    execute_query("""
        DELETE FROM cart WHERE user_id = %s AND product_id = %s
    """, (user_id, product_id))
    
    return APIResponse.success(None, 'Item removed from cart')
# Address Routes
@user_bp.route('/addresses', methods=['GET'])
@user_token_required
def get_addresses(user_id):
    addresses = execute_query("""
        SELECT address_id, address_type as type, full_name as name, phone,
               address_line1 as address_line_1, address_line2 as address_line_2,
               city, state, postal_code as pincode, landmark, is_default
        FROM addresses 
        WHERE user_id = %s 
        ORDER BY is_default DESC, created_at DESC
    """, (user_id,), fetch_all=True)
    
    return jsonify({'addresses': addresses}), 200

@user_bp.route('/addresses', methods=['POST'])
@user_token_required
def add_address(user_id):
    data = request.get_json()
    
    required_fields = ['name', 'phone', 'address_line_1', 'city', 'state', 'pincode']
    if not all(field in data for field in required_fields):
        return APIResponse.error('Missing required fields', 400)
    
    address_type = data.get('type', 'home')
    name = data['name'].strip()
    phone = data['phone'].strip()
    address_line_1 = data['address_line_1'].strip()
    address_line_2 = data.get('address_line_2', '').strip()
    city = data['city'].strip()
    state = data['state'].strip()
    pincode = data['pincode'].strip()
    landmark = data.get('landmark', '').strip()
    is_default = data.get('is_default', False)
    
    # If this is set as default, unset other defaults
    if is_default:
        execute_query("""
            UPDATE addresses SET is_default = FALSE WHERE user_id = %s
        """, (user_id,))
    
    # If no default exists, make this the default
    existing_addresses = execute_query("""
        SELECT COUNT(*) as count FROM addresses WHERE user_id = %s
    """, (user_id,), fetch_one=True)
    
    if existing_addresses['count'] == 0:
        is_default = True
    
    execute_query("""
        INSERT INTO addresses (
            user_id, address_type, full_name, phone, address_line1, 
            address_line2, city, state, postal_code, landmark, is_default, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (user_id, address_type, name, phone, address_line_1, address_line_2, 
          city, state, pincode, landmark, is_default, datetime.now()))
    
    return APIResponse.success(None, 'Address added successfully', 201)

@user_bp.route('/addresses/<int:address_id>', methods=['PUT'])
@user_token_required
def update_address(user_id, address_id):
    data = request.get_json()
    
    # Check if address belongs to user
    address = execute_query("""
        SELECT address_id FROM addresses WHERE address_id = %s AND user_id = %s
    """, (address_id, user_id), fetch_one=True)
    
    if not address:
        return APIResponse.error('Address not found', 404)
    
    address_type = data.get('type', 'home')
    name = data.get('name', '').strip()
    phone = data.get('phone', '').strip()
    address_line_1 = data.get('address_line_1', '').strip()
    address_line_2 = data.get('address_line_2', '').strip()
    city = data.get('city', '').strip()
    state = data.get('state', '').strip()
    pincode = data.get('pincode', '').strip()
    landmark = data.get('landmark', '').strip()
    is_default = data.get('is_default', False)
    
    # If this is set as default, unset other defaults
    if is_default:
        execute_query("""
            UPDATE addresses SET is_default = FALSE WHERE user_id = %s AND address_id != %s
        """, (user_id, address_id))
    
    execute_query("""
        UPDATE addresses SET 
            address_type = %s, full_name = %s, phone = %s, address_line1 = %s,
            address_line2 = %s, city = %s, state = %s, postal_code = %s,
            landmark = %s, is_default = %s, updated_at = %s
        WHERE address_id = %s AND user_id = %s
    """, (address_type, name, phone, address_line_1, address_line_2, city, 
          state, pincode, landmark, is_default, datetime.now(), address_id, user_id))
    
    return APIResponse.success(None, 'Address updated successfully')

@user_bp.route('/addresses/<int:address_id>', methods=['DELETE'])
@user_token_required
def delete_address(user_id, address_id):
    # Check if address belongs to user
    address = execute_query("""
        SELECT address_id, is_default FROM addresses WHERE address_id = %s AND user_id = %s
    """, (address_id, user_id), fetch_one=True)
    
    if not address:
        return APIResponse.error('Address not found', 404)
    
    # Delete the address
    execute_query("""
        DELETE FROM addresses WHERE address_id = %s AND user_id = %s
    """, (address_id, user_id))
    
    # If deleted address was default, make another one default
    if address['is_default']:
        remaining_address = execute_query("""
            SELECT address_id FROM addresses WHERE user_id = %s LIMIT 1
        """, (user_id,), fetch_one=True)
        
        if remaining_address:
            execute_query("""
                UPDATE addresses SET is_default = TRUE WHERE address_id = %s
            """, (remaining_address['address_id'],))
    
    return APIResponse.success(None, 'Address deleted successfully')
# Wishlist Routes
@user_bp.route('/wishlist', methods=['GET'])
@user_token_required
def get_wishlist(user_id):
    wishlist_items = execute_query("""
        SELECT w.*, p.product_name, p.price, p.discount_price, p.brand,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i 
                WHERE i.product_id = p.product_id) as stock_quantity
        FROM wishlist w 
        JOIN products p ON w.product_id = p.product_id 
        WHERE w.user_id = %s AND p.status = 'active'
        ORDER BY w.created_at DESC
    """, (user_id,), fetch_all=True)
    
    # Convert image URLs to absolute URLs
    for item in wishlist_items:
        item['primary_image'] = convert_image_url(item['primary_image'])
        item['in_stock'] = (item.get('stock_quantity') or 0) > 0
    
    return jsonify({'wishlist_items': wishlist_items}), 200

@user_bp.route('/wishlist/add', methods=['POST'])
@user_token_required
def add_to_wishlist(user_id):
    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id:
        return APIResponse.error('Product ID required', 400)
    
    # Check if already in wishlist
    existing = execute_query("""
        SELECT wishlist_id FROM wishlist 
        WHERE user_id = %s AND product_id = %s
    """, (user_id, product_id), fetch_one=True)
    
    if existing:
        return APIResponse.error('Product already in wishlist', 400)
    
    execute_query("""
        INSERT INTO wishlist (user_id, product_id, created_at)
        VALUES (%s, %s, %s)
    """, (user_id, product_id, datetime.now()))
    
    return APIResponse.success(None, 'Added to wishlist')

@user_bp.route('/wishlist/remove/<int:product_id>', methods=['DELETE'])
@user_token_required
def remove_from_wishlist(user_id, product_id):
    execute_query("""
        DELETE FROM wishlist WHERE user_id = %s AND product_id = %s
    """, (user_id, product_id))
    
    return APIResponse.success(None, 'Removed from wishlist')

# Order Routes
@user_bp.route('/orders', methods=['GET'])
@user_token_required
def get_orders(user_id):
    orders = execute_query("""
        SELECT o.*, COUNT(oi.item_id) as item_count
        FROM orders o 
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = %s
        GROUP BY o.order_id
        ORDER BY o.created_at DESC
    """, (user_id,), fetch_all=True)
    
    return jsonify({'orders': orders}), 200

# Referral Routes
@user_bp.route('/referrals/validate', methods=['POST'])
def validate_referral():
    data = request.get_json()
    code = data.get('code', '').strip().upper()
    
    if not code:
        return APIResponse.error('Referral code required', 400)
    
    referrer = execute_query("""
        SELECT user_id, first_name, last_name FROM users 
        WHERE referral_code = %s AND status = 'active'
    """, (code,), fetch_one=True)
    
    if referrer:
        return APIResponse.success({
            'valid': True,
            'referrer_name': f"{referrer['first_name']} {referrer['last_name']}"
        }, 'Valid referral code')
    else:
        return APIResponse.error('Invalid referral code', 404)

@user_bp.route('/referrals', methods=['GET'])
@user_token_required
def get_user_referrals(user_id):
    user = execute_query("""
        SELECT referral_code FROM users WHERE user_id = %s
    """, (user_id,), fetch_one=True)
    
    referrals = execute_query("""
        SELECT u.first_name, u.last_name, u.created_at
        FROM users u 
        WHERE u.referred_by = %s
        ORDER BY u.created_at DESC
    """, (user_id,), fetch_all=True)
    
    return jsonify({
        'referral_code': user['referral_code'],
        'referrals': referrals,
        'total_referrals': len(referrals)
    }), 200

# Wallet Routes
@user_bp.route('/wallet', methods=['GET'])
@user_token_required
def get_wallet(user_id):
    wallet = execute_query("""
        SELECT * FROM wallet WHERE user_id = %s
    """, (user_id,), fetch_one=True)
    
    transactions = execute_query("""
        SELECT * FROM wallet_transactions 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT 20
    """, (user_id,), fetch_all=True)
    
    return jsonify({
        'wallet': wallet,
        'transactions': transactions
    }), 200
    


