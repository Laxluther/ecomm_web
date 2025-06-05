from flask import Blueprint, request, jsonify
from models import execute_query, token_required
from utils import get_indian_states
import uuid
from datetime import datetime

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get user profile"""
    user = execute_query("""
        SELECT user_id, email, first_name, last_name, phone, date_of_birth, 
               gender, profile_image, created_at, updated_at
        FROM users 
        WHERE user_id = %s
    """, (current_user_id,), fetch_one=True)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user}), 200

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update user profile"""
    data = request.get_json()
    
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()
    date_of_birth = data.get('date_of_birth')
    gender = data.get('gender')
    
    if not first_name or not last_name:
        return jsonify({'error': 'First name and last name are required'}), 400
    
    # Update profile
    execute_query("""
        UPDATE users 
        SET first_name = %s, last_name = %s, phone = %s, date_of_birth = %s, 
            gender = %s, updated_at = %s
        WHERE user_id = %s
    """, (first_name, last_name, phone, date_of_birth, gender, 
          datetime.now(), current_user_id))
    
    return jsonify({'message': 'Profile updated successfully'}), 200

# Address Management
@user_bp.route('/addresses', methods=['GET'])
@token_required
def get_addresses(current_user_id):
    """Get user's addresses"""
    addresses = execute_query("""
        SELECT * FROM addresses 
        WHERE user_id = %s 
        ORDER BY is_default DESC, created_at DESC
    """, (current_user_id,), fetch_all=True)
    
    return jsonify({'addresses': addresses}), 200

