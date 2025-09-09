import 'product.dart';
import 'address.dart';
import '../../config/constants.dart';

class Order {
  final String orderId;
  final int userId;
  final String orderNumber;
  final OrderStatus status;
  final List<OrderItem> items;
  final Address deliveryAddress;
  final double subtotal;
  final double deliveryCharges;
  final double totalAmount;
  final double totalSavings;
  final String paymentMethod;
  final String? paymentId;
  final String? couponCode;
  final double? couponDiscount;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? expectedDeliveryDate;
  final DateTime? deliveredAt;
  final List<OrderStatusUpdate>? statusHistory;

  Order({
    required this.orderId,
    required this.userId,
    required this.orderNumber,
    required this.status,
    required this.items,
    required this.deliveryAddress,
    required this.subtotal,
    required this.deliveryCharges,
    required this.totalAmount,
    required this.totalSavings,
    required this.paymentMethod,
    this.paymentId,
    this.couponCode,
    this.couponDiscount,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.expectedDeliveryDate,
    this.deliveredAt,
    this.statusHistory,
  });

  // Factory constructor for creating Order from JSON
  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['order_id'] ?? json['id'] ?? '',
      userId: json['user_id'] ?? 0,
      orderNumber: json['order_number'] ?? json['number'] ?? '',
      status: OrderStatus.fromString(json['status'] ?? 'pending'),
      items: json['items'] != null 
          ? OrderItem.fromJsonList(json['items'] as List<dynamic>)
          : [],
      deliveryAddress: Address.fromJson(json['delivery_address'] as Map<String, dynamic>),
      subtotal: (json['subtotal'] ?? 0.0).toDouble(),
      deliveryCharges: (json['delivery_charges'] ?? 0.0).toDouble(),
      totalAmount: (json['total_amount'] ?? 0.0).toDouble(),
      totalSavings: (json['total_savings'] ?? 0.0).toDouble(),
      paymentMethod: json['payment_method'] ?? 'cod',
      paymentId: json['payment_id'],
      couponCode: json['coupon_code'],
      couponDiscount: (json['coupon_discount'] ?? 0.0).toDouble(),
      notes: json['notes'],
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
      expectedDeliveryDate: json['expected_delivery_date'] != null
          ? DateTime.parse(json['expected_delivery_date'])
          : null,
      deliveredAt: json['delivered_at'] != null
          ? DateTime.parse(json['delivered_at'])
          : null,
      statusHistory: json['status_history'] != null
          ? OrderStatusUpdate.fromJsonList(json['status_history'] as List<dynamic>)
          : null,
    );
  }

  // Method to convert Order to JSON
  Map<String, dynamic> toJson() {
    return {
      'order_id': orderId,
      'user_id': userId,
      'order_number': orderNumber,
      'status': status.toString(),
      'items': items.map((item) => item.toJson()).toList(),
      'delivery_address': deliveryAddress.toJson(),
      'subtotal': subtotal,
      'delivery_charges': deliveryCharges,
      'total_amount': totalAmount,
      'total_savings': totalSavings,
      'payment_method': paymentMethod,
      'payment_id': paymentId,
      'coupon_code': couponCode,
      'coupon_discount': couponDiscount,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'expected_delivery_date': expectedDeliveryDate?.toIso8601String(),
      'delivered_at': deliveredAt?.toIso8601String(),
      'status_history': statusHistory?.map((update) => update.toJson()).toList(),
    };
  }

  // Static method to create a list of orders from JSON array
  static List<Order> fromJsonList(List<dynamic> jsonList) {
    return jsonList.map((json) => Order.fromJson(json as Map<String, dynamic>)).toList();
  }

  // Computed properties

  // Get formatted order ID
  String get formattedOrderId => '#$orderNumber';

  // Get total items count
  int get totalItems => items.length;

  // Get total quantity
  int get totalQuantity => items.fold(0, (sum, item) => sum + item.quantity);

  // Format total amount with currency symbol
  String get formattedTotalAmount => AppConstants.formatPrice(totalAmount);

  // Format subtotal with currency symbol
  String get formattedSubtotal => AppConstants.formatPrice(subtotal);

  // Format delivery charges with currency symbol
  String get formattedDeliveryCharges {
    return deliveryCharges == 0 ? 'Free' : AppConstants.formatPrice(deliveryCharges);
  }

  // Format total savings with currency symbol
  String get formattedTotalSavings => AppConstants.formatPrice(totalSavings);

  // Format coupon discount with currency symbol
  String get formattedCouponDiscount => 
      couponDiscount != null ? AppConstants.formatPrice(couponDiscount!) : '';

  // Check if order has savings
  bool get hasSavings => totalSavings > 0;

  // Get order status display text
  String get statusDisplayText => status.displayText;

  // Get order status color
  String get statusColor => status.colorHex;

  // Check if order can be cancelled
  bool get canBeCancelled => status.canBeCancelled;

  // Check if order can be returned
  bool get canBeReturned => status.canBeReturned && _isReturnEligible();

  // Check if return period is still valid (30 days)
  bool _isReturnEligible() {
    if (deliveredAt == null) return false;
    final daysSinceDelivery = DateTime.now().difference(deliveredAt!).inDays;
    return daysSinceDelivery <= 30;
  }

  // Get order date formatted
  String get formattedOrderDate {
    final monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${createdAt.day} ${monthNames[createdAt.month - 1]} ${createdAt.year}';
  }

  // Get expected delivery date formatted
  String? get formattedExpectedDeliveryDate {
    if (expectedDeliveryDate == null) return null;
    final monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${expectedDeliveryDate!.day} ${monthNames[expectedDeliveryDate!.month - 1]} ${expectedDeliveryDate!.year}';
  }

  // Get delivery status text
  String get deliveryStatusText {
    if (status == OrderStatus.delivered && deliveredAt != null) {
      return 'Delivered on ${_formatDate(deliveredAt!)}';
    } else if (expectedDeliveryDate != null) {
      final daysLeft = expectedDeliveryDate!.difference(DateTime.now()).inDays;
      if (daysLeft < 0) {
        return 'Delivery overdue';
      } else if (daysLeft == 0) {
        return 'Delivering today';
      } else if (daysLeft == 1) {
        return 'Delivering tomorrow';
      } else {
        return 'Delivering in $daysLeft days';
      }
    }
    return statusDisplayText;
  }

  String _formatDate(DateTime date) {
    final monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day} ${monthNames[date.month - 1]} ${date.year}';
  }

  // Get items summary text
  String get itemsSummaryText {
    if (totalItems == 1) {
      return '1 item';
    }
    return '$totalItems items';
  }

  // Get quantity summary text
  String get quantitySummaryText {
    if (totalQuantity == 1) {
      return '1 item';
    }
    return '$totalQuantity items';
  }

  // Get payment method display text
  String get paymentMethodDisplayText {
    switch (paymentMethod.toLowerCase()) {
      case 'cod':
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      case 'online':
      case 'card':
        return 'Online Payment';
      case 'wallet':
        return 'Wallet';
      case 'upi':
        return 'UPI';
      default:
        return paymentMethod;
    }
  }

  // Check if payment is pending
  bool get isPaymentPending => paymentMethod.toLowerCase() == 'cod' && 
                               status != OrderStatus.delivered && 
                               status != OrderStatus.cancelled;

  // Get first item for display
  OrderItem? get firstItem => items.isNotEmpty ? items.first : null;

  // Get main product image
  String get mainProductImage => 
      firstItem?.product.imageUrl ?? AppConstants.placeholderImagePath;

  // Get order progress percentage
  double get progressPercentage => status.progressPercentage;

  // Check if order is recent (within last 7 days)
  bool get isRecent {
    final daysSinceOrder = DateTime.now().difference(createdAt).inDays;
    return daysSinceOrder <= 7;
  }

  // Get time since order
  String get timeSinceOrder {
    final now = DateTime.now();
    final difference = now.difference(createdAt);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hours ago';
    } else {
      return '${difference.inDays} days ago';
    }
  }

  // Additional Order methods and properties

  // Copy with method for creating modified instances
  Order copyWith({
    String? orderId,
    int? userId,
    String? orderNumber,
    OrderStatus? status,
    List<OrderItem>? items,
    Address? deliveryAddress,
    double? subtotal,
    double? deliveryCharges,
    double? totalAmount,
    double? totalSavings,
    String? paymentMethod,
    String? paymentId,
    String? couponCode,
    double? couponDiscount,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? expectedDeliveryDate,
    DateTime? deliveredAt,
    List<OrderStatusUpdate>? statusHistory,
  }) {
    return Order(
      orderId: orderId ?? this.orderId,
      userId: userId ?? this.userId,
      orderNumber: orderNumber ?? this.orderNumber,
      status: status ?? this.status,
      items: items ?? this.items,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      subtotal: subtotal ?? this.subtotal,
      deliveryCharges: deliveryCharges ?? this.deliveryCharges,
      totalAmount: totalAmount ?? this.totalAmount,
      totalSavings: totalSavings ?? this.totalSavings,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentId: paymentId ?? this.paymentId,
      couponCode: couponCode ?? this.couponCode,
      couponDiscount: couponDiscount ?? this.couponDiscount,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      expectedDeliveryDate: expectedDeliveryDate ?? this.expectedDeliveryDate,
      deliveredAt: deliveredAt ?? this.deliveredAt,
      statusHistory: statusHistory ?? this.statusHistory,
    );
  }

  // Equality operator
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Order && other.orderId == orderId;
  }

  // Hash code
  @override
  int get hashCode => orderId.hashCode;

  // String representation
  @override
  String toString() {
    return 'Order(orderId: $orderId, orderNumber: $orderNumber, status: $status, totalAmount: $totalAmount)';
  }

  // Check if order has coupon applied
  bool get hasCouponApplied => couponCode != null && couponCode!.isNotEmpty;

  // Get coupon discount percentage
  double get couponDiscountPercentage {
    if (couponDiscount == null || subtotal == 0) return 0.0;
    return (couponDiscount! / subtotal) * 100;
  }

  // Get total discount (savings + coupon)
  double get totalDiscount => totalSavings + (couponDiscount ?? 0.0);

  // Get formatted total discount
  String get formattedTotalDiscount => AppConstants.formatPrice(totalDiscount);

  // Check if order has any discount
  bool get hasDiscount => totalDiscount > 0;

  // Get order value before any discounts
  double get originalOrderValue => subtotal + totalSavings + (couponDiscount ?? 0.0);

  // Get formatted original order value
  String get formattedOriginalOrderValue => AppConstants.formatPrice(originalOrderValue);

  // Get savings percentage
  double get savingsPercentage {
    if (originalOrderValue == 0) return 0.0;
    return (totalDiscount / originalOrderValue) * 100;
  }

  // Get formatted savings percentage
  String get formattedSavingsPercentage => '${savingsPercentage.toStringAsFixed(0)}%';

  // Check if free delivery was applied
  bool get hasFreeDelivery => deliveryCharges == 0.0;

  // Check if order is eligible for return
  bool get isEligibleForReturn {
    if (!canBeReturned) return false;
    if (deliveredAt == null) return false;
    
    final daysSinceDelivery = DateTime.now().difference(deliveredAt!).inDays;
    return daysSinceDelivery <= 30; // 30 day return policy
  }

  // Get return deadline
  DateTime? get returnDeadline {
    if (deliveredAt == null) return null;
    return deliveredAt!.add(const Duration(days: 30));
  }

  // Get days left for return
  int get daysLeftForReturn {
    if (returnDeadline == null) return 0;
    final daysLeft = returnDeadline!.difference(DateTime.now()).inDays;
    return daysLeft < 0 ? 0 : daysLeft;
  }

  // Get formatted return deadline
  String? get formattedReturnDeadline {
    if (returnDeadline == null) return null;
    return _formatDate(returnDeadline!);
  }

  // Check if order is delivered and within return period
  bool get canInitiateReturn => isEligibleForReturn && daysLeftForReturn > 0;

  // Get expected delivery status
  String get expectedDeliveryStatus {
    if (expectedDeliveryDate == null) return 'Delivery date not available';
    
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final deliveryDate = DateTime(
      expectedDeliveryDate!.year, 
      expectedDeliveryDate!.month, 
      expectedDeliveryDate!.day
    );
    
    final daysDifference = deliveryDate.difference(today).inDays;
    
    if (daysDifference < 0) {
      return 'Delivery overdue by ${-daysDifference} day${-daysDifference == 1 ? '' : 's'}';
    } else if (daysDifference == 0) {
      return 'Expected today';
    } else if (daysDifference == 1) {
      return 'Expected tomorrow';
    } else {
      return 'Expected in $daysDifference days';
    }
  }

  // Get delivery urgency level
  String get deliveryUrgency {
    if (expectedDeliveryDate == null) return 'normal';
    
    final daysLeft = expectedDeliveryDate!.difference(DateTime.now()).inDays;
    
    if (daysLeft < 0) return 'overdue';
    if (daysLeft == 0) return 'urgent';
    if (daysLeft == 1) return 'high';
    if (daysLeft <= 2) return 'medium';
    return 'normal';
  }

  // Check if order requires attention
  bool get requiresAttention {
    return deliveryUrgency == 'overdue' || 
           deliveryUrgency == 'urgent' ||
           status == OrderStatus.cancelled ||
           isPaymentPending;
  }

  // Get order priority score for sorting
  double get priorityScore {
    double score = 0.0;
    
    // Higher score for recent orders
    final ageInDays = DateTime.now().difference(createdAt).inDays;
    score += (30 - ageInDays).clamp(0, 30) * 1.0;
    
    // Higher score for urgent deliveries
    switch (deliveryUrgency) {
      case 'overdue':
        score += 100.0;
        break;
      case 'urgent':
        score += 80.0;
        break;
      case 'high':
        score += 60.0;
        break;
      case 'medium':
        score += 40.0;
        break;
    }
    
    // Higher score for active orders
    if (status.progressPercentage > 0 && status.progressPercentage < 1.0) {
      score += 50.0;
    }
    
    // Higher score for larger orders
    score += totalAmount * 0.01;
    
    return score;
  }

  // Factory constructor for creating order from cart
  factory Order.fromCart({
    required int userId,
    required String orderNumber,
    required List<OrderItem> items,
    required Address deliveryAddress,
    required double subtotal,
    required double deliveryCharges,
    required String paymentMethod,
    String? couponCode,
    double? couponDiscount,
    String? notes,
  }) {
    final totalSavings = items.fold<double>(0.0, (sum, item) {
      final originalPrice = item.product.price * item.quantity;
      return sum + (originalPrice - item.totalPrice);
    });

    final totalAmount = subtotal + deliveryCharges - (couponDiscount ?? 0.0);

    return Order(
      orderId: '', // Will be set by server
      userId: userId,
      orderNumber: orderNumber,
      status: OrderStatus.pending,
      items: items,
      deliveryAddress: deliveryAddress,
      subtotal: subtotal,
      deliveryCharges: deliveryCharges,
      totalAmount: totalAmount,
      totalSavings: totalSavings,
      paymentMethod: paymentMethod,
      couponCode: couponCode,
      couponDiscount: couponDiscount,
      notes: notes,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  // Get delivery charges saved text
  String get deliveryChargesSavedText {
    if (!hasFreeDelivery) return '';
    
    // Estimate what delivery charges would have been
    final estimatedCharges = deliveryAddress.isMetroCity ? 40.0 : 60.0;
    return 'You saved ${AppConstants.formatPrice(estimatedCharges)} on delivery';
  }

  // Check if order contains specific product
  bool containsProduct(int productId) {
    return items.any((item) => item.productId == productId);
  }

  // Get quantity of specific product in order
  int getProductQuantity(int productId) {
    final item = items.where((item) => item.productId == productId).firstOrNull;
    return item?.quantity ?? 0;
  }

  // Get all unique brands in the order
  List<String> get uniqueBrands {
    final brands = items.map((item) => item.product.brand).toSet();
    return brands.toList()..sort();
  }

  // Get all unique categories in the order
  List<String> get uniqueCategories {
    final categories = items.map((item) => item.product.categoryName).toSet();
    return categories.toList()..sort();
  }

  // Check if order is bulk order (more than 10 items total quantity)
  bool get isBulkOrder => totalQuantity > 10;

  // Get estimated packaging requirements
  String get estimatedPackaging {
    if (totalQuantity <= 3) return 'Small package';
    if (totalQuantity <= 8) return 'Medium package';
    return 'Large package';
  }
}

// Order list response model
class OrderListResponse {
  final List<Order> orders;
  final int totalCount;
  final int currentPage;
  final int totalPages;
  final bool hasNext;
  final bool hasPrevious;

  OrderListResponse({
    required this.orders,
    required this.totalCount,
    required this.currentPage,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrevious,
  });

  factory OrderListResponse.fromJson(Map<String, dynamic> json) {
    return OrderListResponse(
      orders: (json['orders'] as List<dynamic>?)
          ?.map((item) => Order.fromJson(item))
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
      'orders': orders.map((order) => order.toJson()).toList(),
      'total_count': totalCount,
      'current_page': currentPage,
      'total_pages': totalPages,
      'has_next': hasNext,
      'has_previous': hasPrevious,
    };
  }

  // Get orders by status
  List<Order> getOrdersByStatus(OrderStatus status) {
    return orders.where((order) => order.status == status).toList();
  }

  // Get active orders (not delivered, cancelled, returned, or refunded)
  List<Order> get activeOrders {
    const activeStatuses = [
      OrderStatus.pending,
      OrderStatus.confirmed,
      OrderStatus.processing,
      OrderStatus.packed,
      OrderStatus.shipped,
      OrderStatus.outForDelivery,
    ];
    return orders.where((order) => activeStatuses.contains(order.status)).toList();
  }

  // Get completed orders (delivered)
  List<Order> get completedOrders => getOrdersByStatus(OrderStatus.delivered);

  // Get cancelled orders
  List<Order> get cancelledOrders => getOrdersByStatus(OrderStatus.cancelled);

  // Get orders sorted by priority
  List<Order> get sortedOrdersByPriority {
    final sorted = List<Order>.from(orders);
    sorted.sort((a, b) => b.priorityScore.compareTo(a.priorityScore));
    return sorted;
  }

  // Get recent orders (within last 30 days)
  List<Order> get recentOrders {
    final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30));
    return orders.where((order) => order.createdAt.isAfter(thirtyDaysAgo)).toList();
  }
}

