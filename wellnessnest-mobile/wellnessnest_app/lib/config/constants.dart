class AppConstants {
  // App Information
  static const String appName = 'WelNest';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Premium Coffee & Makhana - Natural Wellness Products';

  // API Configuration
  static const String baseUrl = 'http://localhost:5000/api';
  static const String developmentUrl = 'http://localhost:5000/api';
  static String productionUrl = ''; // Will be provided later

  // API Endpoints
  static const String publicCategoriesEndpoint = '/public/categories';
  static const String userProductsEndpoint = '/user/products';
  static const String productDetailsEndpoint = '/user/products/';
  static const String featuredProductsEndpoint = '/user/products/featured';
  static const String validateReferralEndpoint = '/user/referrals/validate';

  // Authentication Endpoints
  static const String registerEndpoint = '/user/auth/register';
  static const String loginEndpoint = '/user/auth/login';
  static const String userProfileEndpoint = '/user/auth/me';

  // Cart Endpoints
  static const String cartEndpoint = '/user/cart';
  static const String addToCartEndpoint = '/user/cart/add';
  static const String updateCartEndpoint = '/user/cart/update';
  static const String removeFromCartEndpoint = '/user/cart/remove/';

  // Wishlist Endpoints
  static const String wishlistEndpoint = '/user/wishlist';
  static const String addToWishlistEndpoint = '/user/wishlist/add';
  static const String removeFromWishlistEndpoint = '/user/wishlist/remove/';

  // Order Endpoints
  static const String ordersEndpoint = '/user/orders';
  static const String orderDetailsEndpoint = '/user/orders/';
  static const String createOrderEndpoint = '/user/orders';

  // Address Endpoints
  static const String addressesEndpoint = '/user/addresses';
  static const String updateAddressEndpoint = '/user/addresses/';
  static const String deleteAddressEndpoint = '/user/addresses/';

  // Referral & Wallet Endpoints
  static const String referralsEndpoint = '/user/referrals';
  static const String walletEndpoint = '/user/wallet';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String cartCacheKey = 'cart_cache';
  static const String wishlistCacheKey = 'wishlist_cache';
  static const String categoriesCacheKey = 'categories_cache';
  static const String productsCacheKey = 'products_cache';
  static const String featuredCacheKey = 'featured_cache';
  static const String searchCacheKey = 'search_cache';
  static const String recentSearchesKey = 'recent_searches';
  static const String onboardingCompletedKey = 'onboarding_completed';
  static const String biometricEnabledKey = 'biometric_enabled';
  static const String notificationsEnabledKey = 'notifications_enabled';
  static const String themePreferenceKey = 'theme_preference';
  static const String languageKey = 'language';

  // UI Constants
  static const int maxRecentSearches = 10;
  static const int productsPerPage = 20;
  static const int categoriesGridColumns = 2;
  static const int homeProductsGridColumns = 2;
  static const double cardBorderRadius = 12.0;
  static const double buttonBorderRadius = 8.0;
  static const double bottomSheetBorderRadius = 20.0;
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double cardElevation = 2.0;
  static const double buttonElevation = 2.0;

  // Animation Durations (in milliseconds)
  static const int defaultAnimationDuration = 300;
  static const int fastAnimationDuration = 150;
  static const int slowAnimationDuration = 500;
  static const int pageTransitionDuration = 250;
  static const int shimmerAnimationDuration = 1500;

  // Network Configuration
  static const int connectTimeout = 5000; // 5 seconds
  static const int receiveTimeout = 3000; // 3 seconds
  static const int maxRetryAttempts = 3;
  static const int retryDelay = 1000; // 1 second

  // Image Configuration
  static const String placeholderImagePath = 'assets/images/placeholder.png';
  static const String logoImagePath = 'assets/images/welnest-logo.png';
  static const String onboardingImagesPath = 'assets/images/onboarding/';
  static const double productImageAspectRatio = 3 / 4;
  static const double bannerImageAspectRatio = 16 / 9;

  // Validation Constants
  static const int minPasswordLength = 6;
  static const int maxPasswordLength = 50;
  static const int minNameLength = 2;
  static const int maxNameLength = 50;
  static const int phoneNumberLength = 10;
  static const int pinCodeLength = 6;

  // Currency
  static const String currencySymbol = '₹';
  static const String currencyCode = 'INR';
  static const String locale = 'en_IN';

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  static const int preloadThreshold = 5; // Load more when 5 items from end

  // Search
  static const int searchDebounceDelay = 500; // milliseconds
  static const int minSearchLength = 2;
  static const int maxSearchLength = 100;

  // Cache Configuration
  static const int imageCacheDuration = 7; // days
  static const int dataCacheDuration = 24; // hours
  static const int maxCacheSize = 100; // MB

  // Error Messages
  static const String networkErrorMessage = 'Network error. Please check your connection.';
  static const String serverErrorMessage = 'Server error. Please try again later.';
  static const String unauthorizedErrorMessage = 'Unauthorized. Please login again.';
  static const String notFoundErrorMessage = 'Requested resource not found.';
  static const String timeoutErrorMessage = 'Request timeout. Please try again.';
  static const String unknownErrorMessage = 'Something went wrong. Please try again.';

  // Success Messages
  static const String loginSuccessMessage = 'Login successful!';
  static const String registerSuccessMessage = 'Registration successful!';
  static const String addToCartSuccessMessage = 'Added to cart successfully!';
  static const String addToWishlistSuccessMessage = 'Added to wishlist successfully!';
  static const String orderPlacedSuccessMessage = 'Order placed successfully!';
  static const String profileUpdatedSuccessMessage = 'Profile updated successfully!';

  // Onboarding
  static const List<String> onboardingTitles = [
    'Welcome to WelNest',
    'Premium Coffee & Makhana',
    'Track Orders & Get Rewards',
    'Natural Wellness Products',
  ];

  static const List<String> onboardingDescriptions = [
    'Discover premium roasted coffee and healthy makhana snacks for your wellness journey',
    'Explore our range of 8 coffee flavors and 4 makhana varieties, crafted with natural ingredients',
    'Keep track of your orders and earn rewards with every purchase of our wellness products',
    'Quality guaranteed - From Robusta coffee to ghee-roasted makhana, taste the difference',
  ];

  // Bottom Navigation
  static const List<String> bottomNavLabels = [
    'Home',
    'Categories',
    'Cart',
    'Wishlist',
    'Profile',
  ];

  // Product Sort Options
  static const List<String> sortOptions = [
    'Newest First',
    'Price: Low to High',
    'Price: High to Low',
    'Best Rated',
    'Most Popular',
  ];

  // Order Status
  static const List<String> orderStatuses = [
    'Pending',
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];

  // Payment Methods
  static const List<String> paymentMethods = [
    'Cash on Delivery',
    // More payment methods will be added later
  ];

  // Real WelNest Categories (Fallback Data)
  static const List<Map<String, dynamic>> fallbackCategories = [
    {
      'category_id': 1,
      'category_name': 'Coffee',
      'description': 'Premium roasted coffee - unflavoured and flavoured varieties for coffee lovers',
      'image_url': '/static/uploads/categories/coffee.jpg',
      'status': 'active',
      'sort_order': 1,
    },
    {
      'category_id': 2,
      'category_name': 'Makhana',
      'description': 'Crispy fox nuts - flavoured and unflavoured options, healthy snacking choice',
      'image_url': '/static/uploads/categories/makhana.jpg',
      'status': 'active',
      'sort_order': 2,
    },
  ];

  // Real WelNest Featured Products (Fallback Data)
  static const List<Map<String, dynamic>> fallbackFeaturedProducts = [
    {
      'product_id': 1,
      'product_name': 'Robusta Coffee',
      'description': 'Premium single-origin Robusta coffee beans with bold, strong flavor and high caffeine content.',
      'category_id': 1,
      'brand': 'WelNest',
      'price': 449.00,
      'discount_price': 399.00,
      'is_featured': true,
      'image_url': '/static/uploads/products/robusta-coffee.jpg',
    },
    {
      'product_id': 2,
      'product_name': 'Arabica Coffee',
      'description': 'Smooth and aromatic Arabica coffee beans with complex flavor notes and natural sweetness.',
      'category_id': 1,
      'brand': 'WelNest',
      'price': 549.00,
      'discount_price': 499.00,
      'is_featured': true,
      'image_url': '/static/uploads/products/arabica-coffee.jpg',
    },
    {
      'product_id': 9,
      'product_name': 'Peri Peri Makhana',
      'description': 'Spicy and tangy fox nuts roasted to perfection with authentic peri peri seasoning.',
      'category_id': 2,
      'brand': 'WelNest',
      'price': 299.00,
      'discount_price': 249.00,
      'is_featured': true,
      'image_url': '/static/uploads/products/peri-peri-makhana.jpg',
    },
    {
      'product_id': 12,
      'product_name': 'Ghee Roasted Makhana',
      'description': 'Traditional fox nuts roasted in pure desi ghee. Rich taste with natural goodness.',
      'category_id': 2,
      'brand': 'WelNest',
      'price': 349.00,
      'discount_price': 299.00,
      'is_featured': true,
      'image_url': '/static/uploads/products/ghee-roasted-makhana.jpg',
    },
  ];

  // Helper Methods
  static String getImageUrl(String? relativePath) {
    if (relativePath == null || relativePath.isEmpty) {
      return placeholderImagePath;
    }
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    return '$baseUrl$relativePath';
  }

  static String formatPrice(double price) {
    return '$currencySymbol${price.toStringAsFixed(2)}';
  }

  static String formatPriceInt(int price) {
    return '$currencySymbol$price';
  }

  static bool isValidEmail(String email) {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }

  static bool isValidPhone(String phone) {
    return RegExp(r'^[6-9]\d{9}$').hasMatch(phone);
  }

  static bool isValidPinCode(String pinCode) {
    return RegExp(r'^\d{6}$').hasMatch(pinCode);
  }

  // Feature Flags
  static const bool enableBiometricAuth = true;
  static const bool enableNotifications = true;
  static const bool enableOfflineMode = true;
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  static const bool enableDeepLinking = true;
}