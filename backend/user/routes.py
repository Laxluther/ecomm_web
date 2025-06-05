from flask import Blueprint, request, jsonify, current_app
from shared.models import execute_query, user_token_required, ProductModel
from referral.models import ReferralModel
from datetime import datetime
import uuid
import json

user_bp = Blueprint('user', __name__)

from user.auth import user_auth_bp
user_bp.register_blueprint(user_auth_bp, url_prefix='/auth')

@user_bp.route('/products', methods=['GET'])
def get_products():
    category_id = request.args.get('category')
    search_query = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    
    cache_key = f'user_products_{category_id}_{search_query}_{page}_{per_page}'
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({**cached_data, 'cached': True}), 200
    
    offset = (page - 1) * per_page
    
    query = """
        SELECT p.*, c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity
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
    
    query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    products = execute_query(query, params, fetch_all=True)
    
    for product in products:
        product['in_stock'] = (product.get('stock_quantity') or 0) > 0
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
        else:
            product['savings'] = 0
    
    result_data = {'products': products, 'cached': False}
    current_app.cache.set(cache_key, result_data, timeout=300)
    
    return jsonify(result_data), 200

@user_bp.route('/products/featured', methods=['GET'])
def get_featured_products():
    cache_key = 'user_featured_products'
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({'products': cached_data, 'cached': True}), 200
    
    products = ProductModel.get_featured()
    
    for product in products:
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
        else:
            product['savings'] = 0
    
    current_app.cache.set(cache_key, products, timeout=600)
    return jsonify({'products': products, 'cached': False}), 200

@user_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    cache_key = f'user_product_detail_{product_id}'
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({**cached_data, 'cached': True}), 200
    
    product = ProductModel.get_by_id(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    images = execute_query("""
        SELECT * FROM product_images 
        WHERE product_id = %s 
        ORDER BY sort_order, is_primary DESC
    """, (product_id,), fetch_all=True)
    
    reviews = execute_query("""
        SELECT r.*, u.first_name, u.last_name
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
    
    current_app.cache.set(cache_key, categories, timeout=3600)
    return jsonify({'categories': categories, 'cached': False}), 200

