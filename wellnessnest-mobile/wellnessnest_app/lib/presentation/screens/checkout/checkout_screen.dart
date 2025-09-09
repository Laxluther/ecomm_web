import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../config/constants.dart';
import '../../../config/routes.dart';
import '../../../data/models/address.dart';
import '../../../data/models/order.dart';
import '../../../data/models/product.dart';
import '../../../data/providers/auth_provider.dart';
import '../../../data/providers/cart_provider.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  Address? _selectedAddress;
  String _selectedPaymentMethod = 'cod';
  bool _useWallet = false;
  double _walletBalance = 250.50;
  int _availableRewardPoints = 1250;
  bool _useRewardPoints = false;
  int _rewardPointsToUse = 0;
  String _couponCode = '';
  double _couponDiscount = 0.0;
  bool _isApplyingCoupon = false;
  bool _isPlacingOrder = false;
  
  // Mock cart data - in real app this would come from CartProvider
  List<CartItem> _cartItems = [];
  double _subtotal = 0.0;
  double _deliveryCharges = 0.0;
  double _totalSavings = 0.0;

  @override
  void initState() {
    super.initState();
    _loadCheckoutData();
  }

  Future<void> _loadCheckoutData() async {
    try {
      // TODO: Load data from providers
      await Future.delayed(const Duration(milliseconds: 500));
      
      setState(() {
        _cartItems = _generateMockCartItems();
        _subtotal = _cartItems.fold<double>(0, (sum, item) => sum + item.totalPrice);
        _deliveryCharges = _subtotal > 500 ? 0.0 : 50.0;
        _totalSavings = _cartItems.fold<double>(0, (sum, item) => sum + item.discountAmount);
        _selectedAddress = _getMockAddress();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading checkout data: $e')),
        );
      }
    }
  }

  List<CartItem> _generateMockCartItems() {
    return [
      CartItem(
        productId: 1,
        productName: 'Premium Vitamin D3',
        brand: 'WellnessNest',
        price: 299.99,
        discountPrice: 249.99,
        quantity: 2,
        imageUrl: null,
      ),
      CartItem(
        productId: 2,
        productName: 'Omega-3 Fish Oil',
        brand: 'HealthyLife',
        price: 599.99,
        discountPrice: null,
        quantity: 1,
        imageUrl: null,
      ),
    ];
  }

  Address _getMockAddress() {
    return Address(
      addressId: 1,
      userId: 1,
      name: 'John Doe',
      phoneNumber: '9876543210',
      addressLine1: '123 Main Street',
      addressLine2: 'Near City Center',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      isDefault: true,
      addressType: 'Home',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  double get _rewardPointDiscount => _useRewardPoints ? _rewardPointsToUse / 10 : 0.0;
  double get _walletDiscount => _useWallet ? _walletBalance : 0.0;
  
  double get _finalTotal {
    double total = _subtotal + _deliveryCharges - _couponDiscount - _rewardPointDiscount;
    if (_useWallet) {
      total = (total - _walletBalance).clamp(0.0, double.infinity);
    }
    return total;
  }

  void _selectAddress() async {
    // TODO: Navigate to address selection screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Address selection coming soon')),
    );
  }

  void _applyCoupon() async {
    if (_couponCode.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a coupon code')),
      );
      return;
    }

    setState(() {
      _isApplyingCoupon = true;
    });

    try {
      // TODO: Apply coupon via API
      await Future.delayed(const Duration(milliseconds: 800));
      
      // Mock coupon validation
      if (_couponCode.toUpperCase() == 'SAVE10') {
        setState(() {
          _couponDiscount = _subtotal * 0.1; // 10% discount
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Coupon applied! You saved ${AppConstants.formatPrice(_couponDiscount)}'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Invalid coupon code'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error applying coupon: $e')),
        );
      }
    } finally {
      setState(() {
        _isApplyingCoupon = false;
      });
    }
  }

  void _removeCoupon() {
    setState(() {
      _couponCode = '';
      _couponDiscount = 0.0;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Coupon removed')),
    );
  }

  void _placeOrder() async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a delivery address')),
      );
      return;
    }

    setState(() {
      _isPlacingOrder = true;
    });

    try {
      // TODO: Place order via API
      await Future.delayed(const Duration(milliseconds: 1500));
      
      // Create mock order
      final orderItems = _cartItems.map((item) => OrderItem(
        orderItemId: 0,
        orderId: '',
        productId: item.productId,
        product: Product(
          productId: item.productId,
          productName: item.productName,
          description: 'Premium wellness product',
          price: item.price,
          discountPrice: item.discountPrice,
          primaryImage: item.imageUrl,
          brand: item.brand,
          categoryName: 'Health',
          stockQuantity: 10,
          rating: 4.5,
          reviewCount: 100,
        ),
        quantity: item.quantity,
        unitPrice: item.effectivePrice,
        totalPrice: item.totalPrice,
      )).toList();

      final order = Order(
        orderId: 'ORD${DateTime.now().millisecondsSinceEpoch}',
        userId: 1,
        orderNumber: 'WN${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
        status: OrderStatus.pending,
        items: orderItems,
        deliveryAddress: _selectedAddress!,
        subtotal: _subtotal,
        deliveryCharges: _deliveryCharges,
        totalAmount: _finalTotal,
        totalSavings: _totalSavings + _couponDiscount + _rewardPointDiscount,
        paymentMethod: _selectedPaymentMethod,
        couponCode: _couponCode.isNotEmpty ? _couponCode : null,
        couponDiscount: _couponDiscount > 0 ? _couponDiscount : null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      setState(() {
        _isPlacingOrder = false;
      });

      if (mounted) {
        // Navigate to order success screen
        AppRoutes.navigateToOrderSuccess(context, order);
      }
    } catch (e) {
      setState(() {
        _isPlacingOrder = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error placing order: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppConstants.defaultPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDeliveryAddressSection(),
                  const SizedBox(height: 20),
                  _buildOrderItemsSection(),
                  const SizedBox(height: 20),
                  _buildCouponSection(),
                  const SizedBox(height: 20),
                  _buildRewardPointsSection(),
                  const SizedBox(height: 20),
                  _buildWalletSection(),
                  const SizedBox(height: 20),
                  _buildPaymentMethodSection(),
                  const SizedBox(height: 20),
                  _buildOrderSummarySection(),
                ],
              ),
            ),
          ),
          _buildBottomCheckoutBar(),
        ],
      ),
    );
  }

  Widget _buildDeliveryAddressSection() {
    return Card(
      elevation: AppConstants.cardElevation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.green),
                const SizedBox(width: 8),
                Text(
                  'Delivery Address',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: _selectAddress,
                  child: const Text('Change'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_selectedAddress != null) ...[
              Text(
                _selectedAddress!.name,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _selectedAddress!.formattedPhoneNumber,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 4),
              Text(
                _selectedAddress!.fullAddress,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.local_shipping_outlined,
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Delivery: ${_selectedAddress!.formattedEstimatedDelivery}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ] else
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.add_location_alt_outlined, color: Colors.grey[600]),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text('Select delivery address'),
                    ),
                    const Icon(Icons.chevron_right),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderItemsSection() {
    return Card(
      elevation: AppConstants.cardElevation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Items (${_cartItems.length})',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ..._cartItems.map((item) => _buildCartItemTile(item)),
          ],
        ),
      ),
    );
  }

  Widget _buildCartItemTile(CartItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.image,
              size: 30,
              color: Colors.grey,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productName,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  item.brand,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (item.hasDiscount) ...[
                      Text(
                        AppConstants.formatPrice(item.price),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          decoration: TextDecoration.lineThrough,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      AppConstants.formatPrice(item.effectivePrice),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('Qty: ${item.quantity}'),
                  ],
                ),
              ],
            ),
          ),
          Text(
            AppConstants.formatPrice(item.totalPrice),
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCouponSection() {
    return Card(
      elevation: AppConstants.cardElevation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.local_offer, color: Colors.orange),
                const SizedBox(width: 8),
                Text(
                  'Apply Coupon',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_couponDiscount > 0) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Coupon "$_couponCode" applied',
                            style: const TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            'You saved ${AppConstants.formatPrice(_couponDiscount)}',
                            style: const TextStyle(
                              color: Colors.green,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: _removeCoupon,
                      child: const Text('Remove'),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Enter coupon code',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) => _couponCode = value,
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: _isApplyingCoupon ? null : _applyCoupon,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: _isApplyingCoupon
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Apply'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Try: SAVE10 for 10% off',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRewardPointsSection() {
    return Card(
      elevation: AppConstants.cardElevation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.stars, color: Colors.orange),
                const SizedBox(width: 8),
                Text(
                  'Reward Points',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Available: $_availableRewardPoints points (worth ${AppConstants.formatPrice(_availableRewardPoints / 10)})',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Checkbox(
                  value: _useRewardPoints,
                  onChanged: (value) {
                    setState(() {
                      _useRewardPoints = value ?? false;
                      if (_useRewardPoints) {
                        _rewardPointsToUse = (_availableRewardPoints).clamp(0, (_subtotal * 10).toInt());
                      } else {
                        _rewardPointsToUse = 0;
                      }
                    });
                  },
                ),
                const Text('Use reward points'),
              ],
            ),
            if (_useRewardPoints) ...[
              const SizedBox(height: 12),
              Text('Points to use: $_rewardPointsToUse'),
              Slider(
                value: _rewardPointsToUse.toDouble(),
                min: 0,
                max: (_availableRewardPoints).clamp(0, (_subtotal * 10).toInt()).toDouble(),
                divisions: 10,
                label: '$_rewardPointsToUse points',
                onChanged: (value) {
                  setState(() {
                    _rewardPointsToUse = value.toInt();
                  });
                },
              ),
              Text(
                'Discount: ${AppConstants.formatPrice(_rewardPointDiscount)}',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWalletSection() {
    return Card(
      elevation: AppConstants.cardElevation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.account_balance_wallet, color: Colors.green),
                const SizedBox(width: 8),
                Text(
                  'Wallet',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Available balance: ${AppConstants.formatPrice(_walletBalance)}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Checkbox(
                  value: _useWallet,
                  onChanged: (value) {
                    setState(() {
                      _useWallet = value ?? false;
                    });
                  },
                ),
                const Text('Use wallet balance'),
              ],
            ),
            if (_useWallet) ...[
              const SizedBox(height: 8),
              Text(
                'Wallet discount: ${AppConstants.formatPrice(_walletDiscount.clamp(0, _subtotal + _deliveryCharges - _couponDiscount - _rewardPointDiscount))}',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return Card(
      elevation: AppConstants.cardElevation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Method',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            RadioListTile<String>(
              title: const Text('Cash on Delivery (COD)'),
              subtitle: const Text('Pay when you receive your order'),
              value: 'cod',
              groupValue: _selectedPaymentMethod,
              onChanged: (value) {
                setState(() {
                  _selectedPaymentMethod = value!;
                });
              },
              dense: true,
            ),
            RadioListTile<String>(
              title: const Text('Online Payment'),
              subtitle: const Text('Pay now using UPI, Card, or Net Banking'),
              value: 'online',
              groupValue: _selectedPaymentMethod,
              onChanged: (value) {
                setState(() {
                  _selectedPaymentMethod = value!;
                });
              },
              dense: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummarySection() {
    return Card(
      elevation: AppConstants.cardElevation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Summary',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildSummaryRow('Subtotal', AppConstants.formatPrice(_subtotal)),
            if (_totalSavings > 0)
              _buildSummaryRow('Product Savings', '-${AppConstants.formatPrice(_totalSavings)}', isDiscount: true),
            if (_deliveryCharges > 0)
              _buildSummaryRow('Delivery Charges', AppConstants.formatPrice(_deliveryCharges))
            else
              _buildSummaryRow('Delivery Charges', 'Free', isDiscount: true),
            if (_couponDiscount > 0)
              _buildSummaryRow('Coupon Discount', '-${AppConstants.formatPrice(_couponDiscount)}', isDiscount: true),
            if (_rewardPointDiscount > 0)
              _buildSummaryRow('Reward Points Discount', '-${AppConstants.formatPrice(_rewardPointDiscount)}', isDiscount: true),
            if (_useWallet)
              _buildSummaryRow('Wallet Used', '-${AppConstants.formatPrice(_walletDiscount.clamp(0, _subtotal + _deliveryCharges - _couponDiscount - _rewardPointDiscount))}', isDiscount: true),
            const Divider(),
            _buildSummaryRow(
              'Total Amount',
              AppConstants.formatPrice(_finalTotal),
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isDiscount = false, bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: isTotal ? FontWeight.bold : null,
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: isTotal ? FontWeight.bold : null,
              color: isDiscount ? Colors.green : (isTotal ? Theme.of(context).colorScheme.primary : null),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomCheckoutBar() {
    return Container(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Amount',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  Text(
                    AppConstants.formatPrice(_finalTotal),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
              SizedBox(
                width: 150,
                child: ElevatedButton(
                  onPressed: _isPlacingOrder ? null : _placeOrder,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isPlacingOrder
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Place Order'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Cart item model for checkout
class CartItem {
  final int productId;
  final String productName;
  final String brand;
  final double price;
  final double? discountPrice;
  final int quantity;
  final String? imageUrl;

  CartItem({
    required this.productId,
    required this.productName,
    required this.brand,
    required this.price,
    this.discountPrice,
    required this.quantity,
    this.imageUrl,
  });

  double get effectivePrice => discountPrice ?? price;
  double get totalPrice => effectivePrice * quantity;
  bool get hasDiscount => discountPrice != null && discountPrice! < price;
  double get discountAmount => hasDiscount ? (price - discountPrice!) * quantity : 0.0;
}