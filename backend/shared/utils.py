from datetime import datetime
import random
import json
from shared.models import execute_query
from config import Config

def generate_order_number():
    date_part = datetime.now().strftime('%Y%m%d')
    random_part = random.randint(1000, 9999)
    return f"ORD{date_part}{random_part}"

def get_state_code_from_state_name(state_input):
    if not state_input:
        return 'MH'
    
    if len(state_input) == 2 and state_input.isupper():
        return state_input
    
    state_mapping = {
        'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
        'Chhattisgarh': 'CG', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR', 
        'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
        'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
        'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB', 
        'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TS',
        'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UK', 'West Bengal': 'WB',
        'Delhi': 'DL', 'Jammu and Kashmir': 'JK'
    }
    
    return state_mapping.get(state_input, 'MH')

def calculate_order_totals(cart_items, customer_state, applied_promocode=None):
    customer_state_code = get_state_code_from_state_name(customer_state)
    business_state = Config.BUSINESS_STATE_CODE
    
    subtotal = 0
    total_cgst = 0
    total_sgst = 0
    total_igst = 0
    
    for item in cart_items:
        item_price = float(item['discount_price']) if item['discount_price'] else float(item['price'])
        quantity = item['quantity']
        gst_rate = float(item.get('gst_rate', 5.0))
        item_total = item_price * quantity
        
        subtotal += item_total
        
        if customer_state_code == business_state:
            cgst = (item_total * gst_rate / 2) / 100
            sgst = (item_total * gst_rate / 2) / 100
            total_cgst += cgst
            total_sgst += sgst
        else:
            igst = (item_total * gst_rate) / 100
            total_igst += igst
    
    shipping_amount = 0 if subtotal >= Config.FREE_DELIVERY_THRESHOLD else Config.STANDARD_DELIVERY_CHARGE
    
    discount_amount = 0
    if applied_promocode:
        if subtotal >= applied_promocode['min_order_amount']:
            if applied_promocode['discount_type'] == 'percentage':
                discount_amount = subtotal * (applied_promocode['discount_value'] / 100)
                if applied_promocode['max_discount_amount'] > 0:
                    discount_amount = min(discount_amount, applied_promocode['max_discount_amount'])
            else:
                discount_amount = min(applied_promocode['discount_value'], subtotal)
    
    tax_amount = total_cgst + total_sgst + total_igst
    total_amount = subtotal + tax_amount + shipping_amount - discount_amount
    
    return {
        'subtotal': round(subtotal, 2),
        'tax_amount': round(tax_amount, 2),
        'cgst_amount': round(total_cgst, 2),
        'sgst_amount': round(total_sgst, 2), 
        'igst_amount': round(total_igst, 2),
        'shipping_amount': round(shipping_amount, 2),
        'discount_amount': round(discount_amount, 2),
        'total_amount': round(total_amount, 2)
    }

def validate_promocode(code, subtotal, user_id=None):
    promocode = execute_query("""
        SELECT * FROM promocodes 
        WHERE code = %s AND status = 'active' 
        AND valid_from <= NOW() AND valid_until >= NOW()
        AND (usage_limit IS NULL OR used_count < usage_limit)
    """, (code.upper(),), fetch_one=True)
    
    if not promocode:
        return None, 'Invalid or expired promocode'
    
    min_order = float(promocode.get('min_order_amount') or 0)
    if subtotal < min_order:
        return None, f'Minimum order amount ₹{min_order} required'
    
    return {
        'code': promocode['code'],
        'discount_type': promocode['discount_type'],
        'discount_value': float(promocode['discount_value']),
        'min_order_amount': min_order,
        'max_discount_amount': float(promocode.get('max_discount_amount') or 0)
    }, 'Valid promocode'

