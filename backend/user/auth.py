from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from shared.models import UserModel, execute_query
from referral.models import ReferralModel
from shared.email_service import email_service
import jwt
from datetime import datetime, timedelta
import bleach
import re
from email_validator import validate_email, EmailNotValidError
from main import limiter
user_auth_bp = Blueprint('user_auth', __name__)
def validate_password_strength(password):
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    return True, "Strong password"
@limiter.limit("3 per minute")
@user_auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = bleach.clean(data['email'].lower().strip(), tags=[], attributes={}, strip=True)
    password = data.get('password', '')
    first_name = bleach.clean(data['first_name'].strip(), tags=[], attributes={}, strip=True)
    last_name = bleach.clean(data['last_name'].strip(), tags=[], attributes={}, strip=True)
    phone = bleach.clean(data['phone'].strip(), tags=[], attributes={}, strip=True)

    # Add validation:
    if len(email) > 254:
        return jsonify({'error': 'Email address too long'}), 400
    if len(first_name) < 2 or len(first_name) > 50:
        return jsonify({'error': 'First name must be 2-50 characters'}), 400
    if len(last_name) < 2 or len(last_name) > 50:
        return jsonify({'error': 'Last name must be 2-50 characters'}), 400
    if not re.match(r'^[6-9]\d{9}$', phone):
        return jsonify({'error': 'Invalid Indian phone number format'}), 400

    try:
        valid_email = validate_email(email)
        email = valid_email.email
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email format'}), 400
    referral_code = data.get('referral_code', '').strip()
    
    

    
    is_strong, password_error = validate_password_strength(password)
    if not is_strong:
        return jsonify({'error': password_error}), 400
    
    existing_user = UserModel.get_by_email(email)
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    if referral_code:
        referrer = ReferralModel.validate_code(referral_code)
        if not referrer:
            return jsonify({'error': 'Invalid referral code'}), 400
    
    password_hash = generate_password_hash(password)
    user_id = UserModel.create(email, password_hash, first_name, last_name, phone, referral_code)
    
    ReferralModel.generate_code(user_id)
    
    email_sent = email_service.send_verification_email(email, first_name, user_id)
    
    return jsonify({
        'message': 'Registration successful! Please check your email to verify your account.',
        'user_id': user_id,
        'verification_email_sent': email_sent,
        'referral_applied': bool(referral_code)
    }), 201
@limiter.limit("5 per minute")
@user_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    email = bleach.clean(data['email'].lower().strip(), tags=[], attributes={}, strip=True)
    password = data.get('password', '')
    if len(email) > 254:
        return jsonify({'error': 'Email too long'}), 400
    try:
        valid_email = validate_email(email)
        email = valid_email.email
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email format'}), 400
    remember_me = data.get('remember_me', False)
    
    user = UserModel.get_by_email(email)
    
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.get('email_verified', False):
        return jsonify({
            'error': 'Please verify your email before logging in',
            'email_verification_required': True,
            'email': user['email']
        }), 403
    
    expiry_hours = 24 * 7 if remember_me else 24
    token = jwt.encode({
        'user_id': user['user_id'],
        'exp': datetime.utcnow() + timedelta(hours=expiry_hours)
    }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    user_data = {
        'user_id': user['user_id'],
        'email': user['email'],
        'first_name': user['first_name'],
        'last_name': user['last_name'],
        'phone': user['phone']
    }
    
    cache_key = f'user_session_{user["user_id"]}'
    current_app.cache.set(cache_key, user_data, timeout=86400)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user_data
    }), 200

@user_auth_bp.route('/me', methods=['GET'])
def get_current_user():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({'error': 'Token required'}), 401
    
    token = token[7:]
    data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    user_id = data['user_id']
    
    cache_key = f'user_session_{user_id}'
    cached_user = current_app.cache.get(cache_key)
    
    if cached_user:
        return jsonify({'user': cached_user}), 200
    
    user = UserModel.get_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.pop('password_hash', None)
    current_app.cache.set(cache_key, user, timeout=86400)
    
    return jsonify({'user': user}), 200

