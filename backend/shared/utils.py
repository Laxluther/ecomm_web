import jwt
import re
import uuid
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
import os

# Password utilities
def hash_password(password):
    """Hash a password for storing"""
    return generate_password_hash(password)

def verify_password(password, hash):
    """Verify a password against its hash"""
    return check_password_hash(hash, password)

# JWT Token utilities
def generate_token(user_id, user_type='user', expiry_hours=24):
    """Generate JWT token for user or admin"""
    payload = {
        'exp': datetime.utcnow() + timedelta(hours=expiry_hours),
        'iat': datetime.utcnow(),
        'user_type': user_type
    }
    
    if user_type == 'admin':
        payload['admin_id'] = user_id
    else:
        payload['user_id'] = user_id
    
    return jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

def decode_token(token):
    """Decode JWT token"""
    try:
        return jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Validation utilities
def validate_email(email):
    """Validate email format"""
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(email_pattern.match(email))

def validate_phone(phone):
    """Validate Indian phone number format"""
    phone_pattern = re.compile(r'^[6-9]\d{9}$')
    return bool(phone_pattern.match(phone))

def validate_pincode(pincode):
    """Validate Indian pincode format"""
    pincode_pattern = re.compile(r'^\d{6}$')
    return bool(pincode_pattern.match(pincode))

# Email utilities
def send_email(to_email, subject, html_content, text_content=None):
    """Send email using SMTP"""
    try:
        smtp_server = current_app.config.get('MAIL_SERVER', 'smtp.gmail.com')
        smtp_port = current_app.config.get('MAIL_PORT', 587)
        smtp_username = current_app.config.get('MAIL_USERNAME')
        smtp_password = current_app.config.get('MAIL_PASSWORD')
        from_email = current_app.config.get('MAIL_DEFAULT_SENDER', smtp_username)
        
        if not all([smtp_username, smtp_password, from_email]):
            print("Email configuration missing")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        
        # Add text content
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
        
        # Add HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False

# ID generation utilities
def generate_user_id():
    """Generate unique user ID"""
    return str(uuid.uuid4())

def generate_order_id():
    """Generate unique order ID"""
    return str(uuid.uuid4())

def generate_order_number():
    """Generate human-readable order number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    random_part = str(uuid.uuid4())[:8].upper()
    return f"ORD{timestamp}{random_part}"

def generate_referral_code():
    """Generate referral code"""
    return f"REF{uuid.uuid4().hex[:8].upper()}"

# Status and display utilities
def get_order_status_color(status):
    """Get color code for order status"""
    status_colors = {
        'pending': '#fbbf24',      # yellow
        'confirmed': '#3b82f6',    # blue
        'processing': '#8b5cf6',   # purple
        'shipped': '#06b6d4',      # cyan
        'delivered': '#10b981',    # green
        'cancelled': '#ef4444',    # red
        'refunded': '#f59e0b'      # orange
    }
    return status_colors.get(status, '#6b7280')  # gray default

def format_currency(amount, currency='₹'):
    """Format amount as currency"""
    if amount is None:
        return f"{currency}0.00"
    return f"{currency}{float(amount):.2f}"

def calculate_savings(original_price, discount_price):
    """Calculate savings amount and percentage"""
    if not discount_price or not original_price:
        return {'amount': 0, 'percentage': 0}
    
    savings_amount = float(original_price) - float(discount_price)
    savings_percentage = (savings_amount / float(original_price)) * 100
    
    return {
        'amount': round(savings_amount, 2),
        'percentage': round(savings_percentage, 1)
    }

# Pagination utilities
def paginate_results(query, params, page=1, per_page=20):
    """Paginate database query results"""
    from shared.models import execute_query
    
    offset = (page - 1) * per_page
    
    # Get total count
    count_query = query.replace('SELECT *', 'SELECT COUNT(*) as total', 1)
    if 'ORDER BY' in count_query:
        count_query = count_query.split('ORDER BY')[0]
    
    total_count = execute_query(count_query, params, fetch_one=True)['total']
    
    # Get paginated results
    paginated_query = f"{query} LIMIT {per_page} OFFSET {offset}"
    results = execute_query(paginated_query, params, fetch_all=True)
    
    return {
        'data': results,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'pages': (total_count + per_page - 1) // per_page,
            'has_next': page * per_page < total_count,
            'has_prev': page > 1
        }
    }

# API Response utilities
class APIResponse:
    """Standard API response formatter"""
    
    @staticmethod
    def success(data=None, message="Success", status_code=200):
        response = {'success': True, 'message': message}
        if data is not None:
            response['data'] = data
        return response, status_code
    
    @staticmethod
    def error(message="Error occurred", status_code=400, errors=None):
        response = {'success': False, 'message': message}
        if errors:
            response['errors'] = errors
        return response, status_code
    
    @staticmethod
    def not_found(message="Resource not found"):
        return APIResponse.error(message, 404)
    
    @staticmethod
    def unauthorized(message="Unauthorized access"):
        return APIResponse.error(message, 401)
    
    @staticmethod
    def forbidden(message="Access forbidden"):
        return APIResponse.error(message, 403)
    
    @staticmethod
    def validation_error(errors, message="Validation failed"):
        return APIResponse.error(message, 422, errors)

# File utilities
def allowed_file(filename, allowed_extensions=None):
    """Check if file has allowed extension"""
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_file_size_mb(file):
    """Get file size in MB"""
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)     # Seek back to beginning
    return size / (1024 * 1024)

# Security utilities
def generate_verification_token():
    """Generate email verification token"""
    return str(uuid.uuid4())

def generate_reset_token():
    """Generate password reset token"""
    return str(uuid.uuid4())

# Date utilities
def get_current_timestamp():
    """Get current timestamp"""
    return datetime.now()

def format_date(date_obj, format_str='%Y-%m-%d'):
    """Format date object"""
    if not date_obj:
        return None
    return date_obj.strftime(format_str)

def format_datetime(datetime_obj, format_str='%Y-%m-%d %H:%M:%S'):
    """Format datetime object"""
    if not datetime_obj:
        return None
    return datetime_obj.strftime(format_str)

# Business logic utilities
def calculate_delivery_charge(subtotal, free_delivery_threshold=500):
    """Calculate delivery charge based on subtotal"""
    delivery_charge = current_app.config.get('STANDARD_DELIVERY_CHARGE', 50)
    threshold = current_app.config.get('FREE_DELIVERY_THRESHOLD', free_delivery_threshold)
    
    return 0 if subtotal >= threshold else delivery_charge

def calculate_order_total(subtotal, delivery_charge=0, discount_amount=0):
    """Calculate final order total"""
    return max(0, subtotal + delivery_charge - discount_amount)

# Cache utilities
def get_cache_key(prefix, *args):
    """Generate cache key"""
    return f"{prefix}_{':'.join(str(arg) for arg in args)}"

def clear_related_cache(cache, patterns):
    """Clear cache entries matching patterns"""
    for pattern in patterns:
        cache.delete(pattern)