// Order Item Model
class OrderItem {
  final int orderItemId;
  final String orderId;
  final int productId;
  final Product product;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  OrderItem({
    required this.orderItemId,
    required this.orderId,
    required this.productId,
    required this.product,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  // Factory constructor for creating OrderItem from JSON
  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      orderItemId: json['order_item_id'] as int,
      orderId: json['order_id'] as String,
      productId: json['product_id'] as int,
      product: Product.fromJson(json['product'] as Map<String, dynamic>),
      quantity: json['quantity'] as int,
      unitPrice: (json['unit_price'] as num).toDouble(),
      totalPrice: (json['total_price'] as num).toDouble(),
    );
  }

  // Method to convert OrderItem to JSON
  Map<String, dynamic> toJson() {
    return {
      'order_item_id': orderItemId,
      'order_id': orderId,
      'product_id': productId,
      'product': product.toJson(),
      'quantity': quantity,
      'unit_price': unitPrice,
      'total_price': totalPrice,
    };
  }

  // Static method to create a list of order items from JSON array
  static List<OrderItem> fromJsonList(List<dynamic> jsonList) {
    return jsonList.map((json) => OrderItem.fromJson(json as Map<String, dynamic>)).toList();
  }

  // Format unit price with currency symbol
  String get formattedUnitPrice => AppConstants.formatPrice(unitPrice);

