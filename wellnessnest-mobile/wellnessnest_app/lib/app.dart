import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';

import 'config/theme.dart';
import 'config/routes.dart';
import 'config/constants.dart';
import 'data/providers/auth_provider.dart';
import 'data/providers/cart_provider.dart';
import 'data/providers/wishlist_provider.dart';
import 'data/providers/product_provider.dart';

class WellnessNestApp extends StatelessWidget {
  const WellnessNestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => WishlistProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            
            // Set initial route based on app state
            home: const AppInitializer(),
            
            // Route generator
            onGenerateRoute: AppRoutes.generateRoute,
            
            // Global navigator key for programmatic navigation
            navigatorKey: GlobalKey<NavigatorState>(),
            
            // Locale configuration
            locale: const Locale('en', 'IN'),
            supportedLocales: const [
              Locale('en', 'US'),
              Locale('en', 'IN'),
            ],

            builder: (context, child) {
              // Global error boundary and theme enforcement
              return MediaQuery(
                data: MediaQuery.of(context).copyWith(
                  textScaler: TextScaler.linear(1.0), // Disable font scaling
                ),
                child: child ?? const SizedBox.shrink(),
              );
            },
          );
        },
      ),
    );
  }
}

class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  bool _isInitializing = true;
  String _initializationStatus = 'Initializing...';

  @override
  void initState() {
    super.initState();
    _navigateImmediately();
  }

  void _navigateImmediately() async {
    // Navigate immediately without any initialization
    if (mounted) {
      setState(() {
        _isInitializing = false;
      });

      // Navigate to appropriate screen first
      _navigateToInitialScreen();

      // Schedule provider initialization for much later with Timer
      Timer(const Duration(milliseconds: 500), _initializeProvidersInBackground);
    }
  }

  void _initializeProvidersInBackground() {
    try {
      if (!mounted) return;

      // Get all providers and initialize in background
      final authProvider = context.read<AuthProvider>();
      final cartProvider = context.read<CartProvider>();
      final wishlistProvider = context.read<WishlistProvider>();
      final productProvider = context.read<ProductProvider>();

      // Fire and forget - no awaiting, no blocking
      unawaited(authProvider.initialize());
      unawaited(cartProvider.initialize(authProvider.currentUser));
      unawaited(wishlistProvider.initialize(authProvider.currentUser));
      unawaited(productProvider.initialize());

    } catch (e) {
      print('Background initialization error: $e');
      // Ignore errors - app continues to work without backend data
    }
  }

  void _navigateToInitialScreen() async {
    // Check if user has completed onboarding
    final prefs = await SharedPreferences.getInstance();
    final hasSeenOnboarding = prefs.getBool(AppConstants.onboardingCompletedKey) ?? false;

    if (!mounted) return;

    if (!hasSeenOnboarding) {
      // Show onboarding for first-time users
      Navigator.of(context).pushReplacementNamed(AppRoutes.onboarding);
    } else {
      // Navigate to main app
      Navigator.of(context).pushReplacementNamed(AppRoutes.main);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitializing) {
      return Scaffold(
        backgroundColor: Theme.of(context).colorScheme.primary,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // App logo
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.coffee,
                  size: 80,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 32),
              
              // App name
              const Text(
                AppConstants.appName,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 8),
              
              // App description
              const Text(
                AppConstants.appDescription,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white70,
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Loading indicator
              const SizedBox(
                width: 40,
                height: 40,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Status text
              Text(
                _initializationStatus,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                ),
                textAlign: TextAlign.center,
              ),
              
              // Version info
              const SizedBox(height: 32),
              Text(
                'Version ${AppConstants.appVersion}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // This should never be reached as we navigate away
    return const SizedBox.shrink();
  }
}

// Error boundary widget for handling global app errors
class AppErrorBoundary extends StatelessWidget {
  final Widget child;
  final String? error;

  const AppErrorBoundary({
    super.key,
    required this.child,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    if (error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              const Text(
                'Something went wrong',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  error!,
                  style: const TextStyle(fontSize: 14),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  // Restart app (you might want to implement proper restart logic)
                  Navigator.of(context).pushNamedAndRemoveUntil(
                    AppRoutes.splash,
                    (route) => false,
                  );
                },
                child: const Text('Restart App'),
              ),
            ],
          ),
        ),
      );
    }

    return child;
  }
}