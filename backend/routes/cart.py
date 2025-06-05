from flask import Blueprint, request, jsonify
from models import CartModel, execute_query, token_required
from utils import calculate_order_totals, validate_promocode, check_inventory_availability
from datetime import datetime

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/', methods=['GET'])
@token_required
def get_cart(current_user_id):
    """Get user's cart items"""
    cart_items = CartModel.get_cart_items(current_user_id)
    
    if not cart_items:
        return jsonify({
            'cart_items': [],
            'summary': {
                'subtotal': 0,
                'total_items': 0,
                'total_savings': 0
            }
        }), 200
    
    # Calculate totals
    subtotal = 0
    total_savings = 0
    total_items = 0
    
    for item in cart_items:
        price = float(item['price'])
        discount_price = float(item['discount_price']) if item['discount_price'] else price
        quantity = item['quantity']
        
        subtotal += quantity * discount_price
        total_items += quantity
        
        if item['discount_price']:
            total_savings += quantity * (price - discount_price)
    
    return jsonify({
        'cart_items': cart_items,
        'summary': {
            'subtotal': round(subtotal, 2),
            'total_items': total_items,
            'total_savings': round(total_savings, 2)
        }
    }), 200

@cart_bp.route('/add', methods=['POST'])
@token_required
def add_to_cart(current_user_id):
    """Add item to cart (only active products)"""
    data = request.get_json()
    
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    variant_id = data.get('variant_id')
    
    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400
    
    if quantity <= 0:
        return jsonify({'error': 'Quantity must be greater than 0'}), 400
    
    # Check if product exists and is active
    product = execute_query("""
        SELECT product_id, product_name, status 
        FROM products 
        WHERE product_id = %s AND status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found or no longer available'}), 404
    
    # Check inventory
    available, message = check_inventory_availability(product_id, quantity)
    if not available:
        return jsonify({'error': message}), 400
    
    # Add to cart
    try:
        CartModel.add_to_cart(current_user_id, product_id, quantity, variant_id)
        return jsonify({'message': 'Item added to cart successfully'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@cart_bp.route('/update', methods=['PUT'])
@token_required
def update_cart_item(current_user_id):
    """Update cart item quantity"""
    data = request.get_json()
    
    cart_id = data.get('cart_id')
    quantity = data.get('quantity')
    
    if not cart_id or quantity is None:
        return jsonify({'error': 'Cart ID and quantity are required'}), 400
    
    if quantity <= 0:
        return jsonify({'error': 'Quantity must be greater than 0'}), 400
    
    # Verify cart item belongs to user
    cart_item = execute_query("""
        SELECT c.*, p.product_name 
        FROM cart c 
        JOIN products p ON c.product_id = p.product_id
        WHERE c.cart_id = %s AND c.user_id = %s
    """, (cart_id, current_user_id), fetch_one=True)
    
    if not cart_item:
        return jsonify({'error': 'Cart item not found'}), 404
    
    # Check if product is still active
    product = execute_query("""
        SELECT status FROM products WHERE product_id = %s
    """, (cart_item['product_id'],), fetch_one=True)
    
    if not product or product['status'] != 'active':
        # Remove inactive product from cart
        execute_query("""
            DELETE FROM cart WHERE cart_id = %s
        """, (cart_id,))
        return jsonify({'error': 'Product is no longer available and has been removed from cart'}), 400
    
    # Check inventory for new quantity
    available, message = check_inventory_availability(cart_item['product_id'], quantity)
    if not available:
        return jsonify({'error': message}), 400
    
    # Update quantity
    execute_query("""
        UPDATE cart SET quantity = %s, updated_at = %s 
        WHERE cart_id = %s AND user_id = %s
    """, (quantity, datetime.now(), cart_id, current_user_id))
    
    return jsonify({'message': 'Cart updated successfully'}), 200

@cart_bp.route('/remove', methods=['DELETE'])
@token_required
def remove_from_cart(current_user_id):
    """Remove item from cart"""
    data = request.get_json()
    cart_id = data.get('cart_id')
    
    if not cart_id:
        return jsonify({'error': 'Cart ID is required'}), 400
    
    # Verify cart item belongs to user and remove
    result = execute_query("""
        DELETE FROM cart 
        WHERE cart_id = %s AND user_id = %s
    """, (cart_id, current_user_id))
    
    return jsonify({'message': 'Item removed from cart'}), 200

@cart_bp.route('/clear', methods=['DELETE'])
@token_required
def clear_cart(current_user_id):
    """Clear all items from cart"""
    execute_query("DELETE FROM cart WHERE user_id = %s", (current_user_id,))
    
    return jsonify({'message': 'Cart cleared successfully'}), 200

@cart_bp.route('/count', methods=['GET'])
@token_required
def get_cart_count(current_user_id):
    """Get total items count in cart"""
    result = execute_query("""
        SELECT SUM(quantity) as total_items 
        FROM cart 
        WHERE user_id = %s
    """, (current_user_id,), fetch_one=True)
    
    total_items = result['total_items'] if result and result['total_items'] else 0
    
    return jsonify({'count': total_items}), 200

@cart_bp.route('/validate', methods=['POST'])
@token_required
def validate_cart(current_user_id):
    """Validate cart items for checkout (removes inactive products)"""
    cart_items = CartModel.get_cart_items(current_user_id)
    
    if not cart_items:
        return jsonify({'valid': False, 'error': 'Cart is empty'}), 400
    
    invalid_items = []
    inactive_items = []
    
    for item in cart_items:
        # Check if product is still active (this should already be filtered by get_cart_items)
        product = execute_query("""
            SELECT status FROM products WHERE product_id = %s
        """, (item['product_id'],), fetch_one=True)
        
        if not product or product['status'] != 'active':
            inactive_items.append({
                'cart_id': item['cart_id'],
                'product_name': item['product_name'],
                'error': 'Product is no longer available'
            })
            # Remove from cart automatically
            execute_query("""
                DELETE FROM cart WHERE cart_id = %s
            """, (item['cart_id'],))
            continue
        
        # Check inventory
        available, message = check_inventory_availability(item['product_id'], item['quantity'])
        if not available:
            invalid_items.append({
                'cart_id': item['cart_id'],
                'product_name': item['product_name'],
                'error': message
            })
    
    if inactive_items:
        return jsonify({
            'valid': False,
            'inactive_items': inactive_items,
            'invalid_items': invalid_items,
            'message': 'Some products in your cart are no longer available and have been removed'
        }), 400
    
    if invalid_items:
        return jsonify({
            'valid': False,
            'invalid_items': invalid_items
        }), 400
    
    return jsonify({'valid': True, 'message': 'Cart is valid for checkout'}), 200

@cart_bp.route('/checkout-summary', methods=['POST'])
@token_required
def get_checkout_summary(current_user_id):
    """Get checkout summary with taxes and discounts"""
    data = request.get_json()
    state_code = data.get('state_code', 'MH')
    promocode = data.get('promocode')
    
    cart_items = CartModel.get_cart_items(current_user_id)
    
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    # Validate promocode if provided
    applied_promocode = None
    if promocode:
        # Calculate subtotal first
        subtotal = sum([
            (float(item['discount_price']) if item['discount_price'] else float(item['price'])) * item['quantity']
            for item in cart_items
        ])
        
        promo_data, message = validate_promocode(promocode, subtotal, current_user_id)
        if not promo_data:
            return jsonify({'error': message}), 400
        applied_promocode = promo_data
    
    # Calculate totals
    totals = calculate_order_totals(cart_items, state_code, applied_promocode)
    
    return jsonify({
        'summary': totals,
        'applied_promocode': applied_promocode,
        'cart_items': cart_items
    }), 200

@cart_bp.route('/clean', methods=['POST'])
@token_required
def clean_cart(current_user_id):
    """Remove inactive/deleted products from cart"""
    
    # Get items with inactive products
    inactive_items = execute_query("""
        SELECT c.cart_id, p.product_name 
        FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.user_id = %s AND p.status = 'inactive'
    """, (current_user_id,), fetch_all=True)
    
    if inactive_items:
        # Remove inactive products from cart
        execute_query("""
            DELETE c FROM cart c 
            JOIN products p ON c.product_id = p.product_id 
            WHERE c.user_id = %s AND p.status = 'inactive'
        """, (current_user_id,))
        
        return jsonify({
            'message': f'Removed {len(inactive_items)} unavailable products from cart',
            'removed_items': [item['product_name'] for item in inactive_items]
        }), 200
    else:
        return jsonify({'message': 'No unavailable products found in cart'}), 200