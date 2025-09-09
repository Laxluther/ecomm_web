import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/providers/auth_provider.dart';
import '../../../data/providers/product_provider.dart';
import '../../../data/models/product.dart';
import '../../../data/models/category.dart' as model;
import '../../widgets/app_logo.dart';
import '../../widgets/modern_product_card.dart';
import '../../widgets/trust_badges.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load data asynchronously without blocking UI
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDataInBackground();
    });
  }

  void _loadDataInBackground() {
    final productProvider = context.read<ProductProvider>();
    // Fire and forget - don't block UI
    productProvider.loadFeaturedProducts();
    productProvider.loadCategories();
  }

  String _getTimeBasedGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          return Consumer<ProductProvider>(
            builder: (context, productProvider, child) {
              // Always show UI immediately - no loading spinner

              return CustomScrollView(
                slivers: [
                  // Modern SliverAppBar
                  _buildModernAppBar(),

                  // Enhanced Welcome Section
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: _buildEnhancedWelcomeSection(authProvider),
                    ),
                  ),

                  // Smart Product Banners
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                      child: _buildSmartBanners(productProvider),
                    ),
                  ),

                  // Enhanced Categories Section
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildEnhancedCategoriesSection(productProvider),
                    ),
                  ),

                  // Spacing
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 32),
                  ),

                  // Featured Products Section
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _buildFeaturedProductsHeader(),
                    ),
                  ),

                  // Products Grid
                  _buildEnhancedProductsGrid(productProvider),

                  // Trust Badges Section
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(20.0),
                      child: TrustBadges(),
                    ),
                  ),

                  // Bottom padding
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 100),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildModernAppBar() {
    return SliverAppBar(
      expandedHeight: 100,
      floating: true,
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      shadowColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF4CAF50),
                Color(0xFF66BB6A),
              ],
            ),
          ),
          child: const SafeArea(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  AppLogo(
                    size: 36,
                    withText: false,
                  ),
                  SizedBox(width: 12),
                  Text(
                    'WellnessNest',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 8),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.search,
                color: Colors.white,
                size: 20,
              ),
            ),
            onPressed: _navigateToSearch,
          ),
        ),
        Container(
          margin: const EdgeInsets.only(right: 16),
          child: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.shopping_cart,
                color: Colors.white,
                size: 20,
              ),
            ),
            onPressed: _navigateToCart,
          ),
        ),
      ],
    );
  }

  Widget _buildEnhancedWelcomeSection(AuthProvider authProvider) {
    final user = authProvider.currentUser;
    final userName = user?.firstName ?? 'there';
    final greeting = _getTimeBasedGreeting();
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            Colors.grey[50]!,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4CAF50), Color(0xFF66BB6A)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  _getTimeIcon(),
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$greeting, $userName!',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2E2E2E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Discover premium wellness products',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getTimeIcon() {
    final hour = DateTime.now().hour;
    if (hour < 12) return Icons.wb_sunny;
    if (hour < 17) return Icons.wb_sunny_outlined;
    return Icons.nights_stay;
  }

  Widget _buildSmartBanners(ProductProvider productProvider) {
    final products = productProvider.featuredProducts;
    if (products.isEmpty) {
      return const SizedBox.shrink();
    }

    // Generate smart banners from real data
    final featuredProduct = products.firstWhere(
      (p) => p.hasDiscount,
      orElse: () => products.first,
    );
    
    final topRatedProduct = products.where((p) => (p.rating ?? 0) >= 4.0).isNotEmpty
        ? products.where((p) => (p.rating ?? 0) >= 4.0).first
        : products.first;

    return Column(
      children: [
        // Featured Deal Banner
        Container(
          width: double.infinity,
          height: 160,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                const Color(0xFF4CAF50),
                const Color(0xFF66BB6A),
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4CAF50).withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                top: -20,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        '🔥 FEATURED DEAL',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      featuredProduct.productName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (featuredProduct.hasDiscount) ...[
                          Text(
                            featuredProduct.formattedEffectivePrice,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            featuredProduct.formattedPrice,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        ] else
                          Text(
                            featuredProduct.formattedPrice,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        const Spacer(),
                        ElevatedButton(
                          onPressed: () => _navigateToProductDetails(featuredProduct),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF4CAF50),
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(25),
                            ),
                          ),
                          child: const Text(
                            'Shop Now',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEnhancedCategoriesSection(ProductProvider productProvider) {
    final categories = productProvider.categories;
    
    if (categories.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Shop by Category',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2E2E2E),
          ),
        ),
        const SizedBox(height: 20),
        _buildDynamicCategoriesGrid(categories, productProvider),
      ],
    );
  }

  Widget _buildDynamicCategoriesGrid(List<model.Category> categories, ProductProvider productProvider) {
    final rootCategories = categories.where((cat) => cat.isRootCategory && cat.isActive).toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    
    if (rootCategories.isEmpty) {
      return const Center(
        child: Text(
          'No categories available',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
      );
    }

    // Show categories in a responsive grid
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: rootCategories.length > 1 ? 2 : 1,
        childAspectRatio: 1.2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: rootCategories.length,
      itemBuilder: (context, index) {
        final category = rootCategories[index];
        final categoryProducts = productProvider.featuredProducts.where(
          (p) => p.categoryName.toLowerCase().contains(category.name.toLowerCase())
        ).toList();
        
        return _buildRealCategoryCard(
          category: category,
          products: categoryProducts,
          onTap: () {
            Navigator.pushNamed(context, '/products', arguments: category.name.toLowerCase());
          },
        );
      },
    );
  }

  Widget _buildRealCategoryCard({
    required model.Category category,
    required List<Product> products,
    required VoidCallback onTap,
  }) {
    final productCount = products.length;
    final minPrice = products.isNotEmpty 
        ? products.map((p) => p.effectivePrice).reduce((a, b) => a < b ? a : b)
        : 0.0;

    // Determine icon and colors based on category name
    IconData icon;
    List<Color> gradientColors;
    
    final categoryNameLower = category.name.toLowerCase();
    if (categoryNameLower.contains('coffee')) {
      icon = Icons.local_cafe;
      gradientColors = [const Color(0xFF6F4E37), const Color(0xFF8D6E63)];
    } else if (categoryNameLower.contains('makhana')) {
      icon = Icons.grain;
      gradientColors = [const Color(0xFFFF6B35), const Color(0xFFFF8A50)];
    } else if (categoryNameLower.contains('snack')) {
      icon = Icons.lunch_dining;
      gradientColors = [const Color(0xFFE91E63), const Color(0xFFF06292)];
    } else if (categoryNameLower.contains('drink') || categoryNameLower.contains('beverage')) {
      icon = Icons.local_drink;
      gradientColors = [const Color(0xFF2196F3), const Color(0xFF42A5F5)];
    } else {
      icon = Icons.category;
      gradientColors = [const Color(0xFF4CAF50), const Color(0xFF66BB6A)];
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradientColors,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: gradientColors.first.withValues(alpha: 0.3),
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              right: -15,
              top: -15,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Icon(
                      icon,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        category.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        category.productCount != null 
                            ? '${category.productCount} Products'
                            : '$productCount Products',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (minPrice > 0)
                        Text(
                          'From ₹${minPrice.toInt()}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      if (category.description != null && category.description!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            category.description!,
                            style: const TextStyle(
                              color: Colors.white60,
                              fontSize: 10,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturedProductsHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text(
          'Featured Products',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2E2E2E),
          ),
        ),
        TextButton.icon(
          onPressed: _navigateToProducts,
          icon: const Icon(
            Icons.arrow_forward,
            size: 16,
          ),
          label: const Text(
            'View All',
            style: TextStyle(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  // Navigation methods
  void _navigateToSearch() {
    Navigator.pushNamed(context, '/search');
  }

  void _navigateToCart() {
    Navigator.pushNamed(context, '/cart');
  }

  void _navigateToProducts() {
    Navigator.pushNamed(context, '/products');
  }

  void _navigateToProductDetails(Product product) {
    Navigator.pushNamed(context, '/product-details', arguments: product);
  }

  Widget _buildEnhancedProductsGrid(ProductProvider productProvider) {
    final featuredProducts = productProvider.featuredProducts;
    
    if (featuredProducts.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(40),
            child: Text(
              'No products available at the moment.',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.7,
          crossAxisSpacing: 16,
          mainAxisSpacing: 20,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final product = featuredProducts[index];
            return ModernProductCard(
              product: product,
              onTap: () => _navigateToProductDetails(product),
              onAddToCart: () => _addToCart(product),
              onAddToWishlist: () => _addToWishlist(product),
              isWishlisted: false,
            );
          },
          childCount: featuredProducts.length,
        ),
      ),
    );
  }


  void _addToCart(Product product) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(
              Icons.check_circle,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '${product.productName} added to cart',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF4CAF50),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _addToWishlist(Product product) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(
              Icons.favorite,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                '${product.productName} added to wishlist',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red[400],
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

}