import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../models/product.dart';
import '../../core/api/api_client.dart';
import '../../config/constants.dart';
import '../../core/errors/exceptions.dart';

class WishlistProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient.instance;
  
  List<Product> _wishlistItems = [];
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _errorMessage;

  // Getters
  List<Product> get wishlistItems => List.unmodifiable(_wishlistItems);
  bool get isLoading => _isLoading;
  int get itemCount => _wishlistItems.length;
  bool get isEmpty => _wishlistItems.isEmpty;
  bool get isNotEmpty => _wishlistItems.isNotEmpty;
  String? get errorMessage => _errorMessage;
  bool get hasError => _errorMessage != null;

  /// Initialize wishlist provider with user data
  Future<void> initialize([dynamic user]) async {
    try {
      _setLoading(true);
      _clearError();

      // Update authentication status based on user
      _isAuthenticated = user != null;

      if (_isAuthenticated) {
        // Load wishlist from server for authenticated users
        await _loadWishlistFromServer();
      } else {
        // Load wishlist from local storage for guest users
        await _loadWishlistFromLocal();
      }
    } catch (e) {
      debugPrint('Wishlist initialization error: $e');
      _setError(_getErrorMessage(e));
      // If server fails, try to load from local storage
      if (_isAuthenticated) {
        await _loadWishlistFromLocal();
      }
    } finally {
      _setLoading(false);
    }
  }

  /// Initialize wishlist (load from local storage or server)
  Future<void> initializeWishlist() async {
    return initialize();
  }

  /// Update authentication status
  void updateAuthStatus(bool isAuthenticated) {
    if (_isAuthenticated != isAuthenticated) {
      _isAuthenticated = isAuthenticated;
      
      if (isAuthenticated) {
        // Sync local wishlist to server when user logs in
        _syncLocalWishlistToServer();
      } else {
        // Re-initialize wishlist when user logs out
        initializeWishlist();
      }
    }
  }

  /// Add product to wishlist
  Future<void> addToWishlist(Product product) async {
    try {
      _setLoading(true);

      // Check if product is already in wishlist
      if (isInWishlist(product.productId)) {
        return;
      }

      if (_isAuthenticated) {
        // Add to server
        await _addToWishlistOnServer(product.productId);
        // Refresh wishlist from server
        await _loadWishlistFromServer();
      } else {
        // Add to local wishlist
        _wishlistItems.add(product);
        await _saveWishlistToLocal();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Add to wishlist error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Remove product from wishlist
  Future<void> removeFromWishlist(int productId) async {
    try {
      _setLoading(true);

      if (_isAuthenticated) {
        // Remove from server
        await _removeFromWishlistOnServer(productId);
        // Refresh wishlist from server
        await _loadWishlistFromServer();
      } else {
        // Remove from local wishlist
        _wishlistItems.removeWhere((product) => product.productId == productId);
        await _saveWishlistToLocal();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Remove from wishlist error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Toggle product in wishlist (add if not present, remove if present)
  Future<void> toggleWishlist(Product product) async {
    if (isInWishlist(product.productId)) {
      await removeFromWishlist(product.productId);
    } else {
      await addToWishlist(product);
    }
  }

  /// Clear entire wishlist
  Future<void> clearWishlist() async {
    try {
      _setLoading(true);

      if (_isAuthenticated) {
        // Clear wishlist on server
        for (final product in _wishlistItems) {
          await _removeFromWishlistOnServer(product.productId);
        }
      }

      // Clear local wishlist
      _wishlistItems.clear();
      await _saveWishlistToLocal();
      notifyListeners();
    } catch (e) {
      debugPrint('Clear wishlist error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Check if product is in wishlist
  bool isInWishlist(int productId) {
    return _wishlistItems.any((product) => product.productId == productId);
  }

  /// Get product from wishlist by ID
  Product? getWishlistProduct(int productId) {
    try {
      return _wishlistItems.firstWhere((product) => product.productId == productId);
    } catch (e) {
      return null;
    }
  }

  /// Filter wishlist by category
  List<Product> getWishlistByCategory(int categoryId) {
    return _wishlistItems.where((product) => product.categoryId == categoryId).toList();
  }

  /// Search wishlist
  List<Product> searchWishlist(String query) {
    if (query.trim().isEmpty) return _wishlistItems;
    
    final searchQuery = query.toLowerCase().trim();
    return _wishlistItems.where((product) => product.matchesSearch(searchQuery)).toList();
  }

  /// Get categories present in wishlist
  List<String> getWishlistCategories() {
    final categories = <String>{};
    for (final product in _wishlistItems) {
      categories.add(product.categoryName);
    }
    return categories.toList()..sort();
  }

  /// Get total value of wishlist items
  double get totalWishlistValue {
    return _wishlistItems.fold(0.0, (sum, product) => sum + product.effectivePrice);
  }

  /// Get formatted total wishlist value
  String get formattedTotalValue => '${AppConstants.currencySymbol}${totalWishlistValue.toStringAsFixed(0)}';

  /// Get total savings if all wishlist items are purchased
  double get totalPotentialSavings {
    return _wishlistItems.fold(0.0, (sum, product) => sum + product.savingsAmount);
  }

  /// Get formatted total potential savings
  String get formattedTotalSavings => '${AppConstants.currencySymbol}${totalPotentialSavings.toStringAsFixed(0)}';

  // Error handling methods
  void clearError() => _clearError();

  // Private methods

  /// Load wishlist from server
  Future<void> _loadWishlistFromServer() async {
    final response = await _apiClient.get(AppConstants.wishlistEndpoint);
    final data = response.data as Map<String, dynamic>;
    
    final wishlistData = data['items'] as List<dynamic>? ?? [];
    _wishlistItems = wishlistData.map((item) {
      // Handle case where item might be nested
      final productData = item is Map<String, dynamic> && item.containsKey('product') 
          ? item['product'] as Map<String, dynamic>
          : item as Map<String, dynamic>;
      return Product.fromJson(productData);
    }).toList();
    
    notifyListeners();
  }

  /// Add item to wishlist on server
  Future<void> _addToWishlistOnServer(int productId) async {
    await _apiClient.post(
      AppConstants.addToWishlistEndpoint,
      data: {'product_id': productId},
    );
  }

  /// Remove item from wishlist on server
  Future<void> _removeFromWishlistOnServer(int productId) async {
    await _apiClient.delete('${AppConstants.removeFromWishlistEndpoint}$productId');
  }

  /// Load wishlist from local storage
  Future<void> _loadWishlistFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final wishlistData = prefs.getString(AppConstants.wishlistCacheKey);
      
      if (wishlistData != null) {
        final wishlistJson = json.decode(wishlistData) as Map<String, dynamic>;
        final itemsData = wishlistJson['items'] as List<dynamic>? ?? [];
        
        _wishlistItems = itemsData.map((item) => Product.fromJson(item as Map<String, dynamic>)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Load local wishlist error: $e');
    }
  }

  /// Save wishlist to local storage
  Future<void> _saveWishlistToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final wishlistData = {
        'items': _wishlistItems.map((product) => product.toJson()).toList(),
        'last_updated': DateTime.now().toIso8601String(),
      };
      
      await prefs.setString(AppConstants.wishlistCacheKey, json.encode(wishlistData));
    } catch (e) {
      debugPrint('Save local wishlist error: $e');
    }
  }

  /// Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

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

  String _getErrorMessage(dynamic error) {
    if (error is UnauthorizedException) {
      return 'Session expired. Please login again.';
    } else if (error is NetworkException) {
      return AppConstants.networkErrorMessage;
    } else if (error is ServerException) {
      return AppConstants.serverErrorMessage;
    } else if (error is ValidationException) {
      return error.toString();
    } else {
      return AppConstants.unknownErrorMessage;
    }
  }

  /// Sync local wishlist to server when user logs in
  Future<void> _syncLocalWishlistToServer() async {
    if (!_isAuthenticated || _wishlistItems.isEmpty) {
      // Just initialize from server if no local items
      await initializeWishlist();
      return;
    }

    try {
      _setLoading(true);
      
      // Get current server wishlist
      final serverWishlist = <int>{};
      try {
        final response = await _apiClient.get('/api/wishlist');
        final data = response.data as Map<String, dynamic>;
        final wishlistData = data['items'] as List<dynamic>? ?? [];
        
        for (final item in wishlistData) {
          final productData = item is Map<String, dynamic> && item.containsKey('product') 
              ? item['product'] as Map<String, dynamic>
              : item as Map<String, dynamic>;
          serverWishlist.add(productData['product_id'] as int);
        }
      } catch (e) {
        debugPrint('Error loading server wishlist: $e');
      }
      
      // Add local items that are not on server
      for (final product in _wishlistItems) {
        if (!serverWishlist.contains(product.productId)) {
          try {
            await _addToWishlistOnServer(product.productId);
          } catch (e) {
            debugPrint('Error syncing product ${product.productId} to server: $e');
          }
        }
      }
      
      // Load updated wishlist from server
      await _loadWishlistFromServer();
      
      // Clear local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(AppConstants.wishlistCacheKey);
      
    } catch (e) {
      debugPrint('Wishlist sync error: $e');
      // If sync fails, just load from server
      await _loadWishlistFromServer();
    } finally {
      _setLoading(false);
    }
  }

  /// Sort wishlist items
  void sortWishlist(WishlistSortType sortType) {
    switch (sortType) {
      case WishlistSortType.nameAsc:
        _wishlistItems.sort((a, b) => a.productName.compareTo(b.productName));
        break;
      case WishlistSortType.nameDesc:
        _wishlistItems.sort((a, b) => b.productName.compareTo(a.productName));
        break;
      case WishlistSortType.priceLowToHigh:
        _wishlistItems.sort((a, b) => a.effectivePrice.compareTo(b.effectivePrice));
        break;
      case WishlistSortType.priceHighToLow:
        _wishlistItems.sort((a, b) => b.effectivePrice.compareTo(a.effectivePrice));
        break;
      case WishlistSortType.newest:
        _wishlistItems.sort((a, b) {
          final aDate = a.createdAt ?? DateTime(1970);
          final bDate = b.createdAt ?? DateTime(1970);
          return bDate.compareTo(aDate);
        });
        break;
      case WishlistSortType.oldest:
        _wishlistItems.sort((a, b) {
          final aDate = a.createdAt ?? DateTime(1970);
          final bDate = b.createdAt ?? DateTime(1970);
          return aDate.compareTo(bDate);
        });
        break;
    }
    notifyListeners();
  }

  /// Get wishlist statistics
  WishlistStats get stats {
    final totalItems = _wishlistItems.length;
    final totalValue = totalWishlistValue;
    final totalSavings = totalPotentialSavings;
    final inStockItems = _wishlistItems.where((p) => p.isInStock).length;
    final outOfStockItems = totalItems - inStockItems;
    
    return WishlistStats(
      totalItems: totalItems,
      totalValue: totalValue,
      totalSavings: totalSavings,
      inStockItems: inStockItems,
      outOfStockItems: outOfStockItems,
    );
  }
}

/// Enum for wishlist sorting options
enum WishlistSortType {
  nameAsc,
  nameDesc,
  priceLowToHigh,
  priceHighToLow,
  newest,
  oldest,
}

/// Class to hold wishlist statistics
class WishlistStats {
  final int totalItems;
  final double totalValue;
  final double totalSavings;
  final int inStockItems;
  final int outOfStockItems;

  WishlistStats({
    required this.totalItems,
    required this.totalValue,
    required this.totalSavings,
    required this.inStockItems,
    required this.outOfStockItems,
  });

  String get formattedTotalValue => '${AppConstants.currencySymbol}${totalValue.toStringAsFixed(0)}';
  String get formattedTotalSavings => '${AppConstants.currencySymbol}${totalSavings.toStringAsFixed(0)}';
}