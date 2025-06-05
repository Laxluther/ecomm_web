# admin_app.py - Standalone Admin Application

from flask import Flask, render_template_string, request, jsonify, redirect, url_for, session
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import mysql.connector
from datetime import datetime, timedelta
import os
import uuid
import json
from PIL import Image
import redis

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'admin-panel-secret-key-change-in-production'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=12)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Database configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'password'),
    'database': os.environ.get('DB_NAME', 'ecommerce_db'),
    'port': int(os.environ.get('DB_PORT', 3306))
}

# Redis configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Database connection
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params or ())
    
    if fetch_one:
        result = cursor.fetchone()
    elif fetch_all:
        result = cursor.fetchall()
    else:
        result = None
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return result

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Clear cache function
def clear_cache_keys(pattern='*'):
    try:
        r = redis.Redis.from_url(REDIS_URL)
        if pattern == '*':
            r.flushdb()
        else:
            keys = r.keys(f'*{pattern}*')
            if keys:
                r.delete(*keys)
        return True
    except:
        return False

# Admin Panel HTML Template
ADMIN_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - {{ title }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            color: #333;
        }
        
        .header {
            background: #1a1a1a;
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 1.5rem;
            font-weight: 500;
        }
        
        .sidebar {
            position: fixed;
            left: 0;
            top: 60px;
            width: 250px;
            height: calc(100vh - 60px);
            background: white;
            box-shadow: 2px 0 4px rgba(0,0,0,0.1);
            overflow-y: auto;
        }
        
        .sidebar a {
            display: block;
            padding: 1rem 1.5rem;
            color: #333;
            text-decoration: none;
            border-bottom: 1px solid #eee;
            transition: all 0.3s;
        }
        
        .sidebar a:hover {
            background: #f8f9fa;
            padding-left: 2rem;
        }
        
        .sidebar a.active {
            background: #007bff;
            color: white;
        }
        
        .main-content {
            margin-left: 250px;
            padding: 2rem;
            min-height: calc(100vh - 60px);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-card h3 {
            font-size: 0.875rem;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        
        .stat-card .value {
            font-size: 2rem;
            font-weight: 600;
            color: #333;
        }
        
        .stat-card .change {
            font-size: 0.875rem;
            color: #28a745;
            margin-top: 0.5rem;
        }
        
        .data-table {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .table-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0056b3;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .btn-warning {
            background: #ffc107;
            color: #333;
        }
        
        .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #666;
            font-size: 0.875rem;
            text-transform: uppercase;
        }
        
        tbody tr:hover {
            background: #f8f9fa;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }
        
        .form-control {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.show {
            display: flex;
        }
        
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .modal-header h2 {
            font-size: 1.5rem;
            color: #333;
        }
        
        .close {
            font-size: 2rem;
            cursor: pointer;
            color: #999;
            line-height: 1;
        }
        
        .close:hover {
            color: #333;
        }
        
        .alert {
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-danger {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .search-box {
            position: relative;
            margin-bottom: 1.5rem;
        }
        
        .search-box input {
            width: 100%;
            padding: 0.75rem 1rem;
            padding-left: 2.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .search-box::before {
            content: "🔍";
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            padding: 1.5rem;
        }
        
        .pagination a {
            padding: 0.5rem 0.75rem;
            border: 1px solid #ddd;
            color: #333;
            text-decoration: none;
            border-radius: 4px;
        }
        
        .pagination a.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .pagination a:hover:not(.active) {
            background: #f8f9fa;
        }
        
        .badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 4px;
            text-transform: uppercase;
        }
        
        .badge-success {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .badge-danger {
            background: #f8d7da;
            color: #721c24;
        }
        
        .badge-info {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .image-preview {
            max-width: 100px;
            max-height: 100px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .file-upload {
            position: relative;
            display: inline-block;
        }
        
        .file-upload input[type="file"] {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        .file-upload-label {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .file-upload-label:hover {
            background: #e9ecef;
        }
        
        @media (max-width: 768px) {
            .sidebar {
                width: 200px;
            }
            
            .main-content {
                margin-left: 200px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Admin Panel</h1>
        <div>
            {% if session.admin_id %}
                <span>Welcome, {{ session.admin_name }}</span>
                <a href="/logout" class="btn btn-sm btn-danger" style="margin-left: 1rem;">Logout</a>
            {% endif %}
        </div>
    </div>
    
    {% if session.admin_id %}
    <div class="sidebar">
        <a href="/dashboard" class="{{ 'active' if active_page == 'dashboard' else '' }}">📊 Dashboard</a>
        <a href="/products" class="{{ 'active' if active_page == 'products' else '' }}">📦 Products</a>
        <a href="/categories" class="{{ 'active' if active_page == 'categories' else '' }}">📁 Categories</a>
        <a href="/orders" class="{{ 'active' if active_page == 'orders' else '' }}">🛒 Orders</a>
        <a href="/users" class="{{ 'active' if active_page == 'users' else '' }}">👥 Users</a>
        <a href="/inventory" class="{{ 'active' if active_page == 'inventory' else '' }}">📈 Inventory</a>
        <a href="/promocodes" class="{{ 'active' if active_page == 'promocodes' else '' }}">🎫 Promo Codes</a>
        <a href="/cache" class="{{ 'active' if active_page == 'cache' else '' }}">⚡ Cache Management</a>
        <a href="/settings" class="{{ 'active' if active_page == 'settings' else '' }}">⚙️ Settings</a>
    </div>
    {% endif %}
    
    <div class="main-content">
        {% block content %}{% endblock %}
    </div>
    
    <script>
        // Global functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.add('show');
        }
        
        function hideModal(modalId) {
            document.getElementById(modalId).classList.remove('show');
        }
        
        function confirmDelete(action, id) {
            if(confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                fetch(action + '/' + id, {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'}
                })
                .then(response => response.json())
                .then(data => {
                    if(data.error) {
                        alert('Error: ' + data.error);
                    } else {
                        alert(data.message);
                        location.reload();
                    }
                });
            }
        }
        
        function searchTable(inputId, tableId) {
            const input = document.getElementById(inputId);
            const filter = input.value.toUpperCase();
            const table = document.getElementById(tableId);
            const rows = table.getElementsByTagName('tr');
            
            for(let i = 1; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName('td');
                let found = false;
                
                for(let j = 0; j < cells.length; j++) {
                    if(cells[j].textContent.toUpperCase().indexOf(filter) > -1) {
                        found = true;
                        break;
                    }
                }
                
                rows[i].style.display = found ? '' : 'none';
            }
        }
    </script>
</body>
</html>
'''

# Routes

@app.route('/')
def index():
    if 'admin_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        admin = execute_query("""
            SELECT * FROM admin_users 
            WHERE username = %s AND status = 'active'
        """, (username,), fetch_one=True)
        
        if admin and check_password_hash(admin['password_hash'], password):
            session['admin_id'] = admin['admin_id']
            session['admin_name'] = admin['full_name']
            session['admin_role'] = admin['role']
            session.permanent = True
            
            # Update last login
            execute_query("""
                UPDATE admin_users SET last_login = %s WHERE admin_id = %s
            """, (datetime.now(), admin['admin_id']))
            
            return redirect(url_for('dashboard'))
        else:
            error = 'Invalid credentials'
    
    login_template = '''
    {% extends "base.html" %}
    {% block content %}
    <div style="max-width: 400px; margin: 100px auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="text-align: center; margin-bottom: 2rem;">Admin Login</h2>
        {% if error %}
            <div class="alert alert-danger">{{ error }}</div>
        {% endif %}
        <form method="POST">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
        </form>
    </div>
    {% endblock %}
    '''
    
    return render_template_string(ADMIN_TEMPLATE + login_template, 
                                title='Admin Login',
                                error=request.args.get('error'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@admin_required
def dashboard():
    # Get dashboard statistics
    stats = {}
    
    # User stats
    user_stats = execute_query("""
        SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
        FROM users
    """, fetch_one=True)
    stats['users'] = user_stats
    
    # Product stats
    product_stats = execute_query("""
        SELECT 
            COUNT(*) as total_products,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
            COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_products
        FROM products
    """, fetch_one=True)
    stats['products'] = product_stats
    
    # Order stats
    order_stats = execute_query("""
        SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as orders_30d,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN total_amount END), 0) as revenue_30d
        FROM orders
        WHERE status != 'cancelled'
    """, fetch_one=True)
    stats['orders'] = order_stats
    
    # Recent orders
    recent_orders = execute_query("""
        SELECT o.order_id, o.order_number, o.total_amount, o.status, o.created_at,
               u.first_name, u.last_name, u.email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC
        LIMIT 10
    """, fetch_all=True)
    
    # Low stock products
    low_stock = execute_query("""
        SELECT p.product_name, i.quantity, i.min_stock_level
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.quantity <= i.min_stock_level AND p.status = 'active'
        ORDER BY i.quantity ASC
        LIMIT 10
    """, fetch_all=True)
    
    dashboard_template = '''
    {% extends "base.html" %}
    {% block content %}
    <h2>Dashboard</h2>
    
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Users</h3>
            <div class="value">{{ stats.users.total_users }}</div>
            <div class="change">+{{ stats.users.new_users_30d }} new this month</div>
        </div>
        
        <div class="stat-card">
            <h3>Active Products</h3>
            <div class="value">{{ stats.products.active_products }}</div>
            <div class="change">{{ stats.products.featured_products }} featured</div>
        </div>
        
        <div class="stat-card">
            <h3>Total Orders</h3>
            <div class="value">{{ stats.orders.total_orders }}</div>
            <div class="change">+{{ stats.orders.orders_30d }} this month</div>
        </div>
        
        <div class="stat-card">
            <h3>Revenue</h3>
            <div class="value">₹{{ "%.2f"|format(stats.orders.total_revenue) }}</div>
            <div class="change">₹{{ "%.2f"|format(stats.orders.revenue_30d) }} this month</div>
        </div>
    </div>
    
    <div class="data-table">
        <div class="table-header">
            <h3>Recent Orders</h3>
            <a href="/orders" class="btn btn-primary btn-sm">View All Orders</a>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                {% for order in recent_orders %}
                <tr>
                    <td>{{ order.order_number }}</td>
                    <td>{{ order.first_name }} {{ order.last_name }}</td>
                    <td>₹{{ "%.2f"|format(order.total_amount) }}</td>
                    <td><span class="badge badge-{{ 'success' if order.status == 'delivered' else 'warning' }}">{{ order.status }}</span></td>
                    <td>{{ order.created_at.strftime('%Y-%m-%d %H:%M') }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    
    {% if low_stock %}
    <div class="data-table" style="margin-top: 2rem;">
        <div class="table-header">
            <h3>Low Stock Alert</h3>
            <a href="/inventory" class="btn btn-warning btn-sm">Manage Inventory</a>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Min Stock Level</th>
                </tr>
            </thead>
            <tbody>
                {% for item in low_stock %}
                <tr>
                    <td>{{ item.product_name }}</td>
                    <td style="color: red;">{{ item.quantity }}</td>
                    <td>{{ item.min_stock_level }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    {% endif %}
    {% endblock %}
    '''
    
    return render_template_string(ADMIN_TEMPLATE + dashboard_template,
                                title='Dashboard',
                                active_page='dashboard',
                                stats=stats,
                                recent_orders=recent_orders,
                                low_stock=low_stock)

@app.route('/products')
@admin_required
def products():
    page = int(request.args.get('page', 1))
    per_page = 20
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    
    # Build query
    query = """
        SELECT p.*, c.category_name,
               (SELECT COUNT(*) FROM product_images WHERE product_id = p.product_id) as image_count,
               (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id) as stock_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (p.product_name LIKE %s OR p.sku LIKE %s)"
        params.extend([f'%{search}%', f'%{search}%'])
    
    if status:
        query += " AND p.status = %s"
        params.append(status)
    
    # Count total
    count_query = query.replace("SELECT p.*, c.category_name,", "SELECT COUNT(*) as total")
    count_query = count_query.split("FROM products")[0] + " FROM products" + count_query.split("FROM products")[1].split("ORDER BY")[0]
    total = execute_query(count_query, params, fetch_one=True)['total']
    
    # Add pagination
    offset = (page - 1) * per_page
    query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    products = execute_query(query, params, fetch_all=True)
    
    # Get categories for form
    categories = execute_query("""
        SELECT category_id, category_name FROM categories WHERE status = 'active' ORDER BY category_name
    """, fetch_all=True)
    
    products_template = '''
    {% extends "base.html" %}
    {% block content %}
    <div class="table-header">
        <h2>Products Management</h2>
        <button onclick="showModal('addProductModal')" class="btn btn-primary">Add Product</button>
    </div>
    
    <div class="search-box">
        <input type="text" id="searchInput" placeholder="Search products..." value="{{ request.args.get('search', '') }}"
               onkeyup="if(event.key === 'Enter') window.location.href='?search=' + this.value">
    </div>
    
    <div class="data-table">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {% for product in products %}
                <tr>
                    <td>{{ product.product_id }}</td>
                    <td>{{ product.product_name }}</td>
                    <td>{{ product.category_name or 'N/A' }}</td>
                    <td>₹{{ "%.2f"|format(product.price) }}
                        {% if product.discount_price %}
                            <br><small style="color: green;">₹{{ "%.2f"|format(product.discount_price) }}</small>
                        {% endif %}
                    </td>
                    <td>{{ product.stock_quantity or 0 }}</td>
                    <td><span class="badge badge-{{ 'success' if product.status == 'active' else 'danger' }}">{{ product.status }}</span></td>
                    <td>{{ '✓' if product.is_featured else '' }}</td>
                    <td>
                        <button onclick="editProduct({{ product.product_id }})" class="btn btn-warning btn-sm">Edit</button>
                        <button onclick="confirmDelete('/api/products', {{ product.product_id }})" class="btn btn-danger btn-sm">Delete</button>
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        
        <div class="pagination">
            {% for p in range(1, (total // per_page) + 2) %}
                <a href="?page={{ p }}&search={{ request.args.get('search', '') }}" class="{{ 'active' if p == page else '' }}">{{ p }}</a>
            {% endfor %}
        </div>
    </div>
    
    <!-- Add Product Modal -->
    <div id="addProductModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Product</h2>
                <span class="close" onclick="hideModal('addProductModal')">&times;</span>
            </div>
            <form action="/api/products" method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label>Product Name*</label>
                    <input type="text" name="product_name" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>Category*</label>
                    <select name="category_id" class="form-control" required>
                        <option value="">Select Category</option>
                        {% for cat in categories %}
                            <option value="{{ cat.category_id }}">{{ cat.category_name }}</option>
                        {% endfor %}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" class="form-control" rows="4"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Price*</label>
                    <input type="number" name="price" class="form-control" step="0.01" required>
                </div>
                
                <div class="form-group">
                    <label>Discount Price</label>
                    <input type="number" name="discount_price" class="form-control" step="0.01">
                </div>
                
                <div class="form-group">
                    <label>Brand</label>
                    <input type="text" name="brand" class="form-control">
                </div>
                
                <div class="form-group">
                    <label>SKU</label>
                    <input type="text" name="sku" class="form-control">
                </div>
                
                <div class="form-group">
                    <label>Initial Stock</label>
                    <input type="number" name="initial_stock" class="form-control" value="0">
                </div>
                
                <div class="form-group">
                    <label>GST Rate (%)</label>
                    <input type="number" name="gst_rate" class="form-control" value="5" step="0.01">
                </div>
                
                <div class="form-group">
                    <label>HSN Code</label>
                    <input type="text" name="hsn_code" class="form-control" value="0000">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="is_featured" value="true"> Featured Product
                    </label>
                </div>
                
                <div class="form-group">
                    <label>Product Images</label>
                    <div class="file-upload">
                        <input type="file" name="images" multiple accept="image/*">
                        <label class="file-upload-label">Choose Images</label>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary">Create Product</button>
            </form>
        </div>
    </div>
    
    <script>
        function editProduct(productId) {
            // Implement edit functionality
            window.location.href = '/products/' + productId + '/edit';
        }
    </script>
    {% endblock %}
    '''
    
    return render_template_string(ADMIN_TEMPLATE + products_template,
                                title='Products',
                                active_page='products',
                                products=products,
                                categories=categories,
                                total=total,
                                page=page,
                                per_page=per_page)

@app.route('/categories')
@admin_required
def categories():
    categories = execute_query("""
        SELECT c.*, 
               (SELECT COUNT(*) FROM products WHERE category_id = c.category_id AND status = 'active') as active_product_count,
               (SELECT COUNT(*) FROM products WHERE category_id = c.category_id) as total_product_count
        FROM categories c
        ORDER BY c.status DESC, c.sort_order, c.category_name
    """, fetch_all=True)
    
    categories_template = '''
    {% extends "base.html" %}
    {% block content %}
    <div class="table-header">
        <h2>Categories Management</h2>
        <button onclick="showModal('addCategoryModal')" class="btn btn-primary">Add Category</button>
    </div>
    
    <div class="data-table">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th>Sort Order</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {% for category in categories %}
                <tr>
                    <td>{{ category.category_id }}</td>
                    <td>{{ category.category_name }}</td>
                    <td>{{ category.description[:50] }}{{ '...' if category.description|length > 50 else '' }}</td>
                    <td>{{ category.active_product_count }}/{{ category.total_product_count }}</td>
                    <td><span class="badge badge-{{ 'success' if category.status == 'active' else 'danger' }}">{{ category.status }}</span></td>
                    <td>{{ category.sort_order }}</td>
                    <td>
                        <button onclick="editCategory({{ category.category_id }})" class="btn btn-warning btn-sm">Edit</button>
                        <button onclick="confirmDelete('/api/categories', {{ category.category_id }})" class="btn btn-danger btn-sm">Delete</button>
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
    
    <!-- Add Category Modal -->
    <div id="addCategoryModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Category</h2>
                <span class="close" onclick="hideModal('addCategoryModal')">&times;</span>
            </div>
            <form action="/api/categories" method="POST">
                <div class="form-group">
                    <label>Category Name*</label>
                    <input type="text" name="category_name" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" class="form-control" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Sort Order</label>
                    <input type="number" name="sort_order" class="form-control" value="0">
                </div>
                
                <button type="submit" class="btn btn-primary">Create Category</button>
            </form>
        </div>
    </div>
    
    <script>
        function editCategory(categoryId) {
            // Implement edit functionality
            alert('Edit category: ' + categoryId);
        }
    </script>
    {% endblock %}
    '''
    
    return render_template_string(ADMIN_TEMPLATE + categories_template,
                                title='Categories',
                                active_page='categories',
                                categories=categories)

@app.route('/orders')
@admin_required
def orders():
    page = int(request.args.get('page', 1))
    per_page = 20
    status = request.args.get('status', '')
    
    # Build query
    query = """
        SELECT o.*, u.first_name, u.last_name, u.email,
               COUNT(oi.item_id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE 1=1
    """
    params = []
    
    if status:
        query += " AND o.status = %s"
        params.append(status)
    
    query += " GROUP BY o.order_id ORDER BY o.created_at DESC"
    
    # Count total
    count_query = "SELECT COUNT(DISTINCT order_id) as total FROM orders WHERE 1=1"
    if status:
        count_query += " AND status = %s"
    total = execute_query(count_query, params[:1] if status else [], fetch_one=True)['total']
    
    # Add pagination
    offset = (page - 1) * per_page
    query += " LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    orders = execute_query(query, params, fetch_all=True)
    
    orders_template = '''
    {% extends "base.html" %}
    {% block content %}
    <div class="table-header">
        <h2>Orders Management</h2>
        <select onchange="window.location.href='?status=' + this.value" style="float: right;">
            <option value="">All Orders</option>
            <option value="pending" {{ 'selected' if request.args.get('status') == 'pending' else '' }}>Pending</option>
            <option value="confirmed" {{ 'selected' if request.args.get('status') == 'confirmed' else '' }}>Confirmed</option>
            <option value="shipped" {{ 'selected' if request.args.get('status') == 'shipped' else '' }}>Shipped</option>
            <option value="delivered" {{ 'selected' if request.args.get('status') == 'delivered' else '' }}>Delivered</option>
            <option value="cancelled" {{ 'selected' if request.args.get('status') == 'cancelled' else '' }}>Cancelled</option>
        </select>
    </div>
    
    <div class="data-table">
        <table>
            <thead>
                <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {% for order in orders %}
                <tr>
                    <td>{{ order.order_number }}</td>
                    <td>{{ order.first_name }} {{ order.last_name }}<br><small>{{ order.email }}</small></td>
                    <td>{{ order.item_count }}</td>
                    <td>₹{{ "%.2f"|format(order.total_amount) }}</td>
                    <td>{{ order.payment_method.upper() }}</td>
                    <td>
                        <select onchange="updateOrderStatus('{{ order.order_id }}', this.value)" class="form-control" style="width: auto;">
                            <option value="pending" {{ 'selected' if order.status == 'pending' else '' }}>Pending</option>
                            <option value="confirmed" {{ 'selected' if order.status == 'confirmed' else '' }}>Confirmed</option>
                            <option value="processing" {{ 'selected' if order.status == 'processing' else '' }}>Processing</option>
                            <option value="shipped" {{ 'selected' if order.status == 'shipped' else '' }}>Shipped</option>
                            <option value="delivered" {{ 'selected' if order.status == 'delivered' else '' }}>Delivered</option>
                            <option value="cancelled" {{ 'selected' if order.status == 'cancelled' else '' }}>Cancelled</option>
                        </select>
                    </td>
                    <td>{{ order.created_at.strftime('%Y-%m-%d %H:%M') }}</td>
                    <td>
                        <a href="/orders/{{ order.order_id }}" class="btn btn-info btn-sm">View</a>
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        
        <div class="pagination">
            {% for p in range(1, (total // per_page) + 2) %}
                <a href="?page={{ p }}&status={{ request.args.get('status', '') }}" class="{{ 'active' if p == page else '' }}">{{ p }}</a>
            {% endfor %}
        </div>
    </div>
    
    <script>
        function updateOrderStatus(orderId, status) {
            fetch('/api/orders/' + orderId + '/status', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({status: status})
            })
            .then(response => response.json())
            .then(data => {
                if(data.error) {
                    alert('Error: ' + data.error);
                } else {
                    alert('Order status updated successfully');
                }
            });
        }
    </script>
    {% endblock %}
    '''
    
    return render_template_string(ADMIN_TEMPLATE + orders_template,
                                title='Orders',
                                active_page='orders',
                                orders=orders,
                                total=total,
                                page=page,
                                per_page=per_page)

@app.route('/cache')
@admin_required
def cache_management():
    # Get cache stats
    try:
        r = redis.Redis.from_url(REDIS_URL)
        info = r.info()
        
        cache_stats = {
            'connected': True,
            'version': info.get('redis_version'),
            'memory': info.get('used_memory_human'),
            'clients': info.get('connected_clients'),
            'keys': r.dbsize(),
            'hits': info.get('keyspace_hits', 0),
            'misses': info.get('keyspace_misses', 0)
        }
        
        hit_rate = 0
        if cache_stats['hits'] + cache_stats['misses'] > 0:
            hit_rate = (cache_stats['hits'] / (cache_stats['hits'] + cache_stats['misses'])) * 100
        cache_stats['hit_rate'] = round(hit_rate, 2)
        
    except Exception as e:
        cache_stats = {'connected': False, 'error': str(e)}
    
    cache_template = '''
    {% extends "base.html" %}
    {% block content %}
    <h2>Cache Management</h2>
    
    {% if cache_stats.connected %}
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Redis Version</h3>
                <div class="value">{{ cache_stats.version }}</div>
            </div>
            
            <div class="stat-card">
                <h3>Memory Usage</h3>
                <div class="value">{{ cache_stats.memory }}</div>
            </div>
            
            <div class="stat-card">
                <h3>Total Keys</h3>
                <div class="value">{{ cache_stats.keys }}</div>
            </div>
            
            <div class="stat-card">
                <h3>Hit Rate</h3>
                <div class="value">{{ cache_stats.hit_rate }}%</div>
                <div class="change">{{ cache_stats.hits }} hits / {{ cache_stats.misses }} misses</div>
            </div>
        </div>
        
        <div class="data-table" style="margin-top: 2rem;">
            <div class="table-header">
                <h3>Cache Operations</h3>
            </div>
            <div style="padding: 2rem;">
                <button onclick="clearCache('products')" class="btn btn-warning">Clear Product Cache</button>
                <button onclick="clearCache('categories')" class="btn btn-warning">Clear Category Cache</button>
                <button onclick="clearCache('featured')" class="btn btn-warning">Clear Featured Cache</button>
                <button onclick="clearCache('all')" class="btn btn-danger">Clear All Cache</button>
                
                <div style="margin-top: 2rem;">
                    <h4>Clear by Pattern</h4>
                    <input type="text" id="cachePattern" class="form-control" placeholder="Enter cache key pattern..." style="width: 300px; display: inline-block;">
                    <button onclick="clearCachePattern()" class="btn btn-warning">Clear Pattern</button>
                </div>
            </div>
        </div>
    {% else %}
        <div class="alert alert-danger">
            Redis connection failed: {{ cache_stats.error }}
        </div>
    {% endif %}
    
    <script>
        function clearCache(type) {
            if(confirm('Are you sure you want to clear ' + type + ' cache?')) {
                fetch('/api/cache/clear/' + type, {method: 'POST'})
                .then(response => response.json())
                .then(data => {
                    alert(data.message || 'Cache cleared');
                    location.reload();
                });
            }
        }
        
        function clearCachePattern() {
            const pattern = document.getElementById('cachePattern').value;
            if(!pattern) {
                alert('Please enter a pattern');
                return;
            }
            
            if(confirm('Clear all keys matching pattern: ' + pattern + '?')) {
                fetch('/api/cache/clear/pattern', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({pattern: pattern})
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message || 'Pattern cache cleared');
                    location.reload();
                });
            }
        }
    </script>
    {% endblock %}
    '''
    
    return render_template_string(ADMIN_TEMPLATE + cache_template,
                                title='Cache Management',
                                active_page='cache',
                                cache_stats=cache_stats)

# API Routes
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    # Check if product exists
    product = execute_query("""
        SELECT product_id, product_name FROM products WHERE product_id = %s
    """, (product_id,), fetch_one=True)
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Check if product has been ordered
    order_references = execute_query("""
        SELECT COUNT(*) as count FROM order_items WHERE product_id = %s
    """, (product_id,), fetch_one=True)
    
    if order_references['count'] > 0:
        # Soft delete
        execute_query("""
            UPDATE products SET status = 'inactive', updated_at = %s 
            WHERE product_id = %s
        """, (datetime.now(), product_id))
        
        # Clean up cart and wishlist
        execute_query("DELETE FROM cart WHERE product_id = %s", (product_id,))
        execute_query("DELETE FROM wishlist WHERE product_id = %s", (product_id,))
        
        clear_cache_keys('product')
        
        return jsonify({
            'message': f'Product "{product["product_name"]}" has been deactivated (soft delete)',
            'deletion_type': 'soft_delete'
        }), 200
    else:
        # Hard delete
        execute_query("DELETE FROM cart WHERE product_id = %s", (product_id,))
        execute_query("DELETE FROM wishlist WHERE product_id = %s", (product_id,))
        execute_query("DELETE FROM product_images WHERE product_id = %s", (product_id,))
        execute_query("DELETE FROM product_variants WHERE product_id = %s", (product_id,))
        execute_query("DELETE FROM inventory WHERE product_id = %s", (product_id,))
        execute_query("DELETE FROM products WHERE product_id = %s", (product_id,))
        
        clear_cache_keys('product')
        
        return jsonify({
            'message': f'Product "{product["product_name"]}" has been permanently deleted',
            'deletion_type': 'hard_delete'
        }), 200

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    # Check if category exists
    category = execute_query("""
        SELECT category_id, category_name FROM categories WHERE category_id = %s
    """, (category_id,), fetch_one=True)
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    # Check if products in category have orders
    products_with_orders = execute_query("""
        SELECT COUNT(DISTINCT p.product_id) as count 
        FROM products p
        JOIN order_items oi ON p.product_id = oi.product_id
        WHERE p.category_id = %s
    """, (category_id,), fetch_one=True)
    
    if products_with_orders['count'] > 0:
        # Soft delete category and its products
        execute_query("""
            UPDATE categories SET status = 'inactive', updated_at = %s 
            WHERE category_id = %s
        """, (datetime.now(), category_id))
        
        execute_query("""
            UPDATE products SET status = 'inactive', updated_at = %s 
            WHERE category_id = %s
        """, (datetime.now(), category_id))
        
        # Clean up references
        execute_query("""
            DELETE c FROM cart c 
            JOIN products p ON c.product_id = p.product_id 
            WHERE p.category_id = %s
        """, (category_id,))
        
        execute_query("""
            DELETE w FROM wishlist w 
            JOIN products p ON w.product_id = p.product_id 
            WHERE p.category_id = %s
        """, (category_id,))
        
        clear_cache_keys('')
        
        return jsonify({
            'message': f'Category "{category["category_name"]}" has been deactivated',
            'deletion_type': 'soft_delete'
        }), 200
    else:
        # Hard delete
        # First delete all products in category
        products = execute_query("""
            SELECT product_id FROM products WHERE category_id = %s
        """, (category_id,), fetch_all=True)
        
        for product in products:
            execute_query("DELETE FROM cart WHERE product_id = %s", (product['product_id'],))
            execute_query("DELETE FROM wishlist WHERE product_id = %s", (product['product_id'],))
            execute_query("DELETE FROM product_images WHERE product_id = %s", (product['product_id'],))
            execute_query("DELETE FROM product_variants WHERE product_id = %s", (product['product_id'],))
            execute_query("DELETE FROM inventory WHERE product_id = %s", (product['product_id'],))
            execute_query("DELETE FROM products WHERE product_id = %s", (product['product_id'],))
        
        execute_query("DELETE FROM categories WHERE category_id = %s", (category_id,))
        
        clear_cache_keys('')
        
        return jsonify({
            'message': f'Category "{category["category_name"]}" has been permanently deleted',
            'deletion_type': 'hard_delete'
        }), 200

@app.route('/api/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    data = request.get_json()
    status = data.get('status')
    
    valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    execute_query("""
        UPDATE orders SET status = %s, updated_at = %s WHERE order_id = %s
    """, (status, datetime.now(), order_id))
    
    execute_query("""
        INSERT INTO order_tracking (order_id, status, message, created_at)
        VALUES (%s, %s, %s, %s)
    """, (order_id, status, f'Order status updated to {status}', datetime.now()))
    
    return jsonify({'message': 'Order status updated successfully'}), 200

@app.route('/api/cache/clear/<cache_type>', methods=['POST'])
@admin_required
def clear_cache_route(cache_type):
    if cache_type == 'all':
        clear_cache_keys('*')
        message = 'All cache cleared'
    elif cache_type == 'products':
        clear_cache_keys('product')
        message = 'Product cache cleared'
    elif cache_type == 'categories':
        clear_cache_keys('categor')
        message = 'Category cache cleared'
    elif cache_type == 'featured':
        clear_cache_keys('featured')
        message = 'Featured cache cleared'
    elif cache_type == 'pattern':
        data = request.get_json()
        pattern = data.get('pattern', '')
        clear_cache_keys(pattern)
        message = f'Cache cleared for pattern: {pattern}'
    else:
        return jsonify({'error': 'Invalid cache type'}), 400
    
    return jsonify({'message': message}), 200

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# Template filter
@app.template_filter()
def format_currency(value):
    return f"₹{value:,.2f}"

# Main template parts
@app.before_request
def make_session_permanent():
    session.permanent = True

@app.context_processor
def inject_globals():
    return {
        'session': session,
        'request': request
    }

# Register template as base
app.jinja_env.globals['base.html'] = ADMIN_TEMPLATE

if __name__ == '__main__':
    # Create upload directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    for subdir in ['products', 'categories', 'users']:
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], subdir), exist_ok=True)
    
    # Run app
    app.run(debug=True, port=5001)  # Running on different port than main app