class ApiEndpoints {
  // Base Configuration
  static const String baseUrl = 'http://localhost:5000/api';
  
  // Public Endpoints (No Auth Required)
  static const String publicCategories = '/public/categories';
  static const String userProducts = '/user/products';
  static const String featuredProducts = '/user/products/featured';
  static const String validateReferral = '/user/referrals/validate';
  
  // Authentication Endpoints
  static const String register = '/user/auth/register';
  static const String login = '/user/auth/login';
  static const String userProfile = '/user/auth/me';
  static const String refreshToken = '/user/auth/refresh';
  static const String logout = '/user/auth/logout';
  
  // Cart Endpoints
  static const String cart = '/user/cart';
  static const String cartAdd = '/user/cart/add';
  static const String cartUpdate = '/user/cart/update';
  static const String cartRemove = '/user/cart/remove';
  
  // Wishlist Endpoints
  static const String wishlist = '/user/wishlist';
  static const String wishlistAdd = '/user/wishlist/add';
  static const String wishlistRemove = '/user/wishlist/remove';
  
  // Order Endpoints
  static const String orders = '/user/orders';
  static const String createOrder = '/user/orders';
  static const String orderDetails = '/user/orders'; // + /{orderId}
  
  // Address Endpoints
  static const String addresses = '/user/addresses';
  static const String createAddress = '/user/addresses';
  static const String updateAddress = '/user/addresses'; // + /{id}
  static const String deleteAddress = '/user/addresses'; // + /{id}
  
  // Wallet & Referral Endpoints
  static const String referrals = '/user/referrals';
  static const String wallet = '/user/wallet';
  
  // Utility methods for building URLs
  static String productDetails(int productId) => '$userProducts/$productId';
  static String removeFromCart(int productId) => '$cartRemove/$productId';
  static String removeFromWishlist(int productId) => '$wishlistRemove/$productId';
  static String getOrderDetails(String orderId) => '$orderDetails/$orderId';
  static String updateAddressById(int addressId) => '$updateAddress/$addressId';
  static String deleteAddressById(int addressId) => '$deleteAddress/$addressId';
  
  // Query parameter builders
  static Map<String, dynamic> buildProductQuery({
    int? categoryId,
    String? search,
    String? sortBy,
    String? sortOrder,
    double? minPrice,
    double? maxPrice,
    int? page,
    int? limit,
  }) {
    final Map<String, dynamic> query = {};
    
    if (categoryId != null) query['category_id'] = categoryId;
    if (search != null && search.isNotEmpty) query['search'] = search;
    if (sortBy != null) query['sort_by'] = sortBy;
    if (sortOrder != null) query['sort_order'] = sortOrder;
    if (minPrice != null) query['min_price'] = minPrice;
    if (maxPrice != null) query['max_price'] = maxPrice;
    if (page != null) query['page'] = page;
    if (limit != null) query['limit'] = limit;
    
    return query;
  }
  
  static Map<String, dynamic> buildOrderQuery({
    String? status,
    int? page,
    int? limit,
  }) {
    final Map<String, dynamic> query = {};
    
    if (status != null) query['status'] = status;
    if (page != null) query['page'] = page;
    if (limit != null) query['limit'] = limit;
    
    return query;
  }
  
  // HTTP Headers
  static Map<String, String> get defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  static Map<String, String> authHeaders(String token) => {
    ...defaultHeaders,
    'Authorization': 'Bearer $token',
  };
  
  // Request body builders
  static Map<String, dynamic> buildLoginRequest({
    required String email,
    required String password,
  }) => {
    'email': email,
    'password': password,
  };
  
  static Map<String, dynamic> buildRegisterRequest({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String phoneNumber,
    String? referralCode,
  }) => {
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'password': password,
    'phone_number': phoneNumber,
    if (referralCode != null && referralCode.isNotEmpty) 'referral_code': referralCode,
  };
  
  static Map<String, dynamic> buildAddToCartRequest({
    required int productId,
    required int quantity,
  }) => {
    'product_id': productId,
    'quantity': quantity,
  };
  
  static Map<String, dynamic> buildUpdateCartRequest({
    required int productId,
    required int quantity,
  }) => {
    'product_id': productId,
    'quantity': quantity,
  };
  
  static Map<String, dynamic> buildAddToWishlistRequest({
    required int productId,
  }) => {
    'product_id': productId,
  };
  
  static Map<String, dynamic> buildCreateOrderRequest({
    required int addressId,
    String? couponCode,
    String? notes,
  }) => {
    'address_id': addressId,
    if (couponCode != null && couponCode.isNotEmpty) 'coupon_code': couponCode,
    if (notes != null && notes.isNotEmpty) 'notes': notes,
  };
  
  static Map<String, dynamic> buildAddressRequest({
    required String name,
    required String phoneNumber,
    required String addressLine1,
    String? addressLine2,
    required String city,
    required String state,
    required String postalCode,
    required String country,
    bool isDefault = false,
    String? addressType,
  }) => {
    'name': name,
    'phone_number': phoneNumber,
    'address_line_1': addressLine1,
    if (addressLine2 != null && addressLine2.isNotEmpty) 'address_line_2': addressLine2,
    'city': city,
    'state': state,
    'postal_code': postalCode,
    'country': country,
    'is_default': isDefault,
    if (addressType != null) 'address_type': addressType,
  };
  
  static Map<String, dynamic> buildValidateReferralRequest({
    required String referralCode,
  }) => {
    'referral_code': referralCode,
  };
  
  // Response status codes
  static const int statusOk = 200;
  static const int statusCreated = 201;
  static const int statusNoContent = 204;
  static const int statusBadRequest = 400;
  static const int statusUnauthorized = 401;
  static const int statusForbidden = 403;
  static const int statusNotFound = 404;
  static const int statusUnprocessableEntity = 422;
  static const int statusInternalServerError = 500;
  
  // Timeout configurations (in milliseconds)
  static const int connectTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  static const int sendTimeout = 30000; // 30 seconds
}