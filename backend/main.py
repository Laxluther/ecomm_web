from flask import Flask
from flask_cors import CORS
from flask_caching import Cache
from config import get_config

def create_app():
    app = Flask(__name__)
    
    config_class = get_config()
    app.config.from_object(config_class)
    
    app.url_map.strict_slashes = False
    
    CORS(app, 
         origins=app.config.get('CORS_ORIGINS', ['http://localhost:3000']),
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    cache = Cache(app)
    app.cache = cache
    
    from admin.routes import admin_bp
    from user.routes import user_bp
    from shared.routes import shared_bp
    
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(shared_bp, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)