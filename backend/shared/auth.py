import jwt
from functools import wraps
from flask import request, jsonify, current_app
from shared.models import execute_query

def user_token_required(f):
    """Decorator to require user authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
            
            # Verify user exists and is active
            user = execute_query("""
                SELECT user_id, status FROM users 
                WHERE user_id = %s AND status = 'active'
            """, (current_user_id,), fetch_one=True)
            
            if not user:
                return jsonify({'error': 'Invalid token or user not found'}), 401
                
            return f(current_user_id, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated

def admin_token_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Admin token missing'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            admin_id = data.get('admin_id')
            
            if not admin_id:
                return jsonify({'error': 'Admin access required'}), 403
            
            # Verify admin exists and is active
            admin = execute_query("""
                SELECT admin_id, status, role FROM admin_users 
                WHERE admin_id = %s AND status = 'active'
            """, (admin_id,), fetch_one=True)
            
            if not admin:
                return jsonify({'error': 'Invalid admin token or admin not found'}), 403
                
            return f(admin_id, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Admin token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid admin token'}), 401
        except Exception as e:
            return jsonify({'error': 'Admin authentication failed'}), 403
    
    return decorated

def optional_user_token(f):
    """Decorator for endpoints that work with or without authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        user_id = None
        
        if token and token.startswith('Bearer '):
            token = token[7:]
            try:
                data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
                user_id = data.get('user_id')
                
                # Verify user exists and is active
                user = execute_query("""
                    SELECT user_id FROM users 
                    WHERE user_id = %s AND status = 'active'
                """, (user_id,), fetch_one=True)
                
                if not user:
                    user_id = None
                    
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                user_id = None
        
        return f(user_id, *args, **kwargs)
    
    return decorated