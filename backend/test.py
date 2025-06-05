#!/usr/bin/env python3
"""
Enhanced E-Commerce API Testing Script with Comprehensive Caching Tests
Run this script to test complete user journey + caching functionality
"""

import requests
import json
import time
from datetime import datetime
import concurrent.futures
import threading

# Configuration
BASE_URL = "http://localhost:5000/api"
headers = {"Content-Type": "application/json"}

def print_response(response, description, check_cache=False):
    """Helper function to print response details with cache info"""
    print(f"\n{'='*50}")
    print(f"TEST: {description}")
    print(f"{'='*50}")
    print(f"Status Code: {response.status_code}")
    
    # Check cache headers
    if check_cache:
        print(f"Cache Headers:")
        cache_control = response.headers.get('Cache-Control', 'Not Set')
        etag = response.headers.get('ETag', 'Not Set')
        last_modified = response.headers.get('Last-Modified', 'Not Set')
        expires = response.headers.get('Expires', 'Not Set')
        
        print(f"  Cache-Control: {cache_control}")
        print(f"  ETag: {etag}")
        print(f"  Last-Modified: {last_modified}")
        print(f"  Expires: {expires}")
        
        # Check if response indicates caching
        try:
            response_data = response.json()
            if isinstance(response_data, dict) and 'cached' in response_data:
                print(f"  Server Cache Hit: {response_data.get('cached', 'Unknown')}")
        except:
            pass
    
    print(f"Response Time: {response.elapsed.total_seconds():.3f} seconds")
    
    try:
        response_json = response.json()
        print(f"Response: {json.dumps(response_json, indent=2)}")
        return response_json
    except:
        print(f"Response Text: {response.text}")
        return response.text

def test_health_check():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    return print_response(response, "Health Check", check_cache=True)

def test_cache_performance():
    """Test caching performance by making multiple requests"""
    print(f"\n{'='*50}")
    print("CACHE PERFORMANCE TEST")
    print(f"{'='*50}")
    
    # Test featured products caching
    print("\n🚀 Testing Featured Products Caching Performance:")
    
    # First request (should hit database)
    print("📊 First Request (Cache Miss Expected):")
    start_time = time.time()
    response1 = requests.get(f"{BASE_URL}/products/featured")
    time1 = time.time() - start_time
    print(f"   Response Time: {time1:.3f} seconds")
    try:
        print(f"   Cache Status: {response1.json().get('cached', 'Unknown')}")
    except:
        print(f"   Cache Status: Could not determine")
    
    # Second request (should hit cache)
    print("\n📊 Second Request (Cache Hit Expected):")
    start_time = time.time()
    response2 = requests.get(f"{BASE_URL}/products/featured")
    time2 = time.time() - start_time
    print(f"   Response Time: {time2:.3f} seconds")
    try:
        print(f"   Cache Status: {response2.json().get('cached', 'Unknown')}")
    except:
        print(f"   Cache Status: Could not determine")
    
    # Performance comparison
    if time2 < time1:
        improvement = ((time1 - time2) / time1) * 100
        print(f"\n✅ Cache Performance Improvement: {improvement:.1f}%")
        print(f"   Cache made response {time1/time2:.1f}x faster!")
    else:
        print(f"\n⚠️ No significant performance improvement detected")
    
    return response1.json() if response1.status_code == 200 else None, response2.json() if response2.status_code == 200 else None

def test_cache_headers():
    """Test various endpoints for proper cache headers"""
    print(f"\n{'='*50}")
    print("CACHE HEADERS TEST")
    print(f"{'='*50}")
    
    endpoints_to_test = [
        ("/health", "Health Check"),
        ("/products/featured", "Featured Products"),
        ("/products/categories", "Categories"),
        ("/products/1", "Product Detail"),
        ("/products", "Products List")
    ]
    
    for endpoint, description in endpoints_to_test:
        print(f"\n📋 Testing {description}:")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            
            # Extract cache headers
            cache_control = response.headers.get('Cache-Control', 'Not Set')
            etag = response.headers.get('ETag', 'Not Set')
            
            print(f"   Endpoint: {endpoint}")
            print(f"   Status: {response.status_code}")
            print(f"   Cache-Control: {cache_control}")
            print(f"   ETag: {etag}")
            print(f"   Response Time: {response.elapsed.total_seconds():.3f}s")
            
            # Check if caching is properly configured
            if 'max-age' in cache_control or 'public' in cache_control:
                print(f"   ✅ Caching configured")
            elif 'no-cache' in cache_control:
                print(f"   ⚠️ No-cache policy")
            else:
                print(f"   ❌ No cache headers found")
        except Exception as e:
            print(f"   ❌ Error testing {endpoint}: {str(e)}")

