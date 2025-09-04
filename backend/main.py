import os
import sys
import locale

# Set UTF-8 encoding for Windows compatibility
if sys.platform.startswith('win'):
    try:
        # Try to set UTF-8 locale
        locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
    except locale.Error:
        try:
            # Fallback for Windows
            locale.setlocale(locale.LC_ALL, '')
        except locale.Error:
            pass
    
    # Set environment variables for UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_caching import Cache
from config import get_config
from websocket_manager import WebSocketManager  # ADD THIS IMPORT
# ADD THESE IMPORTS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour", "100 per minute"]
    )
def create_app():
    app = Flask(__name__)
    
    config_class = get_config()
    app.config.from_object(config_class)
    
    app.url_map.strict_slashes = False
    
    cors_origins = app.config.get('CORS_ORIGINS', ['http://localhost:3000'])

    CORS(app, 
        origins=cors_origins,
        supports_credentials=True,  # Keep this as True for now
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    cache = Cache(app)
    limiter.init_app(app)
    

  
    # Security headers - Enhanced configuration
    if not app.debug:
        Talisman(app, 
                force_https=True,
                strict_transport_security=True,
                content_security_policy={
                    'default-src': "'self'",
                    'img-src': "'self' data: https:",
                    'script-src': "'self'",
                    'style-src': "'self' 'unsafe-inline'",
                    'font-src': "'self' https:",
                    'connect-src': "'self'"
                })
    app.cache = cache
    
    # ADD WEBSOCKET MANAGER
    websocket_manager = WebSocketManager(app)
    app.websocket_manager = websocket_manager
    
    from admin.routes import admin_bp
    from user.routes import user_bp
    from shared.routes import shared_bp
    from user.auth import user_auth_bp
    app.register_blueprint(user_auth_bp, url_prefix='/api/user/auth')
    
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(shared_bp, url_prefix='/api')
    
    # Serve static files (images) - CRITICAL FOR IMAGE SERVING
    @app.route('/static/uploads/<path:filename>')
    def uploaded_file(filename):
        upload_folder = app.config.get('UPLOAD_FOLDER', './static/uploads')
        # Handle relative path
        if upload_folder.startswith('./'):
            upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), upload_folder[2:])
        return send_from_directory(upload_folder, filename, as_attachment=False)
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'E-commerce API is running'}, 200
    
    # ADD WEBSOCKET STATUS ENDPOINT
    @app.route('/websocket/status')
    def websocket_status():
        return app.websocket_manager.get_status(), 200
    @app.after_request
    def security_headers(response):
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response
    return app

    
if __name__ == '__main__':
    app = create_app()
    app.websocket_manager.socketio.run(app, debug=True, host='0.0.0.0', port=5000)