import '../../config/constants.dart';

class Product {
  final int productId;
  final String productName;
  final String description;
  final double price;
  final double? discountPrice;
  final String? primaryImage;
  final List<String>? additionalImages;
  final String brand;
  final String categoryName;
  final int? categoryId;
  final int stockQuantity;
  final double? rating;
  final int? reviewCount;
  final bool isFeatured;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final Map<String, dynamic>? attributes;
  final String? weight;
  final String? origin;
  final String? roastLevel;

  Product({
    required this.productId,
    required this.productName,
    required this.description,
    required this.price,
    this.discountPrice,
    this.primaryImage,
    this.additionalImages,
    required this.brand,
    required this.categoryName,
    this.categoryId,
    required this.stockQuantity,
    this.rating,
    this.reviewCount,
    this.isFeatured = false,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
    this.attributes,
    this.weight,
    this.origin,
    this.roastLevel,
  });

  // Factory constructor from JSON
  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      productId: json['product_id'] ?? json['id'] ?? 0,
      productName: json['product_name'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
      discountPrice: json['discount_price'] != null 
          ? (json['discount_price']).toDouble() 
          : null,
      primaryImage: json['primary_image'] ?? json['image_url'],
      additionalImages: json['additional_images'] != null 
          ? List<String>.from(json['additional_images'])
          : null,
      brand: json['brand'] ?? '',
      categoryName: json['category_name'] ?? json['category'] ?? '',
      categoryId: json['category_id'],
      stockQuantity: json['stock_quantity'] ?? json['stock'] ?? 0,
      rating: json['rating'] != null ? (json['rating']).toDouble() : null,
      reviewCount: json['review_count'] ?? json['reviews_count'],
      isFeatured: json['is_featured'] ?? false,
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'])
          : null,
      attributes: json['attributes'],
      weight: json['weight'],
      origin: json['origin'],
      roastLevel: json['roast_level'],
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'product_name': productName,
      'description': description,
      'price': price,
      'discount_price': discountPrice,
      'primary_image': primaryImage,
      'additional_images': additionalImages,
      'brand': brand,
      'category_name': categoryName,
      'category_id': categoryId,
      'stock_quantity': stockQuantity,
      'rating': rating,
      'review_count': reviewCount,
      'is_featured': isFeatured,
      'is_active': isActive,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'attributes': attributes,
      'weight': weight,
      'origin': origin,
      'roast_level': roastLevel,
    };
  }

  // Calculate discount percentage
  int get discountPercentage {
    if (discountPrice == null || discountPrice! >= price) return 0;
    return (((price - discountPrice!) / price) * 100).round();
  }

  // Get effective price (discount price if available, otherwise regular price)
  double get effectivePrice => discountPrice ?? price;

  // Calculate savings amount
  double get savingsAmount {
    if (discountPrice == null || discountPrice! >= price) return 0.0;
    return price - discountPrice!;
  }

  // Check if product is on sale
  bool get isOnSale => discountPrice != null && discountPrice! < price;
  
  // Check if product has discount (alias for compatibility)
  bool get hasDiscount => isOnSale;

  // Check if product is in stock
  bool get isInStock => stockQuantity > 0;

  // Check if product is low stock (less than 5 items)
  bool get isLowStock => stockQuantity > 0 && stockQuantity < 5;

  // Check if product is out of stock
  bool get isOutOfStock => stockQuantity <= 0;

  // Get formatted price with currency symbol
  String get formattedPrice => AppConstants.formatPrice(price);

  // Get formatted discount price with currency symbol
  String get formattedDiscountPrice => 
      discountPrice != null ? AppConstants.formatPrice(discountPrice!) : '';

  // Get formatted effective price with currency symbol
  String get formattedEffectivePrice => AppConstants.formatPrice(effectivePrice);

  // Get formatted savings with currency symbol
  String get formattedSavings => AppConstants.formatPrice(savingsAmount);

  // Get absolute image URL
  String get imageUrl => AppConstants.getImageUrl(primaryImage);

  // Get all image URLs (primary + additional)
  List<String> get allImageUrls {
    List<String> urls = [imageUrl];
    if (additionalImages != null) {
      urls.addAll(additionalImages!.map((img) => AppConstants.getImageUrl(img)));
    }
    return urls;
  }

  // Get rating display (e.g., "4.5" or "No rating")
  String get ratingDisplay {
    if (rating == null) return 'No rating';
    return rating!.toStringAsFixed(1);
  }

  // Get review count display (e.g., "(123)" or "(No reviews)")
  String get reviewCountDisplay {
    if (reviewCount == null || reviewCount! == 0) return '(No reviews)';
    return '($reviewCount)';
  }

  // Get stock status text
  String get stockStatusText {
    if (isOutOfStock) return 'Out of Stock';
    if (isLowStock) return 'Only $stockQuantity left';
    return 'In Stock';
  }

  // Copy with method for creating modified instances
  Product copyWith({
    int? productId,
    String? productName,
    String? description,
    double? price,
    double? discountPrice,
    String? primaryImage,
    List<String>? additionalImages,
    String? brand,
    String? categoryName,
    int? categoryId,
    int? stockQuantity,
    double? rating,
    int? reviewCount,
    bool? isFeatured,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? attributes,
    String? weight,
    String? origin,
    String? roastLevel,
  }) {
    return Product(
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      description: description ?? this.description,
      price: price ?? this.price,
      discountPrice: discountPrice ?? this.discountPrice,
      primaryImage: primaryImage ?? this.primaryImage,
      additionalImages: additionalImages ?? this.additionalImages,
      brand: brand ?? this.brand,
      categoryName: categoryName ?? this.categoryName,
      categoryId: categoryId ?? this.categoryId,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      isFeatured: isFeatured ?? this.isFeatured,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      attributes: attributes ?? this.attributes,
      weight: weight ?? this.weight,
      origin: origin ?? this.origin,
      roastLevel: roastLevel ?? this.roastLevel,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Product && other.productId == productId;
  }

  @override
  int get hashCode => productId.hashCode;

  // Check if product matches search query
  bool matchesSearch(String query) {
    final lowercaseQuery = query.toLowerCase();
    return productName.toLowerCase().contains(lowercaseQuery) ||
           description.toLowerCase().contains(lowercaseQuery) ||
           brand.toLowerCase().contains(lowercaseQuery) ||
           categoryName.toLowerCase().contains(lowercaseQuery);
  }

  @override
  String toString() {
    return 'Product{productId: $productId, productName: $productName, price: $price, discountPrice: $discountPrice, brand: $brand, categoryName: $categoryName, stockQuantity: $stockQuantity}';
  }
}