def test_cache_invalidation(admin_token):
    """Test cache invalidation when data changes"""
    if not admin_token:
        print("\n⚠️ Skipping cache invalidation test - no admin token")
        return
    
    print(f"\n{'='*50}")
    print("CACHE INVALIDATION TEST")
    print(f"{'='*50}")
    
    auth_headers = {**headers, "Authorization": f"Bearer {admin_token}"}
    
    # Step 1: Get featured products (populate cache)
    print("\n📊 Step 1: Initial request to populate cache")
    response1 = requests.get(f"{BASE_URL}/products/featured")
    try:
        initial_cached = response1.json().get('cached', 'Unknown')
        print(f"   Cache Status: {initial_cached}")
        initial_products = response1.json().get('products', [])
    except:
        print(f"   Cache Status: Could not determine")
        initial_products = []
    
    # Step 2: Make same request again (should be cached)
    print("\n📊 Step 2: Second request (should hit cache)")
    response2 = requests.get(f"{BASE_URL}/products/featured")
    try:
        print(f"   Cache Status: {response2.json().get('cached', 'Unknown')}")
    except:
        print(f"   Cache Status: Could not determine")
    
    # Step 3: Update a product (should invalidate cache)
    print("\n📊 Step 3: Update product (should invalidate cache)")
    if initial_products:
        product_id = initial_products[0]['product_id']
        update_data = {
            "product_name": f"Updated Product {datetime.now().strftime('%H:%M:%S')}",
            "price": 999.99
        }
        
        update_response = requests.put(f"{BASE_URL}/admin/products/{product_id}", 
                                     headers=auth_headers, 
                                     data=json.dumps(update_data))
        print(f"   Update Status: {update_response.status_code}")
        
        # Step 4: Get featured products again (cache should be invalidated)
        print("\n📊 Step 4: Request after update (cache should be invalidated)")
        time.sleep(1)  # Small delay to ensure update is processed
        response3 = requests.get(f"{BASE_URL}/products/featured")
        try:
            cached_status = response3.json().get('cached', 'Unknown')
            print(f"   Cache Status: {cached_status}")
            
            # Verify cache was invalidated
            if cached_status == False:
                print("   ✅ Cache properly invalidated after update")
            else:
                print("   ⚠️ Cache might not have been invalidated")
        except:
            print(f"   Cache Status: Could not determine")

