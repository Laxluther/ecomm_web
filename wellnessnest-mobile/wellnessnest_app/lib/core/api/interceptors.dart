import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/constants.dart';

// Authentication Interceptor
class AuthInterceptor extends Interceptor {
  static const _storage = FlutterSecureStorage();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    try {
      final token = await _storage.read(key: AppConstants.tokenKey);
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    } catch (e) {
      // Handle token retrieval error
      print('Error retrieving token: $e');
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      try {
        // Try to refresh token
        final refreshed = await _refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          final newToken = await _storage.read(key: AppConstants.tokenKey);
          err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
          
          final dio = Dio();
          final response = await dio.fetch(err.requestOptions);
          handler.resolve(response);
          return;
        } else {
          // Clear tokens and redirect to login
          await _clearAuthData();
        }
      } catch (e) {
        await _clearAuthData();
      }
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: AppConstants.refreshTokenKey);
      if (refreshToken == null) return false;

      final dio = Dio();
      final response = await dio.post(
        '${AppConstants.baseUrl}/auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      if (response.statusCode == 200) {
        final newToken = response.data['access_token'];
        final newRefreshToken = response.data['refresh_token'];
        
        await _storage.write(key: AppConstants.tokenKey, value: newToken);
        await _storage.write(key: AppConstants.refreshTokenKey, value: newRefreshToken);
        
        return true;
      }
    } catch (e) {
      print('Token refresh failed: $e');
    }
    return false;
  }

  Future<void> _clearAuthData() async {
    await _storage.delete(key: AppConstants.tokenKey);
    await _storage.delete(key: AppConstants.refreshTokenKey);
    await _storage.delete(key: AppConstants.userDataKey);
  }
}

// Retry Interceptor
class RetryInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (_shouldRetry(err)) {
      final options = err.requestOptions;
      final retryCount = options.extra['retry_count'] ?? 0;
      
      if (retryCount < AppConstants.maxRetryAttempts) {
        options.extra['retry_count'] = retryCount + 1;
        
        // Wait before retry
        await Future.delayed(Duration(milliseconds: (AppConstants.retryDelay * (retryCount + 1)) as int));
        
        try {
          final dio = Dio();
          final response = await dio.fetch(options);
          handler.resolve(response);
          return;
        } catch (e) {
          // Continue to next retry or fail
        }
      }
    }
    handler.next(err);
  }

  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.sendTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           err.type == DioExceptionType.connectionError ||
           (err.response?.statusCode != null && err.response!.statusCode! >= 500);
  }
}

// Cache Interceptor
class CacheInterceptor extends Interceptor {
  static final Map<String, CachedResponse> _cache = {};

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Only cache GET requests
    if (options.method.toUpperCase() == 'GET') {
      final cacheKey = _getCacheKey(options);
      final cachedResponse = _cache[cacheKey];
      
      if (cachedResponse != null && !cachedResponse.isExpired()) {
        handler.resolve(cachedResponse.response);
        return;
      }
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    // Cache successful GET responses
    if (response.requestOptions.method.toUpperCase() == 'GET' && 
        response.statusCode == 200) {
      final cacheKey = _getCacheKey(response.requestOptions);
      final cacheDuration = _getCacheDuration(response.requestOptions.path);
      
      _cache[cacheKey] = CachedResponse(
        response: response,
        timestamp: DateTime.now(),
        duration: cacheDuration,
      );
    }
    handler.next(response);
  }

  String _getCacheKey(RequestOptions options) {
    return '${options.method}_${options.path}_${options.queryParameters.toString()}';
  }

  Duration _getCacheDuration(String path) {
    // Different cache durations based on endpoint
    if (path.contains('products') || path.contains('categories')) {
      return Duration(hours: AppConstants.dataCacheDuration);
    } else if (path.contains('user') || path.contains('cart')) {
      return const Duration(minutes: 5);
    }
    return const Duration(minutes: 15);
  }

  static void clearCache() {
    _cache.clear();
  }

