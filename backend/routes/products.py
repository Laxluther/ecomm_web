from flask import Blueprint, request, jsonify, current_app
from models import ProductModel, execute_query, token_required

products_bp = Blueprint('products', __name__)

def invalidate_product_cache(product_id=None):
    """Invalidate product-related cache entries"""
    try:
        cache = current_app.cache
        
        # Clear general product caches
        cache.delete('featured_products')
        cache.delete('active_categories')
        cache.delete('all_brands')
        
        # Clear specific product cache if product_id provided
        if product_id:
            cache.delete(f'product_detail_{product_id}')
            cache.delete(f'product_stock_{product_id}')
        
        # Clear product list caches (they might include the updated product)
        cache.delete_many('products_list_*')
        
        return True
    except Exception as e:
        print(f"Cache invalidation error: {e}")
        return False

@products_bp.route('/', methods=['GET'])
def get_products():
    """Get products with optional filtering and caching (excludes deleted)"""
    category_id = request.args.get('category')
    search_query = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Create cache key based on parameters
    cache_key = f'products_list_{category_id}_{search_query}_{page}_{per_page}_{sort_by}_{sort_order}'
    
    # Try cache first
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({
            **cached_data,
            'cached': True,
            'cache_key': cache_key
        }), 200
    
    # Build query - EXCLUDE DELETED PRODUCTS and get all image information
    offset = (page - 1) * per_page
    
    query = """
        SELECT p.*, 
               c.category_name,
               -- Get primary image
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               -- Get all images as JSON
               (SELECT JSON_ARRAYAGG(
                   JSON_OBJECT(
                       'image_id', pi.image_id,
                       'image_url', pi.image_url,
                       'alt_text', pi.alt_text,
                       'is_primary', pi.is_primary,
                       'sort_order', pi.sort_order
                   )
               ) FROM product_images pi 
                WHERE pi.product_id = p.product_id 
                ORDER BY pi.sort_order) as images,
               -- Get stock info
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity,
               -- Get average rating
               (SELECT AVG(r.rating) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as avg_rating,
               (SELECT COUNT(*) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as review_count
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.status = 'active' AND (c.status = 'active' OR c.status IS NULL)
    """
    
    params = []
    
    if category_id:
        query += " AND p.category_id = %s"
        params.append(category_id)
    
    if search_query:
        query += " AND (p.product_name LIKE %s OR p.description LIKE %s OR p.brand LIKE %s)"
        params.extend([f'%{search_query}%', f'%{search_query}%', f'%{search_query}%'])
    
    # Add sorting
    valid_sort_fields = ['product_name', 'price', 'discount_price', 'created_at', 'avg_rating']
    if sort_by in valid_sort_fields:
        if sort_by in ['price', 'discount_price']:
            query += f" ORDER BY COALESCE(p.discount_price, p.price) {sort_order.upper()}"
        elif sort_by == 'avg_rating':
            query += f" ORDER BY avg_rating {sort_order.upper()}"
        else:
            query += f" ORDER BY p.{sort_by} {sort_order.upper()}"
    else:
        query += " ORDER BY p.created_at DESC"
    
    query += " LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    products = execute_query(query, params, fetch_all=True)
    
    # Process products to parse JSON and add computed fields
    for product in products:
        if product.get('images'):
            try:
                import json
                product['images'] = json.loads(product['images']) if product['images'] else []
            except:
                product['images'] = []
        else:
            product['images'] = []
        
        # Add computed fields
        product['in_stock'] = (product.get('stock_quantity') or 0) > 0
        product['average_rating'] = round(float(product.get('avg_rating') or 0), 1)
        product['total_reviews'] = product.get('review_count') or 0
        
        # Calculate savings
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
            product['savings_percentage'] = round((product['savings'] / float(product['price'])) * 100, 1)
        else:
            product['savings'] = 0
            product['savings_percentage'] = 0
    
    # Get total count for pagination
    count_query = """
        SELECT COUNT(*) as total 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.status = 'active' AND (c.status = 'active' OR c.status IS NULL)
    """
    count_params = []
    
    if category_id:
        count_query += " AND p.category_id = %s"
        count_params.append(category_id)
    
    if search_query:
        count_query += " AND (p.product_name LIKE %s OR p.description LIKE %s OR p.brand LIKE %s)"
        count_params.extend([f'%{search_query}%', f'%{search_query}%', f'%{search_query}%'])
    
    total_result = execute_query(count_query, count_params, fetch_one=True)
    total_count = total_result['total'] if total_result else 0
    
    result_data = {
        'products': products,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'pages': (total_count + per_page - 1) // per_page
        },
        'filters': {
            'category_id': category_id,
            'search_query': search_query,
            'sort_by': sort_by,
            'sort_order': sort_order
        },
        'cached': False
    }
    
    # Cache for configured timeout
    timeout = current_app.config.get('CACHE_TIMEOUT_PRODUCTS', 300)
    current_app.cache.set(cache_key, result_data, timeout=timeout)
    
    return jsonify({**result_data, 'cache_key': cache_key}), 200

