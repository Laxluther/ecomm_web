import '../../config/constants.dart';

class Category {
  final int categoryId;
  final String name;
  final String? description;
  final String? imageUrl;
  final String? iconUrl;
  final int? parentId;
  final bool isActive;
  final int sortOrder;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<Category>? subcategories;
  final int? productCount;

  Category({
    required this.categoryId,
    required this.name,
    this.description,
    this.imageUrl,
    this.iconUrl,
    this.parentId,
    this.isActive = true,
    this.sortOrder = 0,
    this.createdAt,
    this.updatedAt,
    this.subcategories,
    this.productCount,
  });

  // Factory constructor from JSON
  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      categoryId: json['category_id'] ?? json['id'] ?? 0,
      name: json['name'] ?? json['category_name'] ?? '',
      description: json['description'],
      imageUrl: json['image_url'] ?? json['image'],
      iconUrl: json['icon_url'] ?? json['icon'],
      parentId: json['parent_id'],
      isActive: json['is_active'] ?? true,
      sortOrder: json['sort_order'] ?? 0,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'])
          : null,
      subcategories: json['subcategories'] != null
          ? (json['subcategories'] as List<dynamic>)
              .map((item) => Category.fromJson(item))
              .toList()
          : null,
      productCount: json['product_count'],
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'category_id': categoryId,
      'name': name,
      'description': description,
      'image_url': imageUrl,
      'icon_url': iconUrl,
      'parent_id': parentId,
      'is_active': isActive,
      'sort_order': sortOrder,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'subcategories': subcategories?.map((cat) => cat.toJson()).toList(),
      'product_count': productCount,
    };
  }

  // Get absolute image URL
  String get absoluteImageUrl => AppConstants.getImageUrl(imageUrl);

  // Get absolute icon URL
  String get absoluteIconUrl => AppConstants.getImageUrl(iconUrl);

  // Check if category is a root category (no parent)
  bool get isRootCategory => parentId == null;

  // Check if category has subcategories
  bool get hasSubcategories => 
      subcategories != null && subcategories!.isNotEmpty;

  // Get product count display (e.g., "24 products" or "No products")
  String get productCountDisplay {
    if (productCount == null || productCount! == 0) {
      return 'No products';
    }
    return '$productCount product${productCount! == 1 ? '' : 's'}';
  }

  // Get category hierarchy path (e.g., "Coffee > Espresso")
  String getCategoryPath(List<Category> allCategories) {
    if (parentId == null) return name;
    
    final parent = allCategories.firstWhere(
      (cat) => cat.categoryId == parentId,
      orElse: () => Category(categoryId: -1, name: 'Unknown'),
    );
    
    if (parent.categoryId == -1) return name;
    return '${parent.getCategoryPath(allCategories)} > $name';
  }

  // Copy with method for creating modified instances
  Category copyWith({
    int? categoryId,
    String? name,
    String? description,
    String? imageUrl,
    String? iconUrl,
    int? parentId,
    bool? isActive,
    int? sortOrder,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<Category>? subcategories,
    int? productCount,
  }) {
    return Category(
      categoryId: categoryId ?? this.categoryId,
      name: name ?? this.name,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      iconUrl: iconUrl ?? this.iconUrl,
      parentId: parentId ?? this.parentId,
      isActive: isActive ?? this.isActive,
      sortOrder: sortOrder ?? this.sortOrder,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      subcategories: subcategories ?? this.subcategories,
      productCount: productCount ?? this.productCount,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Category && other.categoryId == categoryId;
  }

  @override
  int get hashCode => categoryId.hashCode;

  @override
  String toString() {
    return 'Category{categoryId: $categoryId, name: $name, parentId: $parentId, isActive: $isActive, productCount: $productCount}';
  }
}

// Category tree helper class
class CategoryTree {
  final List<Category> categories;

  CategoryTree(this.categories);

  // Get root categories (categories without parent)
  List<Category> get rootCategories {
    return categories
        .where((category) => category.isRootCategory && category.isActive)
        .toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
  }

  // Get subcategories for a given parent category
  List<Category> getSubcategories(int parentId) {
    return categories
        .where((category) => 
            category.parentId == parentId && category.isActive)
        .toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
  }

  // Get category by ID
  Category? getCategoryById(int categoryId) {
    try {
      return categories.firstWhere((cat) => cat.categoryId == categoryId);
    } catch (e) {
      return null;
    }
  }

  // Get category by name
  Category? getCategoryByName(String name) {
    try {
      return categories.firstWhere(
        (cat) => cat.name.toLowerCase() == name.toLowerCase(),
      );
    } catch (e) {
      return null;
    }
  }

  // Search categories by name
  List<Category> searchCategories(String query) {
    final lowercaseQuery = query.toLowerCase();
    return categories
        .where((category) =>
            category.name.toLowerCase().contains(lowercaseQuery) ||
            (category.description?.toLowerCase().contains(lowercaseQuery) ?? false))
        .toList();
  }

  // Get all categories in a flat list (including subcategories)
  List<Category> get flatCategories {
    return categories.where((cat) => cat.isActive).toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  // Build hierarchical structure
  List<Category> buildHierarchy() {
    final Map<int, List<Category>> childrenMap = {};
    
    // Group categories by parent ID
    for (final category in categories.where((cat) => cat.isActive)) {
      final parentId = category.parentId ?? 0; // Use 0 for root categories
      childrenMap[parentId] = childrenMap[parentId] ?? [];
      childrenMap[parentId]!.add(category);
    }
    
    // Build hierarchy recursively
    List<Category> buildChildren(int parentId) {
      final children = childrenMap[parentId] ?? [];
      return children.map((child) {
        final subcategories = buildChildren(child.categoryId);
        return child.copyWith(
          subcategories: subcategories.isEmpty ? null : subcategories,
        );
      }).toList()
        ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    }
    
    return buildChildren(0); // Start with root categories
  }
}

// Category response model
class CategoryListResponse {
  final List<Category> categories;
  final int totalCount;

  CategoryListResponse({
    required this.categories,
    required this.totalCount,
  });

  factory CategoryListResponse.fromJson(Map<String, dynamic> json) {
    return CategoryListResponse(
      categories: (json['categories'] as List<dynamic>?)
          ?.map((item) => Category.fromJson(item))
          .toList() ?? [],
      totalCount: json['total_count'] ?? json['total'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'categories': categories.map((category) => category.toJson()).toList(),
      'total_count': totalCount,
    };
  }
}

// Category filter parameters
class CategoryFilters {
  final int? parentId;
  final bool? includeInactive;
  final String? search;

  CategoryFilters({
    this.parentId,
    this.includeInactive,
    this.search,
  });

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};

    if (parentId != null) params['parent_id'] = parentId;
    if (includeInactive == true) params['include_inactive'] = true;
    if (search != null && search!.isNotEmpty) params['search'] = search;

    return params;
  }
}