  // Format total price with currency symbol
  String get formattedTotalPrice => AppConstants.formatPrice(totalPrice);

  // Get quantity display text
  String get quantityText => 'Qty: $quantity';

  // Get product name
  String get productName => product.productName;

  // Get product brand
  String get productBrand => product.brand;

  // Get product image URL
  String get productImageUrl => product.imageUrl;

  // Check if item has discount
  bool get hasDiscount => unitPrice < product.price;

  // Get discount amount per unit
  double get discountPerUnit => product.price - unitPrice;

  // Get total discount for this item
  double get totalDiscount => discountPerUnit * quantity;

  // Get formatted total discount
  String get formattedTotalDiscount => AppConstants.formatPrice(totalDiscount);

  // Get original total price (without discount)
  double get originalTotalPrice => product.price * quantity;

  // Get formatted original total price
  String get formattedOriginalTotalPrice => AppConstants.formatPrice(originalTotalPrice);

  // Copy with method
  OrderItem copyWith({
    int? orderItemId,
    String? orderId,
    int? productId,
    Product? product,
    int? quantity,
    double? unitPrice,
    double? totalPrice,
  }) {
    return OrderItem(
      orderItemId: orderItemId ?? this.orderItemId,
      orderId: orderId ?? this.orderId,
      productId: productId ?? this.productId,
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      totalPrice: totalPrice ?? this.totalPrice,
    );
  }

