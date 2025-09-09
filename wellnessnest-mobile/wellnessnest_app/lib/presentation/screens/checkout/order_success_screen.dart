import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

import '../../../config/constants.dart';
import '../../../config/routes.dart';
import '../../../data/models/order.dart';

class OrderSuccessScreen extends StatefulWidget {
  final Order order;

  const OrderSuccessScreen({
    super.key,
    required this.order,
  });

  @override
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen>
    with TickerProviderStateMixin {
  late AnimationController _slideAnimationController;
  late AnimationController _fadeAnimationController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    _slideAnimationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _fadeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideAnimationController,
      curve: Curves.easeOutBack,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeAnimationController,
      curve: Curves.easeIn,
    ));

    // Start animations
    _slideAnimationController.forward();
    _fadeAnimationController.forward();
  }

  @override
  void dispose() {
    _slideAnimationController.dispose();
    _fadeAnimationController.dispose();
    super.dispose();
  }

  void _continueShopping() {
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/main',
      (route) => false,
    );
  }

  void _viewOrderDetails() {
    Navigator.pushNamed(
      context,
      AppRoutes.orderDetails,
      arguments: widget.order,
    );
  }

  void _trackOrder() {
    // TODO: Navigate to order tracking screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order tracking coming soon')),
    );
  }

  void _shareOrder() {
    // TODO: Implement order sharing
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order sharing coming soon')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _continueShopping();
        return false;
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppConstants.defaultPadding),
                child: Column(
                  children: [
                    const SizedBox(height: 40),
                    _buildSuccessAnimation(),
                    const SizedBox(height: 32),
                    _buildSuccessMessage(),
                    const SizedBox(height: 32),
                    _buildOrderDetails(),
                    const SizedBox(height: 32),
                    _buildDeliveryInfo(),
                    const SizedBox(height: 32),
                    _buildPaymentInfo(),
                    const SizedBox(height: 40),
                    _buildActionButtons(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessAnimation() {
    return Container(
      height: 200,
      width: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Animated background circle
          AnimatedBuilder(
            animation: _slideAnimationController,
            builder: (context, child) {
              return Container(
                height: 150 * _slideAnimationController.value,
                width: 150 * _slideAnimationController.value,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.green.withValues(alpha: 0.1),
                ),
              );
            },
          ),
          // Success icon or Lottie animation
          AnimatedBuilder(
            animation: _slideAnimationController,
            builder: (context, child) {
              return Transform.scale(
                scale: _slideAnimationController.value,
                child: Container(
                  height: 80,
                  width: 80,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.green,
                  ),
                  child: const Icon(
                    Icons.check,
                    color: Colors.white,
                    size: 50,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessMessage() {
    return Column(
      children: [
        Text(
          'Order Placed Successfully!',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          'Thank you for your order. We\'ll send you a confirmation email shortly.',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(25),
          ),
          child: Text(
            'Order ID: ${widget.order.formattedOrderId}',
            style: TextStyle(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOrderDetails() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.receipt_long,
                color: Theme.of(context).colorScheme.primary,
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                'Order Summary',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildOrderSummaryRow('Items', '${widget.order.quantitySummaryText}'),
          _buildOrderSummaryRow('Subtotal', widget.order.formattedSubtotal),
          if (widget.order.totalSavings > 0)
            _buildOrderSummaryRow('Savings', '-${widget.order.formattedTotalSavings}', isDiscount: true),
          _buildOrderSummaryRow('Delivery', widget.order.formattedDeliveryCharges),
          if (widget.order.couponDiscount != null && widget.order.couponDiscount! > 0)
            _buildOrderSummaryRow('Coupon Discount', '-${widget.order.formattedCouponDiscount}', isDiscount: true),
          const Divider(height: 24),
          _buildOrderSummaryRow('Total Paid', widget.order.formattedTotalAmount, isTotal: true),
        ],
      ),
    );
  }

  Widget _buildOrderSummaryRow(String label, String value, {bool isDiscount = false, bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: isTotal ? FontWeight.bold : null,
              fontSize: isTotal ? 16 : null,
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: isTotal ? FontWeight.bold : null,
              fontSize: isTotal ? 16 : null,
              color: isDiscount 
                  ? Colors.green 
                  : isTotal 
                      ? Theme.of(context).colorScheme.primary 
                      : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.local_shipping,
                color: Colors.blue,
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                'Delivery Information',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue[800],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            widget.order.deliveryAddress.name,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.order.deliveryAddress.formattedPhoneNumber,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 4),
          Text(
            widget.order.deliveryAddress.fullAddress,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.blue,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              widget.order.deliveryStatusText,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentInfo() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.payment,
                color: Colors.green,
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                'Payment Information',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.green[800],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Payment Method',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              Text(
                widget.order.paymentMethodDisplayText,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Payment Status',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: widget.order.paymentMethod == 'cod' ? Colors.orange : Colors.green,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  widget.order.paymentMethod == 'cod' ? 'Pending' : 'Paid',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          if (widget.order.paymentId != null) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Transaction ID',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                Text(
                  widget.order.paymentId!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        // Primary action buttons
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _trackOrder,
                icon: const Icon(Icons.track_changes, size: 20),
                label: const Text('Track Order'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _viewOrderDetails,
                icon: const Icon(Icons.receipt, size: 20),
                label: const Text('View Details'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        
        // Secondary action buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _shareOrder,
                icon: const Icon(Icons.share, size: 18),
                label: const Text('Share'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: BorderSide(color: Colors.grey[400]!),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextButton.icon(
                onPressed: _continueShopping,
                icon: const Icon(Icons.shopping_bag, size: 18),
                label: const Text('Continue Shopping'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 32),
        
        // Help section
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
          ),
          child: Column(
            children: [
              Icon(
                Icons.help_outline,
                color: Colors.grey[600],
                size: 20,
              ),
              const SizedBox(height: 8),
              Text(
                'Need Help?',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Contact our customer support for any assistance',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  InkWell(
                    onTap: () {
                      // TODO: Open phone dialer
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Call support: +91-1234567890')),
                      );
                    },
                    child: Column(
                      children: [
                        Icon(
                          Icons.phone,
                          color: Theme.of(context).colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Call',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      // TODO: Open chat support
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Chat support coming soon')),
                      );
                    },
                    child: Column(
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          color: Theme.of(context).colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Chat',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      // TODO: Open email client
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Email: support@wellnessnest.com')),
                      );
                    },
                    child: Column(
                      children: [
                        Icon(
                          Icons.email_outlined,
                          color: Theme.of(context).colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Email',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}