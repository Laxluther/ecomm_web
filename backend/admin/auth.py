from flask import Blueprint, request, jsonify, current_app, make_response
from werkzeug.security import check_password_hash
from shared.models import AdminModel, execute_query
import jwt
from datetime import datetime, timedelta

admin_auth_bp = Blueprint('admin_auth', __name__)

@admin_auth_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    admin = AdminModel.get_by_username(username)
    if not admin or not check_password_hash(admin['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'admin_id': admin['admin_id'],
        'role': admin['role'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    execute_query("""
        UPDATE admin_users SET last_login = %s WHERE admin_id = %s
    """, (datetime.now(), admin['admin_id']))
    
    cache_key = f"admin_session_{admin['admin_id']}"
    current_app.cache.set(cache_key, {
        'admin_id': admin['admin_id'],
        'username': admin['username'],
        'role': admin['role'],
        'full_name': admin['full_name']
    }, timeout=86400)
    
    return jsonify({
        'token': token,
        'admin': {
            'admin_id': admin['admin_id'],
            'username': admin['username'],
            'email': admin['email'],
            'role': admin['role'],
            'full_name': admin['full_name']
        }
    }), 200

@admin_auth_bp.route('/me', methods=['GET'])
def get_admin_profile():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({'error': 'Token required'}), 401
    
    token = token[7:]
    data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    admin_id = data.get('admin_id')
    
    cache_key = f"admin_session_{admin_id}"
    cached_admin = current_app.cache.get(cache_key)
    
    if cached_admin:
        return jsonify({'admin': cached_admin}), 200
    
    admin = AdminModel.get_by_id(admin_id)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404
    
    admin.pop('password_hash', None)
    return jsonify({'admin': admin}), 200

@admin_auth_bp.route('/logout', methods=['POST'])
def admin_logout():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:]
        data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        admin_id = data.get('admin_id')
        
        cache_key = f"admin_session_{admin_id}"
        current_app.cache.delete(cache_key)
    
    return jsonify({'message': 'Logged out successfully'}), 200