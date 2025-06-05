import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
from datetime import datetime, timedelta
from config import Config
from models import execute_query
import json
import re

class EmailService:
    def __init__(self):
        self.smtp_server = 'smtp.gmail.com'  # Hardcoded to avoid config issues
        self.smtp_port = 587
        self.email = getattr(Config, 'MAIL_USERNAME', 'test@gmail.com')
        self.password = getattr(Config, 'MAIL_PASSWORD', '')
        
        # AGGRESSIVE cleaning of sender name to prevent encoding issues
        raw_sender = getattr(Config, 'COMPANY_NAME', 'YourStore')
        self.sender_name = self.force_ascii(str(raw_sender))
        
        print(f"📧 Email service initialized:")
        print(f"   SMTP: {self.smtp_server}:{self.smtp_port}")
        print(f"   From: {self.email}")
        print(f"   Sender: '{self.sender_name}'")
        
    def force_ascii(self, text):
        """Force text to be ASCII-only, no exceptions"""
        if not text:
            return "YourStore"
        
        # Convert to string
        text = str(text)
        
        # Remove or replace ALL non-ASCII characters
        # First try encoding/decoding
        try:
            text = text.encode('ascii', 'ignore').decode('ascii')
        except:
            pass
        
        # Replace common problematic characters
        replacements = {
            '\xa0': ' ',      # Non-breaking space
            '\u2019': "'",    # Right single quotation mark
            '\u2018': "'",    # Left single quotation mark  
            '\u201c': '"',    # Left double quotation mark
            '\u201d': '"',    # Right double quotation mark
            '\u2013': '-',    # En dash
            '\u2014': '-',    # Em dash
            '\u2026': '...',  # Horizontal ellipsis
            '\u00a9': 'C',    # Copyright symbol
            '\u00ae': 'R',    # Registered trademark
            '\u2122': 'TM',   # Trademark
            '₹': 'Rs.',       # Rupee symbol
        }
        
        for unicode_char, replacement in replacements.items():
            text = text.replace(unicode_char, replacement)
        
        # Nuclear option: remove ALL non-ASCII characters
        text = re.sub(r'[^\x00-\x7F]', '', text)
        
        # Clean up spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Fallback if empty
        if not text or len(text) == 0:
            text = "YourStore"
            
        return text
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Send email with bulletproof ASCII handling"""
        try:
            # FORCE CLEAN ALL INPUTS
            to_email_clean = self.force_ascii(to_email)
            subject_clean = self.force_ascii(subject)
            html_content_clean = self.force_ascii(html_content)
            sender_name_clean = self.force_ascii(self.sender_name)
            
            if text_content:
                text_content_clean = self.force_ascii(text_content)
            else:
                text_content_clean = self.force_ascii("Please view this email in HTML format.")
            
            print(f"📧 Sending email:")
            print(f"   To: '{to_email_clean}'")
            print(f"   Subject: '{subject_clean}'")
            print(f"   From: '{sender_name_clean} <{self.email}>'")
            
            # Create message with minimal headers
            message = MIMEMultipart("alternative")
            
            # Set headers with ASCII-only content
            message["Subject"] = subject_clean
            message["From"] = self.email  # Don't include sender name in From header
            message["To"] = to_email_clean
            
            # Add content parts
            text_part = MIMEText(text_content_clean, "plain", "ascii")
            html_part = MIMEText(html_content_clean, "html", "ascii")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Get the message as string and check for problematic characters
            message_string = message.as_string()
            
            # Final ASCII check
            try:
                message_string.encode('ascii')
            except UnicodeEncodeError as e:
                print(f"⚠️ Found non-ASCII character at position {e.start}: {repr(message_string[e.start:e.end])}")
                # Force remove the problematic character
                message_string = message_string.encode('ascii', 'ignore').decode('ascii')
            
            # Send email
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.email, self.password)
                server.sendmail(self.email, to_email_clean, message_string)
            
            print(f"✅ Email sent successfully to {to_email_clean}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
            return False
    
    def generate_verification_token(self, user_id):
        """Generate email verification token"""
        token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(hours=24)
        
        execute_query("""
            INSERT INTO email_verifications (user_id, token, expires_at, created_at)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
            token = VALUES(token), 
            expires_at = VALUES(expires_at), 
            created_at = VALUES(created_at)
        """, (user_id, token, expires_at, datetime.now()))
        
        return token
    
    def send_verification_email(self, user_email, user_name, user_id):
        """Send email verification with ultra-safe content"""
        token = self.generate_verification_token(user_id)
        # FIXED: Use backend GET endpoint that handles verification and redirects
        verification_url = f"http://localhost:5000/api/auth/verify-email/{token}"
        
        # Force clean all inputs
        user_email_clean = self.force_ascii(user_email)
        user_name_clean = self.force_ascii(user_name)
        sender_name_clean = self.force_ascii(self.sender_name)
        
        subject = f"Welcome to {sender_name_clean} - Verify Email"
        
        # Ultra-simple HTML (no fancy characters)
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4CAF50;">Welcome to {sender_name_clean}!</h1>
                <p>Hi {user_name_clean},</p>
                <p>Thank you for joining us! Please verify your email address.</p>
                <p style="margin: 30px 0;">
                    <a href="{verification_url}" style="background: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                </p>
                <p>Or copy this link: {verification_url}</p>
                <p>This link expires in 24 hours.</p>
                <p>Best regards,<br>The {sender_name_clean} Team</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to {sender_name_clean}!
        
        Hi {user_name_clean},
        
        Thank you for joining us! Please verify your email address.
        
        Verification Link: {verification_url}
        
        This link expires in 24 hours.
        
        Best regards,
        The {sender_name_clean} Team
        """
        
        return self.send_email(user_email_clean, subject, html_content, text_content)
    
    def send_order_confirmation_email(self, order_id, user_email, user_name):
        """Send order confirmation email"""
        # Get order details
        order = execute_query("""
            SELECT o.*, COUNT(oi.item_id) as item_count
            FROM orders o 
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.order_id = %s
            GROUP BY o.order_id
        """, (order_id,), fetch_one=True)
        
        if not order:
            return False
        
        # Get order items
        order_items = execute_query("""
            SELECT * FROM order_items WHERE order_id = %s
        """, (order_id,), fetch_all=True)
        
        # Parse shipping address
        shipping_address = json.loads(order['shipping_address'])
        
        # Clean all data
        user_email_clean = self.force_ascii(user_email)
        user_name_clean = self.force_ascii(user_name)
        order_number_clean = self.force_ascii(order['order_number'])
        sender_name_clean = self.force_ascii(self.sender_name)
        
        subject = f"Order Confirmed - {order_number_clean}"
        
        # Create simple items list
        items_list = ""
        for item in order_items:
            product_name_clean = self.force_ascii(item['product_name'])
            items_list += f"- {product_name_clean} x{item['quantity']} = Rs.{item['total_price']:.2f}\n"
        
        # Ultra-simple HTML
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4CAF50;">Order Confirmed!</h1>
                <p>Hi {user_name_clean},</p>
                <p>Thank you for your order!</p>
                
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> {order_number_clean}</p>
                <p><strong>Date:</strong> {order['created_at'].strftime('%B %d, %Y')}</p>
                <p><strong>Payment:</strong> {order['payment_method'].upper()}</p>
                <p><strong>Status:</strong> {order['status'].upper()}</p>
                
                <h3>Items Ordered:</h3>
                <pre>{items_list}</pre>
                
                <p><strong>Total: Rs.{order['total_amount']:.2f}</strong></p>
                
                <h3>Shipping Address:</h3>
                <p>{self.force_ascii(shipping_address['full_name'])}<br>
                {self.force_ascii(shipping_address['address_line1'])}<br>
                {self.force_ascii(shipping_address['city'])}, {self.force_ascii(shipping_address['state'])}<br>
                Phone: {shipping_address['phone']}</p>
                
                <p>Thank you for choosing {sender_name_clean}!</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email_clean, subject, html_content)
    
    def verify_email_token(self, token):
        """Verify email verification token"""
        verification = execute_query("""
            SELECT user_id FROM email_verifications 
            WHERE token = %s AND expires_at > NOW() AND used_at IS NULL
        """, (token,), fetch_one=True)
        
        if verification:
            user_id = verification['user_id']
            
            # Mark user as verified
            execute_query("""
                UPDATE users SET email_verified = TRUE, updated_at = %s 
                WHERE user_id = %s
            """, (datetime.now(), user_id))
            
            # Mark token as used
            execute_query("""
                UPDATE email_verifications SET used_at = %s 
                WHERE token = %s
            """, (datetime.now(), token))
            
            return user_id
        
        return None

    def generate_password_reset_token(self, user_id):
        """Generate password reset token"""
        token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(hours=2)  # 2 hour expiry
        
        execute_query("""
            INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, token, expires_at, datetime.now()))
        
        return token

    def send_password_reset_email(self, user_email, user_name, user_id):
        """Send password reset email"""
        token = self.generate_password_reset_token(user_id)
        # FIXED: Use backend GET endpoint that shows reset form
        reset_url = f"http://localhost:5000/api/auth/reset-password/{token}"
        
        # Clean inputs
        user_email_clean = self.force_ascii(user_email)
        user_name_clean = self.force_ascii(user_name)
        sender_name_clean = self.force_ascii(self.sender_name)
        
        subject = f"Password Reset Request - {sender_name_clean}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f44336;">Password Reset Request</h1>
                <p>Hi {user_name_clean},</p>
                <p>We received a request to reset your password.</p>
                <p style="margin: 30px 0;">
                    <a href="{reset_url}" style="background: #f44336; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                </p>
                <p>Or copy this link: {reset_url}</p>
                <p><strong>This link expires in 2 hours.</strong></p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br>The {sender_name_clean} Team</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request
        
        Hi {user_name_clean},
        
        We received a request to reset your password.
        
        Reset link: {reset_url}
        
        This link expires in 2 hours.
        
        If you did not request this, please ignore this email.
        
        Best regards,
        The {sender_name_clean} Team
        """
        
        return self.send_email(user_email_clean, subject, html_content, text_content)

    def send_password_reset_confirmation_email(self, user_email, user_name):
        """Send confirmation after password reset"""
        user_email_clean = self.force_ascii(user_email)
        user_name_clean = self.force_ascii(user_name)
        sender_name_clean = self.force_ascii(self.sender_name)
        
        subject = f"Password Reset Successful - {sender_name_clean}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4CAF50;">Password Reset Successful</h1>
                <p>Hi {user_name_clean},</p>
                <p>Your password has been successfully reset.</p>
                <p>You can now log in with your new password.</p>
                <p style="margin: 30px 0;">
                    <a href="http://localhost:3000/login" style="background: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">Login Now</a>
                </p>
                <p>Reset Time: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                <p>Best regards,<br>The {sender_name_clean} Team</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email_clean, subject, html_content)

    def send_password_change_confirmation_email(self, user_email, user_name):
        """Send confirmation after password change from dashboard"""
        user_email_clean = self.force_ascii(user_email)
        user_name_clean = self.force_ascii(user_name)
        sender_name_clean = self.force_ascii(self.sender_name)
        
        subject = f"Password Changed - {sender_name_clean}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2196F3;">Password Changed</h1>
                <p>Hi {user_name_clean},</p>
                <p>Your password has been successfully changed.</p>
                <p>If you made this change, no further action is required.</p>
                <p>Change Time: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                <p>Best regards,<br>The {sender_name_clean} Team</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email_clean, subject, html_content)

# Global email service instance
email_service = EmailService()