import '../../config/constants.dart';
import 'dart:convert';

class User {
  final int userId;
  final String firstName;
  final String lastName;
  final String email;
  final String phoneNumber;
  final String? profileImage;
  final DateTime? dateOfBirth;
  final String? gender;
  final bool isEmailVerified;
  final bool isPhoneVerified;
  final DateTime createdAt;
  final DateTime updatedAt;
  final UserPreferences? preferences;
  final String? referralCode;
  final int referralCount;
  final double walletBalance;
  final String? jwtToken;
  final String? refreshToken;
  final DateTime? tokenExpiresAt;

  User({
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phoneNumber,
    this.profileImage,
    this.dateOfBirth,
    this.gender,
    required this.isEmailVerified,
    required this.isPhoneVerified,
    required this.createdAt,
    required this.updatedAt,
    this.preferences,
    this.referralCode,
    required this.referralCount,
    required this.walletBalance,
    this.jwtToken,
    this.refreshToken,
    this.tokenExpiresAt,
  });

  // Getters for token compatibility
  String? get token => jwtToken;

  // Factory constructors
  factory User.fromJsonString(String jsonString) {
    final Map<String, dynamic> json = jsonDecode(jsonString);
    return User.fromJson(json);
  }

  // Factory constructor for creating User from JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['user_id'] ?? json['id'] ?? 0,
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phone_number'] ?? json['phone'] ?? '',
      profileImage: json['profile_image'] ?? json['avatar'],
      dateOfBirth: json['date_of_birth'] != null
          ? DateTime.parse(json['date_of_birth'] as String)
          : null,
      gender: json['gender'],
      isEmailVerified: json['is_email_verified'] ?? false,
      isPhoneVerified: json['is_phone_verified'] ?? false,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
      preferences: json['preferences'] != null
          ? UserPreferences.fromJson(json['preferences'] as Map<String, dynamic>)
          : null,
      referralCode: json['referral_code'],
      referralCount: json['referral_count'] ?? 0,
      walletBalance: (json['wallet_balance'] ?? 0.0).toDouble(),
      jwtToken: json['jwt_token'] ?? json['access_token'] ?? json['token'],
      refreshToken: json['refresh_token'],
      tokenExpiresAt: json['token_expires_at'] != null
          ? DateTime.parse(json['token_expires_at'])
          : null,
    );
  }

  // Method to convert User to JSON
  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone_number': phoneNumber,
      'profile_image': profileImage,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'gender': gender,
      'is_email_verified': isEmailVerified,
      'is_phone_verified': isPhoneVerified,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'preferences': preferences?.toJson(),
      'referral_code': referralCode,
      'referral_count': referralCount,
      'wallet_balance': walletBalance,
      'jwt_token': jwtToken,
      'refresh_token': refreshToken,
      'token_expires_at': tokenExpiresAt?.toIso8601String(),
    };
  }

  // Convert to JSON string
  String toJsonString() {
    return jsonEncode(toJson());
  }

  // Copy with method for creating modified instances
  User copyWith({
    int? userId,
    String? firstName,
    String? lastName,
    String? email,
    String? phoneNumber,
    String? profileImage,
    DateTime? dateOfBirth,
    String? gender,
    bool? isEmailVerified,
    bool? isPhoneVerified,
    DateTime? createdAt,
    DateTime? updatedAt,
    UserPreferences? preferences,
    String? referralCode,
    int? referralCount,
    double? walletBalance,
    String? jwtToken,
    String? refreshToken,
    DateTime? tokenExpiresAt,
    String? token, // Add token parameter for compatibility
  }) {
    return User(
      userId: userId ?? this.userId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      profileImage: profileImage ?? this.profileImage,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      isPhoneVerified: isPhoneVerified ?? this.isPhoneVerified,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      preferences: preferences ?? this.preferences,
      referralCode: referralCode ?? this.referralCode,
      referralCount: referralCount ?? this.referralCount,
      walletBalance: walletBalance ?? this.walletBalance,
      jwtToken: jwtToken ?? token ?? this.jwtToken, // Support both token and jwtToken
      refreshToken: refreshToken ?? this.refreshToken,
      tokenExpiresAt: tokenExpiresAt ?? this.tokenExpiresAt,
    );
  }

  // Equality operator
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.userId == userId;
  }

  // Hash code
  @override
  int get hashCode => userId.hashCode;

  // String representation
  @override
  String toString() {
    return 'User(userId: $userId, email: $email, fullName: $fullName)';
  }

  // Computed properties

  // Get full name
  String get fullName => '$firstName $lastName'.trim();

  // Get initials
  String get initials {
    final firstInitial = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final lastInitial = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$firstInitial$lastInitial';
  }

  // Get display name (first name or full name based on context)
  String get displayName => firstName.isNotEmpty ? firstName : fullName;

  // Check if profile is complete
  bool get isProfileComplete {
    return firstName.isNotEmpty &&
           lastName.isNotEmpty &&
           email.isNotEmpty &&
           phoneNumber.isNotEmpty &&
           isEmailVerified &&
           isPhoneVerified;
  }

  // Get profile completion percentage
  double get profileCompletionPercentage {
    int completedFields = 0;
    const int totalFields = 6;

    if (firstName.isNotEmpty) completedFields++;
    if (lastName.isNotEmpty) completedFields++;
    if (email.isNotEmpty) completedFields++;
    if (phoneNumber.isNotEmpty) completedFields++;
    if (isEmailVerified) completedFields++;
    if (isPhoneVerified) completedFields++;

    return (completedFields / totalFields) * 100;
  }

  // Get display profile image URL
  String get displayProfileImageUrl => AppConstants.getImageUrl(profileImage);

  // Check if user has profile image
  bool get hasProfileImage => profileImage != null && profileImage!.isNotEmpty;

  // Format phone number for display
  String get formattedPhoneNumber {
    if (phoneNumber.length == 10) {
      return '+91 ${phoneNumber.substring(0, 5)} ${phoneNumber.substring(5)}';
    }
    return phoneNumber;
  }

  // Get age from date of birth
  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    int age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month || 
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
  }

  // Check if user is adult (18+)
  bool get isAdult => age != null && age! >= 18;

  // Format wallet balance
  String get formattedWalletBalance => AppConstants.formatPrice(walletBalance);

  // Check if user has referral code
  bool get hasReferralCode => referralCode != null && referralCode!.isNotEmpty;

  // Get member since text
  String get memberSince {
    final monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${monthNames[createdAt.month - 1]} ${createdAt.year}';
  }

  // Check if user joined recently (within last 30 days)
  bool get isNewUser {
    final now = DateTime.now();
    return now.difference(createdAt).inDays <= 30;
  }

  // Get verification status text
  String get verificationStatus {
    if (isEmailVerified && isPhoneVerified) {
      return 'Verified';
    } else if (isEmailVerified || isPhoneVerified) {
      return 'Partially Verified';
    } else {
      return 'Not Verified';
    }
  }

  // JWT Token Management Methods
  
  // Check if user has valid JWT token
  bool get hasValidToken => jwtToken != null && jwtToken!.isNotEmpty && !isTokenExpired;

  // Check if JWT token is expired
  bool get isTokenExpired {
    if (tokenExpiresAt == null) return false;
    return DateTime.now().isAfter(tokenExpiresAt!);
  }

  // Check if token needs refresh (expires within 5 minutes)
  bool get needsTokenRefresh {
    if (tokenExpiresAt == null) return false;
    final now = DateTime.now();
    final fiveMinutesFromNow = now.add(const Duration(minutes: 5));
    return tokenExpiresAt!.isBefore(fiveMinutesFromNow);
  }

  // Get authorization header value
  String? get authorizationHeader {
    if (jwtToken == null || jwtToken!.isEmpty) return null;
    return 'Bearer $jwtToken';
  }

  // Check if user is authenticated
  bool get isAuthenticated => hasValidToken;

  // Get token remaining time in minutes
  int get tokenRemainingMinutes {
    if (tokenExpiresAt == null) return 0;
    final now = DateTime.now();
    if (now.isAfter(tokenExpiresAt!)) return 0;
    return tokenExpiresAt!.difference(now).inMinutes;
  }

  // Validation Methods

  // Validate email format
  bool get isValidEmail => AppConstants.isValidEmail(email);

  // Validate phone number format
  bool get isValidPhone => AppConstants.isValidPhone(phoneNumber);

  // Validate first name
  bool get isValidFirstName {
    return firstName.isNotEmpty && 
           firstName.length >= AppConstants.minNameLength &&
           firstName.length <= AppConstants.maxNameLength;
  }

  // Validate last name
  bool get isValidLastName {
    return lastName.isNotEmpty && 
           lastName.length >= AppConstants.minNameLength &&
           lastName.length <= AppConstants.maxNameLength;
  }

  // Validate user data
  Map<String, String> validateUserData() {
    final errors = <String, String>{};

    if (!isValidFirstName) {
      errors['firstName'] = 'First name must be ${AppConstants.minNameLength}-${AppConstants.maxNameLength} characters';
    }

    if (!isValidLastName) {
      errors['lastName'] = 'Last name must be ${AppConstants.minNameLength}-${AppConstants.maxNameLength} characters';
    }

    if (!isValidEmail) {
      errors['email'] = 'Please enter a valid email address';
    }

    if (!isValidPhone) {
      errors['phone'] = 'Please enter a valid 10-digit phone number';
    }

    return errors;
  }

  // Check if user data is valid
  bool get isValidUserData => validateUserData().isEmpty;

  // Business Logic Helper Methods

  // Check if user can make purchase
  bool canMakePurchase(double amount) {
    return isAuthenticated && isProfileComplete && amount >= 0;
  }

  // Check if user can use wallet
  bool canUseWallet(double amount) {
    return walletBalance >= amount && amount > 0;
  }

  // Calculate wallet usage for an amount
  double calculateWalletUsage(double totalAmount) {
    if (!canUseWallet(totalAmount)) return 0.0;
    return totalAmount <= walletBalance ? totalAmount : walletBalance;
  }

  // Get remaining amount after wallet usage
  double getRemainingAmount(double totalAmount) {
    final walletUsage = calculateWalletUsage(totalAmount);
    return totalAmount - walletUsage;
  }

  // Check if user is eligible for referral rewards
  bool get isEligibleForReferralRewards => isProfileComplete && isEmailVerified;

  // Get user level based on referral count
  String get userLevel {
    if (referralCount >= 100) return 'Platinum';
    if (referralCount >= 50) return 'Gold';
    if (referralCount >= 20) return 'Silver';
    if (referralCount >= 5) return 'Bronze';
    return 'Basic';
  }
  
  // Get user level enum
  UserLevel get userLevelEnum => UserLevel.fromReferralCount(referralCount);

  // Get user level benefits text
  String get userLevelBenefits {
    switch (userLevel) {
      case 'Platinum':
        return 'Premium support, free shipping, 15% cashback';
      case 'Gold':
        return 'Priority support, free shipping, 10% cashback';
      case 'Silver':
        return 'Fast support, free shipping on ₹999+, 7% cashback';
      case 'Bronze':
        return 'Standard support, free shipping on ₹1499+, 5% cashback';
      default:
        return 'Standard support, free shipping on ₹1999+, 2% cashback';
    }
  }

  // Factory constructor for creating authenticated user
  factory User.authenticated({
    required int userId,
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String jwtToken,
    String? refreshToken,
    DateTime? tokenExpiresAt,
    String? profileImage,
    UserPreferences? preferences,
    double walletBalance = 0.0,
    int referralCount = 0,
    String? referralCode,
  }) {
    return User(
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber,
      jwtToken: jwtToken,
      refreshToken: refreshToken,
      tokenExpiresAt: tokenExpiresAt,
      profileImage: profileImage,
      preferences: preferences ?? UserPreferences.defaultPreferences(),
      walletBalance: walletBalance,
      referralCount: referralCount,
      referralCode: referralCode,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  // Factory constructor for creating guest user
  factory User.guest() {
    return User(
      userId: 0,
      firstName: 'Guest',
      lastName: 'User',
      email: '',
      phoneNumber: '',
      isEmailVerified: false,
      isPhoneVerified: false,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      referralCount: 0,
      walletBalance: 0.0,
    );
  }

  // Check if user is guest
  bool get isGuest => userId == 0;

}

// User Level Enum
enum UserLevel {
  basic,
  bronze, 
  silver,
  gold,
  platinum;
  
  String get displayName {
    switch (this) {
      case UserLevel.basic:
        return 'Basic';
      case UserLevel.bronze:
        return 'Bronze';
      case UserLevel.silver:
        return 'Silver';
      case UserLevel.gold:
        return 'Gold';
      case UserLevel.platinum:
        return 'Platinum';
    }
  }
  
  // Get user level from referral count
  static UserLevel fromReferralCount(int referralCount) {
    if (referralCount >= 100) return UserLevel.platinum;
    if (referralCount >= 50) return UserLevel.gold;
    if (referralCount >= 20) return UserLevel.silver;
    if (referralCount >= 5) return UserLevel.bronze;
    return UserLevel.basic;
  }
}

// User Preferences Model
class UserPreferences {
  final bool pushNotifications;
  final bool emailNotifications;
  final bool smsNotifications;
  final String language;
  final String currency;
  final bool darkMode;
  final Map<String, dynamic>? customSettings;

  UserPreferences({
    required this.pushNotifications,
    required this.emailNotifications,
    required this.smsNotifications,
    required this.language,
    required this.currency,
    required this.darkMode,
    this.customSettings,
  });

  // Factory constructor for creating UserPreferences from JSON
  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      pushNotifications: json['push_notifications'] as bool? ?? true,
      emailNotifications: json['email_notifications'] as bool? ?? true,
      smsNotifications: json['sms_notifications'] as bool? ?? false,
      language: json['language'] as String? ?? 'en',
      currency: json['currency'] as String? ?? 'INR',
      darkMode: json['dark_mode'] as bool? ?? false,
      customSettings: json['custom_settings'] as Map<String, dynamic>?,
    );
  }

  // Method to convert UserPreferences to JSON
  Map<String, dynamic> toJson() {
    return {
      'push_notifications': pushNotifications,
      'email_notifications': emailNotifications,
      'sms_notifications': smsNotifications,
      'language': language,
      'currency': currency,
      'dark_mode': darkMode,
      'custom_settings': customSettings,
    };
  }

  // Copy with method for creating modified instances
  UserPreferences copyWith({
    bool? pushNotifications,
    bool? emailNotifications,
    bool? smsNotifications,
    String? language,
    String? currency,
    bool? darkMode,
    Map<String, dynamic>? customSettings,
  }) {
    return UserPreferences(
      pushNotifications: pushNotifications ?? this.pushNotifications,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      smsNotifications: smsNotifications ?? this.smsNotifications,
      language: language ?? this.language,
      currency: currency ?? this.currency,
      darkMode: darkMode ?? this.darkMode,
      customSettings: customSettings ?? this.customSettings,
    );
  }

  // Create default preferences
  factory UserPreferences.defaultPreferences() {
    return UserPreferences(
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      language: 'en',
      currency: 'INR',
      darkMode: false,
    );
  }
}