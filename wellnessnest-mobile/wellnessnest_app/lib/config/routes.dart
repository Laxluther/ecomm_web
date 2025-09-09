import 'package:flutter/material.dart';
import '../presentation/screens/onboarding/onboarding_screen.dart';
import '../presentation/screens/auth/login_screen.dart';
import '../presentation/screens/auth/register_screen.dart';
import '../presentation/screens/home/home_screen.dart';
import '../presentation/screens/categories/categories_screen.dart';
import '../presentation/screens/products/products_list_screen.dart';
import '../presentation/screens/products/product_details_screen.dart';
import '../presentation/screens/search/search_screen.dart';
import '../presentation/screens/cart/cart_screen.dart';
import '../presentation/screens/wishlist/wishlist_screen.dart';
import '../presentation/screens/profile/profile_screen.dart';
import '../presentation/screens/profile/addresses_screen.dart';
import '../presentation/screens/profile/orders_screen.dart';
import '../presentation/screens/profile/wallet_screen.dart';
import '../presentation/screens/profile/referrals_screen.dart';
import '../presentation/screens/checkout/checkout_screen.dart';
import '../presentation/screens/checkout/order_success_screen.dart';
import '../presentation/navigation/bottom_navigation.dart';
import '../data/models/product.dart';
import '../data/models/order.dart';

class AppRoutes {
  // Route names
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String main = '/main';
  static const String home = '/home';
  static const String categories = '/categories';
  static const String products = '/products';
  static const String productDetails = '/product-details';
  static const String search = '/search';
  static const String cart = '/cart';
  static const String wishlist = '/wishlist';
  static const String profile = '/profile';
  static const String addresses = '/addresses';
  static const String orders = '/orders';
  static const String orderDetails = '/order-details';
  static const String wallet = '/wallet';
  static const String referrals = '/referrals';
  static const String checkout = '/checkout';
  static const String orderSuccess = '/order-success';
  static const String settings = '/settings';

  // Route generator
  static Route<dynamic> generateRoute(RouteSettings settings) {
    final args = settings.arguments;

    switch (settings.name) {
      case splash:
        return _buildRoute(
          const SplashScreen(),
          settings: settings,
        );
      
      case onboarding:
        return _buildRoute(
          const OnboardingScreen(),
          settings: settings,
        );

      case login:
        return _buildRoute(
          const LoginScreen(),
          settings: settings,
        );

      case register:
        return _buildRoute(
          const RegisterScreen(),
          settings: settings,
        );

      case main:
        return _buildRoute(
          const MainNavigationScreen(),
          settings: settings,
          transitionType: _TransitionType.fade,
        );

      case home:
        return _buildRoute(
          const HomeScreen(),
          settings: settings,
        );

      case categories:
        return _buildRoute(
          const CategoriesScreen(),
          settings: settings,
        );

      case products:
        return _buildRoute(
          ProductsListScreen(
            categoryId: args is Map ? args['categoryId'] : null,
            categoryName: args is Map ? args['categoryName'] : null,
            searchQuery: args is Map ? args['searchQuery'] : null,
          ),
          settings: settings,
        );

      case productDetails:
        if (args is Product) {
          return _buildRoute(
            ProductDetailsScreen(product: args),
            settings: settings,
            transitionType: _TransitionType.slideUp,
          );
        } else if (args is Map && args['productId'] != null) {
          return _buildRoute(
            ProductDetailsScreen(productId: args['productId']),
            settings: settings,
            transitionType: _TransitionType.slideUp,
          );
        }
        return _buildErrorRoute('Product details requires a Product object or productId');

      case search:
        return _buildRoute(
          SearchScreen(
            initialQuery: args is String ? args : null,
          ),
          settings: settings,
        );

      case cart:
        return _buildRoute(
          const CartScreen(),
          settings: settings,
          transitionType: _TransitionType.slideUp,
        );

      case wishlist:
        return _buildRoute(
          const WishlistScreen(),
          settings: settings,
        );

      case profile:
        return _buildRoute(
          const ProfileScreen(),
          settings: settings,
        );

      case addresses:
        return _buildRoute(
          const AddressesScreen(),
          settings: settings,
        );

      case orders:
        return _buildRoute(
          const OrdersScreen(),
          settings: settings,
        );

      case orderDetails:
        if (args is Order) {
          return _buildRoute(
            OrderDetailsScreen(order: args),
            settings: settings,
          );
        } else if (args is Map && args['orderId'] != null) {
          return _buildRoute(
            OrderDetailsScreen(orderId: args['orderId']),
            settings: settings,
          );
        }
        return _buildErrorRoute('Order details requires an Order object or orderId');

      case wallet:
        return _buildRoute(
          const WalletScreen(),
          settings: settings,
        );

      case referrals:
        return _buildRoute(
          const ReferralsScreen(),
          settings: settings,
        );

      case checkout:
        return _buildRoute(
          const CheckoutScreen(),
          settings: settings,
          transitionType: _TransitionType.slideUp,
        );

      case orderSuccess:
        if (args is Order) {
          return _buildRoute(
            OrderSuccessScreen(order: args),
            settings: settings,
            transitionType: _TransitionType.fade,
          );
        }
        return _buildErrorRoute('Order success requires an Order object');

      default:
        return _buildErrorRoute('Route ${settings.name} not found');
    }
  }

