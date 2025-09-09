import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../config/constants.dart';
import '../../../config/routes.dart';
import '../../../data/models/order.dart';
import '../../../data/models/address.dart';
import '../../../data/models/product.dart';
import '../../../data/providers/auth_provider.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Order> _allOrders = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _allOrders.clear();
      });
    }

    setState(() {
      _isLoading = refresh || _allOrders.isEmpty;
    });

    try {
      // TODO: Load orders from API
      await Future.delayed(const Duration(milliseconds: 800));
      
      final newOrders = _generateMockOrders(_currentPage);
      
      if (mounted) {
        setState(() {
          if (refresh || _currentPage == 1) {
            _allOrders = newOrders;
          } else {
            _allOrders.addAll(newOrders);
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading orders: $e')),
        );
      }
    }
  }

  List<Order> _generateMockOrders(int page) {
    final List<Order> orders = [];
    final startIndex = (page - 1) * 10;
    
    for (int i = startIndex; i < startIndex + 10 && i < 25; i++) {
      final orderDate = DateTime.now().subtract(Duration(days: i * 2));
      final status = OrderStatus.values[i % OrderStatus.values.length];
      
      // Create mock address
      final address = Address(
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

      // Create mock products
      final products = <Product>[
        Product(
          productId: i + 1,
          productName: 'Wellness Product ${i + 1}',
          description: 'Premium wellness product for better health',
          price: 200.0 + (i % 5) * 50.0,
          discountPrice: i % 3 == 0 ? 150.0 + (i % 5) * 40.0 : null,
          primaryImage: null,
          brand: 'WellnessNest',
          categoryName: 'Health Supplements',
          stockQuantity: 10,
          rating: 4.0 + (i % 3) * 0.5,
          reviewCount: 50 + i,
          isFeatured: i % 4 == 0,
        ),
      ];

      // Create mock order items
      final items = products.map((product) => OrderItem(
        orderItemId: i + 1,
        orderId: 'ORD${(i + 1).toString().padLeft(6, '0')}',
        productId: product.productId,
        product: product,
        quantity: 1 + (i % 3),
        unitPrice: product.effectivePrice,
        totalPrice: product.effectivePrice * (1 + (i % 3)),
      )).toList();

      final subtotal = items.fold<double>(0, (sum, item) => sum + item.totalPrice);
      final deliveryCharges = subtotal > 500 ? 0.0 : 50.0;

      orders.add(Order(
        orderId: 'ORD${(i + 1).toString().padLeft(6, '0')}',
        userId: 1,
        orderNumber: 'WN${(i + 1).toString().padLeft(6, '0')}',
        status: status,
        items: items,
        deliveryAddress: address,
        subtotal: subtotal,
        deliveryCharges: deliveryCharges,
        totalAmount: subtotal + deliveryCharges,
        totalSavings: items.fold<double>(0, (sum, item) => sum + item.totalDiscount),
        paymentMethod: i % 2 == 0 ? 'cod' : 'online',
        paymentId: i % 2 == 0 ? null : 'PAY${i.toString().padLeft(6, '0')}',
        createdAt: orderDate,
        updatedAt: orderDate.add(Duration(hours: i % 24)),
        expectedDeliveryDate: status == OrderStatus.delivered 
            ? null 
            : orderDate.add(Duration(days: 2 + (i % 3))),
        deliveredAt: status == OrderStatus.delivered 
            ? orderDate.add(Duration(days: 1 + (i % 2)))
            : null,
      ));
    }
    
    return orders;
  }

  List<Order> _getFilteredOrders(int tabIndex) {
    switch (tabIndex) {
      case 0: // All
        return _allOrders;
      case 1: // Active
        return _allOrders.where((order) => ![
          OrderStatus.delivered,
          OrderStatus.cancelled,
          OrderStatus.returned,
          OrderStatus.refunded,
        ].contains(order.status)).toList();
      case 2: // Completed
        return _allOrders.where((order) => order.status == OrderStatus.delivered).toList();
      case 3: // Cancelled
        return _allOrders.where((order) => [
          OrderStatus.cancelled,
          OrderStatus.returned,
          OrderStatus.refunded,
        ].contains(order.status)).toList();
      default:
        return _allOrders;
    }
  }

  Future<void> _cancelOrder(Order order) async {
    if (!order.canBeCancelled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('This order cannot be cancelled')),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Order'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to cancel this order?'),
            const SizedBox(height: 8),
            Text(
              'Order: ${order.formattedOrderId}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text('Total: ${order.formattedTotalAmount}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('No, Keep Order'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        // TODO: Cancel order via API
        await Future.delayed(const Duration(milliseconds: 500));
        
        setState(() {
          final index = _allOrders.indexWhere((o) => o.orderId == order.orderId);
          if (index != -1) {
            _allOrders[index] = order.copyWith(status: OrderStatus.cancelled);
          }
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Order cancelled successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error cancelling order: $e')),
          );
        }
      }
    }
  }

  void _reorderItems(Order order) {
    // TODO: Add order items to cart and navigate to cart
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Items added to cart'),
        action: SnackBarAction(
          label: 'View Cart',
          onPressed: () => AppRoutes.navigateToCart(context),
        ),
      ),
    );
  }

  void _trackOrder(Order order) {
    // TODO: Navigate to order tracking screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Order tracking coming soon')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Active'),
            Tab(text: 'Completed'),
            Tab(text: 'Cancelled'),
          ],
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return TabBarView(
      controller: _tabController,
      children: [
        _buildOrdersList(0), // All
        _buildOrdersList(1), // Active
        _buildOrdersList(2), // Completed
        _buildOrdersList(3), // Cancelled
      ],
    );
  }

  Widget _buildOrdersList(int tabIndex) {
    final orders = _getFilteredOrders(tabIndex);

    if (orders.isEmpty) {
      return _buildEmptyState(tabIndex);
    }

    return RefreshIndicator(
      onRefresh: () => _loadOrders(refresh: true),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _buildOrderCard(order);
        },
      ),
    );
  }

  Widget _buildEmptyState(int tabIndex) {
    String title;
    String subtitle;
    IconData icon;

    switch (tabIndex) {
      case 1: // Active
        title = 'No Active Orders';
        subtitle = 'Your active orders will appear here';
        icon = Icons.shopping_bag_outlined;
        break;
      case 2: // Completed
        title = 'No Completed Orders';
        subtitle = 'Your completed orders will appear here';
        icon = Icons.check_circle_outline;
        break;
      case 3: // Cancelled
        title = 'No Cancelled Orders';
        subtitle = 'Your cancelled orders will appear here';
        icon = Icons.cancel_outlined;
        break;
      default: // All
        title = 'No Orders Yet';
        subtitle = 'Start shopping to see your orders here';
        icon = Icons.shopping_cart_outlined;
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          if (tabIndex == 0) ...[
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pushReplacementNamed('/main'),
              icon: const Icon(Icons.shopping_bag),
              label: const Text('Start Shopping'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    final firstItem = order.firstItem;
    
    return Card(
      elevation: AppConstants.cardElevation,
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppConstants.cardBorderRadius),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            order.formattedOrderId,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Placed on ${order.formattedOrderDate}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(order.status),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        order.statusDisplayText,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${order.quantitySummaryText} • ${order.formattedTotalAmount}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    if (order.status != OrderStatus.delivered &&
                        order.status != OrderStatus.cancelled)
                      Text(
                        order.deliveryStatusText,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          
          // Order items preview
          if (firstItem != null)
            Padding(
              padding: const EdgeInsets.all(16),
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
                          firstItem.productName,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${firstItem.quantityText} • ${firstItem.formattedTotalPrice}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                        if (order.totalItems > 1)
                          Text(
                            '+${order.totalItems - 1} more item${order.totalItems > 2 ? 's' : ''}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          
          // Progress indicator for active orders
          if (order.status != OrderStatus.delivered &&
              order.status != OrderStatus.cancelled)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: LinearProgressIndicator(
                value: order.progressPercentage,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  _getStatusColor(order.status),
                ),
              ),
            ),
          
          // Action buttons
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (order.canBeCancelled)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _cancelOrder(order),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                if (order.canBeCancelled) const SizedBox(width: 8),
                
                if (order.status != OrderStatus.cancelled)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _reorderItems(order),
                      child: const Text('Reorder'),
                    ),
                  ),
                const SizedBox(width: 8),
                
                if (order.status != OrderStatus.delivered &&
                    order.status != OrderStatus.cancelled)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _trackOrder(order),
                      child: const Text('Track'),
                    ),
                  ),
                
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      // Navigate to order details
                      Navigator.pushNamed(
                        context,
                        AppRoutes.orderDetails,
                        arguments: order,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('View Details'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Colors.orange;
      case OrderStatus.confirmed:
        return Colors.blue;
      case OrderStatus.processing:
        return Colors.blue;
      case OrderStatus.packed:
        return Colors.purple;
      case OrderStatus.shipped:
        return Colors.deepOrange;
      case OrderStatus.outForDelivery:
        return Colors.deepOrange;
      case OrderStatus.delivered:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
      case OrderStatus.returned:
        return Colors.orange;
      case OrderStatus.refunded:
        return Colors.green;
    }
  }
}