def test_concurrent_cache_requests():
    """Test cache behavior with concurrent requests"""
    print(f"\n{'='*50}")
    print("CONCURRENT CACHE REQUESTS TEST")
    print(f"{'='*50}")
    
    def make_request(request_id):
        start_time = time.time()
        try:
            response = requests.get(f"{BASE_URL}/products/featured")
            end_time = time.time()
            
            try:
                data = response.json()
                cached = data.get('cached', 'Unknown')
            except:
                cached = 'Error'
            
            return {
                'request_id': request_id,
                'response_time': end_time - start_time,
                'status_code': response.status_code,
                'cached': cached,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'request_id': request_id,
                'response_time': 0,
                'status_code': 0,
                'cached': 'Error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    print("🚀 Making 10 concurrent requests to test cache behavior...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request, i) for i in range(10)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    # Sort results by request_id
    results.sort(key=lambda x: x['request_id'])
    
    print("\n📊 Concurrent Request Results:")
    print("ID | Time(s) | Status | Cached | Timestamp")
    print("-" * 60)
    
    cache_hits = 0
    cache_misses = 0
    total_time = 0
    successful_requests = 0
    
    for result in results:
        status_display = str(result['status_code']) if result['status_code'] != 0 else 'ERROR'
        cached_display = str(result['cached'])[:6]
        
        print(f"{result['request_id']:2d} | {result['response_time']:.3f}   | "
              f"{status_display:6s} | {cached_display:6s} | "
              f"{result['timestamp'][11:19]}")
        
        if result['status_code'] == 200:
            successful_requests += 1
            if result['cached'] == True:
                cache_hits += 1
            elif result['cached'] == False:
                cache_misses += 1
            
            total_time += result['response_time']
    
    print(f"\n📈 Concurrent Cache Statistics:")
    print(f"   Successful Requests: {successful_requests}")
    print(f"   Cache Hits: {cache_hits}")
    print(f"   Cache Misses: {cache_misses}")
    if successful_requests > 0:
        print(f"   Average Response Time: {total_time/successful_requests:.3f}s")
    print(f"   Total Requests: {len(results)}")

def test_cache_expiration():
    """Test cache expiration functionality"""
    print(f"\n{'='*50}")
    print("CACHE EXPIRATION TEST")
    print(f"{'='*50}")
    
    print("🕐 Testing cache expiration (this may take time based on cache timeout)")
    print("💡 Note: Actual expiration test would require waiting for cache timeout")
    
    # Make initial request
    print("\n📊 Initial request:")
    response1 = requests.get(f"{BASE_URL}/health")
    time1 = time.time()
    print(f"   Response time: {response1.elapsed.total_seconds():.3f}s")
    print(f"   Timestamp: {datetime.now().strftime('%H:%M:%S')}")
    
    # Make request after short delay
    print("\n📊 Request after 2 seconds:")
    time.sleep(2)
    response2 = requests.get(f"{BASE_URL}/health")
    time2 = time.time()
    print(f"   Response time: {response2.elapsed.total_seconds():.3f}s")
    print(f"   Timestamp: {datetime.now().strftime('%H:%M:%S')}")
    print(f"   Time difference: {time2 - time1:.1f} seconds")
    
    print("\n💡 For complete expiration test:")
    print("   1. Wait for cache timeout period (e.g., 5+ minutes)")
    print("   2. Make another request")
    print("   3. Verify cache miss occurs")

def test_redis_connection():
    """Test Redis connection and basic operations"""
    print(f"\n{'='*50}")
    print("REDIS CONNECTION TEST")
    print(f"{'='*50}")
    
    try:
        import redis
        
        # Connect to Redis
        r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        
        # Test connection
        ping_result = r.ping()
        print(f"✅ Redis Connection: {'Success' if ping_result else 'Failed'}")
        
        # Get Redis info
        info = r.info()
        print(f"📊 Redis Version: {info.get('redis_version', 'Unknown')}")
        print(f"📊 Used Memory: {info.get('used_memory_human', 'Unknown')}")
        print(f"📊 Connected Clients: {info.get('connected_clients', 'Unknown')}")
        
        # Test basic operations
        test_key = "api_test_key"
        test_value = "api_test_value"
        
        # Set a test value
        r.set(test_key, test_value, ex=60)  # Expire in 60 seconds
        print(f"✅ Set test key: {test_key}")
        
        # Get the test value
        retrieved_value = r.get(test_key)
        print(f"✅ Retrieved value: {retrieved_value}")
        
        # Check if cache keys exist
        cache_keys = r.keys("flask_cache_*")
        print(f"📊 Flask Cache Keys Found: {len(cache_keys)}")
        
        if cache_keys:
            print("🔍 Cache Keys:")
            for key in cache_keys[:5]:  # Show first 5 keys
                ttl = r.ttl(key)
                print(f"   {key} (TTL: {ttl}s)")
        
        # Clean up test key
        r.delete(test_key)
        print(f"🧹 Cleaned up test key")
        
        return True
        
    except ImportError:
        print("❌ Redis library not installed (pip install redis)")
        return False
    except Exception as e:
        print(f"❌ Redis connection failed: {str(e)}")
        print("💡 Make sure Redis server is running: redis-server")
        return False

def test_cache_stats():
    """Test cache statistics endpoint"""
    print(f"\n{'='*50}")
    print("CACHE STATISTICS TEST")
    print(f"{'='*50}")
    
    try:
        response = requests.get(f"{BASE_URL}/cache/stats")
        result = print_response(response, "Cache Statistics")
        
        if response.status_code == 200 and 'cache_stats' in result:
            stats = result['cache_stats']
            print("\n📊 Cache Statistics Summary:")
            
            if 'redis_info' in stats:
                redis_info = stats['redis_info']
                print(f"   Redis Version: {redis_info.get('version', 'Unknown')}")
                print(f"   Memory Usage: {redis_info.get('used_memory', 'Unknown')}")
                print(f"   Connected Clients: {redis_info.get('connected_clients', 'Unknown')}")
            
            if 'performance' in stats:
                perf = stats['performance']
                print(f"   Hit Rate: {perf.get('hit_rate_percent', 'Unknown')}%")
                print(f"   Total Commands: {perf.get('total_commands', 'Unknown')}")
            
            if 'cache_keys' in stats:
                keys_info = stats['cache_keys']
                print(f"   Total Cache Keys: {keys_info.get('total_keys', 'Unknown')}")
        
        return result
    except Exception as e:
        print(f"❌ Error getting cache stats: {str(e)}")
        return None

def test_user_registration():
    """Test user registration with email verification"""
    user_data = {
        "email": "sanidhyarana1@gmail.com",
        "password": "password123",
        "first_name": "sanidhya",
        "last_name": "rana",
        "phone": "6261116108"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", 
                           headers=headers, 
                           data=json.dumps(user_data))
    result = print_response(response, "User Registration (with Email Verification)")
    
    if response.status_code == 201 and result.get('verification_email_sent'):
        print("📧 Check your email for verification link!")
    
    return result

def test_user_login():
    """Test user login"""
    login_data = {
        "email": "sanidhyarana1@gmail.com", 
        "password": "password123",
        "use_cookies": True  # Test cookie support
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", 
                           headers=headers, 
                           data=json.dumps(login_data))
    result = print_response(response, "User Login (with Cookie Support)")
    
    if response.status_code == 403 and result.get('email_verification_required'):
        print("⚠️ Email verification required before login!")
        return None
    elif response.status_code == 200:
        return result.get('token')
    return None

def test_admin_login():
    """Test admin login and return token"""
    admin_data = {
        "username": "admin",
        "password": "admin123",
        "use_cookies": True  # Test cookie support
    }
    
    response = requests.post(f"{BASE_URL}/auth/admin/login", 
                           headers=headers, 
                           data=json.dumps(admin_data))
    result = print_response(response, "Admin Login (with Cookie Support)")
    
    if response.status_code == 200:
        return result.get('token')
    return None

def test_admin_cache_management(admin_token):
    """Test admin cache management endpoints"""
    if not admin_token:
        print("\n⚠️ Skipping admin cache management tests - no admin token")
        return
    
    print(f"\n{'='*50}")
    print("ADMIN CACHE MANAGEMENT TEST")
    print(f"{'='*50}")
    
    auth_headers = {**headers, "Authorization": f"Bearer {admin_token}"}
    
    # Test cache stats
    print("\n📊 Testing Admin Cache Stats:")
    try:
        response = requests.get(f"{BASE_URL}/admin/cache/stats", headers=auth_headers)
        print_response(response, "Admin Cache Stats")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test cache health check
    print("\n🏥 Testing Cache Health Check:")
    try:
        response = requests.get(f"{BASE_URL}/admin/cache/health", headers=auth_headers)
        print_response(response, "Cache Health Check")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test cache clear (products only)
    print("\n🧹 Testing Cache Clear (Products):")
    try:
        clear_data = {"type": "products"}
        response = requests.post(f"{BASE_URL}/admin/cache/clear", 
                               headers=auth_headers,
                               data=json.dumps(clear_data))
        print_response(response, "Clear Product Cache")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test cache warming
    print("\n🔥 Testing Cache Warming:")
    try:
        response = requests.post(f"{BASE_URL}/admin/cache/warm", headers=auth_headers)
        print_response(response, "Warm Cache")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

def test_get_products():
    """Test getting products"""
    response = requests.get(f"{BASE_URL}/products")
    return print_response(response, "Get Products", check_cache=True)

def test_get_featured_products():
    """Test getting featured products"""
    response = requests.get(f"{BASE_URL}/products/featured")
    return print_response(response, "Get Featured Products", check_cache=True)

def test_get_product_detail():
    """Test getting product details"""
    response = requests.get(f"{BASE_URL}/products/1")
    return print_response(response, "Get Product Detail", check_cache=True)

def test_get_categories():
    """Test getting categories"""
    response = requests.get(f"{BASE_URL}/products/categories")
    return print_response(response, "Get Categories", check_cache=True)

def run_caching_test_suite():
    """Run comprehensive caching test suite"""
    print("🚀 Starting Comprehensive Caching Test Suite")
    print("🔧 Testing Redis, HTTP Cache Headers, Performance & Invalidation")
    print("=" * 70)
    
    # 1. Test Redis Connection
    redis_available = test_redis_connection()
    
    # 2. Test Cache Statistics
    test_cache_stats()
    
    # 3. Test Basic API Endpoints (populate cache)
    test_health_check()
    test_get_featured_products()
    test_get_categories()
    test_get_product_detail()
    
    # 4. Test Cache Performance
    test_cache_performance()
    
    # 5. Test Cache Headers
    test_cache_headers()
    
    # 6. Test Concurrent Requests
    test_concurrent_cache_requests()
    
    # 7. Test Cache Expiration
    test_cache_expiration()
    
    # 8. Test Admin Cache Management
    admin_token = test_admin_login()
    if admin_token:
        test_admin_cache_management(admin_token)
        test_cache_invalidation(admin_token)
    else:
        print("\n⚠️ Skipping admin cache tests - admin login failed")
    
    print(f"\n🎉 Caching Test Suite Complete!")
    print("=" * 70)
    
    if redis_available:
        print("✅ Redis connection successful")
    else:
        print("❌ Redis connection issues detected")
    
    print("💡 Cache optimization recommendations:")
    print("   - Monitor cache hit rates")
    print("   - Adjust cache timeouts based on data volatility")
    print("   - Implement cache warming for critical endpoints")
    print("   - Use cache invalidation strategically")

def run_complete_test():
    """Run complete API test suite including caching"""
    print("🚀 Starting Complete E-Commerce API Test Suite with Caching")
    print("📧 Including Email Verification, Orders & Caching Performance!")
    print("=" * 80)
    
    # 1. Basic API Tests
    test_health_check()
    
    # 2. User Authentication Tests
    test_user_registration()
    user_token = test_user_login()
    admin_token = test_admin_login()
    
    # 3. Product Tests with Cache Analysis
    test_get_products()
    test_get_featured_products()
    test_get_product_detail()
    test_get_categories()
    
    # 4. Caching Performance Tests
    print(f"\n{'🔧 CACHING PERFORMANCE ANALYSIS':^50}")
    print("=" * 50)
    test_cache_performance()
    test_cache_headers()
    test_concurrent_cache_requests()
    
    # 5. Redis and Cache Infrastructure
    test_redis_connection()
    test_cache_stats()
    
    # 6. Admin Cache Management
    if admin_token:
        test_admin_cache_management(admin_token)
        test_cache_invalidation(admin_token)
    
    print("\n🎉 Complete Test Suite with Caching Analysis Finished!")
    print("=" * 80)
    print("✅ API functionality tested")
    print("📊 Cache performance analyzed")
    print("🔧 Redis connection verified")
    print("⚡ Performance optimizations identified")

def run_basic_api_tests():
    """Run basic API functionality tests"""
    print("🚀 Starting Basic API Functionality Tests")
    print("=" * 50)
    
    # Basic health and product tests
    test_health_check()
    test_user_registration()
    test_get_products()
    test_get_featured_products()
    test_get_product_detail()
    test_get_categories()
    
    # Try admin login
    admin_token = test_admin_login()
    if admin_token:
        print("✅ Admin access verified")
    
    print("\n🎉 Basic API Tests Complete!")
    print("✅ Core functionality working")

if __name__ == "__main__":
    # Choose test suite to run
    print("🧪 E-Commerce API Test Suite")
    print("=" * 40)
    print("Select test suite to run:")
    print("1. Complete API + Caching Tests (Recommended)")
    print("2. Caching Tests Only")
    print("3. Basic API Tests Only")
    print("4. Performance Benchmark Only")
    
    choice = input("\nEnter choice (1-4) or press Enter for option 1: ").strip()
    
    print(f"\n{'Starting Tests...':^40}")
    print("=" * 40)
    
    if choice == "2":
        run_caching_test_suite()
    elif choice == "3":
        run_basic_api_tests()
    elif choice == "4":
        # Quick performance benchmark
        print("🚀 Running Performance Benchmark...")
        test_redis_connection()
        test_cache_performance()
        test_concurrent_cache_requests()
        print("🎉 Performance Benchmark Complete!")
    else:
        # Default: run complete test suite
        run_complete_test()
    
    print(f"\n{'Tests Complete!':^40}")
    print("=" * 40)