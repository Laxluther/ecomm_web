import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config
from shared.models import execute_query
from datetime import datetime, timedelta
import uuid

class EmailService:
    def __init__(self):
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587
        self.email = getattr(Config, 'MAIL_USERNAME', "sanidhyarana1@gmail.com")
        self.password = getattr(Config, 'MAIL_PASSWORD', "rxeysnootgqklxam")
        self.sender_name = getattr(Config, 'COMPANY_NAME', 'YourStore')
        
        print(f"📧 Email service initialized:")
        print(f"   SMTP: {self.smtp_server}:{self.smtp_port}")
        print(f"   From: {self.email}")
        print(f"   Password configured: {bool(self.password)}")
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        if not self.email or not self.password:
            print(f"❌ Email not configured - Missing email/password")
            print(f"   Would send: {subject} to {to_email}")
            print(f"   Please set MAIL_USERNAME and MAIL_PASSWORD in .env")
            return False
        
        print(f"📧 Sending email:")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   From: {self.email}")
        
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.email
            message["To"] = to_email
            
            if not text_content:
                text_content = "Please view this email in HTML format."
            
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.email, self.password)
                server.sendmail(self.email, to_email, message.as_string())
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError:
            print(f"❌ SMTP Authentication failed - Check email/password")
            return False
        except smtplib.SMTPException as e:
            print(f"❌ SMTP Error: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Email sending failed: {str(e)}")
            return False
    
    def send_welcome_email(self, user_email, user_name, referral_code=None):
        subject = f"Welcome to {self.sender_name}!"
        
        referral_bonus = ""
        if referral_code:
            referral_bonus = """
            <div style="background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0277bd; margin: 0;">🎉 Referral Bonus Applied!</h3>
                <p style="margin: 5px 0;">You'll get ₹50 in your wallet after your first purchase of ₹500 or more!</p>
            </div>
            """
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4CAF50;">Welcome to {self.sender_name}!</h1>
                <p>Hi {user_name},</p>
                <p>Thank you for joining us! We're excited to have you.</p>
                {referral_bonus}
                <h3>Your Referral Code: <span style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-family: monospace;">REF{user_name.upper()[:3]}</span></h3>
                <p>Share your code with friends and earn ₹50 for each successful referral!</p>
                <p>Happy shopping!</p>
                <p>Best regards,<br>The {self.sender_name} Team</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)
    
    def generate_verification_token(self, user_id):
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
        token = self.generate_verification_token(user_id)
        verification_url = f"http://localhost:5000/api/user/auth/verify-email/{token}"
        
        subject = f"Verify Your Email - {self.sender_name}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4CAF50;">Welcome to {self.sender_name}!</h1>
                <p>Hi {user_name},</p>
                <p>Thank you for joining us! Please verify your email address to complete your registration.</p>
                <p style="margin: 30px 0;">
                    <a href="{verification_url}" style="background: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                </p>
                <p>Or copy this link: {verification_url}</p>
                <p>This link expires in 24 hours.</p>
                <p>Best regards,<br>The {self.sender_name} Team</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to {self.sender_name}!
        
        Hi {user_name},
        
        Please verify your email: {verification_url}
        
        This link expires in 24 hours.
        """
        
        return self.send_email(user_email, subject, html_content, text_content)
    
    def verify_email_token(self, token):
        verification = execute_query("""
            SELECT user_id FROM email_verifications 
            WHERE token = %s AND expires_at > NOW() AND used_at IS NULL
        """, (token,), fetch_one=True)
        
        if verification:
            user_id = verification['user_id']
            
            execute_query("""
                UPDATE users SET email_verified = TRUE, updated_at = %s 
                WHERE user_id = %s
            """, (datetime.now(), user_id))
            
            execute_query("""
                UPDATE email_verifications SET used_at = %s 
                WHERE token = %s
            """, (datetime.now(), token))
            
            return user_id
        
        return None
    
    def generate_password_reset_token(self, user_id):
        token = str(uuid.uuid4())
        expires_at = datetime.now() + timedelta(hours=2)
        
        execute_query("""
            INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, token, expires_at, datetime.now()))
        
        return token
    
    def send_password_reset_email(self, user_email, user_name, user_id):
        token = self.generate_password_reset_token(user_id)
        reset_url = f"http://localhost:5000/api/user/auth/reset-password/{token}"
        
        subject = f"Password Reset Request - {self.sender_name}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f44336;">Password Reset Request</h1>
                <p>Hi {user_name},</p>
                <p>We received a request to reset your password.</p>
                <p style="margin: 30px 0;">
                    <a href="{reset_url}" style="background: #f44336; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                </p>
                <p>Or copy this link: {reset_url}</p>
                <p><strong>This link expires in 2 hours.</strong></p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br>The {self.sender_name} Team</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)
    
    def verify_reset_token(self, token):
        reset_request = execute_query("""
            SELECT pr.user_id, pr.expires_at, u.email, u.first_name
            FROM password_reset_tokens pr
            JOIN users u ON pr.user_id = u.user_id
            WHERE pr.token = %s AND pr.expires_at > NOW() AND pr.used_at IS NULL
        """, (token,), fetch_one=True)
        
        return reset_request
    
    def reset_password(self, token, new_password_hash):
        reset_request = self.verify_reset_token(token)
        if not reset_request:
            return False
        
        execute_query("""
            UPDATE users 
            SET password_hash = %s, updated_at = %s 
            WHERE user_id = %s
        """, (new_password_hash, datetime.now(), reset_request['user_id']))
        
        execute_query("""
            UPDATE password_reset_tokens 
            SET used_at = %s 
            WHERE token = %s
        """, (datetime.now(), token))
        
        execute_query("""
            UPDATE password_reset_tokens 
            SET used_at = %s 
            WHERE user_id = %s AND used_at IS NULL AND token != %s
        """, (datetime.now(), reset_request['user_id'], token))
        
        return True
    
    def send_order_confirmation(self, order_id, user_email, user_name):
        order = execute_query("""
            SELECT o.*, COUNT(oi.item_id) as item_count
            FROM orders o 
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.order_id = %s
            GROUP BY o.order_id
        """, (order_id,), fetch_one=True)
        
        if not order:
            return False
        
        subject = f"Order Confirmed - {order['order_number']}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4CAF50;">Order Confirmed!</h1>
                <p>Hi {user_name},</p>
                <p>Your order has been confirmed and is being processed.</p>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3>Order Details:</h3>
                    <p><strong>Order Number:</strong> {order['order_number']}</p>
                    <p><strong>Date:</strong> {order['created_at'].strftime('%B %d, %Y')}</p>
                    <p><strong>Items:</strong> {order['item_count']}</p>
                    <p><strong>Total:</strong> ₹{order['total_amount']:.2f}</p>
                    <p><strong>Payment:</strong> {order['payment_method'].upper()}</p>
                </div>
                
                <p>We'll send you updates as your order progresses.</p>
                <p>Thank you for choosing {self.sender_name}!</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)
    
    def send_referral_reward_notification(self, user_email, user_name, amount=50):
        subject = f"You earned ₹{amount} referral reward!"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4CAF50;">🎉 Referral Reward Earned!</h1>
                <p>Hi {user_name},</p>
                <p>Great news! You've earned a referral reward.</p>
                
                <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <h2 style="color: #2e7d32; margin: 0;">₹{amount}</h2>
                    <p style="margin: 5px 0;">Added to your wallet</p>
                </div>
                
                <p>Someone you referred just made their first purchase! Keep sharing your referral code to earn more rewards.</p>
                <p>Thank you for spreading the word about {self.sender_name}!</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(user_email, subject, html_content)
    
    def send_low_stock_alert(self, admin_email, product_name, current_stock):
        subject = f"Low Stock Alert: {product_name}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f44336;">⚠️ Low Stock Alert</h1>
                <p>Product: <strong>{product_name}</strong></p>
                <p>Current Stock: <strong>{current_stock} units</strong></p>
                <p>Please restock this item soon to avoid stockouts.</p>
                <p>Time: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(admin_email, subject, html_content)

email_service = EmailService()