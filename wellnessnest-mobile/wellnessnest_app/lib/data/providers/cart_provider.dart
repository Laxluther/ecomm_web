import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../models/cart_item.dart';
import '../models/product.dart';
import '../../core/api/api_client.dart';
import '../../config/constants.dart';
import '../../core/errors/exceptions.dart';

class CartProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient.instance;
  
  List<CartItem> _cartItems = [];
  bool _isLoading = false;
  bool _isAuthenticated = false;
  double _deliveryCharge = 0.0;
  double _discount = 0.0;
  String? _couponCode;
  String? _errorMessage;

  // Getters
  List<CartItem> get cartItems => List.unmodifiable(_cartItems);
  bool get isLoading => _isLoading;
  int get itemCount => _cartItems.fold(0, (sum, item) => sum + item.quantity);
  bool get isEmpty => _cartItems.isEmpty;
  bool get isNotEmpty => _cartItems.isNotEmpty;
  double get deliveryCharge => _deliveryCharge;
  double get discount => _discount;
  String? get couponCode => _couponCode;
  String? get errorMessage => _errorMessage;
  bool get hasError => _errorMessage != null;

  /// Get subtotal (sum of all item prices)
  double get subtotal {
    return _cartItems.fold(0.0, (sum, item) => sum + item.totalPrice);
  }

  /// Get total amount including delivery and discounts
  double get totalAmount {
    final subtotalAmount = subtotal;
    final deliveryAmount = subtotalAmount >= 500 ? 0.0 : _deliveryCharge; // Free delivery above ₹500
    return subtotalAmount + deliveryAmount - _discount;
  }

  /// Get total savings
  double get totalSavings {
    return _cartItems.fold(0.0, (sum, item) {
      if (item.product.hasDiscount) {
        final savings = (item.product.price - item.product.discountPrice!) * item.quantity;
        return sum + savings;
      }
      return sum;
    }) + _discount;
  }

  /// Initialize cart provider with user data
  Future<void> initialize([dynamic user]) async {
    try {
      _setLoading(true);
      _clearError();

      // Update authentication status based on user
      _isAuthenticated = user != null;

      if (_isAuthenticated) {
        // Load cart from server for authenticated users
        await _loadCartFromServer();
      } else {
        // Load cart from local storage for guest users
        await _loadCartFromLocal();
      }
    } catch (e) {
      debugPrint('Cart initialization error: $e');
      _setError(_getErrorMessage(e));
      // If server fails, try to load from local storage
      if (_isAuthenticated) {
        await _loadCartFromLocal();
      }
    } finally {
      _setLoading(false);
    }
  }

  /// Initialize cart (load from local storage or server)
  Future<void> initializeCart() async {
    return initialize();
  }

  /// Update authentication status
  void updateAuthStatus(bool isAuthenticated) {
    if (_isAuthenticated != isAuthenticated) {
      _isAuthenticated = isAuthenticated;
      // Re-initialize cart when auth status changes
      initializeCart();
    }
  }

  /// Add item to cart
  Future<void> addToCart(Product product, {int quantity = 1}) async {
    try {
      _setLoading(true);

      // Check if item already exists in cart
      final existingIndex = _cartItems.indexWhere(
        (item) => item.product.productId == product.productId,
      );

      if (existingIndex != -1) {
        // Update existing item quantity
        await updateQuantity(product.productId, _cartItems[existingIndex].quantity + quantity);
      } else {
        // Add new item
        final cartItem = CartItem.createForCart(
          product: product,
          quantity: quantity,
        );

        if (_isAuthenticated) {
          // Add to server
          await _addToCartOnServer(product.productId, quantity);
          // Refresh cart from server to get proper cart ID
          await _loadCartFromServer();
        } else {
          // Add to local cart
          _cartItems.add(cartItem);
          await _saveCartToLocal();
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Add to cart error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Update item quantity
  Future<void> updateQuantity(int productId, int quantity) async {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      _setLoading(true);

      final itemIndex = _cartItems.indexWhere(
        (item) => item.product.productId == productId,
      );

      if (itemIndex == -1) return;

      if (_isAuthenticated) {
        // Update on server
        await _updateCartOnServer(productId, quantity);
        // Refresh cart from server
        await _loadCartFromServer();
      } else {
        // Update locally
        _cartItems[itemIndex] = _cartItems[itemIndex].copyWith(quantity: quantity);
        await _saveCartToLocal();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Update quantity error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Remove item from cart
  Future<void> removeFromCart(int productId) async {
    try {
      _setLoading(true);

      if (_isAuthenticated) {
        // Remove from server
        await _removeFromCartOnServer(productId);
        // Refresh cart from server
        await _loadCartFromServer();
      } else {
        // Remove locally
        _cartItems.removeWhere((item) => item.product.productId == productId);
        await _saveCartToLocal();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Remove from cart error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Clear entire cart
  Future<void> clearCart() async {
    try {
      _setLoading(true);

      if (_isAuthenticated) {
        // Clear cart on server
        for (final item in _cartItems) {
          await _removeFromCartOnServer(item.product.productId);
        }
      }

      // Clear local cart
      _cartItems.clear();
      _couponCode = null;
      _discount = 0.0;
      await _saveCartToLocal();
      notifyListeners();
    } catch (e) {
      debugPrint('Clear cart error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Apply coupon code
  Future<bool> applyCoupon(String couponCode) async {
    try {
      _setLoading(true);

      // TODO: Implement coupon validation API
      // For now, simulate coupon application
      if (couponCode.toUpperCase() == 'WELCOME10') {
        _couponCode = couponCode;
        _discount = subtotal * 0.1; // 10% discount
        notifyListeners();
        return true;
      }

      return false;
    } catch (e) {
      debugPrint('Apply coupon error: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Remove applied coupon
  void removeCoupon() {
    _couponCode = null;
    _discount = 0.0;
    notifyListeners();
  }

  /// Get item by product ID
  CartItem? getCartItem(int productId) {
    try {
      return _cartItems.firstWhere(
        (item) => item.product.productId == productId,
      );
    } catch (e) {
      return null;
    }
  }

  /// Check if product is in cart
  bool isInCart(int productId) {
    return _cartItems.any((item) => item.product.productId == productId);
  }

  /// Get quantity of product in cart
  int getQuantity(int productId) {
    final item = getCartItem(productId);
    return item?.quantity ?? 0;
  }

  // Private methods

  /// Load cart from server
  Future<void> _loadCartFromServer() async {
    final response = await _apiClient.get(AppConstants.cartEndpoint);
    final data = response.data as Map<String, dynamic>;
    
    final cartItemsData = data['items'] as List<dynamic>? ?? [];
    _cartItems = cartItemsData.map((item) => CartItem.fromJson(item as Map<String, dynamic>)).toList();
    
    // Load other cart data
    _deliveryCharge = (data['delivery_charge'] as num?)?.toDouble() ?? 50.0;
    _discount = (data['discount'] as num?)?.toDouble() ?? 0.0;
    _couponCode = data['coupon_code'] as String?;
    
    notifyListeners();
  }

  /// Add item to cart on server
  Future<void> _addToCartOnServer(int productId, int quantity) async {
    await _apiClient.post(
      AppConstants.addToCartEndpoint,
      data: {
        'product_id': productId,
        'quantity': quantity,
      },
    );
  }

  /// Update cart item on server
  Future<void> _updateCartOnServer(int productId, int quantity) async {
    await _apiClient.put(
      AppConstants.updateCartEndpoint,
      data: {
        'product_id': productId,
        'quantity': quantity,
      },
    );
  }

  /// Remove item from cart on server
  Future<void> _removeFromCartOnServer(int productId) async {
    await _apiClient.delete('${AppConstants.removeFromCartEndpoint}$productId');
  }

  /// Load cart from local storage
  Future<void> _loadCartFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartData = prefs.getString(AppConstants.cartCacheKey);
      
      if (cartData != null) {
        final cartJson = json.decode(cartData) as Map<String, dynamic>;
        final itemsData = cartJson['items'] as List<dynamic>? ?? [];
        
        _cartItems = itemsData.map((item) => CartItem.fromJson(item as Map<String, dynamic>)).toList();
        _deliveryCharge = (cartJson['delivery_charge'] as num?)?.toDouble() ?? 50.0;
        _discount = (cartJson['discount'] as num?)?.toDouble() ?? 0.0;
        _couponCode = cartJson['coupon_code'] as String?;
        
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Load local cart error: $e');
    }
  }

  /// Save cart to local storage
  Future<void> _saveCartToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartData = {
        'items': _cartItems.map((item) => item.toJson()).toList(),
        'delivery_charge': _deliveryCharge,
        'discount': _discount,
        'coupon_code': _couponCode,
        'last_updated': DateTime.now().toIso8601String(),
      };
      
      await prefs.setString(AppConstants.cartCacheKey, json.encode(cartData));
    } catch (e) {
      debugPrint('Save local cart error: $e');
    }
  }

  /// Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Sync local cart to server when user logs in
  Future<void> syncLocalCartToServer() async {
    if (!_isAuthenticated || _cartItems.isEmpty) return;

    try {
      _setLoading(true);
      
      // Add all local items to server cart
      for (final item in _cartItems) {
        await _addToCartOnServer(item.product.productId, item.quantity);
      }
      
      // Clear local cart and load from server
      _cartItems.clear();
      await _loadCartFromServer();
      
      // Clear local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(AppConstants.cartCacheKey);
      
    } catch (e) {
      debugPrint('Cart sync error: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Calculate delivery charge based on location and cart value
  void updateDeliveryCharge(double charge) {
    _deliveryCharge = charge;
    notifyListeners();
  }

  /// Get formatted subtotal
  String get formattedSubtotal => '${AppConstants.currencySymbol}${subtotal.toStringAsFixed(0)}';

  /// Get formatted total
  String get formattedTotal => '${AppConstants.currencySymbol}${totalAmount.toStringAsFixed(0)}';

  /// Get formatted savings
  String get formattedSavings => '${AppConstants.currencySymbol}${totalSavings.toStringAsFixed(0)}';

  /// Get formatted delivery charge
  String get formattedDeliveryCharge {
    if (subtotal >= 500) return 'FREE';
    return '${AppConstants.currencySymbol}${_deliveryCharge.toStringAsFixed(0)}';
  }

  // Error handling methods
  void _setError(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  void clearError() => _clearError();

  String _getErrorMessage(dynamic error) {
    if (error is UnauthorizedException) {
      return 'Session expired. Please login again.';
    } else if (error is NetworkException) {
      return AppConstants.networkErrorMessage;
    } else if (error is ServerException) {
      return AppConstants.serverErrorMessage;
    } else if (error is BadRequestException) {
      return error.toString();
    } else {
      return AppConstants.unknownErrorMessage;
    }
  }
}