def process_wallet_payment(user_id, amount):
    wallet = execute_query("SELECT balance FROM wallet WHERE user_id = %s", (user_id,), fetch_one=True)
    current_balance = float(wallet['balance']) if wallet else 0.0
    
    if current_balance < amount:
        return False, f'Insufficient wallet balance. Available: ₹{current_balance}'
    
    new_balance = current_balance - amount
    execute_query("UPDATE wallet SET balance = %s, updated_at = %s WHERE user_id = %s", 
                 (new_balance, datetime.now(), user_id))
    
    transaction_id = str(__import__('uuid').uuid4())
    execute_query("""
        INSERT INTO wallet_transactions 
        (transaction_id, user_id, transaction_type, amount, balance_after, 
         description, reference_type, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (transaction_id, user_id, 'debit', amount, new_balance,
          'Payment for order', 'order', datetime.now()))
    
    return True, 'Payment successful'

def check_inventory_availability(product_id, quantity):
    inventory = execute_query("""
        SELECT quantity, reserved_quantity 
        FROM inventory 
        WHERE product_id = %s
    """, (product_id,), fetch_one=True)
    
    if not inventory:
        return False, "Product not found in inventory"
    
    available_stock = inventory['quantity'] - inventory['reserved_quantity']
    
    if available_stock < quantity:
        return False, f"Only {available_stock} units available"
    
    return True, "Stock available"

def update_inventory(product_id, quantity, operation='decrease'):
    if operation == 'decrease':
        execute_query("""
            UPDATE inventory 
            SET quantity = quantity - %s, reserved_quantity = reserved_quantity + %s
            WHERE product_id = %s
        """, (quantity, quantity, product_id))
    elif operation == 'increase':
        execute_query("""
            UPDATE inventory 
            SET quantity = quantity + %s, reserved_quantity = reserved_quantity - %s
            WHERE product_id = %s
        """, (quantity, quantity, product_id))

def get_indian_states():
    return {
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

def sanitize_filename(filename):
    import re
    import os
    name, ext = os.path.splitext(filename)
    name = re.sub(r'[^\w\-_\.]', '_', name)
    return f"{name}{ext}"

def format_currency(amount):
    return f"₹{float(amount):,.2f}"

def format_date(date_obj):
    if isinstance(date_obj, str):
        date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
    return date_obj.strftime('%B %d, %Y')

def format_datetime(datetime_obj):
    if isinstance(datetime_obj, str):
        datetime_obj = datetime.fromisoformat(datetime_obj.replace('Z', '+00:00'))
    return datetime_obj.strftime('%B %d, %Y at %I:%M %p')

def calculate_discount_percentage(original_price, discounted_price):
    if not original_price or not discounted_price:
        return 0
    return round(((float(original_price) - float(discounted_price)) / float(original_price)) * 100, 1)

def generate_sku(category_name, product_name):
    import re
    category_code = re.sub(r'[^\w]', '', category_name)[:3].upper()
    product_code = re.sub(r'[^\w]', '', product_name)[:3].upper()
    random_num = random.randint(100, 999)
    return f"{category_code}{product_code}{random_num}"

def validate_phone_number(phone):
    import re
    phone_pattern = re.compile(r'^[6-9]\d{9}$')
    return bool(phone_pattern.match(phone))

def validate_email(email):
    import re
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(email_pattern.match(email))

def validate_pincode(pincode):
    import re
    pincode_pattern = re.compile(r'^\d{6}$')
    return bool(pincode_pattern.match(pincode))

def get_order_status_color(status):
    status_colors = {
        'pending': '#fbbf24',
        'confirmed': '#3b82f6',
        'processing': '#8b5cf6',
        'shipped': '#06b6d4',
        'delivered': '#10b981',
        'cancelled': '#ef4444',
        'refunded': '#f59e0b'
    }
    return status_colors.get(status, '#6b7280')

def paginate_results(query, params, page=1, per_page=20):
    offset = (page - 1) * per_page
    
    count_query = query.replace('SELECT *', 'SELECT COUNT(*) as total', 1)
    if 'ORDER BY' in count_query:
        count_query = count_query.split('ORDER BY')[0]
    
    total_count = execute_query(count_query, params, fetch_one=True)['total']
    
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

class APIResponse:
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