  // Helper method to build routes with custom transitions
  static PageRoute<T> _buildRoute<T extends Object?>(
    Widget page, {
    required RouteSettings settings,
    _TransitionType transitionType = _TransitionType.slide,
    Duration transitionDuration = const Duration(milliseconds: 300),
  }) {
    switch (transitionType) {
      case _TransitionType.fade:
        return PageRouteBuilder<T>(
          settings: settings,
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionDuration: transitionDuration,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        );

      case _TransitionType.slideUp:
        return PageRouteBuilder<T>(
          settings: settings,
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionDuration: transitionDuration,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const begin = Offset(0.0, 1.0);
            const end = Offset.zero;
            const curve = Curves.easeInOut;
            var tween = Tween(begin: begin, end: end).chain(
              CurveTween(curve: curve),
            );
            return SlideTransition(
              position: animation.drive(tween),
              child: child,
            );
          },
        );

      case _TransitionType.slideLeft:
        return PageRouteBuilder<T>(
          settings: settings,
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionDuration: transitionDuration,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const begin = Offset(1.0, 0.0);
            const end = Offset.zero;
            const curve = Curves.easeInOut;
            var tween = Tween(begin: begin, end: end).chain(
              CurveTween(curve: curve),
            );
            return SlideTransition(
              position: animation.drive(tween),
              child: child,
            );
          },
        );

      case _TransitionType.scale:
        return PageRouteBuilder<T>(
          settings: settings,
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionDuration: transitionDuration,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return ScaleTransition(
              scale: Tween<double>(
                begin: 0.0,
                end: 1.0,
              ).animate(CurvedAnimation(
                parent: animation,
                curve: Curves.elasticOut,
              )),
              child: child,
            );
          },
        );

      case _TransitionType.slide:
      default:
        return MaterialPageRoute<T>(
          builder: (context) => page,
          settings: settings,
        );
    }
  }

  // Error route builder
  static Route<dynamic> _buildErrorRoute(String message) {
    return MaterialPageRoute<dynamic>(
      builder: (context) => Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Route Error',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Navigation helper methods
  static Future<T?> navigateTo<T extends Object?>(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    return Navigator.pushNamed<T>(context, routeName, arguments: arguments);
  }

  static Future<T?> navigateToAndReplace<T extends Object?, TO extends Object?>(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    return Navigator.pushReplacementNamed<T, TO>(
      context,
      routeName,
      arguments: arguments,
    );
  }

  static Future<T?> navigateToAndClearAll<T extends Object?>(
    BuildContext context,
    String routeName, {
    Object? arguments,
  }) {
    return Navigator.pushNamedAndRemoveUntil<T>(
      context,
      routeName,
      (route) => false,
      arguments: arguments,
    );
  }

  static void goBack<T extends Object?>(BuildContext context, [T? result]) {
    Navigator.pop<T>(context, result);
  }

  static bool canGoBack(BuildContext context) {
    return Navigator.canPop(context);
  }

  // Specific navigation methods for common flows
  static Future<void> navigateToLogin(BuildContext context) {
    return navigateToAndReplace(context, login);
  }

  static Future<void> navigateToMain(BuildContext context) {
    return navigateToAndClearAll(context, main);
  }

  static Future<void> navigateToProductDetails(
    BuildContext context,
    Product product,
  ) {
    return navigateTo(context, productDetails, arguments: product);
  }

  static Future<void> navigateToProductDetailsById(
    BuildContext context,
    int productId,
  ) {
    return navigateTo(context, productDetails, arguments: {'productId': productId});
  }

  static Future<void> navigateToProducts(
    BuildContext context, {
    int? categoryId,
    String? categoryName,
    String? searchQuery,
  }) {
    return navigateTo(
      context,
      products,
      arguments: {
        'categoryId': categoryId,
        'categoryName': categoryName,
        'searchQuery': searchQuery,
      },
    );
  }

  static Future<void> navigateToCart(BuildContext context) {
    return navigateTo(context, cart);
  }

  static Future<void> navigateToCheckout(BuildContext context) {
    return navigateTo(context, checkout);
  }

  static Future<void> navigateToOrderSuccess(BuildContext context, Order order) {
    return navigateToAndReplace(context, orderSuccess, arguments: order);
  }

  static Future<void> navigateToSearch(
    BuildContext context, {
    String? initialQuery,
  }) {
    return navigateTo(context, search, arguments: initialQuery);
  }
}

enum _TransitionType {
  slide,
  fade,
  slideUp,
  slideLeft,
  scale,
}

// Splash Screen (temporary placeholder until implemented)
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.primary,
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.coffee,
              size: 80,
              color: Colors.white,
            ),
            SizedBox(height: 24),
            Text(
              'WellnessNest',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Premium Coffee Experience',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Temporary placeholders for screens that will be implemented
class OrderDetailsScreen extends StatelessWidget {
  final Order? order;
  final int? orderId;

  const OrderDetailsScreen({super.key, this.order, this.orderId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: const Center(child: Text('Order Details - Coming Soon')),
    );
  }
}