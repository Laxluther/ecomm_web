import 'product.dart';
import '../../config/constants.dart';

class CartItem {
  final int cartId;
  final int productId;
  final Product product;
  int quantity;
  final DateTime createdAt;
  final DateTime updatedAt;

  CartItem({
    required this.cartId,
    required this.productId,
    required this.product,
    required this.quantity,
    required this.createdAt,
    required this.updatedAt,
  });

  // Factory constructor for creating CartItem from JSON
  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      cartId: json['cart_id'] ?? json['id'] ?? 0,
      productId: json['product_id'] ?? 0,
      product: Product.fromJson(json['product'] as Map<String, dynamic>),
      quantity: json['quantity'] ?? 1,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
    );
  }

  // Method to convert CartItem to JSON
  Map<String, dynamic> toJson() {
    return {
      'cart_id': cartId,
      'product_id': productId,
      'product': product.toJson(),
      'quantity': quantity,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // Copy with method for creating modified instances
  CartItem copyWith({
    int? cartId,
    int? productId,
    Product? product,
    int? quantity,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CartItem(
      cartId: cartId ?? this.cartId,
      productId: productId ?? this.productId,
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Equality operator
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CartItem && 
           other.cartId == cartId && 
           other.productId == productId;
  }

  // Hash code
  @override
  int get hashCode => Object.hash(cartId, productId);

  // String representation
  @override
  String toString() {
    return 'CartItem(cartId: $cartId, productId: $productId, quantity: $quantity, totalPrice: $totalPrice)';
  }

  // Static method to create a list of cart items from JSON array
  static List<CartItem> fromJsonList(List<dynamic> jsonList) {
    return jsonList.map((json) => CartItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  // Computed properties

  // Get unit price (effective price per item)
  double get unitPrice => product.effectivePrice;

  // Get total price for this cart item (quantity * unit price)
  double get totalPrice => unitPrice * quantity;

  // Get original total price (without discount)
  double get originalTotalPrice => product.price * quantity;

  // Get total savings for this cart item
  double get totalSavings => originalTotalPrice - totalPrice;

  // Check if cart item has savings
  bool get hasSavings => totalSavings > 0;

  // Format unit price with currency symbol
  String get formattedUnitPrice => AppConstants.formatPrice(unitPrice);

  // Format total price with currency symbol
  String get formattedTotalPrice => AppConstants.formatPrice(totalPrice);

  // Format original total price with currency symbol
  String get formattedOriginalTotalPrice => AppConstants.formatPrice(originalTotalPrice);

  // Format total savings with currency symbol
  String get formattedTotalSavings => AppConstants.formatPrice(totalSavings);

  // Check if product is available in requested quantity
  bool get isAvailableInQuantity => product.stockQuantity >= quantity;

  // Check if cart item is valid (product is active and in stock)
  bool get isValid => product.isActive && product.isInStock && isAvailableInQuantity;

  // Get availability message
  String get availabilityMessage {
    if (!product.isActive) {
      return 'Product is no longer available';
    }
    if (product.isOutOfStock) {
      return 'Product is out of stock';
    }
    if (!isAvailableInQuantity) {
      return 'Only ${product.stockQuantity} items available';
    }
    return 'Available';
  }

  // Get maximum quantity that can be added
  int get maxQuantity => product.stockQuantity;

  // Check if quantity can be increased
  bool get canIncreaseQuantity => quantity < maxQuantity && quantity < 99;

  // Check if quantity can be decreased
  bool get canDecreaseQuantity => quantity > 1;

  // Get quantity display text
  String get quantityText => quantity.toString();

  // Get weight display text (if product has weight)
  String? get weightText {
    if (product.weight == null) return null;
    return '${product.weight}';
  }

  // Check if this is a bulk purchase (quantity > 5)
  bool get isBulkPurchase => quantity > 5;

  // Get discount percentage for this cart item
  int get discountPercentage => product.discountPercentage;

  // Check if cart item has discount
  bool get hasDiscount => product.isOnSale;

  // Get product name
  String get productName => product.productName;

  // Get product brand
  String get productBrand => product.brand;

  // Get product image URL
  String get productImageUrl => product.imageUrl;

  // Get product rating
  double? get productRating => product.rating;

  // Get formatted product rating
  String get productRatingText => product.ratingDisplay;

  // Check if product is featured
  bool get isFeaturedProduct => product.isFeatured;

  // Get product category
  String get productCategory => product.categoryName;

  // Get product description
  String get productDescription => product.description;

  // Calculate delivery charges (example logic)
  double get deliveryCharges {
    // Free delivery for orders above ₹500
    if (totalPrice >= 500) return 0.0;
    // ₹50 delivery charges for orders below ₹500
    return 50.0;
  }

  // Get formatted delivery charges
  String get formattedDeliveryCharges {
    final charges = deliveryCharges;
    return charges == 0 ? 'Free Delivery' : AppConstants.formatPrice(charges);
  }

  // Get estimated delivery date (example: 3-5 days from now)
  DateTime get estimatedDeliveryDate {
    return DateTime.now().add(const Duration(days: 5));
  }

  // Format estimated delivery date
  String get formattedEstimatedDelivery {
    final deliveryDate = estimatedDeliveryDate;
    final daysFromNow = deliveryDate.difference(DateTime.now()).inDays;
    
    if (daysFromNow <= 1) {
      return 'Tomorrow';
    } else if (daysFromNow <= 7) {
      return 'Within $daysFromNow days';
    } else {
      final monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${deliveryDate.day} ${monthNames[deliveryDate.month - 1]}';
    }
  }

  // Additional helper methods
  
  // Create CartItem for adding to cart
  factory CartItem.createForCart({
    required Product product,
    int quantity = 1,
  }) {
    return CartItem(
      cartId: 0, // Will be set by server
      productId: product.productId,
      product: product,
      quantity: quantity,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  // Update quantity
  CartItem updateQuantity(int newQuantity) {
    return copyWith(
      quantity: newQuantity.clamp(1, maxQuantity),
      updatedAt: DateTime.now(),
    );
  }

  // Increase quantity by 1
  CartItem increaseQuantity() {
    if (!canIncreaseQuantity) return this;
    return updateQuantity(quantity + 1);
  }

  // Decrease quantity by 1
  CartItem decreaseQuantity() {
    if (!canDecreaseQuantity) return this;
    return updateQuantity(quantity - 1);
  }

  // Set quantity to specific value with validation
  CartItem setQuantity(int newQuantity) {
    if (newQuantity <= 0) return this;
    if (newQuantity > maxQuantity) newQuantity = maxQuantity;
    return updateQuantity(newQuantity);
  }

  // Check if item matches product
  bool isForProduct(int productId) => this.productId == productId;

  // Get cart item age in days
  int get ageInDays => DateTime.now().difference(createdAt).inDays;

  // Check if cart item is stale (older than 30 days)
  bool get isStale => ageInDays > 30;

  // Get priority score for sorting (considers various factors)
  double get priorityScore {
    double score = 0.0;
    
    // Higher score for featured products
    if (isFeaturedProduct) score += 10.0;
    
    // Higher score for discounted products
    if (hasDiscount) score += 5.0;
    
    // Higher score for higher quantity
    score += quantity * 1.0;
    
    // Lower score for older items
    score -= ageInDays * 0.1;
    
    // Higher score for higher rated products
    if (productRating != null) score += productRating! * 2.0;
    
    return score;
  }
}

// Cart Summary Model
class CartSummary {
  final List<CartItem> items;
  final int totalItems;
  final int totalQuantity;
  final double subtotal;
  final double totalSavings;
  final double deliveryCharges;
  final double totalAmount;
  final bool hasInvalidItems;

  CartSummary({
    required this.items,
    required this.totalItems,
    required this.totalQuantity,
    required this.subtotal,
    required this.totalSavings,
    required this.deliveryCharges,
    required this.totalAmount,
    required this.hasInvalidItems,
  });

  // Factory constructor for creating CartSummary from cart items
  factory CartSummary.fromCartItems(List<CartItem> cartItems) {
    final validItems = cartItems.where((item) => item.isValid).toList();
    
    final totalItems = validItems.length;
    final totalQuantity = validItems.fold<int>(
      0, 
      (sum, item) => sum + item.quantity,
    );
    
    final subtotal = validItems.fold<double>(
      0.0, 
      (sum, item) => sum + item.totalPrice,
    );
    
    final totalSavings = validItems.fold<double>(
      0.0, 
      (sum, item) => sum + item.totalSavings,
    );
    
    // Calculate delivery charges (free for orders above ₹500)
    final deliveryCharges = subtotal >= 500 ? 0.0 : 50.0;
    
    final totalAmount = subtotal + deliveryCharges;
    
    final hasInvalidItems = cartItems.any((item) => !item.isValid);
    
    return CartSummary(
      items: validItems,
      totalItems: totalItems,
      totalQuantity: totalQuantity,
      subtotal: subtotal,
      totalSavings: totalSavings,
      deliveryCharges: deliveryCharges,
      totalAmount: totalAmount,
      hasInvalidItems: hasInvalidItems,
    );
  }

  // Check if cart is empty
  bool get isEmpty => totalItems == 0;

  // Check if cart has items
  bool get isNotEmpty => totalItems > 0;

  // Format subtotal with currency symbol
  String get formattedSubtotal => AppConstants.formatPrice(subtotal);

  // Format total savings with currency symbol
  String get formattedTotalSavings => AppConstants.formatPrice(totalSavings);

  // Format delivery charges with currency symbol
  String get formattedDeliveryCharges {
    return deliveryCharges == 0 ? 'Free' : AppConstants.formatPrice(deliveryCharges);
  }

  // Format total amount with currency symbol
  String get formattedTotalAmount => AppConstants.formatPrice(totalAmount);

  // Get items count text
  String get itemsCountText {
    if (totalItems == 0) return 'No items';
    if (totalItems == 1) return '1 item';
    return '$totalItems items';
  }

  // Get quantity count text
  String get quantityCountText {
    if (totalQuantity == 0) return 'No items';
    if (totalQuantity == 1) return '1 item';
    return '$totalQuantity items';
  }

  // Check if eligible for free delivery
  bool get isEligibleForFreeDelivery => subtotal >= 500;

  // Get amount needed for free delivery
  double get amountNeededForFreeDelivery {
    return isEligibleForFreeDelivery ? 0.0 : (500 - subtotal);
  }

  // Format amount needed for free delivery
  String get formattedAmountNeededForFreeDelivery => 
      AppConstants.formatPrice(amountNeededForFreeDelivery);

  // Check if cart has savings
  bool get hasSavings => totalSavings > 0;

  // Get savings percentage
  double get savingsPercentage {
    final originalTotal = subtotal + totalSavings;
    return originalTotal > 0 ? (totalSavings / originalTotal) * 100 : 0.0;
  }

  // Format savings percentage
  String get formattedSavingsPercentage => '${savingsPercentage.toStringAsFixed(0)}%';
}