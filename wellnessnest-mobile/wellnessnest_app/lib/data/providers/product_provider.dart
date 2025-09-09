import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../models/product.dart';
import '../models/category.dart' as model;
import '../../core/api/api_client.dart';
import '../../config/constants.dart';
import '../../core/errors/exceptions.dart';

class ProductProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient.instance;
  
  // Product state
  List<Product> _products = [];
  List<Product> _featuredProducts = [];
  List<Product> _searchResults = [];
  Map<int, Product> _productCache = {};
  
  // Category state
  List<model.Category> _categories = [];
  model.CategoryTree? _categoryTree;
  
  // UI state
  bool _isLoading = false;
  bool _isFeaturedLoading = false;
  bool _isSearching = false;
  bool _hasMoreProducts = false;
  String? _errorMessage;
  
  // Pagination state
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalCount = 0;
  
  // Filter state
  ProductFilters _currentFilters = ProductFilters();
  String _lastSearchQuery = '';
  
  // Cache timestamps
  DateTime? _categoriesLastFetched;
  DateTime? _productsLastFetched;
  DateTime? _featuredLastFetched;

  // Getters
  List<Product> get products => List.unmodifiable(_products);
  List<Product> get featuredProducts => List.unmodifiable(_featuredProducts);
  List<Product> get searchResults => List.unmodifiable(_searchResults);
  List<model.Category> get categories => List.unmodifiable(_categories);
  model.CategoryTree? get categoryTree => _categoryTree;
  
  bool get isLoading => _isLoading;
  bool get isFeaturedLoading => _isFeaturedLoading;
  bool get isSearching => _isSearching;
  bool get hasMoreProducts => _hasMoreProducts;
  String? get errorMessage => _errorMessage;
  
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get totalCount => _totalCount;
  ProductFilters get currentFilters => _currentFilters;
  String get lastSearchQuery => _lastSearchQuery;

  // Initialize provider
  Future<void> initialize() async {
    try {
      _setLoading(true);
      _clearError();
      
      // Load categories first (they're needed for filtering)
      await loadCategories();
      
      // Load featured products
      await loadFeaturedProducts();
      
      // Load initial products
      await loadProducts();
      
    } catch (e) {
      _setError(_getErrorMessage(e));
      debugPrint('ProductProvider initialization error: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Load categories
  Future<void> loadCategories({bool forceRefresh = false}) async {
    if (!forceRefresh && _categoriesLastFetched != null) {
      final cacheAge = DateTime.now().difference(_categoriesLastFetched!);
      if (cacheAge.inHours < AppConstants.dataCacheDuration) {
        return; // Use cached data
      }
    }

    try {
      // Try to load from cache first
      if (!forceRefresh) {
        await _loadCategoriesFromCache();
        if (_categories.isNotEmpty) return;
      }

      final response = await _apiClient.get(AppConstants.publicCategoriesEndpoint);
      
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final categoryResponse = model.CategoryListResponse.fromJson(data);
        
        _categories = categoryResponse.categories;
        _categoryTree = model.CategoryTree(_categories);
        _categoriesLastFetched = DateTime.now();
        
        // Cache categories
        await _saveCategoriesCache();
        notifyListeners();
      }
    } catch (e) {
      _setError(_getErrorMessage(e));
      debugPrint('Load categories error: $e');
      rethrow;
    }
  }

  // Load products with filters and pagination
  Future<void> loadProducts({
    ProductFilters? filters,
    bool reset = false,
    bool loadMore = false,
  }) async {
    if (_isLoading) return;

    try {
      if (reset || filters != null) {
        _currentPage = 1;
        _products.clear();
        _hasMoreProducts = false;
      }

      if (loadMore && !_hasMoreProducts) return;
      
      _setLoading(true);
      _clearError();

      // Update filters if provided
      if (filters != null) {
        _currentFilters = filters;
      }

      // Set page for load more
      if (loadMore) {
        _currentPage++;
      }

      final queryFilters = _currentFilters.copyWith(
        page: _currentPage,
        limit: AppConstants.productsPerPage,
      );

      final response = await _apiClient.get(
        AppConstants.userProductsEndpoint,
        queryParameters: queryFilters.toQueryParams(),
      );
      
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final productResponse = ProductListResponse.fromJson(data);
        
        if (loadMore) {
          _products.addAll(productResponse.products);
        } else {
          _products = productResponse.products;
        }
        
        _totalPages = productResponse.totalPages;
        _totalCount = productResponse.totalCount;
        _hasMoreProducts = productResponse.hasNext;
        _productsLastFetched = DateTime.now();
        
        // Cache products individually
        for (final product in productResponse.products) {
          _productCache[product.productId] = product;
        }
        
        await _saveProductsCache();
        notifyListeners();
      }
    } catch (e) {
      _setError(_getErrorMessage(e));
      debugPrint('Load products error: $e');
      
      // Try to load from cache on error
      if (!loadMore) {
        await _loadProductsFromCache();
      }
      // Don't rethrow - let the app continue
    } finally {
      _setLoading(false);
    }
  }

  // Load featured products
  Future<void> loadFeaturedProducts({bool forceRefresh = false}) async {
    if (!forceRefresh && _featuredLastFetched != null) {
      final cacheAge = DateTime.now().difference(_featuredLastFetched!);
      if (cacheAge.inHours < AppConstants.dataCacheDuration) {
        return; // Use cached data
      }
    }

    try {
      _setFeaturedLoading(true);
      
      // Try cache first
      if (!forceRefresh) {
        await _loadFeaturedFromCache();
        if (_featuredProducts.isNotEmpty) return;
      }

      final response = await _apiClient.get(AppConstants.featuredProductsEndpoint);
      
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final products = (data['products'] as List<dynamic>?)
            ?.map((item) => Product.fromJson(item))
            .toList() ?? [];
        
        _featuredProducts = products;
        _featuredLastFetched = DateTime.now();
        
        // Cache featured products individually
        for (final product in products) {
          _productCache[product.productId] = product;
        }
        
        await _saveFeaturedCache();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Load featured products error: $e');
      // Try to load from cache if API fails
      await _loadFeaturedFromCache();
    } finally {
      _setFeaturedLoading(false);
    }
  }

  // Search products
  Future<void> searchProducts(String query, {ProductFilters? filters}) async {
    if (query.trim().isEmpty) {
      _searchResults.clear();
      _lastSearchQuery = '';
      notifyListeners();
      return;
    }

    try {
      _setSearching(true);
      _clearError();

      final searchFilters = (filters ?? ProductFilters()).copyWith(
        search: query.trim(),
        page: 1,
        limit: AppConstants.productsPerPage,
      );

      final response = await _apiClient.get(
        AppConstants.userProductsEndpoint,
        queryParameters: searchFilters.toQueryParams(),
      );
      
      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final productResponse = ProductListResponse.fromJson(data);
        
        _searchResults = productResponse.products;
        _lastSearchQuery = query.trim();
        
        // Cache search results
        for (final product in productResponse.products) {
          _productCache[product.productId] = product;
        }
        
        await _saveSearchCache(query, _searchResults);
        notifyListeners();
      }
    } catch (e) {
      _setError(_getErrorMessage(e));
      debugPrint('Search products error: $e');
      
      // Try to load from cache
      await _loadSearchFromCache(query);
    } finally {
      _setSearching(false);
    }
  }

  // Get product by ID
  Future<Product?> getProduct(int productId, {bool useCache = true}) async {
    // Check cache first
    if (useCache && _productCache.containsKey(productId)) {
      return _productCache[productId];
    }

    try {
      final response = await _apiClient.get(
        '${AppConstants.productDetailsEndpoint}$productId',
      );
      
      if (response.statusCode == 200) {
        final product = Product.fromJson(response.data);
        _productCache[productId] = product;
        notifyListeners();
        return product;
      }
    } catch (e) {
      debugPrint('Get product error: $e');
    }
    
    return null;
  }

  // Refresh all data
  Future<void> refresh() async {
    try {
      _setLoading(true);
      _clearError();
      
      await Future.wait([
        loadCategories(forceRefresh: true),
        loadFeaturedProducts(forceRefresh: true),
        loadProducts(reset: true),
      ]);
      
    } catch (e) {
      _setError(_getErrorMessage(e));
    } finally {
      _setLoading(false);
    }
  }

  // Filter products by category
  Future<void> filterByCategory(int? categoryId) async {
    final filters = _currentFilters.copyWith(
      categoryId: categoryId,
      page: 1,
    );
    await loadProducts(filters: filters, reset: true);
  }

  // Apply price filter
  Future<void> filterByPrice(double? minPrice, double? maxPrice) async {
    final filters = _currentFilters.copyWith(
      minPrice: minPrice,
      maxPrice: maxPrice,
      page: 1,
    );
    await loadProducts(filters: filters, reset: true);
  }

  // Sort products
  Future<void> sortProducts(String sortBy, {String sortOrder = 'asc'}) async {
    final filters = _currentFilters.copyWith(
      sortBy: sortBy,
      sortOrder: sortOrder,
      page: 1,
    );
    await loadProducts(filters: filters, reset: true);
  }

  // Clear filters
  Future<void> clearFilters() async {
    _currentFilters = ProductFilters();
    await loadProducts(reset: true);
  }

  // Load more products (pagination)
  Future<void> loadMoreProducts() async {
    if (_hasMoreProducts && !_isLoading) {
      await loadProducts(loadMore: true);
    }
  }

  // Clear search
  void clearSearch() {
    _searchResults.clear();
    _lastSearchQuery = '';
    notifyListeners();
  }

  // Get products by category
  List<Product> getProductsByCategory(int categoryId) {
    return _products.where((product) => product.categoryId == categoryId).toList();
  }

  // Get products on sale
  List<Product> get saleProducts {
    return _products.where((product) => product.isOnSale).toList();
  }

  // Get products in stock
  List<Product> get inStockProducts {
    return _products.where((product) => product.isInStock).toList();
  }

  // Get category by ID
  model.Category? getCategory(int categoryId) {
    return _categoryTree?.getCategoryById(categoryId);
  }

  // Get root categories
  List<model.Category> get rootCategories {
    return _categoryTree?.rootCategories ?? [];
  }

  // Get subcategories
  List<model.Category> getSubcategories(int parentId) {
    return _categoryTree?.getSubcategories(parentId) ?? [];
  }

  // Search categories
  List<model.Category> searchCategories(String query) {
    return _categoryTree?.searchCategories(query) ?? [];
  }

  // Cache management methods
  Future<void> _loadCategoriesFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedData = prefs.getString(AppConstants.categoriesCacheKey);
      
      if (cachedData != null) {
        final jsonData = json.decode(cachedData) as Map<String, dynamic>;
        final timestamp = DateTime.parse(jsonData['timestamp']);
        
        // Check if cache is still valid
        if (DateTime.now().difference(timestamp).inHours < AppConstants.dataCacheDuration) {
          final categoriesData = jsonData['categories'] as List<dynamic>;
          _categories = categoriesData.map((item) => model.Category.fromJson(item)).toList();
          _categoryTree = model.CategoryTree(_categories);
          _categoriesLastFetched = timestamp;
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Load categories cache error: $e');
    }
  }

  Future<void> _saveCategoriesCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheData = {
        'categories': _categories.map((cat) => cat.toJson()).toList(),
        'timestamp': DateTime.now().toIso8601String(),
      };
      await prefs.setString(AppConstants.categoriesCacheKey, json.encode(cacheData));
    } catch (e) {
      debugPrint('Save categories cache error: $e');
    }
  }

  Future<void> _loadProductsFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedData = prefs.getString(AppConstants.productsCacheKey);
      
      if (cachedData != null) {
        final jsonData = json.decode(cachedData) as Map<String, dynamic>;
        final timestamp = DateTime.parse(jsonData['timestamp']);
        
        // Check if cache is still valid (shorter cache for products)
        if (DateTime.now().difference(timestamp).inMinutes < 30) {
          final productsData = jsonData['products'] as List<dynamic>;
          _products = productsData.map((item) => Product.fromJson(item)).toList();
          
          // Update cache
          for (final product in _products) {
            _productCache[product.productId] = product;
          }
          
          _productsLastFetched = timestamp;
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Load products cache error: $e');
    }
  }

  Future<void> _saveProductsCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheData = {
        'products': _products.map((product) => product.toJson()).toList(),
        'timestamp': DateTime.now().toIso8601String(),
      };
      await prefs.setString(AppConstants.productsCacheKey, json.encode(cacheData));
    } catch (e) {
      debugPrint('Save products cache error: $e');
    }
  }

  Future<void> _loadFeaturedFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedData = prefs.getString(AppConstants.featuredCacheKey);
      
      if (cachedData != null) {
        final jsonData = json.decode(cachedData) as Map<String, dynamic>;
        final timestamp = DateTime.parse(jsonData['timestamp']);
        
        if (DateTime.now().difference(timestamp).inHours < AppConstants.dataCacheDuration) {
          final productsData = jsonData['products'] as List<dynamic>;
          _featuredProducts = productsData.map((item) => Product.fromJson(item)).toList();
          _featuredLastFetched = timestamp;
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Load featured cache error: $e');
    }
  }

  Future<void> _saveFeaturedCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheData = {
        'products': _featuredProducts.map((product) => product.toJson()).toList(),
        'timestamp': DateTime.now().toIso8601String(),
      };
      await prefs.setString(AppConstants.featuredCacheKey, json.encode(cacheData));
    } catch (e) {
      debugPrint('Save featured cache error: $e');
    }
  }

  Future<void> _loadSearchFromCache(String query) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '${AppConstants.searchCacheKey}_${query.toLowerCase()}';
      final cachedData = prefs.getString(cacheKey);
      
      if (cachedData != null) {
        final jsonData = json.decode(cachedData) as Map<String, dynamic>;
        final timestamp = DateTime.parse(jsonData['timestamp']);
        
        // Search cache is shorter lived (15 minutes)
        if (DateTime.now().difference(timestamp).inMinutes < 15) {
          final productsData = jsonData['results'] as List<dynamic>;
          _searchResults = productsData.map((item) => Product.fromJson(item)).toList();
          _lastSearchQuery = query;
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Load search cache error: $e');
    }
  }

  Future<void> _saveSearchCache(String query, List<Product> results) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = '${AppConstants.searchCacheKey}_${query.toLowerCase()}';
      final cacheData = {
        'results': results.map((product) => product.toJson()).toList(),
        'query': query,
        'timestamp': DateTime.now().toIso8601String(),
      };
      await prefs.setString(cacheKey, json.encode(cacheData));
    } catch (e) {
      debugPrint('Save search cache error: $e');
    }
  }

  // Clear all caches
  Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((key) => 
        key.startsWith(AppConstants.categoriesCacheKey) ||
        key.startsWith(AppConstants.productsCacheKey) ||
        key.startsWith(AppConstants.featuredCacheKey) ||
        key.startsWith(AppConstants.searchCacheKey)
      ).toList();
      
      for (final key in keys) {
        await prefs.remove(key);
      }
      
      _productCache.clear();
    } catch (e) {
      debugPrint('Clear cache error: $e');
    }
  }

  // State management methods
  void _setLoading(bool loading) {
    if (_isLoading != loading) {
      _isLoading = loading;
      notifyListeners();
    }
  }

  void _setFeaturedLoading(bool loading) {
    if (_isFeaturedLoading != loading) {
      _isFeaturedLoading = loading;
      notifyListeners();
    }
  }

  void _setSearching(bool searching) {
    if (_isSearching != searching) {
      _isSearching = searching;
      notifyListeners();
    }
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

  // All data is now fetched exclusively from the backend API

  String _getErrorMessage(dynamic error) {
    if (error is UnauthorizedException) {
      return 'Session expired. Please login again.';
    } else if (error is NetworkException) {
      return AppConstants.networkErrorMessage;
    } else if (error is ServerException) {
      return AppConstants.serverErrorMessage;
    } else if (error is TimeoutException) {
      return AppConstants.timeoutErrorMessage;
    } else if (error is ProductNotFoundException) {
      return AppConstants.notFoundErrorMessage;
    } else {
      return AppConstants.unknownErrorMessage;
    }
  }

  // Helper getters
  bool get hasError => _errorMessage != null;
  void clearError() => _clearError();

  // Get formatted counts
  String get formattedTotalCount {
    if (_totalCount == 0) return 'No products found';
    if (_totalCount == 1) return '1 product found';
    return '$_totalCount products found';
  }

  String get formattedCurrentRange {
    if (_products.isEmpty) return '';
    final start = ((_currentPage - 1) * AppConstants.productsPerPage) + 1;
    final end = start + _products.length - 1;
    return '$start-$end of $_totalCount';
  }

  // Check if should preload more
  bool shouldPreloadMore(int index) {
    return index >= _products.length - AppConstants.preloadThreshold && _hasMoreProducts;
  }

  @override
  void dispose() {
    super.dispose();
  }
}