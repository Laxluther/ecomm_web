from shared.models import BaseModel, execute_query
import random
import string

class ReferralModel(BaseModel):
    @staticmethod
    def generate_code(user_id):
        base_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        code = f"REF{base_code}"
        
        execute_query("""
            INSERT INTO referral_codes (user_id, code, status, created_at)
            VALUES (%s, %s, 'active', %s)
        """, (user_id, code, ReferralModel.current_time()))
        
        return code
    
    @staticmethod
    def get_user_code(user_id):
        return execute_query("""
            SELECT code FROM referral_codes 
            WHERE user_id = %s AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        """, (user_id,), fetch_one=True)
    
    @staticmethod
    def get_referral_stats(user_id):
        return execute_query("""
            SELECT 
                COUNT(ru.id) as total_referrals,
                SUM(CASE WHEN ru.reward_given = 1 THEN 1 ELSE 0 END) as successful_referrals,
                SUM(CASE WHEN ru.reward_given = 1 THEN 50 ELSE 0 END) as total_earned
            FROM referral_codes rc
            LEFT JOIN referral_uses ru ON rc.id = ru.referral_code_id
            WHERE rc.user_id = %s AND rc.status = 'active'
        """, (user_id,), fetch_one=True)
    
    @staticmethod
    def get_referrals_list(user_id):
        return execute_query("""
            SELECT 
                u.first_name, u.last_name, u.email,
                ru.created_at as referred_date,
                ru.reward_given,
                ru.first_purchase_date
            FROM referral_codes rc
            JOIN referral_uses ru ON rc.id = ru.referral_code_id
            JOIN users u ON ru.referred_user_id = u.user_id
            WHERE rc.user_id = %s AND rc.status = 'active'
            ORDER BY ru.created_at DESC
        """, (user_id,), fetch_all=True)
    
    @staticmethod
    def process_first_purchase(user_id, order_amount):
        if order_amount < 500:
            return False
        
        referral_use = execute_query("""
            SELECT ru.*, rc.user_id as referrer_id
            FROM referral_uses ru
            JOIN referral_codes rc ON ru.referral_code_id = rc.id
            WHERE ru.referred_user_id = %s AND ru.reward_given = 0
        """, (user_id,), fetch_one=True)
        
        if not referral_use:
            return False
        
        execute_query("""
            UPDATE referral_uses 
            SET reward_given = 1, first_purchase_date = %s 
            WHERE id = %s
        """, (ReferralModel.current_time(), referral_use['id']))
        
        ReferralModel.add_wallet_reward(user_id, 50, "Referral signup bonus")
        ReferralModel.add_wallet_reward(referral_use['referrer_id'], 50, "Referral reward")
        
        return True
    
    @staticmethod
    def add_wallet_reward(user_id, amount, description):
        current_balance = execute_query("""
            SELECT balance FROM wallet WHERE user_id = %s
        """, (user_id,), fetch_one=True)
        
        if current_balance:
            new_balance = float(current_balance['balance']) + amount
            execute_query("""
                UPDATE wallet SET balance = %s, updated_at = %s 
                WHERE user_id = %s
            """, (new_balance, ReferralModel.current_time(), user_id))
        else:
            execute_query("""
                INSERT INTO wallet (user_id, balance, created_at)
                VALUES (%s, %s, %s)
            """, (user_id, amount, ReferralModel.current_time()))
            new_balance = amount
        
        transaction_id = ReferralModel.create_id()
        execute_query("""
            INSERT INTO wallet_transactions 
            (transaction_id, user_id, transaction_type, amount, balance_after, 
             description, reference_type, created_at)
            VALUES (%s, %s, 'credit', %s, %s, %s, 'referral', %s)
        """, (transaction_id, user_id, amount, new_balance, description, ReferralModel.current_time()))
    
    @staticmethod
    def validate_code(code):
        return execute_query("""
            SELECT rc.*, u.first_name, u.last_name
            FROM referral_codes rc
            JOIN users u ON rc.user_id = u.user_id
            WHERE rc.code = %s AND rc.status = 'active'
        """, (code,), fetch_one=True)
    
    @staticmethod
    def get_admin_stats():
        return execute_query("""
            SELECT 
                COUNT(DISTINCT rc.id) as total_codes,
                COUNT(ru.id) as total_uses,
                SUM(CASE WHEN ru.reward_given = 1 THEN 1 ELSE 0 END) as successful_referrals,
                SUM(CASE WHEN ru.reward_given = 1 THEN 100 ELSE 0 END) as total_rewards_paid
            FROM referral_codes rc
            LEFT JOIN referral_uses ru ON rc.id = ru.referral_code_id
            WHERE rc.status = 'active'
        """, fetch_one=True)
    
    @staticmethod
    def get_top_referrers(limit=10):
        return execute_query("""
            SELECT 
                u.first_name, u.last_name, u.email,
                COUNT(ru.id) as total_referrals,
                SUM(CASE WHEN ru.reward_given = 1 THEN 1 ELSE 0 END) as successful_referrals,
                SUM(CASE WHEN ru.reward_given = 1 THEN 50 ELSE 0 END) as total_earned,
                rc.code
            FROM referral_codes rc
            JOIN users u ON rc.user_id = u.user_id
            LEFT JOIN referral_uses ru ON rc.id = ru.referral_code_id
            WHERE rc.status = 'active'
            GROUP BY rc.user_id
            HAVING total_referrals > 0
            ORDER BY successful_referrals DESC, total_referrals DESC
            LIMIT %s
        """, (limit,), fetch_all=True)