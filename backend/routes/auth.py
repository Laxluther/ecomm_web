from flask import Blueprint, request, jsonify, current_app, make_response
from werkzeug.security import generate_password_hash, check_password_hash
from models import UserModel, token_required, execute_query
import jwt
from datetime import datetime, timedelta
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = data['email'].lower().strip()
    password = data['password']
    first_name = data['first_name'].strip()
    last_name = data['last_name'].strip()
    phone = data['phone'].strip()
    
    # Basic validation
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if user already exists
    existing_user = UserModel.get_user_by_email(email)
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create user
    password_hash = generate_password_hash(password)
    user_id = UserModel.create_user(email, password_hash, first_name, last_name, phone)
    
    # Send verification email
    try:
        from email_service import email_service
        email_sent = email_service.send_verification_email(email, first_name, user_id)
        
        if email_sent:
            # Update verification sent timestamp
            execute_query("""
                UPDATE users SET verification_sent_at = %s WHERE user_id = %s
            """, (datetime.now(), user_id))
            
            return jsonify({
                'message': 'Registration successful! Please check your email to verify your account.',
                'user_id': user_id,
                'verification_email_sent': True
            }), 201
        else:
            return jsonify({
                'message': 'Registration successful! Please contact support for email verification.',
                'user_id': user_id,
                'verification_email_sent': False
            }), 201
            
    except Exception as e:
        print(f"Email sending failed: {e}")
        return jsonify({
            'message': 'Registration successful! Email verification will be sent shortly.',
            'user_id': user_id,
            'verification_email_sent': False
        }), 201

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email with token"""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400
    
    try:
        from email_service import email_service
        user_id = email_service.verify_email_token(token)
        
        if user_id:
            # Get user details
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
            
    except Exception as e:
        print(f"Email verification error: {e}")
        return jsonify({'error': 'Email verification failed'}), 500

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email_link(token):
    """Handle email verification from link (GET request)"""
    try:
        from email_service import email_service
        user_id = email_service.verify_email_token(token)
        
        if user_id:
            # Get user details
            user = execute_query("""
                SELECT first_name, email FROM users WHERE user_id = %s
            """, (user_id,), fetch_one=True)
            
            # Return success page that redirects to login
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
                    <p>You will be redirected to the login page in 3 seconds...</p>
                    <p><a href="http://localhost:3000/login">Click here if not redirected automatically</a></p>
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
            
    except Exception as e:
        print(f"Email verification error: {e}")
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Verification Error</title>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }}
                .error {{ color: #f44336; }}
                .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="error">❌ Verification Error</h1>
                <p>An error occurred during verification.</p>
                <p><a href="http://localhost:3000/login">Go to Login</a></p>
            </div>
        </body>
        </html>
        """, 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Get user
    user = execute_query("""
        SELECT user_id, email, first_name, email_verified 
        FROM users WHERE email = %s
    """, (email,), fetch_one=True)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user['email_verified']:
        return jsonify({'error': 'Email is already verified'}), 400
    
    try:
        from email_service import email_service
        email_sent = email_service.send_verification_email(
            user['email'], 
            user['first_name'], 
            user['user_id']
        )
        
        if email_sent:
            execute_query("""
                UPDATE users SET verification_sent_at = %s WHERE user_id = %s
            """, (datetime.now(), user['user_id']))
            
            return jsonify({'message': 'Verification email sent successfully!'}), 200
        else:
            return jsonify({'error': 'Failed to send verification email'}), 500
            
    except Exception as e:
        print(f"Resend verification error: {e}")
        return jsonify({'error': 'Failed to send verification email'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    email = data['email'].lower().strip()
    password = data['password']
    remember_me = data.get('remember_me', False)
    use_cookies = data.get('use_cookies', False)  # Optional cookie support
    
    # Get user
    user = UserModel.get_user_by_email(email)
    
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check if email verification is required
    if not user.get('email_verified', False):
        return jsonify({
            'error': 'Please verify your email before logging in',
            'email_verification_required': True,
            'email': user['email']
        }), 403
    
    # Generate JWT token
    expiry_hours = 24 * 7 if remember_me else current_app.config['JWT_EXPIRATION_DELTA']
    token = jwt.encode({
        'user_id': user['user_id'],
        'exp': datetime.utcnow() + timedelta(hours=expiry_hours)
    }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    # Prepare response data
    response_data = {
        'message': 'Login successful',
        'token': token,
        'user': {
            'user_id': user['user_id'],
            'email': user['email'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'phone': user['phone'],
            'email_verified': user.get('email_verified', False)
        }
    }
    
    # Create response
    response = make_response(jsonify(response_data))
    
    # Optionally set token as HttpOnly cookie for additional security
    if use_cookies:
        response.set_cookie(
            'auth_token',
            token,
            max_age=expiry_hours * 3600,
            httponly=True,
            secure=current_app.config.get('SESSION_COOKIE_SECURE', False),
            samesite=current_app.config.get('SESSION_COOKIE_SAMESITE', 'Lax')
        )
        response_data['cookie_set'] = True
    
    # Cache user session info for performance
    cache_key = f'user_session_{user["user_id"]}'
    current_app.cache.set(cache_key, {
        'user_id': user['user_id'],
        'email': user['email'],
        'first_name': user['first_name'],
        'last_name': user['last_name']
    }, timeout=current_app.config.get('CACHE_TIMEOUT_USER_SESSION', 1800))
    
    return response

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout and clear session/cookies"""
    data = request.get_json() or {}
    clear_cookies = data.get('clear_cookies', False)
    
    response = make_response(jsonify({'message': 'Logged out successfully'}))
    
    # Clear auth cookie if it was set
    if clear_cookies:
        response.set_cookie(
            'auth_token',
            '',
            expires=0,
            httponly=True,
            secure=current_app.config.get('SESSION_COOKIE_SECURE', False),
            samesite=current_app.config.get('SESSION_COOKIE_SAMESITE', 'Lax')
        )
    
    return response

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user_id):
    # Try cache first for performance
    cache_key = f'user_session_{current_user_id}'
    cached_user = current_app.cache.get(cache_key)
    
    if cached_user:
        return jsonify({'user': cached_user, 'cached': True}), 200
    
    # Get from database if not cached
    user = UserModel.get_user_by_id(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Remove sensitive data
    user.pop('password_hash', None)
    
    # Cache user data for future requests
    current_app.cache.set(cache_key, user, timeout=1800)  # 30 minutes
    
    return jsonify({'user': user, 'cached': False}), 200

# ===== FORGOT PASSWORD ROUTES =====

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Get user by email
    user = execute_query("""
        SELECT user_id, email, first_name, status 
        FROM users WHERE email = %s
    """, (email,), fetch_one=True)
    
    # Always return success message for security (don't reveal if email exists)
    success_message = {
        'message': 'If an account with that email exists, we have sent password reset instructions.'
    }
    
    if not user:
        # Email doesn't exist, but don't reveal this to prevent email enumeration
        return jsonify(success_message), 200
    
    if user['status'] != 'active':
        # Account is not active, but don't reveal this
        return jsonify(success_message), 200
    
    # Check rate limiting (max 3 password reset requests per hour)
    recent_requests = execute_query("""
        SELECT COUNT(*) as count FROM password_reset_tokens 
        WHERE user_id = %s AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    """, (user['user_id'],), fetch_one=True)
    
    if recent_requests['count'] >= 3:
        # Rate limited, but don't reveal this
        return jsonify(success_message), 200
    
    try:
        from email_service import email_service
        
        # Generate and send password reset email
        success = email_service.send_password_reset_email(
            user['email'], 
            user['first_name'], 
            user['user_id']
        )
        
        if success:
            # Update user's password reset tracking
            execute_query("""
                UPDATE users 
                SET password_reset_requested_at = %s, 
                    password_reset_count = password_reset_count + 1
                WHERE user_id = %s
            """, (datetime.now(), user['user_id']))
            
            return jsonify(success_message), 200
        else:
            # Email sending failed, but don't reveal this
            return jsonify(success_message), 200
            
    except Exception as e:
        print(f"Password reset email error: {e}")
        # Always return success to prevent information disclosure
        return jsonify(success_message), 200

@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if password reset token is valid"""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Reset token is required'}), 400
    
    # Check if token is valid and not expired
    reset_request = execute_query("""
        SELECT pr.user_id, pr.expires_at, u.email, u.first_name
        FROM password_reset_tokens pr
        JOIN users u ON pr.user_id = u.user_id
        WHERE pr.token = %s AND pr.expires_at > NOW() AND pr.used_at IS NULL
    """, (token,), fetch_one=True)
    
    if not reset_request:
        return jsonify({'error': 'Invalid or expired reset token'}), 400
    
    return jsonify({
        'valid': True,
        'email': reset_request['email'],
        'message': 'Token is valid. You can now reset your password.'
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using reset token"""
    try:
        data = request.get_json()
        
        # Check if data exists
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        token = data.get('token')
        new_password = data.get('new_password') or data.get('password')  # Support both field names
        confirm_password = data.get('confirm_password') or data.get('confirmPassword')  # Support both field names
        
        # Debug logging
        print(f"Reset password request data: {data}")
        print(f"Token: {token}")
        print(f"New password provided: {bool(new_password)}")
        print(f"Confirm password provided: {bool(confirm_password)}")
        
        if not token:
            return jsonify({'error': 'Reset token is required'}), 400
            
        if not new_password:
            return jsonify({'error': 'New password is required'}), 400
            
        if not confirm_password:
            return jsonify({'error': 'Password confirmation is required'}), 400
        
        if new_password != confirm_password:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Verify token is valid and not expired
        reset_request = execute_query("""
            SELECT pr.user_id, pr.expires_at, u.email, u.first_name
            FROM password_reset_tokens pr
            JOIN users u ON pr.user_id = u.user_id
            WHERE pr.token = %s AND pr.expires_at > NOW() AND pr.used_at IS NULL
        """, (token,), fetch_one=True)
        
        if not reset_request:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Hash the new password
        new_password_hash = generate_password_hash(new_password)
        
        # Update user's password
        execute_query("""
            UPDATE users 
            SET password_hash = %s, updated_at = %s 
            WHERE user_id = %s
        """, (new_password_hash, datetime.now(), reset_request['user_id']))
        
        # Mark the reset token as used
        execute_query("""
            UPDATE password_reset_tokens 
            SET used_at = %s 
            WHERE token = %s
        """, (datetime.now(), token))
        
        # Invalidate all other unused tokens for this user (for security)
        execute_query("""
            UPDATE password_reset_tokens 
            SET used_at = %s 
            WHERE user_id = %s AND used_at IS NULL AND token != %s
        """, (datetime.now(), reset_request['user_id'], token))
        
        # Invalidate user cache after password change
        cache_key = f'user_session_{reset_request["user_id"]}'
        current_app.cache.delete(cache_key)
        
        # Send password reset confirmation email
        try:
            from email_service import email_service
            email_service.send_password_reset_confirmation_email(
                reset_request['email'], 
                reset_request['first_name']
            )
        except Exception as e:
            print(f"Password reset confirmation email error: {e}")
            # Don't fail the password reset if email fails
        
        return jsonify({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }), 200
        
    except Exception as e:
        print(f"Password reset error: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to reset password. Please try again.'}), 500

@auth_bp.route('/reset-password/<token>', methods=['GET'])
def reset_password_form(token):
    """Show password reset form"""
    # Verify token first
    reset_request = execute_query("""
        SELECT pr.user_id, pr.expires_at, u.email, u.first_name
        FROM password_reset_tokens pr
        JOIN users u ON pr.user_id = u.user_id
        WHERE pr.token = %s AND pr.expires_at > NOW() AND pr.used_at IS NULL
    """, (token,), fetch_one=True)
    
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
    
    # Return password reset form
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
                
                try {{
                    const response = await fetch('/api/auth/reset-password', {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json',
                        }},
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
                }} catch (error) {{
                    messageDiv.innerHTML = '<p class="error">❌ An error occurred. Please try again.</p>';
                }}
            }});
        </script>
    </body>
    </html>
    """, 200

# ===== EXISTING CHANGE PASSWORD ROUTE (ENHANCED) =====

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user_id):
    """Change password for authenticated user (enhanced with email confirmation)"""
    data = request.get_json()
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not all([current_password, new_password, confirm_password]):
        return jsonify({'error': 'Current password, new password, and confirmation are required'}), 400
    
    if new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    # Get user
    user = UserModel.get_user_by_id(current_user_id)
    
    if not user or not check_password_hash(user['password_hash'], current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    # Update password
    new_password_hash = generate_password_hash(new_password)
    execute_query("""
        UPDATE users SET password_hash = %s, updated_at = %s 
        WHERE user_id = %s
    """, (new_password_hash, datetime.now(), current_user_id))
    
    # Invalidate user cache after password change
    cache_key = f'user_session_{current_user_id}'
    current_app.cache.delete(cache_key)
    
    # Send password change confirmation email
    try:
        from email_service import email_service
        email_service.send_password_change_confirmation_email(
            user['email'], 
            user['first_name']
        )
    except Exception as e:
        print(f"Password change confirmation email error: {e}")
    
    return jsonify({'message': 'Password changed successfully'}), 200


@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify if a token is valid"""
    data = request.get_json()
    token = data.get('token')
    
    # Also check for token in cookies as fallback
    if not token:
        token = request.cookies.get('auth_token')
    
    if not token:
        return jsonify({'valid': False, 'error': 'Token required'}), 400
    
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        
        # Check if it's a user or admin token
        user_id = payload.get('user_id')
        admin_id = payload.get('admin_id')
        
        response_data = {'valid': True}
        
        if user_id:
            response_data.update({
                'user_id': user_id,
                'type': 'user'
            })
        elif admin_id:
            response_data.update({
                'admin_id': admin_id,
                'role': payload.get('role'),
                'type': 'admin'
            })
        
        return jsonify(response_data), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'valid': False, 'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'valid': False, 'error': 'Invalid token'}), 401

@auth_bp.route('/refresh-token', methods=['POST'])
@token_required
def refresh_token(current_user_id):
    """Refresh JWT token"""
    # Generate new token with extended expiry
    new_token = jwt.encode({
        'user_id': current_user_id,
        'exp': datetime.utcnow() + timedelta(hours=current_app.config['JWT_EXPIRATION_DELTA'])
    }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Token refreshed successfully',
        'token': new_token
    }), 200