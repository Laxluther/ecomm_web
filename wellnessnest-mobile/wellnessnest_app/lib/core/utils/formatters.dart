import 'package:intl/intl.dart';

class Formatters {
  // Currency formatter for Indian Rupees
  static String formatCurrency(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }
  
  // Format currency with decimal places
  static String formatCurrencyWithDecimals(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }
  
  // Format number with Indian numbering system (lakhs, crores)
  static String formatIndianNumber(double number) {
    final formatter = NumberFormat('#,##,###', 'en_IN');
    return formatter.format(number);
  }
  
  // Format date to display format
  static String formatDate(DateTime date) {
    final formatter = DateFormat('dd MMM yyyy');
    return formatter.format(date);
  }
  
  // Format date with time
  static String formatDateTime(DateTime dateTime) {
    final formatter = DateFormat('dd MMM yyyy, hh:mm a');
    return formatter.format(dateTime);
  }
  
  // Format date for API (ISO format)
  static String formatDateForApi(DateTime date) {
    final formatter = DateFormat('yyyy-MM-dd');
    return formatter.format(date);
  }
  
  // Format time only
  static String formatTime(DateTime time) {
    final formatter = DateFormat('hh:mm a');
    return formatter.format(time);
  }
  
  // Format relative time (e.g., "2 hours ago")
  static String formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '$weeks week${weeks > 1 ? 's' : ''} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months month${months > 1 ? 's' : ''} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years year${years > 1 ? 's' : ''} ago';
    }
  }
  
  // Format phone number with country code
  static String formatPhoneNumber(String phoneNumber) {
    if (phoneNumber.length == 10) {
      return '+91 $phoneNumber';
    }
    return phoneNumber;
  }
  
  // Format phone number for display with spacing
  static String formatPhoneNumberDisplay(String phoneNumber) {
    final cleanNumber = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    if (cleanNumber.length == 10) {
      return '${cleanNumber.substring(0, 5)} ${cleanNumber.substring(5)}';
    }
    return phoneNumber;
  }
  
  // Format file size
  static String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }
  
  // Format percentage
  static String formatPercentage(double value, {int decimals = 0}) {
    final formatter = NumberFormat.percentPattern();
    formatter.minimumFractionDigits = decimals;
    formatter.maximumFractionDigits = decimals;
    return formatter.format(value / 100);
  }
  
  // Format discount percentage
  static String formatDiscount(double originalPrice, double discountedPrice) {
    final discountPercentage = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return '${discountPercentage.round()}% OFF';
  }
  
  // Format quantity with unit
  static String formatQuantity(int quantity, {String unit = 'item'}) {
    if (quantity == 1) {
      return '$quantity $unit';
    } else {
      final pluralUnit = unit == 'item' ? 'items' : '${unit}s';
      return '$quantity $pluralUnit';
    }
  }
  
  // Format weight
  static String formatWeight(double weight) {
    if (weight < 1000) {
      return '${weight.toStringAsFixed(0)}g';
    } else {
      return '${(weight / 1000).toStringAsFixed(1)}kg';
    }
  }
  
  // Format rating
  static String formatRating(double rating) {
    return rating.toStringAsFixed(1);
  }
  
  // Format order ID
  static String formatOrderId(String orderId) {
    return '#$orderId';
  }
  
  // Format product SKU
  static String formatSKU(String sku) {
    return sku.toUpperCase();
  }
  
  // Capitalize first letter
  static String capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1).toLowerCase();
  }
  
  // Capitalize each word
  static String capitalizeWords(String text) {
    if (text.isEmpty) return text;
    return text.split(' ')
        .map((word) => word.isEmpty ? word : capitalize(word))
        .join(' ');
  }
  
  // Format delivery time
  static String formatDeliveryTime(DateTime deliveryDate) {
    final now = DateTime.now();
    final difference = deliveryDate.difference(now).inDays;
    
    if (difference <= 0) {
      return 'Today';
    } else if (difference == 1) {
      return 'Tomorrow';
    } else if (difference <= 7) {
      return 'Within $difference days';
    } else {
      return formatDate(deliveryDate);
    }
  }
  
  // Format order status
  static String formatOrderStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Order Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      case 'refunded':
        return 'Refunded';
      default:
        return capitalizeWords(status.replaceAll('_', ' '));
    }
  }
  
  // Format address for display
  static String formatAddress({
    required String addressLine1,
    String? addressLine2,
    required String city,
    required String state,
    required String postalCode,
  }) {
    final parts = <String>[
      addressLine1,
      if (addressLine2?.isNotEmpty == true) addressLine2!,
      city,
      state,
      postalCode,
    ];
    return parts.join(', ');
  }
  
  // Format full name
  static String formatFullName(String? firstName, String? lastName) {
    final parts = <String>[];
    if (firstName?.isNotEmpty == true) parts.add(firstName!);
    if (lastName?.isNotEmpty == true) parts.add(lastName!);
    return parts.join(' ');
  }
  
  // Format price range
  static String formatPriceRange(double minPrice, double maxPrice) {
    return '${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}';
  }
  
  // Format search result count
  static String formatSearchResults(int count, String query) {
    if (count == 0) {
      return 'No results found for "$query"';
    } else if (count == 1) {
      return '1 result found for "$query"';
    } else {
      return '$count results found for "$query"';
    }
  }
  
  // Format product count
  static String formatProductCount(int count) {
    if (count == 0) {
      return 'No products';
    } else if (count == 1) {
      return '1 product';
    } else {
      return '$count products';
    }
  }
  
  // Format cart item count
  static String formatCartCount(int count) {
    if (count == 0) {
      return 'Empty';
    } else if (count == 1) {
      return '1 item';
    } else {
      return '$count items';
    }
  }
  
  // Strip HTML tags
  static String stripHtmlTags(String htmlText) {
    return htmlText.replaceAll(RegExp(r'<[^>]*>'), '');
  }
  
  // Truncate text with ellipsis
  static String truncateText(String text, int maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    return '${text.substring(0, maxLength)}...';
  }
  
  // Format email domain
  static String formatEmailDomain(String email) {
    final parts = email.split('@');
    if (parts.length == 2) {
      return '@${parts[1]}';
    }
    return email;
  }
  
  // Format referral code
  static String formatReferralCode(String code) {
    return code.toUpperCase();
  }
  
  // Format wallet balance
  static String formatWalletBalance(double balance) {
    return 'Wallet Balance: ${formatCurrency(balance)}';
  }
}