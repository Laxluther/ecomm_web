import '../../config/constants.dart';

class Address {
  final int addressId;
  final int userId;
  final String name;
  final String phoneNumber;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String postalCode;
  final String country;
  final bool isDefault;
  final String? addressType;
  final DateTime createdAt;
  final DateTime updatedAt;

  Address({
    required this.addressId,
    required this.userId,
    required this.name,
    required this.phoneNumber,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
    required this.isDefault,
    this.addressType,
    required this.createdAt,
    required this.updatedAt,
  });

  // Factory constructor for creating Address from JSON
  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      addressId: json['address_id'] ?? json['id'] ?? 0,
      userId: json['user_id'] ?? 0,
      name: json['name'] ?? '',
      phoneNumber: json['phone_number'] ?? json['phone'] ?? '',
      addressLine1: json['address_line_1'] ?? json['street'] ?? '',
      addressLine2: json['address_line_2'] ?? json['street2'],
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      postalCode: json['postal_code'] ?? json['pincode'] ?? json['zip_code'] ?? '',
      country: json['country'] ?? 'India',
      isDefault: json['is_default'] ?? false,
      addressType: json['address_type'] ?? json['type'],
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'])
          : DateTime.now(),
    );
  }

  // Method to convert Address to JSON
  Map<String, dynamic> toJson() {
    return {
      'address_id': addressId,
      'user_id': userId,
      'name': name,
      'phone_number': phoneNumber,
      'address_line_1': addressLine1,
      'address_line_2': addressLine2,
      'city': city,
      'state': state,
      'postal_code': postalCode,
      'country': country,
      'is_default': isDefault,
      'address_type': addressType,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // Copy with method for creating modified instances
  Address copyWith({
    int? addressId,
    int? userId,
    String? name,
    String? phoneNumber,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? postalCode,
    String? country,
    bool? isDefault,
    String? addressType,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Address(
      addressId: addressId ?? this.addressId,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      addressLine1: addressLine1 ?? this.addressLine1,
      addressLine2: addressLine2 ?? this.addressLine2,
      city: city ?? this.city,
      state: state ?? this.state,
      postalCode: postalCode ?? this.postalCode,
      country: country ?? this.country,
      isDefault: isDefault ?? this.isDefault,
      addressType: addressType ?? this.addressType,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Equality operator
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Address && other.addressId == addressId;
  }

  // Hash code
  @override
  int get hashCode => addressId.hashCode;

  // String representation
  @override
  String toString() {
    return 'Address(addressId: $addressId, name: $name, fullAddress: $fullAddress)';
  }

  // Static method to create a list of addresses from JSON array
  static List<Address> fromJsonList(List<dynamic> jsonList) {
    return jsonList.map((json) => Address.fromJson(json as Map<String, dynamic>)).toList();
  }

  // Computed properties

  // Get full address string
  String get fullAddress {
    final parts = <String>[
      addressLine1,
      if (addressLine2?.isNotEmpty == true) addressLine2!,
      city,
      state,
      postalCode,
    ];
    return parts.join(', ');
  }

  // Get short address (first line + city)
  String get shortAddress {
    return '$addressLine1, $city';
  }

  // Get address with name and phone
  String get fullAddressWithContact {
    return '$name\n$formattedPhoneNumber\n$fullAddress';
  }

  // Format phone number for display
  String get formattedPhoneNumber {
    if (phoneNumber.length == 10) {
      return '+91 ${phoneNumber.substring(0, 5)} ${phoneNumber.substring(5)}';
    }
    return phoneNumber;
  }

  // Get address type display text
  String get displayAddressType {
    if (addressType == null || addressType!.isEmpty) {
      return isDefault ? 'Default' : 'Other';
    }
    
    switch (addressType!.toLowerCase()) {
      case 'home':
        return 'Home';
      case 'work':
      case 'office':
        return 'Work';
      case 'other':
        return 'Other';
      default:
        return addressType!;
    }
  }

  // Get address type icon
  String get addressTypeIcon {
    switch (displayAddressType.toLowerCase()) {
      case 'home':
        return '🏠';
      case 'work':
        return '🏢';
      case 'other':
      default:
        return '📍';
    }
  }

  // Check if address is complete
  bool get isComplete {
    return name.isNotEmpty &&
           phoneNumber.isNotEmpty &&
           addressLine1.isNotEmpty &&
           city.isNotEmpty &&
           state.isNotEmpty &&
           postalCode.isNotEmpty &&
           country.isNotEmpty;
  }

  // Validate postal code format (Indian PIN code)
  bool get hasValidPostalCode => AppConstants.isValidPinCode(postalCode);

  // Validate phone number format
  bool get hasValidPhoneNumber => AppConstants.isValidPhone(phoneNumber);

  // Check if address is valid
  bool get isValid {
    return isComplete && hasValidPostalCode && hasValidPhoneNumber;
  }

  // Get validation issues
  List<String> get validationIssues {
    final issues = <String>[];
    
    if (name.isEmpty) issues.add('Name is required');
    if (phoneNumber.isEmpty) issues.add('Phone number is required');
    if (!hasValidPhoneNumber && phoneNumber.isNotEmpty) {
      issues.add('Phone number is invalid');
    }
    if (addressLine1.isEmpty) issues.add('Address line 1 is required');
    if (city.isEmpty) issues.add('City is required');
    if (state.isEmpty) issues.add('State is required');
    if (postalCode.isEmpty) issues.add('Postal code is required');
    if (!hasValidPostalCode && postalCode.isNotEmpty) {
      issues.add('Postal code is invalid');
    }
    if (country.isEmpty) issues.add('Country is required');
    
    return issues;
  }

  // Get state and postal code
  String get statePostalCode {
    return '$state $postalCode';
  }

  // Get city, state and postal code
  String get cityStatePostalCode {
    return '$city, $state $postalCode';
  }

  // Get address for map/location services
  String get locationAddress {
    return '$addressLine1, $city, $state, $country';
  }

  // Check if address is recently added (within last 7 days)
  bool get isRecentlyAdded {
    final now = DateTime.now();
    return now.difference(createdAt).inDays <= 7;
  }

  // Check if address was recently updated (within last 7 days)
  bool get isRecentlyUpdated {
    final now = DateTime.now();
    return now.difference(updatedAt).inDays <= 7;
  }

  // Get formatted creation date
  String get formattedCreatedDate {
    final monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${createdAt.day} ${monthNames[createdAt.month - 1]} ${createdAt.year}';
  }

  // Check if this address matches another address
  bool isSameAs(Address other) {
    return name.toLowerCase() == other.name.toLowerCase() &&
           phoneNumber == other.phoneNumber &&
           addressLine1.toLowerCase() == other.addressLine1.toLowerCase() &&
           (addressLine2?.toLowerCase() ?? '') == (other.addressLine2?.toLowerCase() ?? '') &&
           city.toLowerCase() == other.city.toLowerCase() &&
           state.toLowerCase() == other.state.toLowerCase() &&
           postalCode == other.postalCode &&
           country.toLowerCase() == other.country.toLowerCase();
  }

  // Create a copy for editing (without ID)
  Map<String, dynamic> toEditableJson() {
    return {
      'name': name,
      'phone_number': phoneNumber,
      'address_line_1': addressLine1,
      'address_line_2': addressLine2,
      'city': city,
      'state': state,
      'postal_code': postalCode,
      'country': country,
      'is_default': isDefault,
      'address_type': addressType,
    };
  }

  // Get distance estimation based on PIN code (example logic)
  String get estimatedDeliveryTime {
    // This is example logic - in real app, you'd use actual distance calculation
    final pinFirstDigit = int.tryParse(postalCode.substring(0, 1)) ?? 0;
    
    if (pinFirstDigit >= 1 && pinFirstDigit <= 3) {
      // North India
      return '2-3 days';
    } else if (pinFirstDigit >= 4 && pinFirstDigit <= 6) {
      // West/Central India
      return '1-2 days';
    } else if (pinFirstDigit >= 7 && pinFirstDigit <= 8) {
      // South India
      return '3-4 days';
    } else {
      // East/Northeast India
      return '4-5 days';
    }
  }

  // Check if address is in metro city (based on PIN code)
  bool get isMetroCity {
    // Example metro cities PIN codes
    final metroPinPrefixes = [
      '110', '400', '560', '600', '700', // Delhi, Mumbai, Bangalore, Chennai, Kolkata
      '411', '380', '500', '201', '122'  // Pune, Ahmedabad, Hyderabad, Noida, Gurgaon
    ];
    
    return metroPinPrefixes.any((prefix) => postalCode.startsWith(prefix));
  }

  // Additional factory constructors and helper methods

  // Factory constructor for creating new address
  factory Address.create({
    required int userId,
    required String name,
    required String phoneNumber,
    required String addressLine1,
    String? addressLine2,
    required String city,
    required String state,
    required String postalCode,
    String country = 'India',
    bool isDefault = false,
    String? addressType,
  }) {
    return Address(
      addressId: 0, // Will be set by server
      userId: userId,
      name: name,
      phoneNumber: phoneNumber,
      addressLine1: addressLine1,
      addressLine2: addressLine2,
      city: city,
      state: state,
      postalCode: postalCode,
      country: country,
      isDefault: isDefault,
      addressType: addressType,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  // Factory constructor for creating default address template
  factory Address.defaultTemplate(int userId) {
    return Address(
      addressId: 0,
      userId: userId,
      name: '',
      phoneNumber: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  // Get formatted address for shipping label
  String get shippingLabelAddress {
    final buffer = StringBuffer();
    buffer.writeln(name);
    buffer.writeln(formattedPhoneNumber);
    buffer.writeln(addressLine1);
    if (addressLine2?.isNotEmpty == true) {
      buffer.writeln(addressLine2);
    }
    buffer.writeln('$city, $state');
    buffer.writeln('$postalCode, $country');
    return buffer.toString().trim();
  }

  // Get single line address
  String get singleLineAddress {
    final parts = <String>[
      addressLine1,
      if (addressLine2?.isNotEmpty == true) addressLine2!,
      city,
      state,
      postalCode,
    ];
    return parts.join(', ');
  }

  // Get address for Google Maps search
  String get googleMapsAddress {
    return '$addressLine1, $city, $state $postalCode, $country';
  }

  // Validate name field
  bool get hasValidName {
    return name.isNotEmpty && 
           name.length >= AppConstants.minNameLength &&
           name.length <= AppConstants.maxNameLength;
  }

  // Validate all address fields
  Map<String, String> validateAddressFields() {
    final errors = <String, String>{};

    if (!hasValidName) {
      errors['name'] = 'Name must be ${AppConstants.minNameLength}-${AppConstants.maxNameLength} characters';
    }

    if (!hasValidPhoneNumber) {
      errors['phoneNumber'] = 'Please enter a valid 10-digit phone number';
    }

    if (addressLine1.isEmpty) {
      errors['addressLine1'] = 'Address line 1 is required';
    }

    if (city.isEmpty) {
      errors['city'] = 'City is required';
    }

    if (state.isEmpty) {
      errors['state'] = 'State is required';
    }

    if (!hasValidPostalCode) {
      errors['postalCode'] = 'Please enter a valid 6-digit PIN code';
    }

    return errors;
  }

  // Check if address data is valid
  bool get isValidAddressData => validateAddressFields().isEmpty;

  // Get priority score for address sorting
  double get priorityScore {
    double score = 0.0;
    
    // Higher score for default address
    if (isDefault) score += 10.0;
    
    // Higher score for complete addresses
    if (isComplete) score += 5.0;
    
    // Higher score for metro cities (faster delivery)
    if (isMetroCity) score += 3.0;
    
    // Higher score for home addresses
    if (addressType?.toLowerCase() == 'home') score += 2.0;
    
    // Lower score for older addresses
    final ageInDays = DateTime.now().difference(updatedAt).inDays;
    score -= ageInDays * 0.01;
    
    return score;
  }

  // Get delivery charges based on location
  double getDeliveryCharges(double orderAmount) {
    // Free delivery for orders above threshold
    if (orderAmount >= 500) return 0.0;
    
    // Different charges based on location
    if (isMetroCity) {
      return 40.0; // Lower charges for metro cities
    } else {
      return 60.0; // Higher charges for non-metro cities
    }
  }

  // Get formatted delivery charges
  String getFormattedDeliveryCharges(double orderAmount) {
    final charges = getDeliveryCharges(orderAmount);
    return charges == 0 ? 'Free Delivery' : AppConstants.formatPrice(charges);
  }

  // Check if address supports cash on delivery
  bool get supportsCashOnDelivery {
    // Example logic - metro cities and major states support COD
    final codStates = [
      'maharashtra', 'karnataka', 'tamil nadu', 'delhi', 'uttar pradesh',
      'west bengal', 'gujarat', 'rajasthan', 'madhya pradesh', 'haryana'
    ];
    
    return codStates.contains(state.toLowerCase());
  }

  // Get estimated delivery days
  int get estimatedDeliveryDays {
    if (isMetroCity) return 1; // Same day or next day
    
    final pinFirstDigit = int.tryParse(postalCode.isNotEmpty ? postalCode.substring(0, 1) : '0') ?? 0;
    
    if (pinFirstDigit >= 1 && pinFirstDigit <= 3) {
      return 3; // North India
    } else if (pinFirstDigit >= 4 && pinFirstDigit <= 6) {
      return 2; // West/Central India
    } else if (pinFirstDigit >= 7 && pinFirstDigit <= 8) {
      return 4; // South India
    } else {
      return 5; // East/Northeast India
    }
  }

  // Get formatted estimated delivery text
  String get formattedEstimatedDelivery {
    final days = estimatedDeliveryDays;
    if (days == 1) return 'Tomorrow';
    return 'Within $days days';
  }

  // Get address hash for comparison (excluding IDs and timestamps)
  String get addressHash {
    return [
      name.toLowerCase().trim(),
      phoneNumber.trim(),
      addressLine1.toLowerCase().trim(),
      addressLine2?.toLowerCase().trim() ?? '',
      city.toLowerCase().trim(),
      state.toLowerCase().trim(),
      postalCode.trim(),
      country.toLowerCase().trim(),
    ].join('|');
  }

  // Check if this address is identical to another (excluding IDs)
  bool isIdenticalTo(Address other) {
    return addressHash == other.addressHash;
  }

  // Get address completeness percentage
  double get completenessPercentage {
    int completedFields = 0;
    const int totalFields = 8;

    if (name.isNotEmpty) completedFields++;
    if (phoneNumber.isNotEmpty) completedFields++;
    if (addressLine1.isNotEmpty) completedFields++;
    if (city.isNotEmpty) completedFields++;
    if (state.isNotEmpty) completedFields++;
    if (postalCode.isNotEmpty) completedFields++;
    if (country.isNotEmpty) completedFields++;
    if (addressType?.isNotEmpty == true) completedFields++;

    return (completedFields / totalFields) * 100;
  }

  // Get missing fields
  List<String> get missingFields {
    final missing = <String>[];
    
    if (name.isEmpty) missing.add('Name');
    if (phoneNumber.isEmpty) missing.add('Phone Number');
    if (addressLine1.isEmpty) missing.add('Address Line 1');
    if (city.isEmpty) missing.add('City');
    if (state.isEmpty) missing.add('State');
    if (postalCode.isEmpty) missing.add('PIN Code');
    
    return missing;
  }

  // Get address label for UI display
  String get displayLabel {
    if (addressType?.isNotEmpty == true) {
      return '$displayAddressType - $shortAddress';
    }
    return shortAddress;
  }
}

// Address list response model
class AddressListResponse {
  final List<Address> addresses;
  final int totalCount;

  AddressListResponse({
    required this.addresses,
    required this.totalCount,
  });

  factory AddressListResponse.fromJson(Map<String, dynamic> json) {
    return AddressListResponse(
      addresses: (json['addresses'] as List<dynamic>?)
          ?.map((item) => Address.fromJson(item))
          .toList() ?? [],
      totalCount: json['total_count'] ?? json['total'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'addresses': addresses.map((address) => address.toJson()).toList(),
      'total_count': totalCount,
    };
  }

  // Get default address
  Address? get defaultAddress {
    try {
      return addresses.firstWhere((addr) => addr.isDefault);
    } catch (e) {
      return addresses.isNotEmpty ? addresses.first : null;
    }
  }

  // Check if has default address
  bool get hasDefaultAddress => addresses.any((addr) => addr.isDefault);

  // Get addresses sorted by priority
  List<Address> get sortedAddresses {
    final sorted = List<Address>.from(addresses);
    sorted.sort((a, b) => b.priorityScore.compareTo(a.priorityScore));
    return sorted;
  }

  // Get addresses by type
  List<Address> getAddressesByType(String type) {
    return addresses.where((addr) => 
        addr.addressType?.toLowerCase() == type.toLowerCase()).toList();
  }
}