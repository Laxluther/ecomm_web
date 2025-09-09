class Validators {
  // Email validation
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  }
  
  // Password validation
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    
    if (value.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    return null;
  }
  
  // Confirm password validation
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    
    if (value != password) {
      return 'Passwords do not match';
    }
    
    return null;
  }
  
  // Name validation
  static String? validateName(String? value, {String? fieldName}) {
    final field = fieldName ?? 'Name';
    
    if (value == null || value.isEmpty) {
      return '$field is required';
    }
    
    if (value.length < 2) {
      return '$field must be at least 2 characters long';
    }
    
    if (value.length > 50) {
      return '$field cannot exceed 50 characters';
    }
    
    // Check for valid name characters
    final nameRegex = RegExp(r'^[a-zA-Z\s]+$');
    if (!nameRegex.hasMatch(value)) {
      return '$field can only contain letters and spaces';
    }
    
    return null;
  }
  
  // Phone number validation (Indian format)
  static String? validatePhoneNumber(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    
    // Remove spaces and special characters
    final cleanValue = value.replaceAll(RegExp(r'[^\d]'), '');
    
    // Check for 10 digit Indian mobile number
    if (cleanValue.length != 10) {
      return 'Phone number must be 10 digits';
    }
    
    // Indian mobile numbers start with 6, 7, 8, or 9
    if (!RegExp(r'^[6-9]').hasMatch(cleanValue)) {
      return 'Please enter a valid mobile number';
    }
    
    return null;
  }
  
  // Required field validation
  static String? validateRequired(String? value, {String? fieldName}) {
    final field = fieldName ?? 'This field';
    
    if (value == null || value.trim().isEmpty) {
      return '$field is required';
    }
    
    return null;
  }
  
  // Referral code validation (optional)
  static String? validateReferralCode(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Optional field
    }
    
    if (value.length < 6 || value.length > 20) {
      return 'Referral code must be between 6 and 20 characters';
    }
    
    // Allow alphanumeric characters
    final codeRegex = RegExp(r'^[a-zA-Z0-9]+$');
    if (!codeRegex.hasMatch(value)) {
      return 'Referral code can only contain letters and numbers';
    }
    
    return null;
  }
  
  // Address validation
  static String? validateAddress(String? value, {String? fieldName}) {
    final field = fieldName ?? 'Address';
    
    if (value == null || value.trim().isEmpty) {
      return '$field is required';
    }
    
    if (value.trim().length < 10) {
      return '$field must be at least 10 characters long';
    }
    
    if (value.length > 200) {
      return '$field cannot exceed 200 characters';
    }
    
    return null;
  }
  
  // Postal code validation (Indian PIN code)
  static String? validatePostalCode(String? value) {
    if (value == null || value.isEmpty) {
      return 'Postal code is required';
    }
    
    // Indian PIN code: 6 digits
    final pinRegex = RegExp(r'^[1-9][0-9]{5}$');
    if (!pinRegex.hasMatch(value)) {
      return 'Please enter a valid 6-digit PIN code';
    }
    
    return null;
  }
  
  // City validation
  static String? validateCity(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'City is required';
    }
    
    if (value.trim().length < 2) {
      return 'City name must be at least 2 characters long';
    }
    
    if (value.length > 50) {
      return 'City name cannot exceed 50 characters';
    }
    
    // Allow letters, spaces, and some special characters
    final cityRegex = RegExp(r"^[a-zA-Z\s\-'\.]+$");
    if (!cityRegex.hasMatch(value)) {
      return 'Please enter a valid city name';
    }
    
    return null;
  }
  
  // State validation
  static String? validateState(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'State is required';
    }
    
    if (value.trim().length < 2) {
      return 'State name must be at least 2 characters long';
    }
    
    if (value.length > 50) {
      return 'State name cannot exceed 50 characters';
    }
    
    // Allow letters, spaces, and some special characters
    final stateRegex = RegExp(r"^[a-zA-Z\s\-'\.]+$");
    if (!stateRegex.hasMatch(value)) {
      return 'Please enter a valid state name';
    }
    
    return null;
  }
  
  // Country validation
  static String? validateCountry(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Country is required';
    }
    
    if (value.trim().length < 2) {
      return 'Country name must be at least 2 characters long';
    }
    
    return null;
  }
  
  // Quantity validation
  static String? validateQuantity(String? value) {
    if (value == null || value.isEmpty) {
      return 'Quantity is required';
    }
    
    final quantity = int.tryParse(value);
    if (quantity == null) {
      return 'Please enter a valid number';
    }
    
    if (quantity < 1) {
      return 'Quantity must be at least 1';
    }
    
    if (quantity > 99) {
      return 'Quantity cannot exceed 99';
    }
    
    return null;
  }
  
  // Price validation
  static String? validatePrice(String? value) {
    if (value == null || value.isEmpty) {
      return 'Price is required';
    }
    
    final price = double.tryParse(value);
    if (price == null) {
      return 'Please enter a valid price';
    }
    
    if (price < 0) {
      return 'Price cannot be negative';
    }
    
    if (price > 99999) {
      return 'Price cannot exceed ₹99,999';
    }
    
    return null;
  }
  
  // Search query validation
  static String? validateSearchQuery(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Allow empty search
    }
    
    if (value.trim().length < 2) {
      return 'Search query must be at least 2 characters long';
    }
    
    if (value.length > 100) {
      return 'Search query cannot exceed 100 characters';
    }
    
    return null;
  }
  
  // OTP validation
  static String? validateOTP(String? value) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }
    
    if (value.length != 6) {
      return 'OTP must be 6 digits';
    }
    
    final otpRegex = RegExp(r'^[0-9]{6}$');
    if (!otpRegex.hasMatch(value)) {
      return 'Please enter a valid OTP';
    }
    
    return null;
  }
  
  // Age validation
  static String? validateAge(String? value) {
    if (value == null || value.isEmpty) {
      return 'Age is required';
    }
    
    final age = int.tryParse(value);
    if (age == null) {
      return 'Please enter a valid age';
    }
    
    if (age < 18) {
      return 'You must be at least 18 years old';
    }
    
    if (age > 120) {
      return 'Please enter a valid age';
    }
    
    return null;
  }
  
  // URL validation
  static String? validateURL(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Optional field
    }
    
    final urlRegex = RegExp(
      r'^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$',
    );
    
    if (!urlRegex.hasMatch(value)) {
      return 'Please enter a valid URL';
    }
    
    return null;
  }
  
  // Username validation
  static String? validateUsername(String? value) {
    if (value == null || value.isEmpty) {
      return 'Username is required';
    }
    
    if (value.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    
    if (value.length > 20) {
      return 'Username cannot exceed 20 characters';
    }
    
    final usernameRegex = RegExp(r'^[a-zA-Z0-9._]+$');
    if (!usernameRegex.hasMatch(value)) {
      return 'Username can only contain letters, numbers, dots, and underscores';
    }
    
    return null;
  }
  
  // Special characters validation
  static String? validateNoSpecialChars(String? value, {String? fieldName}) {
    if (value == null || value.isEmpty) {
      return null;
    }
    
    final field = fieldName ?? 'This field';
    final regex = RegExp(r'^[a-zA-Z0-9\s]+$');
    
    if (!regex.hasMatch(value)) {
      return '$field can only contain letters, numbers, and spaces';
    }
    
    return null;
  }
  
  // Date validation (format: DD/MM/YYYY)
  static String? validateDate(String? value) {
    if (value == null || value.isEmpty) {
      return 'Date is required';
    }
    
    final dateRegex = RegExp(r'^(\d{1,2})\/(\d{1,2})\/(\d{4})$');
    final match = dateRegex.firstMatch(value);
    
    if (match == null) {
      return 'Please enter date in DD/MM/YYYY format';
    }
    
    final day = int.tryParse(match.group(1)!);
    final month = int.tryParse(match.group(2)!);
    final year = int.tryParse(match.group(3)!);
    
    if (day == null || month == null || year == null) {
      return 'Please enter a valid date';
    }
    
    if (day < 1 || day > 31) {
      return 'Day must be between 1 and 31';
    }
    
    if (month < 1 || month > 12) {
      return 'Month must be between 1 and 12';
    }
    
    if (year < 1900 || year > DateTime.now().year + 1) {
      return 'Please enter a valid year';
    }
    
    // Basic month-day validation
    if (month == 2 && day > 29) {
      return 'February cannot have more than 29 days';
    }
    
    if ([4, 6, 9, 11].contains(month) && day > 30) {
      return 'This month cannot have more than 30 days';
    }
    
    return null;
  }
}