from flask import Blueprint, jsonify
from shared.models import execute_query
from shared.image_utils import convert_products_images, convert_category_images, convert_product_images, convert_image_url
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
    
    # Convert image URLs to absolute URLs
    products = convert_products_images(products)
    
    return jsonify({'products': products}), 200

@shared_bp.route('/public/categories', methods=['GET'])
def public_categories():
    categories = execute_query("""
        SELECT category_id, category_name, description, image_url
        FROM categories 
        WHERE status = 'active' 
        ORDER BY sort_order, category_name
    """, fetch_all=True)
    
    # Convert image URLs to absolute URLs
    categories = convert_category_images(categories)
    
    return jsonify({'categories': categories}), 200

@shared_bp.route('/public/products/<int:product_id>', methods=['GET'])
def public_product_detail(product_id):
    product = execute_query("""
        SELECT p.*, c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.product_id = %s AND p.status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Get all product images
    images = execute_query("""
        SELECT image_url, alt_text, is_primary, sort_order
        FROM product_images 
        WHERE product_id = %s 
        ORDER BY sort_order, is_primary DESC
    """, (product_id,), fetch_all=True)
    
    # Convert image URLs to absolute URLs
    product = convert_product_images(product)
    for img in images:
        img['image_url'] = convert_image_url(img['image_url'])
    
    product['images'] = images
    
    return jsonify({'product': product}), 200

@shared_bp.route('/states', methods=['GET'])
def get_indian_states():
    states = [
        {"code": "AN", "name": "Andaman and Nicobar Islands"},
        {"code": "AP", "name": "Andhra Pradesh"},
        {"code": "AR", "name": "Arunachal Pradesh"},
        {"code": "AS", "name": "Assam"},
        {"code": "BR", "name": "Bihar"},
        {"code": "CH", "name": "Chandigarh"},
        {"code": "CT", "name": "Chhattisgarh"},
        {"code": "DN", "name": "Dadra and Nagar Haveli"},
        {"code": "DD", "name": "Daman and Diu"},
        {"code": "DL", "name": "Delhi"},
        {"code": "GA", "name": "Goa"},
        {"code": "GJ", "name": "Gujarat"},
        {"code": "HR", "name": "Haryana"},
        {"code": "HP", "name": "Himachal Pradesh"},
        {"code": "JK", "name": "Jammu and Kashmir"},
        {"code": "JH", "name": "Jharkhand"},
        {"code": "KA", "name": "Karnataka"},
        {"code": "KL", "name": "Kerala"},
        {"code": "LD", "name": "Lakshadweep"},
        {"code": "MP", "name": "Madhya Pradesh"},
        {"code": "MH", "name": "Maharashtra"},
        {"code": "MN", "name": "Manipur"},
        {"code": "ML", "name": "Meghalaya"},
        {"code": "MZ", "name": "Mizoram"},
        {"code": "NL", "name": "Nagaland"},
        {"code": "OR", "name": "Odisha"},
        {"code": "PY", "name": "Puducherry"},
        {"code": "PB", "name": "Punjab"},
        {"code": "RJ", "name": "Rajasthan"},
        {"code": "SK", "name": "Sikkim"},
        {"code": "TN", "name": "Tamil Nadu"},
        {"code": "TG", "name": "Telangana"},
        {"code": "TR", "name": "Tripura"},
        {"code": "UP", "name": "Uttar Pradesh"},
        {"code": "UT", "name": "Uttarakhand"},
        {"code": "WB", "name": "West Bengal"}
    ]
    
    return jsonify({'states': states}), 200