from flask import Blueprint, jsonify
from shared.models import execute_query
from datetime import datetime

shared_bp = Blueprint('shared', __name__)

@shared_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'E-commerce API is running',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0'
    }), 200

@shared_bp.route('/public/products/featured', methods=['GET'])
def public_featured_products():
    products = execute_query("""
        SELECT p.product_id, p.product_name, p.price, p.discount_price,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image
        FROM products p 
        WHERE p.is_featured = 1 AND p.status = 'active'
        ORDER BY p.created_at DESC LIMIT 6
    """, fetch_all=True)
    
    return jsonify({'products': products}), 200

@shared_bp.route('/public/categories', methods=['GET'])
def public_categories():
    categories = execute_query("""
        SELECT category_id, category_name, description, image_url
        FROM categories 
        WHERE status = 'active' 
        ORDER BY sort_order, category_name
    """, fetch_all=True)
    
    return jsonify({'categories': categories}), 200

@shared_bp.route('/public/products/<int:product_id>', methods=['GET'])
def public_product_detail(product_id):
    product = execute_query("""
        SELECT p.*, c.category_name
        FROM products p 
        JOIN categories c ON p.category_id = c.category_id 
        WHERE p.product_id = %s AND p.status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    images = execute_query("""
        SELECT image_url, alt_text FROM product_images 
        WHERE product_id = %s 
        ORDER BY sort_order, is_primary DESC
    """, (product_id,), fetch_all=True)
    
    return jsonify({
        'product': product,
        'images': images
    }), 200

@shared_bp.route('/track-order', methods=['POST'])
def track_order():
    from flask import request
    data = request.get_json()
    order_number = data.get('order_number')
    phone = data.get('phone')
    
    if not order_number:
        return jsonify({'error': 'Order number required'}), 400
    
    order = execute_query("""
        SELECT o.order_number, o.status, o.total_amount, o.created_at,
               o.shipping_address, u.phone as user_phone
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.user_id 
        WHERE o.order_number = %s
    """, (order_number,), fetch_one=True)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if phone and order.get('user_phone') != phone:
        return jsonify({'error': 'Invalid phone number'}), 403
    
    return jsonify({'order': order}), 200

@shared_bp.route('/states', methods=['GET'])
def get_indian_states():
    states = {
        'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar',
        'CG': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana', 
        'HP': 'Himachal Pradesh', 'JH': 'Jharkhand', 'KA': 'Karnataka', 'KL': 'Kerala',
        'MP': 'Madhya Pradesh', 'MH': 'Maharashtra', 'MN': 'Manipur', 'ML': 'Meghalaya',
        'MZ': 'Mizoram', 'NL': 'Nagaland', 'OR': 'Odisha', 'PB': 'Punjab', 
        'RJ': 'Rajasthan', 'SK': 'Sikkim', 'TN': 'Tamil Nadu', 'TS': 'Telangana',
        'TR': 'Tripura', 'UP': 'Uttar Pradesh', 'UK': 'Uttarakhand', 'WB': 'West Bengal',
        'DL': 'Delhi'
    }
    
    return jsonify({'states': states}), 200