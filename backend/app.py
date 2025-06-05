from flask import Flask, request, make_response, send_from_directory, jsonify
from flask_cors import CORS
from flask_caching import Cache
from config import get_config
import os
from datetime import datetime

def create_app():
    app = Flask(__name__)
    
    # Load configuration
    config_class = get_config()
    app.config.from_object(config_class)
    
    # FIXED: Disable strict slashes to prevent 308 redirects
    app.url_map.strict_slashes = False
    
    # Enhanced CORS configuration with file upload support
    CORS(app, 
         origins=app.config.get('CORS_ORIGINS', ['http://localhost:3000', 'http://localhost:5173']),
         supports_credentials=True,  # Enable cookies
         allow_headers=['Content-Type', 'Authorization', 'Cookie'],
         expose_headers=['Set-Cookie'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    )
    
    # Initialize caching
    cache = Cache(app)
    app.cache = cache  # Make cache available globally
    
    # Create upload directory structure
    upload_folder = app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    # Create subdirectories for different content types
    subdirs = ['products', 'categories', 'users', 'banners']
    for subdir in subdirs:
        for size in ['thumbnails', 'small', 'medium', 'large', 'original']:
            os.makedirs(os.path.join(upload_folder, subdir, size), exist_ok=True)
    
    # Static file serving for uploads
    @app.route('/static/uploads/<path:filename>')
    def uploaded_file(filename):
        """Serve uploaded files"""
        try:
            return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        except FileNotFoundError:
            # Return a default image or 404
            return jsonify({'error': 'File not found'}), 404
    
    # File Upload Routes
    @app.route('/api/upload/single', methods=['POST'])
    def upload_single_file():
        """Upload single file"""
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        folder_type = request.form.get('type', 'products')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        from file_upload_service import file_upload_service
        result, message = file_upload_service.save_image(file, folder_type, create_variants=True)
        
        if result:
            return jsonify({
                'message': message,
                'file': result
            }), 200
        else:
            return jsonify({'error': message}), 400
    
    @app.route('/api/upload/multiple', methods=['POST'])
    def upload_multiple_files():
        """Upload multiple files"""
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        folder_type = request.form.get('type', 'products')
        
        uploaded_files = []
        failed_files = []
        
        from file_upload_service import file_upload_service
        
        for file in files:
            if file.filename != '':
                result, message = file_upload_service.save_image(file, folder_type, create_variants=True)
                if result:
                    uploaded_files.append(result)
                else:
                    failed_files.append({'filename': file.filename, 'error': message})
        
        return jsonify({
            'message': f'Uploaded {len(uploaded_files)} files successfully',
            'uploaded_files': uploaded_files,
            'failed_files': failed_files
        }), 200
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.products import products_bp
    from routes.cart import cart_bp
    from routes.orders import orders_bp
    from routes.user import user_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    
    # Add caching and security middleware
    @app.after_request
    def after_request(response):
        # Add cache headers based on endpoint
        if request.endpoint:
            if 'static' in request.endpoint or 'uploaded_file' in request.endpoint:
                # Static files and uploads - cache for 1 year
                response.headers['Cache-Control'] = 'public, max-age=31536000'
            elif request.endpoint in ['products.get_featured_products', 'products.get_categories']:
                # Product data - cache for 10 minutes
                response.headers['Cache-Control'] = 'public, max-age=600'
            elif request.endpoint in ['products.get_products', 'products.get_product_detail']:
                # Product listings - cache for 5 minutes
                response.headers['Cache-Control'] = 'public, max-age=300'
            elif request.endpoint == 'health_check':
                # Health check - cache for 1 minute
                response.headers['Cache-Control'] = 'public, max-age=60'
            else:
                # Dynamic content - no cache
                response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response.headers['Pragma'] = 'no-cache'
                response.headers['Expires'] = '0'
        
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add ETag for cacheable responses
        if response.status_code == 200 and request.method == 'GET':
            if request.endpoint in ['products.get_featured_products', 'products.get_categories', 'products.get_product_detail']:
                # Generate ETag based on content
                response.add_etag()
        
        return response
    
    # Basic health check with caching
    @app.route('/api/health')
    def health_check():
        """Health check endpoint with caching"""
        cache_key = 'health_check'
        
        # Try cache first
        cached_result = app.cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Generate fresh response
        health_data = {
            'status': 'healthy',
            'message': 'E-commerce API is running',
            'timestamp': datetime.now().isoformat(),
            'cached': False,
            'upload_folder': app.config['UPLOAD_FOLDER'],
            'max_content_length': app.config['MAX_CONTENT_LENGTH']
        }
        
        # Cache for 1 minute
        app.cache.set(cache_key, health_data, timeout=60)
        
        return health_data
    
    # Cache statistics endpoint (for monitoring)
    @app.route('/api/cache/stats')
    def cache_stats():
        """Get cache statistics"""
        try:
            import redis
            r = redis.Redis.from_url(app.config['CACHE_REDIS_URL'])
            info = r.info()
            
            # Get Flask cache keys
            cache_keys = r.keys("flask_cache_*")
            
            stats = {
                'redis_version': info.get('redis_version'),
                'used_memory': info.get('used_memory_human'),
                'connected_clients': info.get('connected_clients'),
                'total_commands_processed': info.get('total_commands_processed'),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'cache_keys_count': len(cache_keys),
                'uptime_in_seconds': info.get('uptime_in_seconds'),
                'hit_rate': round(
                    info.get('keyspace_hits', 0) / 
                    (info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1)) * 100, 2
                )
            }
            
            return {'cache_stats': stats}, 200
        except Exception as e:
            return {'error': f'Cache stats unavailable: {str(e)}'}, 500
    
    # System Information Endpoint
    @app.route('/api/system/info')
    def system_info():
        """Get system information"""
        return jsonify({
            'upload_folder': app.config['UPLOAD_FOLDER'],
            'max_file_size': app.config['MAX_CONTENT_LENGTH'],
            'allowed_extensions': list(app.config['ALLOWED_EXTENSIONS']),
            'image_sizes': app.config.get('IMAGE_SIZES', {}),
            'cache_enabled': bool(app.cache),
            'debug_mode': app.debug,
            'environment': os.environ.get('FLASK_ENV', 'development')
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(413)
    def file_too_large(error):
        return {'error': 'File too large'}, 413
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)