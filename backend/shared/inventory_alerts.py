"""
Inventory alert system for low stock notifications
"""
from shared.models import execute_query
from shared.email_service import email_service
from config import Config
import logging

def check_and_send_low_stock_alerts():
    """
    Check for low stock products and send email alerts to admins
    """
    try:
        # Get products with low stock (quantity <= min_stock_level)
        low_stock_products = execute_query("""
            SELECT p.product_name, i.quantity, i.min_stock_level
            FROM products p
            JOIN inventory i ON p.product_id = i.product_id
            WHERE i.quantity <= i.min_stock_level 
            AND p.status = 'active'
            AND i.quantity >= 0
            ORDER BY (i.quantity / NULLIF(i.min_stock_level, 0)) ASC
        """, fetch_all=True)
        
        if not low_stock_products:
            return True
        
        # Get admin emails
        admin_emails = execute_query("""
            SELECT email FROM admin_users 
            WHERE status = 'active' AND role IN ('admin', 'super_admin')
        """, fetch_all=True)
        
        if not admin_emails:
            logging.warning("No admin emails found for low stock alerts")
            return False
        
        # Send alerts to each admin
        for admin in admin_emails:
            for product in low_stock_products:
                try:
                    email_sent = email_service.send_low_stock_alert(
                        admin_email=admin['email'],
                        product_name=product['product_name'],
                        current_stock=product['quantity']
                    )
                    
                    if email_sent:
                        logging.info(f"Low stock alert sent for {product['product_name']} to {admin['email']}")
                    else:
                        logging.warning(f"Failed to send low stock alert for {product['product_name']}")
                        
                except Exception as e:
                    logging.error(f"Error sending low stock alert: {str(e)}")
        
        return True
        
    except Exception as e:
        logging.error(f"Error in low stock check: {str(e)}")
        return False

def send_low_stock_alert_for_product(product_id, current_stock):
    """
    Send low stock alert for a specific product
    """
    try:
        # Get product details
        product = execute_query("""
            SELECT p.product_name, i.min_stock_level
            FROM products p
            JOIN inventory i ON p.product_id = i.product_id
            WHERE p.product_id = %s AND p.status = 'active'
        """, (product_id,), fetch_one=True)
        
        if not product:
            return False
        
        # Check if stock is actually low
        if current_stock > product['min_stock_level']:
            return True  # Not low stock, no alert needed
        
        # Get admin emails
        admin_emails = execute_query("""
            SELECT email FROM admin_users 
            WHERE status = 'active' AND role IN ('admin', 'super_admin')
        """, fetch_all=True)
        
        if not admin_emails:
            return False
        
        # Send alert to admins
        for admin in admin_emails:
            try:
                email_sent = email_service.send_low_stock_alert(
                    admin_email=admin['email'],
                    product_name=product['product_name'],
                    current_stock=current_stock
                )
                
                if email_sent:
                    logging.info(f"Low stock alert sent for {product['product_name']} (stock: {current_stock})")
                
            except Exception as e:
                logging.error(f"Error sending individual low stock alert: {str(e)}")
        
        return True
        
    except Exception as e:
        logging.error(f"Error sending low stock alert for product {product_id}: {str(e)}")
        return False