  static void clearCacheForPath(String path) {
    _cache.removeWhere((key, value) => key.contains(path));
  }
}

class CachedResponse {
  final Response response;
  final DateTime timestamp;
  final Duration duration;

  CachedResponse({
    required this.response,
    required this.timestamp,
    required this.duration,
  });

  bool isExpired() {
    return DateTime.now().difference(timestamp) > duration;
  }
}

// Error Interceptor
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Log error details
    print('=== API Error ===');
    print('URL: ${err.requestOptions.uri}');
    print('Method: ${err.requestOptions.method}');
    print('Status Code: ${err.response?.statusCode}');
    print('Error Type: ${err.type}');
    print('Error Message: ${err.message}');
    if (err.response?.data != null) {
      print('Response Data: ${err.response?.data}');
    }
    print('================');

    // Handle specific error types
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        _showErrorMessage('Connection timeout. Please try again.');
        break;
      case DioExceptionType.connectionError:
        _showErrorMessage('No internet connection. Please check your network.');
        break;
      case DioExceptionType.badResponse:
        final statusCode = err.response?.statusCode;
        final message = err.response?.data?['message'] ?? 'Unknown error occurred';
        
        switch (statusCode) {
          case 400:
            _showErrorMessage('Bad request: $message');
            break;
          case 401:
            _showErrorMessage('Authentication failed. Please login again.');
            break;
          case 403:
            _showErrorMessage('Access forbidden.');
            break;
          case 404:
            _showErrorMessage('Resource not found.');
            break;
          case 422:
            _showErrorMessage('Validation error: $message');
            break;
          case 500:
            _showErrorMessage('Server error. Please try again later.');
            break;
          default:
            _showErrorMessage(message);
        }
        break;
      case DioExceptionType.cancel:
        _showErrorMessage('Request was cancelled.');
        break;
      case DioExceptionType.unknown:
        _showErrorMessage('An unexpected error occurred.');
        break;
      default:
        _showErrorMessage('Something went wrong. Please try again.');
    }

    handler.next(err);
  }

  void _showErrorMessage(String message) {
    // In a real app, you might want to show a snackbar or toast
    // For now, we'll just print the message
    print('Error Message: $message');
    
    // You can implement a global error handler here
    // For example, using a global key for scaffold messenger
    // or a notification service
  }
}

// Network Connectivity Interceptor
class ConnectivityInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final isConnected = await _checkConnectivity();
    if (!isConnected) {
      handler.reject(
        DioException(
          requestOptions: options,
          type: DioExceptionType.connectionError,
          message: 'No internet connection',
        ),
      );
      return;
    }
    handler.next(options);
  }

  Future<bool> _checkConnectivity() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } on SocketException catch (_) {
      return false;
    }
  }
}

// Request/Response Logging Interceptor (Custom)
class CustomLogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('🚀 REQUEST: ${options.method} ${options.uri}');
    print('Headers: ${options.headers}');
    if (options.data != null) {
      print('Data: ${options.data}');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print('✅ RESPONSE: ${response.statusCode} ${response.requestOptions.uri}');
    print('Data: ${response.data}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print('❌ ERROR: ${err.message}');
    print('URL: ${err.requestOptions.uri}');
    if (err.response != null) {
      print('Status: ${err.response?.statusCode}');
      print('Data: ${err.response?.data}');
    }
    handler.next(err);
  }
}

// Rate Limiting Interceptor
class RateLimitInterceptor extends Interceptor {
  final Map<String, DateTime> _lastRequestTimes = {};
  final Duration _minInterval = const Duration(milliseconds: 100);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final key = '${options.method}_${options.path}';
    final now = DateTime.now();
    final lastRequest = _lastRequestTimes[key];

    if (lastRequest != null) {
      final timeSinceLastRequest = now.difference(lastRequest);
      if (timeSinceLastRequest < _minInterval) {
        final waitTime = _minInterval - timeSinceLastRequest;
        await Future.delayed(waitTime);
      }
    }

    _lastRequestTimes[key] = DateTime.now();
    handler.next(options);
  }
}