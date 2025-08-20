import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Security keys - Must be set in environment variables
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_EXPIRATION_DELTA = 24
    
    # Validate required security keys
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable is required")
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY environment variable is required")
    
    # Database configuration - Must be set in environment variables
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DB_NAME = os.environ.get('DB_NAME', 'ecommerce_db')
    DB_PORT = int(os.environ.get('DB_PORT', '3306'))
    
    # Validate required database password
    if not DB_PASSWORD:
        raise ValueError("DB_PASSWORD environment variable is required")
    
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
    
    IMAGE_SIZES = {
        'thumbnail': (150, 150),
        'small': (300, 300),
        'medium': (600, 600),
        'large': (1200, 1200),
        'hero': (1920, 1080)
    }
    
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = 'ecommerce_v2_'
    
    CACHE_TIMEOUT_HEALTH = 60
    CACHE_TIMEOUT_PRODUCTS = 120
    CACHE_TIMEOUT_CATEGORIES = 600
    CACHE_TIMEOUT_FEATURED = 180
    CACHE_TIMEOUT_PRODUCT_DETAIL = 180
    CACHE_TIMEOUT_USER_SESSION = 1800
    
    # Email configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', '587'))
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # Email feature flags
    EMAIL_VERIFICATION_REQUIRED = os.environ.get('EMAIL_VERIFICATION_REQUIRED', 'true').lower() == 'true'
    SEND_ORDER_EMAILS = os.environ.get('SEND_ORDER_EMAILS', 'true').lower() == 'true'
    
    # URL configuration
    BACKEND_BASE_URL = os.environ.get('BACKEND_BASE_URL', 'http://localhost:5000')
    FRONTEND_BASE_URL = os.environ.get('FRONTEND_BASE_URL', 'http://localhost:3000')
    
    # Company information
    COMPANY_NAME = os.environ.get('COMPANY_NAME', 'WellnessNest')
    COMPANY_EMAIL = os.environ.get('COMPANY_EMAIL', 'info@wellnessnest.com')
    COMPANY_PHONE = os.environ.get('COMPANY_PHONE', '6261116108')
    
    BUSINESS_STATE_CODE = 'MP'
    FREE_DELIVERY_THRESHOLD = 500
    STANDARD_DELIVERY_CHARGE = 50
    
    REFERRAL_REWARD_AMOUNT = 50
    REFERRAL_MIN_ORDER_AMOUNT = 500
    
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']
    
    @staticmethod
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    CACHE_TIMEOUT_PRODUCTS = 300
    CACHE_TIMEOUT_CATEGORIES = 600

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
    DB_HOST = os.environ.get('PROD_DB_HOST') or Config.DB_HOST
    DB_USER = os.environ.get('PROD_DB_USER') or Config.DB_USER
    DB_PASSWORD = os.environ.get('PROD_DB_PASSWORD') or Config.DB_PASSWORD
    DB_NAME = os.environ.get('PROD_DB_NAME') or Config.DB_NAME
    
    CACHE_TIMEOUT_PRODUCTS = 1800
    CACHE_TIMEOUT_CATEGORIES = 7200
    CACHE_TIMEOUT_FEATURED = 1200
    
    UPLOAD_FOLDER = os.environ.get('PROD_UPLOAD_FOLDER') or Config.UPLOAD_FOLDER

class TestingConfig(Config):
    DEBUG = True
    TESTING = True
    DB_NAME = 'test_ecommerce_db'
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 60
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_uploads')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])