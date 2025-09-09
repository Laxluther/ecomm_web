import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/constants.dart';

class Helpers {
  // Show snack bar message
  static void showSnackBar(BuildContext context, String message, {
    SnackBarAction? action,
    Duration duration = const Duration(seconds: 3),
    bool isError = false,
  }) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    
    final snackBar = SnackBar(
      content: Text(message),
      duration: duration,
      action: action,
      backgroundColor: isError 
          ? Theme.of(context).colorScheme.error
          : null,
    );
    
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
  
  // Show error snack bar
  static void showErrorSnackBar(BuildContext context, String message) {
    showSnackBar(context, message, isError: true);
  }
  
  // Show success snack bar
  static void showSuccessSnackBar(BuildContext context, String message) {
    showSnackBar(
      context, 
      message,
      duration: const Duration(seconds: 2),
    );
  }
  
  // Show loading dialog
  static void showLoadingDialog(BuildContext context, {String? message}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(message ?? 'Loading...'),
          ],
        ),
      ),
    );
  }
  
  // Hide loading dialog
  static void hideLoadingDialog(BuildContext context) {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }
  
  // Show confirmation dialog
  static Future<bool?> showConfirmationDialog(
    BuildContext context, {
    required String title,
    required String content,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
  }) async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(cancelText),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(confirmText),
          ),
        ],
      ),
    );
  }
  
  // Show info dialog
  static Future<void> showInfoDialog(
    BuildContext context, {
    required String title,
    required String content,
    String buttonText = 'OK',
  }) async {
    return await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(buttonText),
          ),
        ],
      ),
    );
  }
  
  // Copy to clipboard
  static Future<void> copyToClipboard(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
  }
  
  // Copy to clipboard with feedback
  static Future<void> copyToClipboardWithFeedback(
    BuildContext context,
    String text,
    String message,
  ) async {
    await copyToClipboard(text);
    if (context.mounted) {
      showSuccessSnackBar(context, message);
    }
  }
  
  // Launch URL
  static Future<void> launchURL(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
  
  // Launch phone dialer
  static Future<void> launchPhone(String phoneNumber) async {
    final uri = Uri.parse('tel:$phoneNumber');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
  
  // Launch email
  static Future<void> launchEmail(String email, {
    String? subject,
    String? body,
  }) async {
    final uri = Uri(
      scheme: 'mailto',
      path: email,
      query: [
        if (subject != null) 'subject=$subject',
        if (body != null) 'body=$body',
      ].join('&'),
    );
    
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
  
  // Launch WhatsApp
  static Future<void> launchWhatsApp(String phoneNumber, {String? message}) async {
    final uri = Uri.parse(
      'https://wa.me/$phoneNumber${message != null ? '?text=${Uri.encodeComponent(message)}' : ''}',
    );
    
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
  
  // Get device type
  static DeviceType getDeviceType(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final width = size.width;
    
    if (width < 600) {
      return DeviceType.mobile;
    } else if (width < 900) {
      return DeviceType.tablet;
    } else {
      return DeviceType.desktop;
    }
  }
  
  // Check if device is mobile
  static bool isMobile(BuildContext context) {
    return getDeviceType(context) == DeviceType.mobile;
  }
  
  // Check if device is tablet
  static bool isTablet(BuildContext context) {
    return getDeviceType(context) == DeviceType.tablet;
  }
  
  // Check if device is desktop
  static bool isDesktop(BuildContext context) {
    return getDeviceType(context) == DeviceType.desktop;
  }
  
  // Get responsive padding
  static EdgeInsets getResponsivePadding(BuildContext context) {
    final deviceType = getDeviceType(context);
    switch (deviceType) {
      case DeviceType.mobile:
        return const EdgeInsets.all(AppConstants.defaultPadding);
      case DeviceType.tablet:
        return const EdgeInsets.all(AppConstants.largePadding);
      case DeviceType.desktop:
        return const EdgeInsets.all(AppConstants.largePadding * 2);
    }
  }
  
  // Get cross axis count for grid
  static int getGridCrossAxisCount(BuildContext context) {
    final deviceType = getDeviceType(context);
    switch (deviceType) {
      case DeviceType.mobile:
        return 2;
      case DeviceType.tablet:
        return 3;
      case DeviceType.desktop:
        return 4;
    }
  }
  
  // Debounce function calls
  static void debounce(
    String key,
    Duration duration,
    VoidCallback callback,
  ) {
    _debounceTimers[key]?.cancel();
    _debounceTimers[key] = Timer(duration, callback);
  }
  
  static final Map<String, Timer> _debounceTimers = {};
  
  // Generate random string
  static String generateRandomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    return List.generate(length, (index) => chars[random.nextInt(chars.length)]).join();
  }
  
  // Generate order ID
  static String generateOrderId() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = Random().nextInt(999);
    return 'WN$timestamp$random';
  }
  
  // Format price for display
  static String formatPrice(double price) {
    return '₹${price.toStringAsFixed(0)}';
  }
  
  // Calculate discount percentage
  static int calculateDiscountPercentage(double originalPrice, double discountPrice) {
    if (originalPrice <= 0 || discountPrice <= 0 || discountPrice >= originalPrice) {
      return 0;
    }
    return (((originalPrice - discountPrice) / originalPrice) * 100).round();
  }
  
  // Check if string is null or empty
  static bool isNullOrEmpty(String? value) {
    return value == null || value.trim().isEmpty;
  }
  
  // Check if list is null or empty
  static bool isListNullOrEmpty(List? list) {
    return list == null || list.isEmpty;
  }
  
  // Get initials from name
  static String getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '';
    
    if (parts.length == 1) {
      return parts[0].substring(0, 1).toUpperCase();
    } else {
      return '${parts[0].substring(0, 1)}${parts[parts.length - 1].substring(0, 1)}'.toUpperCase();
    }
  }
  
  // Validate email format
  static bool isValidEmail(String email) {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(email);
  }
  
  // Validate phone number format
  static bool isValidPhoneNumber(String phone) {
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d]'), '');
    return cleanPhone.length == 10 && RegExp(r'^[6-9]').hasMatch(cleanPhone);
  }
  
  // Get color from hex string
  static Color getColorFromHex(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) {
      hex = 'FF$hex';
    }
    return Color(int.parse(hex, radix: 16));
  }
  
  // Get contrast color (black or white) for given color
  static Color getContrastColor(Color color) {
    final luminance = color.computeLuminance();
    return luminance > 0.5 ? Colors.black : Colors.white;
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
  
  // Build image URL from relative path
  static String buildImageUrl(String? relativePath) {
    if (relativePath == null || relativePath.isEmpty) {
      return AppConstants.placeholderImagePath;
    }
    
    // If already absolute URL, return as is
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    
    // Build absolute URL from relative path
    return '${AppConstants.baseUrl.replaceAll('/api', '')}$relativePath';
  }
  
  // Get greeting based on time of day
  static String getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }
  
  // Calculate days between dates
  static int daysBetween(DateTime from, DateTime to) {
    from = DateTime(from.year, from.month, from.day);
    to = DateTime(to.year, to.month, to.day);
    return to.difference(from).inDays;
  }
  
  // Check if date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && 
           date.month == now.month && 
           date.day == now.day;
  }
  
  // Check if date is yesterday
  static bool isYesterday(DateTime date) {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return date.year == yesterday.year && 
           date.month == yesterday.month && 
           date.day == yesterday.day;
  }
  
  // Haptic feedback
  static void lightHaptic() {
    HapticFeedback.lightImpact();
  }
  
  static void mediumHaptic() {
    HapticFeedback.mediumImpact();
  }
  
  static void heavyHaptic() {
    HapticFeedback.heavyImpact();
  }
  
  static void selectionHaptic() {
    HapticFeedback.selectionClick();
  }
}

// Device type enum
enum DeviceType {
  mobile,
  tablet,
  desktop,
}

// Timer class for debouncing
class Timer {
  final Duration duration;
  final VoidCallback callback;
  late final DateTime startTime;
  bool _isActive = true;
  
  Timer(this.duration, this.callback) {
    startTime = DateTime.now();
    Future.delayed(duration, () {
      if (_isActive) {
        callback();
      }
    });
  }
  
  void cancel() {
    _isActive = false;
  }
}

// Random class
class Random {
  static final _instance = Random._internal();
  factory Random() => _instance;
  Random._internal();
  
  int nextInt(int max) {
    return DateTime.now().microsecond % max;
  }
}