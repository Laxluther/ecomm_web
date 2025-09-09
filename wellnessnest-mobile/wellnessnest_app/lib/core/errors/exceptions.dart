// Base Exception Class
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic data;

  const AppException({
    required this.message,
    this.code,
    this.data,
  });

  @override
  String toString() => 'AppException: $message';
}

// Network Related Exceptions
class NetworkException extends AppException {
  const NetworkException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'NetworkException: $message';
}

class TimeoutException extends AppException {
  const TimeoutException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'TimeoutException: $message';
}

class NoInternetException extends AppException {
  const NoInternetException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'NoInternetException: $message';
}

// Authentication Exceptions
class AuthException extends AppException {
  const AuthException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'AuthException: $message';
}

class UnauthorizedException extends AuthException {
  const UnauthorizedException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'UnauthorizedException: $message';
}

class TokenExpiredException extends AuthException {
  const TokenExpiredException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'TokenExpiredException: $message';
}

// Server Exceptions
class ServerException extends AppException {
  final int statusCode;

  const ServerException({
    required this.statusCode,
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'ServerException ($statusCode): $message';
}

class ValidationException extends AppException {
  final Map<String, List<String>>? errors;

  const ValidationException({
    required super.message,
    this.errors,
    super.code,
    super.data,
  });

  @override
  String toString() => 'ValidationException: $message';
}

class BadRequestException extends AppException {
  const BadRequestException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'BadRequestException: $message';
}

// Cache Exceptions
class CacheException extends AppException {
  const CacheException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'CacheException: $message';
}

// Business Logic Exceptions
class BusinessLogicException extends AppException {
  const BusinessLogicException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'BusinessLogicException: $message';
}

class ProductNotFoundException extends BusinessLogicException {
  const ProductNotFoundException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'ProductNotFoundException: $message';
}

class InsufficientStockException extends BusinessLogicException {
  const InsufficientStockException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'InsufficientStockException: $message';
}

class CartEmptyException extends BusinessLogicException {
  const CartEmptyException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'CartEmptyException: $message';
}

// Generic Exceptions
class UnknownException extends AppException {
  const UnknownException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'UnknownException: $message';
}

class ParseException extends AppException {
  const ParseException({
    required super.message,
    super.code,
    super.data,
  });

  @override
  String toString() => 'ParseException: $message';
}

// Utility class for exception mapping
class ExceptionMapper {
  static AppException fromDioError(dynamic error) {
    if (error.toString().contains('SocketException')) {
      return const NoInternetException(
        message: 'Please check your internet connection',
        code: 'NO_INTERNET',
      );
    }
    
    if (error.toString().contains('TimeoutException')) {
      return const TimeoutException(
        message: 'Request timeout. Please try again.',
        code: 'TIMEOUT',
      );
    }
    
    final statusCode = error.response?.statusCode;
    final message = error.response?.data?['message'] ?? 
                   error.response?.statusMessage ?? 
                   'An unexpected error occurred';
    
    switch (statusCode) {
      case 400:
        return ValidationException(
          message: message,
          code: 'VALIDATION_ERROR',
          data: error.response?.data,
        );
      case 401:
        return UnauthorizedException(
          message: 'Session expired. Please login again.',
          code: 'UNAUTHORIZED',
          data: error.response?.data,
        );
      case 403:
        return AuthException(
          message: 'Access denied. You do not have permission.',
          code: 'FORBIDDEN',
          data: error.response?.data,
        );
      case 404:
        return ServerException(
          statusCode: 404,
          message: 'Resource not found',
          code: 'NOT_FOUND',
          data: error.response?.data,
        );
      case 422:
        return ValidationException(
          message: message,
          code: 'UNPROCESSABLE_ENTITY',
          errors: _parseValidationErrors(error.response?.data),
          data: error.response?.data,
        );
      case 500:
      case 502:
      case 503:
        return ServerException(
          statusCode: statusCode ?? 500,
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          data: error.response?.data,
        );
      default:
        if (statusCode != null && statusCode >= 400) {
          return ServerException(
            statusCode: statusCode,
            message: message,
            code: 'HTTP_ERROR',
            data: error.response?.data,
          );
        }
        return NetworkException(
          message: message,
          code: 'NETWORK_ERROR',
          data: error.response?.data,
        );
    }
  }
  
  static Map<String, List<String>>? _parseValidationErrors(dynamic data) {
    if (data == null) return null;
    
    try {
      if (data is Map<String, dynamic> && data.containsKey('errors')) {
        final errors = data['errors'] as Map<String, dynamic>?;
        if (errors != null) {
          return errors.map((key, value) => MapEntry(
            key,
            (value as List<dynamic>).map((e) => e.toString()).toList(),
          ));
        }
      }
    } catch (e) {
      // If parsing fails, return null
    }
    
    return null;
  }
  
  static String getDisplayMessage(AppException exception) {
    switch (exception.runtimeType) {
      case NoInternetException:
        return 'Please check your internet connection and try again.';
      case TimeoutException:
        return 'Request timeout. Please try again.';
      case UnauthorizedException:
        return 'Your session has expired. Please login again.';
      case ValidationException:
        return exception.message;
      case ServerException:
        final serverException = exception as ServerException;
        if (serverException.statusCode >= 500) {
          return 'Server is temporarily unavailable. Please try again later.';
        }
        return exception.message;
      default:
        return exception.message.isNotEmpty 
            ? exception.message 
            : 'Something went wrong. Please try again.';
    }
  }
}