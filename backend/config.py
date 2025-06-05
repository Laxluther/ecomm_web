import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Security Keys
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key'
    JWT_EXPIRATION_DELTA = 24  # hours
    
    # Database Configuration
    DB_HOST = os.environ.get('DB_HOST') or 'localhost'
    DB_USER = os.environ.get('DB_USER') or 'root'
    DB_PASSWORD = os.environ.get('DB_PASSWORD') or 'password'
    DB_NAME = os.environ.get('DB_NAME') or 'ecommerce_db'
    DB_PORT = int(os.environ.get('DB_PORT') or 3306)
    
    # File Upload Configuration - ENHANCED
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32MB for multiple files
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
    
    # Image Processing Configuration
    IMAGE_SIZES = {
        'thumbnail': (150, 150),
        'small': (300, 300),
        'medium': (600, 600),
        'large': (1200, 1200),
        'hero': (1920, 1080)  # For banners/hero images
    }
    
    # Image Quality Settings
    IMAGE_QUALITY = {
        'thumbnail': 75,
        'small': 80,
        'medium': 85,
        'large': 90,
        'original': 95
    }
    
    # Caching Configuration
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes default
    CACHE_KEY_PREFIX = 'ecommerce_api_'
    
    # Cache timeouts for different data types (in seconds)
    CACHE_TIMEOUT_HEALTH = 60           # 1 minute
    CACHE_TIMEOUT_PRODUCTS = 600        # 10 minutes
    CACHE_TIMEOUT_CATEGORIES = 3600     # 1 hour
    CACHE_TIMEOUT_FEATURED = 600        # 10 minutes
    CACHE_TIMEOUT_PRODUCT_DETAIL = 900  # 15 minutes
    CACHE_TIMEOUT_INVENTORY = 300       # 5 minutes
    CACHE_TIMEOUT_USER_SESSION = 1800   # 30 minutes
    CACHE_TIMEOUT_IMAGES = 86400        # 24 hours (images don't change often)
    
    # Business Configuration
    COMPANY_NAME = 'YourStore'
    COMPANY_EMAIL = 'info@yourstore.com'
    COMPANY_PHONE = '+91 1234567890'
    COMPANY_ADDRESS = 'Your Business Address, India'
    
    # Tax Configuration
    BUSINESS_STATE_CODE = 'MP'  # Madhya Pradesh (change as per your business)
    BUSINESS_GSTIN = 'YOUR_GSTIN_NUMBER'
    
    # Delivery Configuration
    FREE_DELIVERY_THRESHOLD = 500
    STANDARD_DELIVERY_CHARGE = 50
    EXPRESS_DELIVERY_CHARGE = 100
    
    # Email Configuration (Gmail SMTP)
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')  # Your Gmail address
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')  # Your Gmail App Password
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or os.environ.get('MAIL_USERNAME')
    
    # Email Features
    EMAIL_VERIFICATION_REQUIRED = os.environ.get('EMAIL_VERIFICATION_REQUIRED', 'true').lower() == 'true'
    SEND_ORDER_EMAILS = os.environ.get('SEND_ORDER_EMAILS', 'true').lower() == 'true'
    
    # Payment Gateway Configuration
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
    
    # Session Configuration (for cookies)
    SESSION_TYPE = 'redis'
    SESSION_REDIS = os.environ.get('SESSION_REDIS_URL', 'redis://localhost:6379/1')
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'ecommerce_session_'
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Content Security Settings
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']
    
    # Indian States for GST calculation
    INDIAN_STATES = {
        'AN': 'Andaman and Nicobar Islands', 'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh',
        'AS': 'Assam', 'BR': 'Bihar', 'CH': 'Chandigarh', 'CG': 'Chhattisgarh',
        'DN': 'Dadra and Nagar Haveli', 'DD': 'Daman and Diu', 'DL': 'Delhi',
        'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana', 'HP': 'Himachal Pradesh',
        'JK': 'Jammu and Kashmir', 'JH': 'Jharkhand', 'KA': 'Karnataka', 'KL': 'Kerala',
        'LD': 'Lakshadweep', 'MP': 'Madhya Pradesh', 'MH': 'Maharashtra', 'MN': 'Manipur',
        'ML': 'Meghalaya', 'MZ': 'Mizoram', 'NL': 'Nagaland', 'OR': 'Odisha',
        'PY': 'Puducherry', 'PB': 'Punjab', 'RJ': 'Rajasthan', 'SK': 'Sikkim',
        'TN': 'Tamil Nadu', 'TS': 'Telangana', 'TR': 'Tripura', 'UP': 'Uttar Pradesh',
        'UK': 'Uttarakhand', 'WB': 'West Bengal'
    }
    
    @staticmethod
    def allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    
    # Development-specific cache settings
    CACHE_TIMEOUT_PRODUCTS = 300        # 5 minutes for development
    CACHE_TIMEOUT_CATEGORIES = 600      # 10 minutes for development
    
    # More verbose logging in development
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
    # Override with production database
    DB_HOST = os.environ.get('PROD_DB_HOST') or Config.DB_HOST
    DB_USER = os.environ.get('PROD_DB_USER') or Config.DB_USER
    DB_PASSWORD = os.environ.get('PROD_DB_PASSWORD') or Config.DB_PASSWORD
    DB_NAME = os.environ.get('PROD_DB_NAME') or Config.DB_NAME
    
    # Production cache settings (longer timeouts)
    CACHE_TIMEOUT_PRODUCTS = 1800       # 30 minutes in production
    CACHE_TIMEOUT_CATEGORIES = 7200     # 2 hours in production
    CACHE_TIMEOUT_FEATURED = 1200       # 20 minutes in production
    
    # Production security settings
    SESSION_COOKIE_SECURE = True        # HTTPS only in production
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # Production upload folder (could be cloud storage)
    UPLOAD_FOLDER = os.environ.get('PROD_UPLOAD_FOLDER') or Config.UPLOAD_FOLDER

class TestingConfig(Config):
    DEBUG = True
    TESTING = True
    DB_NAME = 'test_ecommerce_db'
    
    # Use simple cache for testing
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 60
    
    # Shorter cache timeouts for testing
    CACHE_TIMEOUT_PRODUCTS = 60
    CACHE_TIMEOUT_CATEGORIES = 120
    CACHE_TIMEOUT_FEATURED = 60
    
    # Test upload folder
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_uploads')

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])