@products_bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get featured products with caching and full image data"""
    cache_key = 'featured_products'
    
    # Try cache first
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({
            'products': cached_data, 
            'cached': True,
            'cache_key': cache_key
        }), 200
    
    # Get from database with enhanced image data
    products = execute_query("""
        SELECT p.*, 
               c.category_name,
               -- Get primary image
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               -- Get all images
               (SELECT JSON_ARRAYAGG(
                   JSON_OBJECT(
                       'image_id', pi.image_id,
                       'image_url', pi.image_url,
                       'alt_text', pi.alt_text,
                       'is_primary', pi.is_primary,
                       'sort_order', pi.sort_order
                   )
               ) FROM product_images pi 
                WHERE pi.product_id = p.product_id 
                ORDER BY pi.sort_order) as images,
               -- Get stock and rating info
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity,
               (SELECT AVG(r.rating) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as avg_rating,
               (SELECT COUNT(*) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as review_count
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.is_featured = 1 AND p.status = 'active' AND c.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 8
    """, fetch_all=True)
    
    # Process products
    for product in products:
        if product.get('images'):
            try:
                import json
                product['images'] = json.loads(product['images']) if product['images'] else []
            except:
                product['images'] = []
        else:
            product['images'] = []
        
        # Add computed fields
        product['in_stock'] = (product.get('stock_quantity') or 0) > 0
        product['average_rating'] = round(float(product.get('avg_rating') or 0), 1)
        product['total_reviews'] = product.get('review_count') or 0
        
        # Calculate savings
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
            product['savings_percentage'] = round((product['savings'] / float(product['price'])) * 100, 1)
        else:
            product['savings'] = 0
            product['savings_percentage'] = 0
    
    # Cache for configured timeout
    timeout = current_app.config.get('CACHE_TIMEOUT_FEATURED', 600)
    current_app.cache.set(cache_key, products, timeout=timeout)
    
    return jsonify({
        'products': products, 
        'cached': False,
        'cache_key': cache_key
    }), 200

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    """Get detailed product information with full image and review data"""
    cache_key = f'product_detail_{product_id}'
    
    # Try cache first
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({**cached_data, 'cached': True}), 200
    
    # Get product from database with full details
    product = execute_query("""
        SELECT p.*, c.category_name,
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity,
               (SELECT i.min_stock_level FROM inventory i WHERE i.product_id = p.product_id) as min_stock_level
        FROM products p 
        JOIN categories c ON p.category_id = c.category_id 
        WHERE p.product_id = %s AND p.status = 'active' AND c.status = 'active'
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found or unavailable'}), 404
    
    # Get all product images
    images = execute_query("""
        SELECT * FROM product_images 
        WHERE product_id = %s 
        ORDER BY sort_order, is_primary DESC
    """, (product_id,), fetch_all=True)
    
    # Get product variants
    variants = execute_query("""
        SELECT * FROM product_variants 
        WHERE product_id = %s AND status = 'active'
        ORDER BY variant_name, variant_value
    """, (product_id,), fetch_all=True)
    
    # Get reviews with pagination
    reviews = execute_query("""
        SELECT r.*, u.first_name, u.last_name,
               DATE_FORMAT(r.created_at, '%M %d, %Y') as review_date
        FROM reviews r 
        JOIN users u ON r.user_id = u.user_id 
        WHERE r.product_id = %s AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT 10
    """, (product_id,), fetch_all=True)
    
    # Get rating breakdown
    rating_breakdown = execute_query("""
        SELECT 
            rating,
            COUNT(*) as count,
            (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews WHERE product_id = %s AND status = 'approved')) as percentage
        FROM reviews 
        WHERE product_id = %s AND status = 'approved'
        GROUP BY rating
        ORDER BY rating DESC
    """, (product_id, product_id), fetch_all=True)
    
    # Calculate average rating and total reviews
    avg_rating_result = execute_query("""
        SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
        FROM reviews 
        WHERE product_id = %s AND status = 'approved'
    """, (product_id,), fetch_one=True)
    
    # Get related products (same category)
    related_products = execute_query("""
        SELECT p.product_id, p.product_name, p.price, p.discount_price,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image
        FROM products p 
        WHERE p.category_id = %s AND p.product_id != %s AND p.status = 'active'
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT 6
    """, (product['category_id'], product_id), fetch_all=True)
    
    # Add computed fields to product
    product['in_stock'] = (product.get('stock_quantity') or 0) > 0
    product['low_stock'] = (product.get('stock_quantity') or 0) <= (product.get('min_stock_level') or 10)
    
    # Calculate savings
    if product.get('discount_price') and product.get('price'):
        product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
        product['savings_percentage'] = round((product['savings'] / float(product['price'])) * 100, 1)
    else:
        product['savings'] = 0
        product['savings_percentage'] = 0
    
    # Format rating breakdown
    rating_stats = {str(i): {'count': 0, 'percentage': 0} for i in range(1, 6)}
    for rating in rating_breakdown:
        rating_stats[str(rating['rating'])] = {
            'count': rating['count'],
            'percentage': round(rating['percentage'], 1)
        }
    
    product_data = {
        'product': product,
        'images': images,
        'variants': variants,
        'reviews': reviews,
        'rating': {
            'average': round(float(avg_rating_result['avg_rating'] or 0), 1),
            'total_reviews': avg_rating_result['total_reviews'],
            'breakdown': rating_stats
        },
        'related_products': related_products,
        'cached': False
    }
    
    # Cache for configured timeout
    timeout = current_app.config.get('CACHE_TIMEOUT_PRODUCT_DETAIL', 900)
    current_app.cache.set(cache_key, product_data, timeout=timeout)
    
    return jsonify(product_data), 200

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all active categories with product counts and images"""
    cache_key = 'active_categories'
    
    # Try cache first
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({
            'categories': cached_data, 
            'cached': True,
            'cache_key': cache_key
        }), 200
    
    # Get from database with enhanced data
    categories = execute_query("""
        SELECT c.*, 
               (SELECT COUNT(*) FROM products p 
                WHERE p.category_id = c.category_id AND p.status = 'active') as product_count
        FROM categories c
        WHERE c.status = 'active' 
        ORDER BY c.sort_order, c.category_name
    """, fetch_all=True)
    
    # Cache for configured timeout
    timeout = current_app.config.get('CACHE_TIMEOUT_CATEGORIES', 3600)
    current_app.cache.set(cache_key, categories, timeout=timeout)
    
    return jsonify({
        'categories': categories, 
        'cached': False,
        'cache_key': cache_key
    }), 200

@products_bp.route('/search', methods=['GET'])
def search_products():
    """Advanced product search with enhanced filtering"""
    query = request.args.get('q', '').strip()
    category_id = request.args.get('category')
    brand = request.args.get('brand')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    min_rating = request.args.get('min_rating')
    in_stock = request.args.get('in_stock', '').lower() == 'true'
    featured_only = request.args.get('featured', '').lower() == 'true'
    sort_by = request.args.get('sort_by', 'relevance')
    sort_order = request.args.get('sort_order', 'desc')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    
    # Create cache key from search parameters
    cache_params = f"{query}_{category_id}_{brand}_{min_price}_{max_price}_{min_rating}_{in_stock}_{featured_only}_{sort_by}_{sort_order}_{page}_{per_page}"
    cache_key = f'search_{hash(cache_params)}'
    
    # Try cache first
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({**cached_data, 'cached': True}), 200
    
    # Build search query
    sql = """
        SELECT p.*, 
               c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity,
               (SELECT AVG(r.rating) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as avg_rating,
               (SELECT COUNT(*) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as review_count
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.status = 'active' AND (c.status = 'active' OR c.status IS NULL)
    """
    
    params = []
    
    # Search filters
    if query:
        sql += " AND (p.product_name LIKE %s OR p.description LIKE %s OR p.brand LIKE %s)"
        params.extend([f'%{query}%', f'%{query}%', f'%{query}%'])
    
    if category_id:
        sql += " AND p.category_id = %s"
        params.append(category_id)
    
    if brand:
        sql += " AND p.brand = %s"
        params.append(brand)
    
    if min_price:
        sql += " AND (COALESCE(p.discount_price, p.price) >= %s)"
        params.append(float(min_price))
    
    if max_price:
        sql += " AND (COALESCE(p.discount_price, p.price) <= %s)"
        params.append(float(max_price))
    
    if featured_only:
        sql += " AND p.is_featured = 1"
    
    if in_stock:
        sql += " AND EXISTS (SELECT 1 FROM inventory i WHERE i.product_id = p.product_id AND i.quantity > 0)"
    
    # Add HAVING clause for rating filter (after aggregation)
    having_clause = ""
    if min_rating:
        having_clause = f" HAVING avg_rating >= {float(min_rating)}"
    
    # Sorting
    if sort_by == 'relevance' and query:
        # Search relevance sorting
        sql += " ORDER BY (CASE WHEN p.product_name LIKE %s THEN 1 ELSE 2 END), p.is_featured DESC, p.created_at DESC"
        params.append(f'%{query}%')
    elif sort_by == 'price':
        sql += f" ORDER BY COALESCE(p.discount_price, p.price) {sort_order.upper()}"
    elif sort_by == 'rating':
        sql += f" ORDER BY avg_rating {sort_order.upper()}"
    elif sort_by == 'reviews':
        sql += f" ORDER BY review_count {sort_order.upper()}"
    elif sort_by == 'name':
        sql += f" ORDER BY p.product_name {sort_order.upper()}"
    else:
        sql += " ORDER BY p.created_at DESC"
    
    # Add having clause
    sql += having_clause
    
    # Get total count first (for pagination)
    count_sql = sql.replace(
        """SELECT p.*, 
               c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity,
               (SELECT AVG(r.rating) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as avg_rating,
               (SELECT COUNT(*) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as review_count""",
        "SELECT COUNT(*) as total"
    )
    
    # Remove ORDER BY from count query
    count_sql = count_sql.split(' ORDER BY')[0] + having_clause
    
    total_result = execute_query(count_sql, params, fetch_one=True)
    total_count = total_result['total'] if total_result else 0
    
    # Add pagination to main query
    offset = (page - 1) * per_page
    sql += " LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    products = execute_query(sql, params, fetch_all=True)
    
    # Process products
    for product in products:
        product['in_stock'] = (product.get('stock_quantity') or 0) > 0
        product['average_rating'] = round(float(product.get('avg_rating') or 0), 1)
        product['total_reviews'] = product.get('review_count') or 0
        
        # Calculate savings
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
            product['savings_percentage'] = round((product['savings'] / float(product['price'])) * 100, 1)
        else:
            product['savings'] = 0
            product['savings_percentage'] = 0
    
    search_data = {
        'products': products,
        'search_query': query,
        'filters': {
            'category_id': category_id,
            'brand': brand,
            'min_price': min_price,
            'max_price': max_price,
            'min_rating': min_rating,
            'in_stock': in_stock,
            'featured_only': featured_only,
            'sort_by': sort_by,
            'sort_order': sort_order
        },
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'pages': (total_count + per_page - 1) // per_page
        },
        'cached': False
    }
    
    # Cache search results for shorter time
    current_app.cache.set(cache_key, search_data, timeout=300)  # 5 minutes
    
    return jsonify(search_data), 200

@products_bp.route('/brands', methods=['GET'])
def get_brands():
    """Get all product brands with product counts"""
    cache_key = 'all_brands'
    
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({'brands': cached_data, 'cached': True}), 200
    
    brands = execute_query("""
        SELECT brand, COUNT(*) as product_count
        FROM products 
        WHERE brand IS NOT NULL AND brand != '' AND status = 'active'
        GROUP BY brand
        ORDER BY product_count DESC, brand
    """, fetch_all=True)
    
    current_app.cache.set(cache_key, brands, timeout=3600)  # 1 hour
    
    return jsonify({'brands': brands, 'cached': False}), 200

@products_bp.route('/<int:product_id>/reviews', methods=['POST'])
@token_required
def add_review(current_user_id, product_id):
    """Add product review"""
    data = request.get_json()
    
    rating = data.get('rating')
    title = data.get('title', '').strip()
    comment = data.get('comment', '').strip()
    
    if not rating or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    if not comment:
        return jsonify({'error': 'Review comment is required'}), 400
    
    # Check if user already reviewed this product
    existing_review = execute_query("""
        SELECT review_id FROM reviews 
        WHERE user_id = %s AND product_id = %s
    """, (current_user_id, product_id), fetch_one=True)
    
    if existing_review:
        return jsonify({'error': 'You have already reviewed this product'}), 409
    
    # Check if user purchased this product
    purchased = execute_query("""
        SELECT oi.item_id FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.user_id = %s AND oi.product_id = %s AND o.status = 'delivered'
    """, (current_user_id, product_id), fetch_one=True)
    
    if not purchased:
        return jsonify({'error': 'You can only review products you have purchased'}), 403
    
    # Add review
    from datetime import datetime
    execute_query("""
        INSERT INTO reviews (product_id, user_id, rating, title, comment, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (product_id, current_user_id, rating, title, comment, 'pending', datetime.now()))
    
    # Invalidate product cache since reviews affect the product
    invalidate_product_cache(product_id)
    
    return jsonify({'message': 'Review submitted successfully. It will be published after moderation.'}), 201

@products_bp.route('/<int:product_id>/stock', methods=['GET'])
def check_stock(product_id):
    """Check product stock availability with caching"""
    cache_key = f'product_stock_{product_id}'
    
    # Try cache first
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({**cached_data, 'cached': True}), 200
    
    # Get from database
    inventory = execute_query("""
        SELECT quantity, reserved_quantity, min_stock_level 
        FROM inventory 
        WHERE product_id = %s
    """, (product_id,), fetch_one=True)
    
    if not inventory:
        stock_data = {
            'available': False, 
            'stock': 0, 
            'low_stock': False,
            'out_of_stock': True,
            'cached': False
        }
    else:
        available_stock = inventory['quantity'] - inventory['reserved_quantity']
        min_stock = inventory.get('min_stock_level', 10)
        
        stock_data = {
            'available': available_stock > 0,
            'stock': max(0, available_stock),
            'in_stock': available_stock > 0,
            'low_stock': available_stock <= min_stock and available_stock > 0,
            'out_of_stock': available_stock <= 0,
            'min_stock_level': min_stock,
            'cached': False
        }
    
    # Cache stock info for shorter time (inventory changes frequently)
    timeout = current_app.config.get('CACHE_TIMEOUT_INVENTORY', 300)
    current_app.cache.set(cache_key, stock_data, timeout=timeout)
    
    return jsonify(stock_data), 200

@products_bp.route('/<int:product_id>/variants', methods=['GET'])
def get_product_variants(product_id):
    """Get product variants"""
    variants = execute_query("""
        SELECT pv.*, 
               (SELECT i.quantity FROM inventory i 
                WHERE i.product_id = pv.product_id AND i.variant_id = pv.variant_id) as stock
        FROM product_variants pv
        WHERE pv.product_id = %s AND pv.status = 'active'
        ORDER BY pv.variant_name, pv.variant_value
    """, (product_id,), fetch_all=True)
    
    return jsonify({'variants': variants}), 200

@products_bp.route('/filter-options', methods=['GET'])
def get_filter_options():
    """Get filter options for product search"""
    cache_key = 'product_filter_options'
    
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({**cached_data, 'cached': True}), 200
    
    # Get price range
    price_range = execute_query("""
        SELECT 
            MIN(COALESCE(discount_price, price)) as min_price,
            MAX(COALESCE(discount_price, price)) as max_price
        FROM products 
        WHERE status = 'active'
    """, fetch_one=True)
    
    # Get brands
    brands = execute_query("""
        SELECT brand, COUNT(*) as product_count
        FROM products 
        WHERE brand IS NOT NULL AND brand != '' AND status = 'active'
        GROUP BY brand
        ORDER BY product_count DESC
    """, fetch_all=True)
    
    # Get categories
    categories = execute_query("""
        SELECT c.category_id, c.category_name, COUNT(p.product_id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.category_id = p.category_id AND p.status = 'active'
        WHERE c.status = 'active'
        GROUP BY c.category_id, c.category_name
        HAVING product_count > 0
        ORDER BY c.sort_order, c.category_name
    """, fetch_all=True)
    
    filter_data = {
        'price_range': {
            'min': float(price_range['min_price'] or 0),
            'max': float(price_range['max_price'] or 0)
        },
        'brands': brands,
        'categories': categories,
        'rating_options': [
            {'value': 4, 'label': '4+ Stars'},
            {'value': 3, 'label': '3+ Stars'},
            {'value': 2, 'label': '2+ Stars'},
            {'value': 1, 'label': '1+ Stars'}
        ],
        'sort_options': [
            {'value': 'relevance', 'label': 'Relevance'},
            {'value': 'price', 'label': 'Price: Low to High'},
            {'value': 'price_desc', 'label': 'Price: High to Low'},
            {'value': 'rating', 'label': 'Customer Rating'},
            {'value': 'reviews', 'label': 'Most Reviews'},
            {'value': 'name', 'label': 'Name: A to Z'},
            {'value': 'newest', 'label': 'Newest First'}
        ],
        'cached': False
    }
    
    # Cache for 1 hour
    current_app.cache.set(cache_key, filter_data, timeout=3600)
    
    return jsonify(filter_data), 200

@products_bp.route('/trending', methods=['GET'])
def get_trending_products():
    """Get trending products based on recent orders and views"""
    cache_key = 'trending_products'
    
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({'products': cached_data, 'cached': True}), 200
    
    # Get products with most orders in last 30 days
    trending = execute_query("""
        SELECT p.*, c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               COUNT(oi.item_id) as order_count,
               SUM(oi.quantity) as total_sold,
               (SELECT AVG(r.rating) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as avg_rating
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.order_id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE p.status = 'active' AND c.status = 'active'
        GROUP BY p.product_id
        ORDER BY order_count DESC, total_sold DESC
        LIMIT 12
    """, fetch_all=True)
    
    # Process products
    for product in trending:
        product['average_rating'] = round(float(product.get('avg_rating') or 0), 1)
        product['trending_score'] = product.get('order_count', 0) + (product.get('total_sold', 0) * 0.5)
        
        # Calculate savings
        if product.get('discount_price') and product.get('price'):
            product['savings'] = round(float(product['price']) - float(product['discount_price']), 2)
            product['savings_percentage'] = round((product['savings'] / float(product['price'])) * 100, 1)
        else:
            product['savings'] = 0
            product['savings_percentage'] = 0
    
    # Cache for 1 hour
    current_app.cache.set(cache_key, trending, timeout=3600)
    
    return jsonify({'products': trending, 'cached': False}), 200

@products_bp.route('/deals', methods=['GET'])
def get_deals():
    """Get products with best discounts"""
    cache_key = 'product_deals'
    
    cached_data = current_app.cache.get(cache_key)
    if cached_data:
        return jsonify({'products': cached_data, 'cached': True}), 200
    
    deals = execute_query("""
        SELECT p.*, c.category_name,
               (SELECT pi.image_url FROM product_images pi 
                WHERE pi.product_id = p.product_id AND pi.is_primary = 1 
                LIMIT 1) as primary_image,
               (p.price - p.discount_price) as savings_amount,
               ROUND(((p.price - p.discount_price) / p.price) * 100, 1) as savings_percentage,
               (SELECT AVG(r.rating) FROM reviews r 
                WHERE r.product_id = p.product_id AND r.status = 'approved') as avg_rating
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.status = 'active' AND c.status = 'active' 
        AND p.discount_price IS NOT NULL AND p.discount_price < p.price
        ORDER BY savings_percentage DESC, savings_amount DESC
        LIMIT 20
    """, fetch_all=True)
    
    # Process products
    for product in deals:
        product['average_rating'] = round(float(product.get('avg_rating') or 0), 1)
    
    # Cache for 30 minutes
    current_app.cache.set(cache_key, deals, timeout=1800)
    
    return jsonify({'products': deals, 'cached': False}), 200