// Product list response model
class ProductListResponse {
  final List<Product> products;
  final int totalCount;
  final int currentPage;
  final int totalPages;
  final bool hasNext;
  final bool hasPrevious;

  ProductListResponse({
    required this.products,
    required this.totalCount,
    required this.currentPage,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrevious,
  });

  factory ProductListResponse.fromJson(Map<String, dynamic> json) {
    return ProductListResponse(
      products: (json['products'] as List<dynamic>?)
          ?.map((item) => Product.fromJson(item))
          .toList() ?? [],
      totalCount: json['total_count'] ?? json['total'] ?? 0,
      currentPage: json['current_page'] ?? json['page'] ?? 1,
      totalPages: json['total_pages'] ?? json['pages'] ?? 1,
      hasNext: json['has_next'] ?? false,
      hasPrevious: json['has_previous'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'products': products.map((product) => product.toJson()).toList(),
      'total_count': totalCount,
      'current_page': currentPage,
      'total_pages': totalPages,
      'has_next': hasNext,
      'has_previous': hasPrevious,
    };
  }
}

// Product filter/search parameters
class ProductFilters {
  final String? search;
  final int? categoryId;
  final String? category;
  final double? minPrice;
  final double? maxPrice;
  final String? sortBy;
  final String? sortOrder;
  final bool? featuredOnly;
  final bool? inStockOnly;
  final int page;
  final int limit;

  ProductFilters({
    this.search,
    this.categoryId,
    this.category,
    this.minPrice,
    this.maxPrice,
    this.sortBy,
    this.sortOrder,
    this.featuredOnly,
    this.inStockOnly,
    this.page = 1,
    this.limit = 20,
  });

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (search != null && search!.isNotEmpty) params['search'] = search;
    if (categoryId != null) params['category_id'] = categoryId;
    if (category != null && category!.isNotEmpty) params['category'] = category;
    if (minPrice != null) params['min_price'] = minPrice;
    if (maxPrice != null) params['max_price'] = maxPrice;
    if (sortBy != null && sortBy!.isNotEmpty) params['sort_by'] = sortBy;
    if (sortOrder != null && sortOrder!.isNotEmpty) params['sort_order'] = sortOrder;
    if (featuredOnly == true) params['featured_only'] = true;
    if (inStockOnly == true) params['in_stock_only'] = true;

    return params;
  }

  ProductFilters copyWith({
    String? search,
    int? categoryId,
    String? category,
    double? minPrice,
    double? maxPrice,
    String? sortBy,
    String? sortOrder,
    bool? featuredOnly,
    bool? inStockOnly,
    int? page,
    int? limit,
  }) {
    return ProductFilters(
      search: search ?? this.search,
      categoryId: categoryId ?? this.categoryId,
      category: category ?? this.category,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
      featuredOnly: featuredOnly ?? this.featuredOnly,
      inStockOnly: inStockOnly ?? this.inStockOnly,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }
}