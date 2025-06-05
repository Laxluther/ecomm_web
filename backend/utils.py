from datetime import datetime
import random
import json
from models import execute_query
from config import Config

def generate_order_number():
    """Generate unique order number"""
    date_part = datetime.now().strftime('%Y%m%d')
    random_part = random.randint(1000, 9999)
    return f"ORD{date_part}{random_part}"

def get_state_code_from_state_name(state_input):
    """Convert state name to state code or return as-is if already a code"""
    if not state_input:
        return 'MH'
    
    # If it's already a 2-letter code, return it
    if len(state_input) == 2 and state_input.isupper():
        return state_input
    
    # State mapping for conversion
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

def calculate_product_wise_gst(cart_items, customer_state_code):
    """Calculate GST for each product and total"""
    business_state = Config.BUSINESS_STATE_CODE
    
    tax_breakdown = {
        'items': [],
        'total_cgst': 0,
        'total_sgst': 0, 
        'total_igst': 0,
        'total_tax': 0,
        'subtotal': 0
    }
    
    for item in cart_items:
        item_price = float(item.get('discount_price', item.get('price', 0)))
        quantity = item.get('quantity', 1)
        gst_rate = float(item.get('gst_rate', 5.0))
        item_total = item_price * quantity
        
        # Calculate tax based on delivery location
        if customer_state_code == business_state:
            # Intra-state: CGST + SGST
            cgst = (item_total * gst_rate / 2) / 100
            sgst = (item_total * gst_rate / 2) / 100
            igst = 0
        else:
            # Inter-state: IGST
            cgst = 0
            sgst = 0
            igst = (item_total * gst_rate) / 100
        
        item_tax = {
            'product_name': item.get('product_name'),
            'hsn_code': item.get('hsn_code'),
            'quantity': quantity,
            'unit_price': item_price,
            'item_total': item_total,
            'gst_rate': gst_rate,
            'cgst': round(cgst, 2),
            'sgst': round(sgst, 2),
            'igst': round(igst, 2),
            'total_tax': round(cgst + sgst + igst, 2)
        }
        
        tax_breakdown['items'].append(item_tax)
        tax_breakdown['total_cgst'] += cgst
        tax_breakdown['total_sgst'] += sgst
        tax_breakdown['total_igst'] += igst
        tax_breakdown['subtotal'] += item_total
    
    tax_breakdown['total_tax'] = tax_breakdown['total_cgst'] + tax_breakdown['total_sgst'] + tax_breakdown['total_igst']
    
    # Round totals
    for key in ['total_cgst', 'total_sgst', 'total_igst', 'total_tax']:
        tax_breakdown[key] = round(tax_breakdown[key], 2)
    
    return tax_breakdown

def calculate_order_totals(cart_items, customer_state, applied_promocode=None):
    """Calculate order totals with GST and discounts"""
    customer_state_code = get_state_code_from_state_name(customer_state) if isinstance(customer_state, str) else customer_state
    business_state = Config.BUSINESS_STATE_CODE
    
    subtotal = 0
    total_cgst = 0
    total_sgst = 0
    total_igst = 0
    total_tax_rate = 0
    
    for item in cart_items:
        item_price = float(item['discount_price']) if item['discount_price'] else float(item['price'])
        quantity = item['quantity']
        gst_rate = float(item.get('gst_rate', 5.0))
        item_total = item_price * quantity
        
        subtotal += item_total
        total_tax_rate += gst_rate * quantity
        
        # Calculate GST
        if customer_state_code == business_state:
            # Intra-state: CGST + SGST
            cgst = (item_total * gst_rate / 2) / 100
            sgst = (item_total * gst_rate / 2) / 100
            total_cgst += cgst
            total_sgst += sgst
        else:
            # Inter-state: IGST
            igst = (item_total * gst_rate) / 100
            total_igst += igst
    
    # Calculate shipping
    shipping_amount = 0 if subtotal >= Config.FREE_DELIVERY_THRESHOLD else Config.STANDARD_DELIVERY_CHARGE
    
    # Calculate discount
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
    
    # Calculate average tax rate
    total_items = sum(item['quantity'] for item in cart_items)
    avg_tax_rate = (total_tax_rate / total_items) if total_items > 0 else 0
    
    return {
        'subtotal': round(subtotal, 2),
        'tax_amount': round(tax_amount, 2),
        'cgst_amount': round(total_cgst, 2),
        'sgst_amount': round(total_sgst, 2), 
        'igst_amount': round(total_igst, 2),
        'shipping_amount': round(shipping_amount, 2),
        'discount_amount': round(discount_amount, 2),
        'total_amount': round(total_amount, 2),
        'avg_tax_rate': round(avg_tax_rate, 2)
    }

def validate_promocode(code, subtotal, user_id=None):
    """Validate and return promocode details"""
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
    """Process wallet payment and return result"""
    # Get current balance
    wallet = execute_query("SELECT balance FROM wallet WHERE user_id = %s", (user_id,), fetch_one=True)
    current_balance = float(wallet['balance']) if wallet else 0.0
    
    if current_balance < amount:
        return False, f'Insufficient wallet balance. Available: ₹{current_balance}'
    
    # Deduct amount
    new_balance = current_balance - amount
    execute_query("UPDATE wallet SET balance = %s, updated_at = %s WHERE user_id = %s", 
                 (new_balance, datetime.now(), user_id))
    
    # Add transaction record
    transaction_id = str(__import__('uuid').uuid4())
    execute_query("""
        INSERT INTO wallet_transactions 
        (transaction_id, user_id, transaction_type, amount, balance_after, 
         description, reference_type, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (transaction_id, user_id, 'debit', amount, new_balance,
          'Payment for order', 'order', datetime.now()))
    
    return True, 'Payment successful'

def send_order_confirmation_email(order_id, order_number, user_id):
    """Send order confirmation email"""
    try:
        # Get user details
        from models import execute_query
        user = execute_query("""
            SELECT email, first_name, last_name FROM users WHERE user_id = %s
        """, (user_id,), fetch_one=True)
        
        if user:
            from email_service import email_service
            success = email_service.send_order_confirmation_email(
                order_id, 
                user['email'], 
                user['first_name']
            )
            
            if success:
                print(f"✅ Order confirmation email sent to {user['email']} for order {order_number}")
            else:
                print(f"❌ Failed to send order confirmation email for order {order_number}")
        else:
            print(f"❌ User not found for order confirmation email: {user_id}")
            
    except Exception as e:
        print(f"❌ Error sending order confirmation email: {e}")
        # Don't fail the order if email fails

def check_inventory_availability(product_id, quantity):
    """Check if product has enough stock"""
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
    """Update product inventory"""
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
    """Return Indian states for dropdown"""
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