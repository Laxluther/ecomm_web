from flask import Blueprint, request, jsonify
from models import OrderModel, CartModel, execute_query, token_required
from utils import (
    calculate_order_totals, validate_promocode, generate_order_number, 
    process_wallet_payment, update_inventory, send_order_confirmation_email,
    check_inventory_availability
)

import json
import uuid
from datetime import datetime

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['GET'])
@token_required
def get_user_orders(current_user_id):
    """Get user's order history"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    status = request.args.get('status')
    
    # Build query
    query = """
        SELECT o.*, COUNT(oi.item_id) as item_count
        FROM orders o 
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.user_id = %s
    """
    params = [current_user_id]
    
    if status:
        query += " AND o.status = %s"
        params.append(status)
    
    query += " GROUP BY o.order_id ORDER BY o.created_at DESC"
    
    # Add pagination
    offset = (page - 1) * per_page
    query += " LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    orders = execute_query(query, params, fetch_all=True)
    
    return jsonify({
        'orders': orders,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': len(orders)
        }
    }), 200

@orders_bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order_detail(current_user_id, order_id):
    """Get detailed order information"""
    # Get order
    order = execute_query("""
        SELECT * FROM orders 
        WHERE order_id = %s AND user_id = %s
    """, (order_id, current_user_id), fetch_one=True)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Get order items
    order_items = execute_query("""
        SELECT oi.*, 
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = oi.product_id LIMIT 1) as image_url
        FROM order_items oi
        WHERE oi.order_id = %s
    """, (order_id,), fetch_all=True)
    
    # Get tracking history
    tracking = execute_query("""
        SELECT * FROM order_tracking 
        WHERE order_id = %s 
        ORDER BY created_at ASC
    """, (order_id,), fetch_all=True)
    
    return jsonify({
        'order': order,
        'order_items': order_items,
        'tracking': tracking
    }), 200

# Replace the place_order function in routes/orders.py with this fixed version:

@orders_bp.route('/place', methods=['POST'])
@token_required
def place_order(current_user_id):
    """Place a new order"""
    data = request.get_json()
    
    address_id = data.get('address_id')
    payment_method = data.get('payment_method')
    notes = data.get('notes', '')
    promocode = data.get('promocode')
    
    if not address_id or not payment_method:
        return jsonify({'error': 'Address and payment method are required'}), 400
    
    if payment_method not in ['cod', 'wallet', 'online']:
        return jsonify({'error': 'Invalid payment method'}), 400
    
    # Get cart items with all details
    cart_items = CartModel.get_cart_items(current_user_id)
    
    if not cart_items:
        return jsonify({'error': 'Cart is empty'}), 400
    
    # Validate inventory for all items
    for item in cart_items:
        available, message = check_inventory_availability(item['product_id'], item['quantity'])
        if not available:
            return jsonify({'error': f"{item['product_name']}: {message}"}), 400
    
    # Get shipping address
    address = execute_query("""
        SELECT * FROM addresses 
        WHERE address_id = %s AND user_id = %s
    """, (address_id, current_user_id), fetch_one=True)
    
    if not address:
        return jsonify({'error': 'Invalid shipping address'}), 404
    
    # Validate promocode if provided
    applied_promocode = None
    if promocode:
        subtotal = sum([
            (float(item['discount_price']) if item['discount_price'] else float(item['price'])) * item['quantity']
            for item in cart_items
        ])
        
        promo_data, message = validate_promocode(promocode, subtotal, current_user_id)
        if not promo_data:
            return jsonify({'error': f'Promocode error: {message}'}), 400
        applied_promocode = promo_data
    
    # Calculate order totals
    order_totals = calculate_order_totals(cart_items, address['state'], applied_promocode)
    
    # Validate wallet balance if payment method is wallet
    if payment_method == 'wallet':
        wallet = execute_query(
            "SELECT balance FROM wallet WHERE user_id = %s", 
            (current_user_id,), 
            fetch_one=True
        )
        wallet_balance = float(wallet['balance']) if wallet else 0.0
        
        if wallet_balance < order_totals['total_amount']:
            return jsonify({
                'error': f'Insufficient wallet balance. Available: ₹{wallet_balance}'
            }), 400
    
    # Generate order details
    order_id = str(uuid.uuid4())
    order_number = generate_order_number()
    
    # Prepare shipping address JSON
    shipping_address_json = json.dumps({
        'full_name': address['full_name'],
        'phone': address['phone'],
        'address_line1': address['address_line1'],
        'address_line2': address['address_line2'] or '',
        'city': address['city'],
        'state': address['state'],
        'postal_code': address['postal_code'],
        'country': address.get('country', 'India')
    })
    
    # FIXED: Create order directly with execute_query instead of using OrderModel
    execute_query("""
        INSERT INTO orders (
            order_id, user_id, order_number, status, subtotal, tax_amount, 
            shipping_amount, discount_amount, total_amount, payment_method, 
            payment_status, shipping_address, notes, cgst_amount, sgst_amount, 
            igst_amount, tax_rate, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        order_id, current_user_id, order_number, 'pending', 
        order_totals['subtotal'], order_totals['tax_amount'],
        order_totals['shipping_amount'], order_totals['discount_amount'],
        order_totals['total_amount'], payment_method,
        'pending', shipping_address_json, notes,
        order_totals['cgst_amount'], order_totals['sgst_amount'],
        order_totals['igst_amount'], order_totals['avg_tax_rate'],
        datetime.now()
    ))
    
    # FIXED: Create order items using the same order_id
    for item in cart_items:
        unit_price = float(item['discount_price']) if item['discount_price'] else float(item['price'])
        total_price = unit_price * item['quantity']
        
        execute_query("""
            INSERT INTO order_items (
                order_id, product_id, variant_id, product_name, variant_name,
                quantity, unit_price, total_price, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            order_id, item['product_id'], item.get('variant_id'),
            item['product_name'], item.get('variant_name'),
            item['quantity'], unit_price, total_price, datetime.now()
        ))
    
    # Update inventory
    for item in cart_items:
        update_inventory(item['product_id'], item['quantity'], 'decrease')
    
    # Process payment
    payment_success = True
    payment_message = 'Order placed successfully'
    
    if payment_method == 'wallet':
        success, message = process_wallet_payment(current_user_id, order_totals['total_amount'])
        if success:
            execute_query("""
                UPDATE orders SET payment_status = 'completed', status = 'confirmed'
                WHERE order_id = %s
            """, (order_id,))
            payment_message = 'Payment completed. Order confirmed.'
        else:
            payment_success = False
            payment_message = message
    elif payment_method == 'cod':
        execute_query("""
            UPDATE orders SET status = 'confirmed'
            WHERE order_id = %s
        """, (order_id,))
        payment_message = 'COD order confirmed'
    elif payment_method == 'online':
        # Placeholder for online payment
        execute_query("""
            UPDATE orders SET payment_status = 'pending', status = 'pending'
            WHERE order_id = %s
        """, (order_id,))
        payment_message = 'Online payment pending. Order will be confirmed after payment.'
    
    if not payment_success:
        # Rollback inventory changes
        for item in cart_items:
            update_inventory(item['product_id'], item['quantity'], 'increase')
        return jsonify({'error': payment_message}), 400
    
    # Add initial tracking
    execute_query("""
        INSERT INTO order_tracking (order_id, status, message, created_at)
        VALUES (%s, %s, %s, %s)
    """, (order_id, 'order_placed', payment_message, datetime.now()))
    
    # Update promocode usage if applied
    if applied_promocode:
        execute_query("""
            UPDATE promocodes SET used_count = used_count + 1 
            WHERE code = %s
        """, (applied_promocode['code'],))
    
    # Clear cart
    execute_query("DELETE FROM cart WHERE user_id = %s", (current_user_id,))
    
    # Send confirmation email
    send_order_confirmation_email(order_id, order_number, current_user_id)
    
    return jsonify({
        'message': 'Order placed successfully',
        'order_id': order_id,
        'order_number': order_number,
        'total_amount': order_totals['total_amount'],
        'payment_status': 'completed' if payment_method == 'wallet' else 'pending'
    }), 201

@orders_bp.route('/track', methods=['POST'])
def track_order():
    """Track order by order number (public endpoint)"""
    data = request.get_json()
    order_number = data.get('order_number')
    phone = data.get('phone')  # For guest tracking
    
    if not order_number:
        return jsonify({'error': 'Order number is required'}), 400
    
    # Get order
    order = execute_query("""
        SELECT o.*, u.phone as user_phone
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.user_id 
        WHERE o.order_number = %s
    """, (order_number,), fetch_one=True)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # If phone provided, verify it matches
    if phone and order.get('user_phone') != phone:
        return jsonify({'error': 'Invalid phone number for this order'}), 403
    
    # Get order items
    order_items = execute_query("""
        SELECT oi.*, 
               (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = oi.product_id LIMIT 1) as image_url
        FROM order_items oi
        WHERE oi.order_id = %s
    """, (order['order_id'],), fetch_all=True)
    
    # Get tracking history
    tracking = execute_query("""
        SELECT * FROM order_tracking 
        WHERE order_id = %s 
        ORDER BY created_at ASC
    """, (order['order_id'],), fetch_all=True)
    
    return jsonify({
        'order': {
            'order_number': order['order_number'],
            'status': order['status'],
            'total_amount': order['total_amount'],
            'created_at': order['created_at'],
            'shipping_address': order['shipping_address']
        },
        'order_items': order_items,
        'tracking': tracking
    }), 200

@orders_bp.route('/<order_id>/cancel', methods=['POST'])
@token_required
def cancel_order(current_user_id, order_id):
    """Cancel an order"""
    # Get order
    order = execute_query("""
        SELECT * FROM orders 
        WHERE order_id = %s AND user_id = %s
    """, (order_id, current_user_id), fetch_one=True)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Check if order can be cancelled
    if order['status'] in ['shipped', 'delivered', 'cancelled']:
        return jsonify({'error': 'Order cannot be cancelled'}), 400
    
    # Update order status
    execute_query("""
        UPDATE orders SET status = 'cancelled', updated_at = %s 
        WHERE order_id = %s
    """, (datetime.now(), order_id))
    
    # Add tracking entry
    execute_query("""
        INSERT INTO order_tracking (order_id, status, message, created_at)
        VALUES (%s, %s, %s, %s)
    """, (order_id, 'cancelled', 'Order cancelled by customer', datetime.now()))
    
    # Restore inventory
    order_items = execute_query("""
        SELECT product_id, quantity FROM order_items WHERE order_id = %s
    """, (order_id,), fetch_all=True)
    
    for item in order_items:
        update_inventory(item['product_id'], item['quantity'], 'increase')
    
    # Process refund if payment was completed
    if order['payment_status'] == 'completed' and order['payment_method'] == 'wallet':
        # Add money back to wallet
        execute_query("""
            UPDATE wallet SET balance = balance + %s, updated_at = %s 
            WHERE user_id = %s
        """, (order['total_amount'], datetime.now(), current_user_id))
        
        # Add transaction record
        transaction_id = str(uuid.uuid4())
        execute_query("""
            INSERT INTO wallet_transactions 
            (transaction_id, user_id, transaction_type, amount, balance_after, 
             description, reference_type, reference_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (transaction_id, current_user_id, 'credit', order['total_amount'],
              0, 'Refund for cancelled order', 'order', order_id, datetime.now()))
    
    return jsonify({'message': 'Order cancelled successfully'}), 200