from flask import current_app
import functools
import time
import hashlib
from datetime import datetime

class CacheService:
    @staticmethod
    def generate_key(*args, **kwargs):
        key_data = str(args) + str(sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()
    
    @staticmethod
    def timed_cache(timeout=300, key_prefix=''):
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = f"{key_prefix}{func.__name__}_{CacheService.generate_key(*args, **kwargs)}"
                
                start_time = time.time()
                cached_result = current_app.cache.get(cache_key)
                cache_time = time.time() - start_time
                
                if cached_result:
                    return {
                        'data': cached_result,
                        'cached': True,
                        'cache_key': cache_key,
                        'cache_time': cache_time
                    }
                
                exec_start = time.time()
                result = func(*args, **kwargs)
                exec_time = time.time() - exec_start
                
                current_app.cache.set(cache_key, result, timeout=timeout)
                
                return {
                    'data': result,
                    'cached': False,
                    'cache_key': cache_key,
                    'execution_time': exec_time,
                    'cache_time': cache_time
                }
            return wrapper
        return decorator
    
    @staticmethod
    def invalidate_pattern(pattern):
        import redis
        r = redis.Redis.from_url(current_app.config['CACHE_REDIS_URL'])
        
        cache_prefix = current_app.config.get('CACHE_KEY_PREFIX', 'ecommerce_v2_')
        search_pattern = f"{cache_prefix}*{pattern}*"
        keys = r.keys(search_pattern)
        
        if keys:
            r.delete(*keys)
            return len(keys)
        return 0
    
    @staticmethod
    def invalidate_keys(keys):
        cache = current_app.cache
        invalidated = 0
        
        for key in keys:
            if cache.delete(key):
                invalidated += 1
        
        return invalidated
    
    @staticmethod
    def get_stats():
        import redis
        r = redis.Redis.from_url(current_app.config['CACHE_REDIS_URL'])
        
        info = r.info()
        cache_prefix = current_app.config.get('CACHE_KEY_PREFIX', 'ecommerce_v2_')
        cache_keys = r.keys(f"{cache_prefix}*")
        
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total_requests = hits + misses
        hit_rate = round((hits / total_requests * 100) if total_requests > 0 else 0, 2)
        
        return {
            'redis_version': info.get('redis_version'),
            'used_memory': info.get('used_memory_human'),
            'connected_clients': info.get('connected_clients'),
            'total_commands': info.get('total_commands_processed'),
            'keyspace_hits': hits,
            'keyspace_misses': misses,
            'hit_rate_percent': hit_rate,
            'cache_keys_count': len(cache_keys),
            'timestamp': datetime.now().isoformat()
        }
    
    @staticmethod
    def clear_all():
        current_app.cache.clear()
        return True
    
    @staticmethod
    def clear_products():
        patterns = ['featured_products', 'user_products', 'product_detail', 'user_categories']
        cleared = 0
        for pattern in patterns:
            cleared += CacheService.invalidate_pattern(pattern)
        return cleared
    
    @staticmethod
    def warm_cache():
        from shared.models import ProductModel
        
        products = ProductModel.get_featured()
        current_app.cache.set('user_featured_products', products, timeout=600)
        
        categories = ProductModel.execute_query("""
            SELECT * FROM categories 
            WHERE status = 'active' 
            ORDER BY sort_order, category_name
        """, fetch_all=True)
        current_app.cache.set('user_categories', categories, timeout=3600)
        
        return len(products) + len(categories)
    
    @staticmethod
    def health_check():
        import redis
        
        health = {
            'status': 'unknown',
            'redis_connected': False,
            'cache_working': False,
            'response_time_ms': None
        }
        
        start_time = time.time()
        r = redis.Redis.from_url(current_app.config['CACHE_REDIS_URL'])
        
        test_key = 'health_check_test'
        test_value = 'test_value'
        
        r.set(test_key, test_value, ex=60)
        retrieved_value = r.get(test_key)
        r.delete(test_key)
        
        response_time = (time.time() - start_time) * 1000
        
        if retrieved_value and retrieved_value.decode() == test_value:
            health.update({
                'status': 'healthy',
                'redis_connected': True,
                'cache_working': True,
                'response_time_ms': round(response_time, 2)
            })
        
        return health

def invalidate_product_cache(product_id=None):
    cache = current_app.cache
    cache.delete('user_featured_products')
    cache.delete('user_categories')
    
    if product_id:
        cache.delete(f'user_product_detail_{product_id}')
    
    CacheService.invalidate_pattern('user_products')
    return True

cache_service = CacheService()