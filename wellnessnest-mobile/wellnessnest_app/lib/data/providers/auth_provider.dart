import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../../core/api/api_client.dart';
import '../../core/errors/exceptions.dart';
import '../../config/constants.dart';

class AuthProvider extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  
  User? _currentUser;
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _errorMessage;

  // Getters
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  String? get errorMessage => _errorMessage;
  String? get token => _currentUser?.token;

  // Initialize auth state from stored data
  Future<void> initialize() async {
    if (_isInitialized) return;

    _setLoading(true);
    try {
      final token = await _storage.read(key: AppConstants.tokenKey);
      if (token != null && token.isNotEmpty) {
        final userData = await _storage.read(key: AppConstants.userDataKey);
        if (userData != null) {
          _currentUser = User.fromJsonString(userData);
          
          // Check if token is still valid
          if (_currentUser!.isTokenExpired) {
            await _refreshTokenIfNeeded();
          } else {
            // Verify user session with backend
            await _verifySession();
          }
        }
      }
    } catch (e) {
      print('Error initializing auth: $e');
      await logout(); // Clear invalid data
    }

    _isInitialized = true;
    _setLoading(false);
  }

  // Login with email and password
  Future<bool> login(String email, String password) async {
    _clearError();
    _setLoading(true);

    try {
      final response = await ApiClient.instance.post(
        AppConstants.loginEndpoint,
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final userData = response.data;
        _currentUser = User.fromJson(userData['user']);
        _currentUser = _currentUser!.copyWith(
          jwtToken: userData['access_token'],
          refreshToken: userData['refresh_token'],
        );

        await _storeAuthData();
        _setLoading(false);
        notifyListeners();
        return true;
      }
    } catch (e) {
      _setError(_getErrorMessage(e));
    }

    _setLoading(false);
    return false;
  }

  // Register new user
  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String phone,
    String? referralCode,
  }) async {
    _clearError();
    _setLoading(true);

    try {
      final response = await ApiClient.instance.post(
        AppConstants.registerEndpoint,
        data: {
          'first_name': firstName.trim(),
          'last_name': lastName.trim(),
          'email': email.trim().toLowerCase(),
          'password': password,
          'phone': phone.trim(),
          if (referralCode != null && referralCode.isNotEmpty)
            'referral_code': referralCode.trim(),
        },
      );

      if (response.statusCode == 201) {
        final userData = response.data;
        _currentUser = User.fromJson(userData['user']);
        _currentUser = _currentUser!.copyWith(
          jwtToken: userData['access_token'],
          refreshToken: userData['refresh_token'],
        );

        await _storeAuthData();
        _setLoading(false);
        notifyListeners();
        return true;
      }
    } catch (e) {
      _setError(_getErrorMessage(e));
    }

    _setLoading(false);
    return false;
  }

  // Logout user
  Future<void> logout() async {
    _setLoading(true);

    try {
      // Optionally call logout endpoint
      if (isAuthenticated) {
        await ApiClient.instance.post('/auth/logout');
      }
    } catch (e) {
      print('Error during logout API call: $e');
    }

    await _clearAuthData();
    _currentUser = null;
    _clearError();
    _setLoading(false);
    notifyListeners();
  }

  // Update user profile
  Future<bool> updateProfile(User updatedUser) async {
    if (!isAuthenticated) return false;

    _clearError();
    _setLoading(true);

    try {
      final response = await ApiClient.instance.put(
        AppConstants.userProfileEndpoint,
        data: updatedUser.toJson(),
      );

      if (response.statusCode == 200) {
        _currentUser = User.fromJson(response.data)
            .copyWith(token: _currentUser!.token, refreshToken: _currentUser!.refreshToken);
        await _storeUserData();
        _setLoading(false);
        notifyListeners();
        return true;
      }
    } catch (e) {
      _setError(_getErrorMessage(e));
    }

    _setLoading(false);
    return false;
  }

  // Refresh user data from server
  Future<void> refreshUserData() async {
    if (!isAuthenticated) return;

    try {
      final response = await ApiClient.instance.get(AppConstants.userProfileEndpoint);
      if (response.statusCode == 200) {
        _currentUser = User.fromJson(response.data)
            .copyWith(token: _currentUser!.token, refreshToken: _currentUser!.refreshToken);
        await _storeUserData();
        notifyListeners();
      }
    } catch (e) {
      print('Error refreshing user data: $e');
    }
  }

  // Verify session with backend
  Future<void> _verifySession() async {
    try {
      final response = await ApiClient.instance.get(AppConstants.userProfileEndpoint);
      if (response.statusCode == 200) {
        _currentUser = User.fromJson(response.data)
            .copyWith(token: _currentUser!.token, refreshToken: _currentUser!.refreshToken);
        await _storeUserData();
      } else if (response.statusCode == 401) {
        await logout(); // Invalid session
      }
    } catch (e) {
      print('Session verification failed: $e');
      await logout();
    }
  }

  // Refresh token if needed
  Future<void> _refreshTokenIfNeeded() async {
    if (_currentUser == null || _currentUser!.refreshToken == null) {
      await logout();
      return;
    }

    try {
      final response = await ApiClient.instance.post(
        '/auth/refresh',
        data: {'refresh_token': _currentUser!.refreshToken},
      );

      if (response.statusCode == 200) {
        final newToken = response.data['access_token'];
        final newRefreshToken = response.data['refresh_token'];
        
        _currentUser = _currentUser!.copyWith(
          token: newToken,
          refreshToken: newRefreshToken,
        );
        
        await _storeAuthData();
      } else {
        await logout(); // Refresh failed
      }
    } catch (e) {
      print('Token refresh failed: $e');
      await logout();
    }
  }

  // Store authentication data securely
  Future<void> _storeAuthData() async {
    if (_currentUser == null) return;

    await Future.wait([
      _storage.write(key: AppConstants.tokenKey, value: _currentUser!.token),
      _storage.write(key: AppConstants.refreshTokenKey, value: _currentUser!.refreshToken),
      _storeUserData(),
    ]);
  }

  // Store user data
  Future<void> _storeUserData() async {
    if (_currentUser == null) return;
    await _storage.write(key: AppConstants.userDataKey, value: _currentUser!.toJsonString());
  }

  // Clear all authentication data
  Future<void> _clearAuthData() async {
    await Future.wait([
      _storage.delete(key: AppConstants.tokenKey),
      _storage.delete(key: AppConstants.refreshTokenKey),
      _storage.delete(key: AppConstants.userDataKey),
    ]);
  }

  // Set loading state
  void _setLoading(bool loading) {
    if (_isLoading != loading) {
      _isLoading = loading;
      notifyListeners();
    }
  }

  // Set error message
  void _setError(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  // Clear error message
  void _clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  // Get user-friendly error message
  String _getErrorMessage(dynamic error) {
    if (error is UnauthorizedException) {
      return 'Invalid email or password. Please try again.';
    } else if (error is NetworkException) {
      return 'Network error. Please check your internet connection.';
    } else if (error is ServerException) {
      return 'Server error. Please try again later.';
    } else if (error is BadRequestException) {
      return error.message;
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  // Helper methods for UI
  bool get hasError => _errorMessage != null;

  void clearError() => _clearError();

  // Check if user can access premium features
  bool get canAccessPremiumFeatures {
    if (!isAuthenticated) return false;
    return _currentUser!.userLevelEnum != UserLevel.basic;
  }

  // Check if user has completed profile
  bool get hasCompletedProfile {
    if (!isAuthenticated) return false;
    return _currentUser!.isProfileComplete;
  }

  // Get user display name
  String get userDisplayName {
    if (!isAuthenticated) return 'Guest';
    return _currentUser!.fullName;
  }

  // Get user initial for avatar
  String get userInitial {
    if (!isAuthenticated) return 'G';
    return _currentUser!.firstName.isNotEmpty 
        ? _currentUser!.firstName[0].toUpperCase()
        : 'U';
  }

  // Get formatted wallet balance
  String get formattedWalletBalance {
    if (!isAuthenticated) return AppConstants.formatPrice(0);
    return AppConstants.formatPrice(_currentUser!.walletBalance);
  }

  // Get user level display
  String get userLevelDisplay {
    if (!isAuthenticated) return 'Guest';
    return _currentUser!.userLevelEnum.displayName;
  }

  @override
  void dispose() {
    super.dispose();
  }
}