@user_bp.route('/addresses', methods=['POST'])
@token_required
def add_address(current_user_id):
    """Add new address"""
    data = request.get_json()
    
    required_fields = ['full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required address fields'}), 400
    
    full_name = data['full_name'].strip()
    phone = data['phone'].strip()
    address_line1 = data['address_line1'].strip()
    address_line2 = data.get('address_line2', '').strip()
    city = data['city'].strip()
    state = data['state'].strip()
    postal_code = data['postal_code'].strip()
    landmark = data.get('landmark', '').strip()
    address_type = data.get('address_type', 'home')
    is_default = data.get('is_default', False)
    
    # If setting as default, remove default from other addresses
    if is_default:
        execute_query("""
            UPDATE addresses SET is_default = 0 WHERE user_id = %s
        """, (current_user_id,))
    
    # Add address
    execute_query("""
        INSERT INTO addresses 
        (user_id, address_type, full_name, phone, address_line1, address_line2, 
         city, state, postal_code, landmark, is_default, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (current_user_id, address_type, full_name, phone, address_line1, 
          address_line2, city, state, postal_code, landmark, is_default, datetime.now()))
    
    return jsonify({'message': 'Address added successfully'}), 201

@user_bp.route('/addresses/<int:address_id>', methods=['PUT'])
@token_required
def update_address(current_user_id, address_id):
    """Update address"""
    data = request.get_json()
    
    # Verify address belongs to user
    address = execute_query("""
        SELECT address_id FROM addresses 
        WHERE address_id = %s AND user_id = %s
    """, (address_id, current_user_id), fetch_one=True)
    
    if not address:
        return jsonify({'error': 'Address not found'}), 404
    
    # Get update fields
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()
    address_line1 = data.get('address_line1', '').strip()
    address_line2 = data.get('address_line2', '').strip()
    city = data.get('city', '').strip()
    state = data.get('state', '').strip()
    postal_code = data.get('postal_code', '').strip()
    landmark = data.get('landmark', '').strip()
    address_type = data.get('address_type', 'home')
    is_default = data.get('is_default', False)
    
    if not all([full_name, phone, address_line1, city, state, postal_code]):
        return jsonify({'error': 'Missing required address fields'}), 400
    
    # If setting as default, remove default from other addresses
    if is_default:
        execute_query("""
            UPDATE addresses SET is_default = 0 WHERE user_id = %s AND address_id != %s
        """, (current_user_id, address_id))
    
    # Update address
    execute_query("""
        UPDATE addresses 
        SET address_type = %s, full_name = %s, phone = %s, address_line1 = %s, 
            address_line2 = %s, city = %s, state = %s, postal_code = %s, 
            landmark = %s, is_default = %s, updated_at = %s
        WHERE address_id = %s AND user_id = %s
    """, (address_type, full_name, phone, address_line1, address_line2, 
          city, state, postal_code, landmark, is_default, datetime.now(),
          address_id, current_user_id))
    
    return jsonify({'message': 'Address updated successfully'}), 200

@user_bp.route('/addresses/<int:address_id>', methods=['DELETE'])
@token_required
def delete_address(current_user_id, address_id):
    """Delete address"""
    # Verify address belongs to user and delete
    result = execute_query("""
        DELETE FROM addresses 
        WHERE address_id = %s AND user_id = %s
    """, (address_id, current_user_id))
    
    return jsonify({'message': 'Address deleted successfully'}), 200

# Wallet Management
@user_bp.route('/wallet', methods=['GET'])
@token_required
def get_wallet(current_user_id):
    """Get wallet balance and recent transactions"""
    # Get balance
    wallet = execute_query("""
        SELECT balance FROM wallet WHERE user_id = %s
    """, (current_user_id,), fetch_one=True)
    
    balance = float(wallet['balance']) if wallet else 0.00
    
    # Get recent transactions
    transactions = execute_query("""
        SELECT * FROM wallet_transactions 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT 20
    """, (current_user_id,), fetch_all=True)
    
    return jsonify({
        'balance': balance,
        'transactions': transactions
    }), 200

@user_bp.route('/wallet/add-money', methods=['POST'])
@token_required
def add_money_to_wallet(current_user_id):
    """Add money to wallet (for testing - in production this would be via payment gateway)"""
    data = request.get_json()
    amount = data.get('amount', 0)
    
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount > 10000:  # Max limit for testing
        return jsonify({'error': 'Amount cannot exceed ₹10,000'}), 400
    
    # Get current balance
    wallet = execute_query("""
        SELECT balance FROM wallet WHERE user_id = %s
    """, (current_user_id,), fetch_one=True)
    
    current_balance = float(wallet['balance']) if wallet else 0.0
    new_balance = current_balance + amount
    
    if not wallet:
        # Create wallet if doesn't exist
        execute_query("""
            INSERT INTO wallet (user_id, balance, created_at)
            VALUES (%s, %s, %s)
        """, (current_user_id, amount, datetime.now()))
    else:
        # Update balance
        execute_query("""
            UPDATE wallet SET balance = %s, updated_at = %s 
            WHERE user_id = %s
        """, (new_balance, datetime.now(), current_user_id))
    
    # Add transaction record
    transaction_id = str(uuid.uuid4())
    execute_query("""
        INSERT INTO wallet_transactions 
        (transaction_id, user_id, transaction_type, amount, balance_after, 
         description, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (transaction_id, current_user_id, 'credit', amount, new_balance,
          'Money added to wallet', datetime.now()))
    
    return jsonify({
        'message': f'₹{amount} added to wallet successfully',
        'new_balance': new_balance
    }), 200

# Wishlist Management
@user_bp.route('/wishlist', methods=['GET'])
@token_required
def get_wishlist(current_user_id):
    """Get user's wishlist (excludes inactive products)"""
    wishlist_items = execute_query("""
        SELECT w.*, p.product_name, p.price, p.discount_price, p.status,
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.product_id LIMIT 1) as image_url
        FROM wishlist w
        JOIN products p ON w.product_id = p.product_id
        WHERE w.user_id = %s AND p.status = 'active'
        ORDER BY w.created_at DESC
    """, (current_user_id,), fetch_all=True)
    
    return jsonify({'wishlist': wishlist_items}), 200

@user_bp.route('/wishlist/add', methods=['POST'])
@token_required
def add_to_wishlist(current_user_id):
    """Add product to wishlist (only active products)"""
    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    # Check if product exists and is active
    product = execute_query("""
        SELECT product_id FROM products 
        WHERE product_id = %s AND status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found or unavailable'}), 404
    
    # Check if already in wishlist
    existing = execute_query("""
        SELECT wishlist_id FROM wishlist 
        WHERE user_id = %s AND product_id = %s
    """, (current_user_id, product_id), fetch_one=True)
    
    if existing:
        return jsonify({'error': 'Product already in wishlist'}), 409
    
    # Add to wishlist
    execute_query("""
        INSERT INTO wishlist (user_id, product_id, created_at)
        VALUES (%s, %s, %s)
    """, (current_user_id, product_id, datetime.now()))
    
    return jsonify({'message': 'Product added to wishlist'}), 201

@user_bp.route('/wishlist/remove', methods=['DELETE'])
@token_required
def remove_from_wishlist(current_user_id):
    """Remove product from wishlist"""
    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    # Remove from wishlist
    execute_query("""
        DELETE FROM wishlist 
        WHERE user_id = %s AND product_id = %s
    """, (current_user_id, product_id))
    
    return jsonify({'message': 'Product removed from wishlist'}), 200

@user_bp.route('/cleanup-deleted', methods=['POST'])
@token_required
def cleanup_inactive_products(current_user_id):
    """Remove inactive products from user's cart and wishlist"""
    
    # Remove inactive products from cart
    cart_cleanup = execute_query("""
        DELETE c FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.user_id = %s AND p.status = 'inactive'
    """, (current_user_id,))
    
    # Remove inactive products from wishlist
    wishlist_cleanup = execute_query("""
        DELETE w FROM wishlist w 
        JOIN products p ON w.product_id = p.product_id 
        WHERE w.user_id = %s AND p.status = 'inactive'
    """, (current_user_id,))
    
    # Get counts of cleaned items
    cart_count = execute_query("""
        SELECT COUNT(*) as count FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.user_id = %s AND p.status = 'inactive'
    """, (current_user_id,), fetch_one=True)['count']
    
    wishlist_count = execute_query("""
        SELECT COUNT(*) as count FROM wishlist w 
        JOIN products p ON w.product_id = p.product_id 
        WHERE w.user_id = %s AND p.status = 'inactive'
    """, (current_user_id,), fetch_one=True)['count']
    
    return jsonify({
        'message': 'Cleanup completed',
        'removed_from_cart': cart_count,
        'removed_from_wishlist': wishlist_count
    }), 200

# Utility routes
@user_bp.route('/states', methods=['GET'])
def get_states():
    """Get Indian states for address forms"""
    return jsonify({'states': get_indian_states()}), 200

@user_bp.route('/promocodes', methods=['GET'])
@token_required
def get_available_promocodes(current_user_id):
    """Get available promocodes"""
    promocodes = execute_query("""
        SELECT code, description, discount_type, discount_value, 
               min_order_amount, max_discount_amount, valid_until
        FROM promocodes 
        WHERE status = 'active' AND valid_until > NOW()
        ORDER BY created_at DESC
    """, fetch_all=True)
    
    return jsonify({'promocodes': promocodes}), 200