@user_bp.route('/cart', methods=['GET'])
@user_token_required
def get_cart(user_id):
    cart_items = execute_query("""
        SELECT c.*, p.product_name, p.price, p.discount_price,
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.product_id LIMIT 1) as image_url
        FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.user_id = %s AND p.status = 'active'
    """, (user_id,), fetch_all=True)
    
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
        return jsonify({'error': 'Invalid product or quantity'}), 400
    
    product = execute_query("""
        SELECT product_id FROM products 
        WHERE product_id = %s AND status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
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
    
    return jsonify({'message': 'Item added to cart'}), 200

@user_bp.route('/cart/remove', methods=['DELETE'])
@user_token_required
def remove_from_cart(user_id):
    data = request.get_json()
    cart_id = data.get('cart_id')
    
    execute_query("""
        DELETE FROM cart WHERE cart_id = %s AND user_id = %s
    """, (cart_id, user_id))
    
    return jsonify({'message': 'Item removed from cart'}), 200

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

@user_bp.route('/orders/place', methods=['POST'])
@user_token_required
def place_order(user_id):
    data = request.get_json()
    address_id = data.get('address_id')
    payment_method = data.get('payment_method')
    
    if not address_id or not payment_method:
        return jsonify({'error': 'Address and payment method required'}), 400
    
    cart_items = execute_query("""
        SELECT c.*, p.product_name, p.price, p.discount_price
        FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.user_id = %s AND p.status = 'active'
    """, (user_id,), fetch_all=True)
    
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    address = execute_query("""
        SELECT * FROM addresses 
        WHERE address_id = %s AND user_id = %s
    """, (address_id, user_id), fetch_one=True)
    
    if not address:
        return jsonify({'error': 'Invalid address'}), 404
    
    subtotal = sum([
        (float(item['discount_price']) if item['discount_price'] else float(item['price'])) * item['quantity']
        for item in cart_items
    ])
    
    shipping_amount = 50 if subtotal < 500 else 0
    total_amount = subtotal + shipping_amount
    
    order_id = str(uuid.uuid4())
    order_number = f"ORD{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
    
    shipping_address_json = json.dumps({
        'full_name': address['full_name'],
        'phone': address['phone'],
        'address_line1': address['address_line1'],
        'city': address['city'],
        'state': address['state'],
        'postal_code': address['postal_code']
    })
    
    execute_query("""
        INSERT INTO orders (
            order_id, user_id, order_number, status, subtotal, 
            shipping_amount, total_amount, payment_method, 
            payment_status, shipping_address, created_at
        ) VALUES (%s, %s, %s, 'pending', %s, %s, %s, %s, 'pending', %s, %s)
    """, (order_id, user_id, order_number, subtotal, shipping_amount, 
          total_amount, payment_method, shipping_address_json, datetime.now()))
    
    for item in cart_items:
        unit_price = float(item['discount_price']) if item['discount_price'] else float(item['price'])
        total_price = unit_price * item['quantity']
        
        execute_query("""
            INSERT INTO order_items (
                order_id, product_id, product_name, quantity, unit_price, total_price, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (order_id, item['product_id'], item['product_name'],
              item['quantity'], unit_price, total_price, datetime.now()))
    
    execute_query("DELETE FROM cart WHERE user_id = %s", (user_id,))
    
    ReferralModel.process_first_purchase(user_id, total_amount)
    
    return jsonify({
        'message': 'Order placed successfully',
        'order_id': order_id,
        'order_number': order_number,
        'total_amount': total_amount
    }), 201

@user_bp.route('/profile', methods=['GET'])
@user_token_required
def get_profile(user_id):
    user = execute_query("""
        SELECT user_id, email, first_name, last_name, phone, created_at
        FROM users WHERE user_id = %s
    """, (user_id,), fetch_one=True)
    
    return jsonify({'user': user}), 200

@user_bp.route('/profile', methods=['PUT'])
@user_token_required
def update_profile(user_id):
    data = request.get_json()
    
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()
    
    if not first_name or not last_name:
        return jsonify({'error': 'First name and last name required'}), 400
    
    execute_query("""
        UPDATE users 
        SET first_name = %s, last_name = %s, phone = %s, updated_at = %s
        WHERE user_id = %s
    """, (first_name, last_name, phone, datetime.now(), user_id))
    
    cache_key = f'user_session_{user_id}'
    current_app.cache.delete(cache_key)
    
    return jsonify({'message': 'Profile updated successfully'}), 200

@user_bp.route('/addresses', methods=['GET'])
@user_token_required
def get_addresses(user_id):
    addresses = execute_query("""
        SELECT * FROM addresses 
        WHERE user_id = %s 
        ORDER BY is_default DESC, created_at DESC
    """, (user_id,), fetch_all=True)
    
    return jsonify({'addresses': addresses}), 200

@user_bp.route('/addresses', methods=['POST'])
@user_token_required
def add_address(user_id):
    data = request.get_json()
    
    required_fields = ['full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if data.get('is_default'):
        execute_query("UPDATE addresses SET is_default = 0 WHERE user_id = %s", (user_id,))
    
    execute_query("""
        INSERT INTO addresses 
        (user_id, full_name, phone, address_line1, address_line2, 
         city, state, postal_code, is_default, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (user_id, data['full_name'], data['phone'], data['address_line1'],
          data.get('address_line2', ''), data['city'], data['state'],
          data['postal_code'], data.get('is_default', False), datetime.now()))
    
    return jsonify({'message': 'Address added successfully'}), 201

@user_bp.route('/wallet', methods=['GET'])
@user_token_required
def get_wallet(user_id):
    wallet = execute_query("""
        SELECT balance FROM wallet WHERE user_id = %s
    """, (user_id,), fetch_one=True)
    
    balance = float(wallet['balance']) if wallet else 0.00
    
    transactions = execute_query("""
        SELECT * FROM wallet_transactions 
        WHERE user_id = %s 
        ORDER BY created_at DESC LIMIT 20
    """, (user_id,), fetch_all=True)
    
    return jsonify({
        'balance': balance,
        'transactions': transactions
    }), 200

@user_bp.route('/referrals', methods=['GET'])
@user_token_required
def get_referrals(user_id):
    user_code = ReferralModel.get_user_code(user_id)
    stats = ReferralModel.get_referral_stats(user_id)
    referrals_list = ReferralModel.get_referrals_list(user_id)
    
    return jsonify({
        'referral_code': user_code['code'] if user_code else None,
        'stats': stats,
        'referrals': referrals_list
    }), 200

@user_bp.route('/referrals/validate', methods=['POST'])
def validate_referral_code():
    data = request.get_json()
    code = data.get('code', '').strip()
    
    if not code:
        return jsonify({'error': 'Referral code required'}), 400
    
    referrer = ReferralModel.validate_code(code)
    
    if referrer:
        return jsonify({
            'valid': True,
            'referrer_name': f"{referrer['first_name']} {referrer['last_name']}",
            'message': 'Valid referral code! You will get ₹50 after your first purchase.'
        }), 200
    else:
        return jsonify({
            'valid': False,
            'message': 'Invalid referral code'
        }), 400