  // Equality operator
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is OrderItem && 
           other.orderItemId == orderItemId && 
           other.productId == productId;
  }

  // Hash code
  @override
  int get hashCode => Object.hash(orderItemId, productId);

  // String representation
  @override
  String toString() {
    return 'OrderItem(orderItemId: $orderItemId, productId: $productId, quantity: $quantity, totalPrice: $totalPrice)';
  }

  // Factory constructor for creating from cart item
  factory OrderItem.fromCartItem({
    required String orderId,
    required int productId,
    required Product product,
    required int quantity,
    required double unitPrice,
  }) {
    return OrderItem(
      orderItemId: 0, // Will be set by server
      orderId: orderId,
      productId: productId,
      product: product,
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: unitPrice * quantity,
    );
  }
}

// Order Status Enum
enum OrderStatus {
  pending,
  confirmed,
  processing,
  packed,
  shipped,
  outForDelivery,
  delivered,
  cancelled,
  returned,
  refunded;

  // Factory constructor for creating OrderStatus from string
  static OrderStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return OrderStatus.pending;
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'processing':
        return OrderStatus.processing;
      case 'packed':
        return OrderStatus.packed;
      case 'shipped':
        return OrderStatus.shipped;
      case 'out_for_delivery':
        return OrderStatus.outForDelivery;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      case 'returned':
        return OrderStatus.returned;
      case 'refunded':
        return OrderStatus.refunded;
      default:
        return OrderStatus.pending;
    }
  }

  // Get display text for status
  String get displayText {
    switch (this) {
      case OrderStatus.pending:
        return 'Order Placed';
      case OrderStatus.confirmed:
        return 'Order Confirmed';
      case OrderStatus.processing:
        return 'Processing';
      case OrderStatus.packed:
        return 'Packed';
      case OrderStatus.shipped:
        return 'Shipped';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
      case OrderStatus.returned:
        return 'Returned';
      case OrderStatus.refunded:
        return 'Refunded';
    }
  }

  // Get color hex for status
  String get colorHex {
    switch (this) {
      case OrderStatus.pending:
        return '#FF9800'; // Orange
      case OrderStatus.confirmed:
        return '#2196F3'; // Blue
      case OrderStatus.processing:
        return '#2196F3'; // Blue
      case OrderStatus.packed:
        return '#9C27B0'; // Purple
      case OrderStatus.shipped:
        return '#FF5722'; // Deep Orange
      case OrderStatus.outForDelivery:
        return '#FF5722'; // Deep Orange
      case OrderStatus.delivered:
        return '#4CAF50'; // Green
      case OrderStatus.cancelled:
        return '#F44336'; // Red
      case OrderStatus.returned:
        return '#FF9800'; // Orange
      case OrderStatus.refunded:
        return '#4CAF50'; // Green
    }
  }

  // Get progress percentage
  double get progressPercentage {
    switch (this) {
      case OrderStatus.pending:
        return 0.1;
      case OrderStatus.confirmed:
        return 0.2;
      case OrderStatus.processing:
        return 0.4;
      case OrderStatus.packed:
        return 0.6;
      case OrderStatus.shipped:
        return 0.7;
      case OrderStatus.outForDelivery:
        return 0.9;
      case OrderStatus.delivered:
        return 1.0;
      case OrderStatus.cancelled:
      case OrderStatus.returned:
      case OrderStatus.refunded:
        return 0.0;
    }
  }

  // Check if order can be cancelled
  bool get canBeCancelled {
    return this == OrderStatus.pending || 
           this == OrderStatus.confirmed || 
           this == OrderStatus.processing;
  }

  // Check if order can be returned
  bool get canBeReturned {
    return this == OrderStatus.delivered;
  }

  @override
  String toString() {
    return name;
  }
}

// Order Status Update Model
class OrderStatusUpdate {
  final int id;
  final String orderId;
  final OrderStatus status;
  final String? message;
  final DateTime timestamp;

  OrderStatusUpdate({
    required this.id,
    required this.orderId,
    required this.status,
    this.message,
    required this.timestamp,
  });

  // Factory constructor for creating OrderStatusUpdate from JSON
  factory OrderStatusUpdate.fromJson(Map<String, dynamic> json) {
    return OrderStatusUpdate(
      id: json['id'] as int,
      orderId: json['order_id'] as String,
      status: OrderStatus.fromString(json['status'] as String),
      message: json['message'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  // Method to convert OrderStatusUpdate to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'status': status.toString(),
      'message': message,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  // Static method to create a list of status updates from JSON array
  static List<OrderStatusUpdate> fromJsonList(List<dynamic> jsonList) {
    return jsonList.map((json) => OrderStatusUpdate.fromJson(json as Map<String, dynamic>)).toList();
  }

  // Get formatted timestamp
  String get formattedTimestamp {
    final monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final time = '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
    return '${timestamp.day} ${monthNames[timestamp.month - 1]} ${timestamp.year}, $time';
  }
}