@user_auth_bp.route('/change-password', methods=['POST'])
def change_password():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({'error': 'Token required'}), 401
    
    token = token[7:]
    data_token = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    user_id = data_token['user_id']
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password required'}), 400
    
    # REPLACE WITH:
    if len(new_password) < 12:
        return jsonify({'error': 'Password must be at least 12 characters long'}), 400

    # Check password complexity
    if not re.search(r'[A-Z]', new_password):
        return jsonify({'error': 'Password must contain uppercase letter'}), 400
    if not re.search(r'[a-z]', new_password):
        return jsonify({'error': 'Password must contain lowercase letter'}), 400
    if not re.search(r'\d', new_password):
        return jsonify({'error': 'Password must contain number'}), 400
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
        return jsonify({'error': 'Password must contain special character'}), 400
    user = UserModel.get_by_id(user_id)
    if not user or not check_password_hash(user['password_hash'], current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    new_password_hash = generate_password_hash(new_password)
    execute_query("""
        UPDATE users SET password_hash = %s, updated_at = %s 
        WHERE user_id = %s
    """, (new_password_hash, datetime.now(), user_id))
    
    cache_key = f'user_session_{user_id}'
    current_app.cache.delete(cache_key)
    
    return jsonify({'message': 'Password changed successfully'}), 200

@user_auth_bp.route('/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:]
        data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        user_id = data.get('user_id')
        
        if user_id:
            cache_key = f'user_session_{user_id}'
            current_app.cache.delete(cache_key)
    
    return jsonify({'message': 'Logged out successfully'}), 200

@user_auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400
    
    user_id = email_service.verify_email_token(token)
    
    if user_id:
        user = execute_query("""
            SELECT user_id, email, first_name, last_name, email_verified
            FROM users WHERE user_id = %s
        """, (user_id,), fetch_one=True)
        
        return jsonify({
            'message': 'Email verified successfully! You can now log in.',
            'user': {
                'user_id': user['user_id'],
                'email': user['email'],
                'first_name': user['first_name'],
                'last_name': user['last_name'],
                'email_verified': True
            }
        }), 200
    else:
        return jsonify({'error': 'Invalid or expired verification token'}), 400

@user_auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email_link(token):
    user_id = email_service.verify_email_token(token)
    
    if user_id:
        user = execute_query("""
            SELECT first_name, email FROM users WHERE user_id = %s
        """, (user_id,), fetch_one=True)
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Email Verified</title>
            <meta http-equiv="refresh" content="3;url=http://localhost:3000/login">
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }}
                .success {{ color: #4CAF50; }}
                .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="success">✅ Email Verified Successfully!</h1>
                <p>Hi {user['first_name']},</p>
                <p>Your email <strong>{user['email']}</strong> has been verified.</p>
                <p>You will be redirected to login in 3 seconds...</p>
                <p><a href="http://localhost:3000/login">Click here if not redirected</a></p>
            </div>
        </body>
        </html>
        """, 200
    else:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Verification Failed</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }}
                .error {{ color: #f44336; }}
                .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="error">❌ Verification Failed</h1>
                <p>The verification link is invalid or has expired.</p>
                <p><a href="http://localhost:3000/login">Go to Login</a></p>
            </div>
        </body>
        </html>
        """, 400

@user_auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = execute_query("""
        SELECT user_id, email, first_name, email_verified 
        FROM users WHERE email = %s
    """, (email,), fetch_one=True)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user['email_verified']:
        return jsonify({'error': 'Email is already verified'}), 400
    
    email_sent = email_service.send_verification_email(
        user['email'], 
        user['first_name'], 
        user['user_id']
    )
    
    if email_sent:
        return jsonify({'message': 'Verification email sent successfully!'}), 200
    else:
        return jsonify({'error': 'Failed to send verification email'}), 500

@user_auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = execute_query("""
        SELECT user_id, email, first_name, status 
        FROM users WHERE email = %s
    """, (email,), fetch_one=True)
    
    success_message = {
        'message': 'If an account with that email exists, we have sent password reset instructions.'
    }
    
    if not user or user['status'] != 'active':
        return jsonify(success_message), 200
    
    recent_requests = execute_query("""
        SELECT COUNT(*) as count FROM password_reset_tokens 
        WHERE user_id = %s AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    """, (user['user_id'],), fetch_one=True)
    
    if recent_requests['count'] >= 3:
        return jsonify(success_message), 200
    
    email_sent = email_service.send_password_reset_email(
        user['email'], 
        user['first_name'], 
        user['user_id']
    )
    
    return jsonify(success_message), 200

@user_auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Reset token is required'}), 400
    
    reset_request = email_service.verify_reset_token(token)
    
    if not reset_request:
        return jsonify({'error': 'Invalid or expired reset token'}), 400
    
    return jsonify({
        'valid': True,
        'email': reset_request['email'],
        'message': 'Token is valid. You can now reset your password.'
    }), 200

@user_auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    token = data.get('token')
    new_password = data.get('new_password') or data.get('password')
    confirm_password = data.get('confirm_password') or data.get('confirmPassword')
    
    if not token:
        return jsonify({'error': 'Reset token is required'}), 400
        
    if not new_password:
        return jsonify({'error': 'New password is required'}), 400
        
    if not confirm_password:
        return jsonify({'error': 'Password confirmation is required'}), 400
    
    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
    
    is_strong, password_error = validate_password_strength(new_password)
    if not is_strong:
        return jsonify({'error': password_error}), 400
    
    new_password_hash = generate_password_hash(new_password)
    success = email_service.reset_password(token, new_password_hash)
    
    if success:
        return jsonify({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }), 200
    else:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

@user_auth_bp.route('/reset-password/<token>', methods=['GET'])
def reset_password_form(token):
    reset_request = email_service.verify_reset_token(token)
    
    if not reset_request:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reset Password</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }}
                .error {{ color: #f44336; }}
                .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="error">❌ Invalid Reset Link</h1>
                <p>The password reset link is invalid or has expired.</p>
                <p><a href="http://localhost:3000/forgot-password">Request New Reset Link</a></p>
            </div>
        </body>
        </html>
        """, 400
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reset Password</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
            .container {{ max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .form-group {{ margin-bottom: 20px; }}
            label {{ display: block; margin-bottom: 5px; font-weight: bold; }}
            input {{ width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }}
            button {{ width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }}
            button:hover {{ background: #45a049; }}
            .error {{ color: #f44336; margin-top: 10px; }}
            .success {{ color: #4CAF50; margin-top: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Reset Your Password</h2>
            <p>Hi {reset_request['first_name']}, enter your new password below:</p>
            
            <form id="resetForm">
                <div class="form-group">
                    <label for="password">New Password:</label>
                    <input type="password" id="password" name="password" required minlength="6">
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password:</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
                </div>
                
                <button type="submit">Reset Password</button>
            </form>
            
            <div id="message"></div>
        </div>

        <script>
            document.getElementById('resetForm').addEventListener('submit', async function(e) {{
                e.preventDefault();
                
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const messageDiv = document.getElementById('message');
                
                if (password !== confirmPassword) {{
                    messageDiv.innerHTML = '<p class="error">Passwords do not match!</p>';
                    return;
                }}
                
                if (password.length < 6) {{
                    messageDiv.innerHTML = '<p class="error">Password must be at least 6 characters long!</p>';
                    return;
                }}
                
                const response = await fetch('/api/user/auth/reset-password', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        token: '{token}',
                        new_password: password,
                        confirm_password: confirmPassword
                    }})
                }});
                
                const data = await response.json();
                
                if (response.ok) {{
                    messageDiv.innerHTML = '<p class="success">✅ ' + data.message + '</p>';
                    setTimeout(() => {{
                        window.location.href = 'http://localhost:3000/login';
                    }}, 2000);
                }} else {{
                    messageDiv.innerHTML = '<p class="error">❌ ' + data.error + '</p>';
                }}
            }});
        </script>
    </body>
    </html>
    """, 200