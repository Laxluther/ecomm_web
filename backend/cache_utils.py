"""
Cache Utility Functions for E-Commerce API
Provides caching decorators, cache management, and monitoring utilities
"""

from flask import current_app
import functools
import time
import hashlib
import json
from datetime import datetime

def generate_cache_key(*args, **kwargs):
    """Generate a consistent cache key from arguments"""
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()

def timed_cache(timeout=300, key_prefix=''):
    """
    Decorator for caching function results with timing information
    
    Args:
        timeout (int): Cache timeout in seconds
        key_prefix (str): Prefix for cache key
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}{func.__name__}_{generate_cache_key(*args, **kwargs)}"
            
            # Try cache first
            start_time = time.time()
            cached_result = current_app.cache.get(cache_key)
            cache_lookup_time = time.time() - start_time
            
            if cached_result:
                return {
                    'data': cached_result,
                    'cached': True,
                    'cache_key': cache_key,
                    'cache_lookup_time': cache_lookup_time
                }
            
            # Execute function if not cached
            execution_start = time.time()
            result = func(*args, **kwargs)
            execution_time = time.time() - execution_start
            
            # Cache the result
            current_app.cache.set(cache_key, result, timeout=timeout)
            
            return {
                'data': result,
                'cached': False,
                'cache_key': cache_key,
                'execution_time': execution_time,
                'cache_lookup_time': cache_lookup_time
            }
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern):
    """
    Invalidate cache keys matching a pattern
    
    Args:
        pattern (str): Pattern to match cache keys
        
    Returns:
        int: Number of keys invalidated
    """
    try:
        import redis
        r = redis.Redis.from_url(current_app.config['CACHE_REDIS_URL'])
        
        # Get all keys matching the pattern
        cache_prefix = current_app.config.get('CACHE_KEY_PREFIX', 'flask_cache_')
        search_pattern = f"{cache_prefix}*{pattern}*"
        keys = r.keys(search_pattern)
        
        if keys:
            r.delete(*keys)
            print(f"Invalidated {len(keys)} cache keys matching pattern: {pattern}")
            return len(keys)
        return 0
    except Exception as e:
        print(f"Cache invalidation error: {e}")
        return 0

def invalidate_cache_keys(keys):
    """
    Invalidate specific cache keys
    
    Args:
        keys (list): List of cache keys to invalidate
        
    Returns:
        int: Number of keys invalidated
    """
    try:
        cache = current_app.cache
        invalidated = 0
        
        for key in keys:
            if cache.delete(key):
                invalidated += 1
        
        return invalidated
    except Exception as e:
        print(f"Cache invalidation error: {e}")
        return 0

def get_cache_stats():
    """
    Get comprehensive cache statistics
    
    Returns:
        dict: Cache statistics and health information
    """
    try:
        import redis
        r = redis.Redis.from_url(current_app.config['CACHE_REDIS_URL'])
        
        # Get Redis info
        info = r.info()
        
        # Get Flask cache keys
        cache_prefix = current_app.config.get('CACHE_KEY_PREFIX', 'flask_cache_')
        cache_keys = r.keys(f"{cache_prefix}*")
        
        # Calculate hit rate
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total_requests = hits + misses
        hit_rate = round((hits / total_requests * 100) if total_requests > 0 else 0, 2)
        
        # Get memory info
        used_memory = info.get('used_memory', 0)
        max_memory = info.get('maxmemory', 0)
        memory_usage_percent = round((used_memory / max_memory * 100) if max_memory > 0 else 0, 2)
        
        # Analyze cache keys by type
        key_analysis = analyze_cache_keys(cache_keys, r)
        
        stats = {
            'redis_info': {
                'version': info.get('redis_version'),
                'uptime_seconds': info.get('uptime_in_seconds'),
                'connected_clients': info.get('connected_clients'),
                'used_memory': info.get('used_memory_human'),
                'max_memory': info.get('maxmemory_human', 'Not set'),
                'memory_usage_percent': memory_usage_percent
            },
            'performance': {
                'total_commands': info.get('total_commands_processed'),
                'keyspace_hits': hits,
                'keyspace_misses': misses,
                'hit_rate_percent': hit_rate,
                'ops_per_second': info.get('instantaneous_ops_per_sec', 0)
            },
            'cache_keys': {
                'total_keys': len(cache_keys),
                'key_analysis': key_analysis
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return stats
    except Exception as e:
        return {
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def analyze_cache_keys(cache_keys, redis_client):
    """
    Analyze cache keys to provide insights
    
    Args:
        cache_keys (list): List of cache keys
        redis_client: Redis client instance
        
    Returns:
        dict: Analysis of cache keys
    """
    analysis = {
        'by_type': {},
        'expiring_soon': [],
        'large_keys': [],
        'old_keys': []
    }
    
    try:
        current_time = time.time()
        
        for key in cache_keys[:100]:  # Limit analysis to first 100 keys for performance
            key_str = key.decode() if isinstance(key, bytes) else key
            
            # Categorize by key pattern
            if 'product' in key_str:
                analysis['by_type']['products'] = analysis['by_type'].get('products', 0) + 1
            elif 'category' in key_str:
                analysis['by_type']['categories'] = analysis['by_type'].get('categories', 0) + 1
            elif 'user' in key_str:
                analysis['by_type']['users'] = analysis['by_type'].get('users', 0) + 1
            elif 'cart' in key_str:
                analysis['by_type']['cart'] = analysis['by_type'].get('cart', 0) + 1
            else:
                analysis['by_type']['other'] = analysis['by_type'].get('other', 0) + 1
            
            # Check TTL (time to live)
            ttl = redis_client.ttl(key)
            if 0 < ttl < 300:  # Expiring in next 5 minutes
                analysis['expiring_soon'].append({
                    'key': key_str,
                    'ttl_seconds': ttl
                })
            
            # Check key size
            try:
                key_size = redis_client.memory_usage(key)
                if key_size and key_size > 10000:  # Keys larger than 10KB
                    analysis['large_keys'].append({
                        'key': key_str,
                        'size_bytes': key_size
                    })
            except:
                pass  # memory_usage might not be available in all Redis versions
        
    except Exception as e:
        analysis['error'] = str(e)
    
    return analysis

def warm_cache():
    """
    Warm up cache with frequently accessed data
    Should be called during application startup or after cache clears
    """
    try:
        from models import ProductModel, execute_query
        
        print("🔥 Warming up cache...")
        
        # Warm featured products
        products = ProductModel.get_featured_products()
        current_app.cache.set('featured_products', products, timeout=600)
        print(f"   ✅ Cached {len(products)} featured products")
        
        # Warm categories
        categories = execute_query("""
            SELECT * FROM categories 
            WHERE status = 'active' 
            ORDER BY sort_order, category_name
        """, fetch_all=True)
        current_app.cache.set('active_categories', categories, timeout=3600)
        print(f"   ✅ Cached {len(categories)} categories")
        
        # Warm popular products (first 20 products)
        popular_products = execute_query("""
            SELECT p.*, c.category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.status = 'active'
            ORDER BY p.created_at DESC
            LIMIT 20
        """, fetch_all=True)
        
        for product in popular_products:
            cache_key = f'product_detail_{product["product_id"]}'
            # Cache individual products for 15 minutes
            current_app.cache.set(cache_key, product, timeout=900)
        
        print(f"   ✅ Cached {len(popular_products)} popular products")
        print("🔥 Cache warming completed!")
        
        return True
    except Exception as e:
        print(f"❌ Cache warming failed: {e}")
        return False

def clear_expired_cache():
    """
    Manually clear expired cache entries (Redis handles this automatically, 
    but this can be useful for monitoring)
    """
    try:
        import redis
        r = redis.Redis.from_url(current_app.config['CACHE_REDIS_URL'])
        
        # Get all cache keys
        cache_prefix = current_app.config.get('CACHE_KEY_PREFIX', 'flask_cache_')
        cache_keys = r.keys(f"{cache_prefix}*")
        
        expired_count = 0
        for key in cache_keys:
            ttl = r.ttl(key)
            if ttl == -2:  # Key doesn't exist (expired)
                expired_count += 1
        
        return expired_count
    except Exception as e:
        print(f"Error checking expired cache: {e}")
        return 0

def cache_health_check():
    """
    Perform a health check on the cache system
    
    Returns:
        dict: Health check results
    """
    health = {
        'status': 'unknown',
        'redis_connected': False,
        'cache_working': False,
        'response_time_ms': None,
        'errors': []
    }
    
    try:
        import redis
        
        # Test Redis connection
        start_time = time.time()
        r = redis.Redis.from_url(current_app.config['CACHE_REDIS_URL'])
        
        # Test basic operations
        test_key = 'health_check_test'
        test_value = 'test_value'
        
        # Test SET
        r.set(test_key, test_value, ex=60)
        
        # Test GET
        retrieved_value = r.get(test_key)
        
        # Test DELETE
        r.delete(test_key)
        
        response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        if retrieved_value and retrieved_value.decode() == test_value:
            health.update({
                'status': 'healthy',
                'redis_connected': True,
                'cache_working': True,
                'response_time_ms': round(response_time, 2)
            })
        else:
            health['errors'].append('Cache read/write test failed')
            
    except Exception as e:
        health['errors'].append(str(e))
    
    # Determine overall status
    if health['redis_connected'] and health['cache_working']:
        health['status'] = 'healthy'
    elif health['redis_connected']:
        health['status'] = 'degraded'
    else:
        health['status'] = 'unhealthy'
    
    return health

# Context manager for cache operations
class CacheContext:
    """Context manager for cache operations with automatic cleanup"""
    
    def __init__(self, cache_keys=None):
        self.cache_keys = cache_keys or []
        self.temp_keys = []
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Clean up temporary cache keys
        if self.temp_keys:
            invalidate_cache_keys(self.temp_keys)
    
    def add_temp_key(self, key):
        """Add a temporary cache key that will be cleaned up"""
        self.temp_keys.append(key)
    
    def cache_set(self, key, value, timeout=300):
        """Set cache value and track the key"""
        current_app.cache.set(key, value, timeout=timeout)
        self.add_temp_key(key)

# Decorators for cache invalidation
def invalidate_on_change(patterns):
    """
    Decorator to invalidate cache patterns when a function is called
    Used for functions that modify data
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalidate cache patterns after successful execution
            for pattern in patterns:
                invalidate_cache_pattern(pattern)
            
            return result
        return wrapper
    return decorator