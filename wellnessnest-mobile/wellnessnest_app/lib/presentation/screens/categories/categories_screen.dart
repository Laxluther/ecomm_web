import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';

import '../../../data/providers/product_provider.dart';
import '../../../data/models/category.dart' as model;

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    _loadCategories();
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _loadCategories() {
    final productProvider = context.read<ProductProvider>();
    productProvider.loadCategories();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF8F9FA),
              Color(0xFFE9ECEF),
            ],
          ),
        ),
        child: SafeArea(
          child: Consumer<ProductProvider>(
            builder: (context, productProvider, child) {
              return CustomScrollView(
                slivers: [
                  // Modern App Bar
                  SliverAppBar(
                    expandedHeight: 160,
                    floating: false,
                    pinned: true,
                    elevation: 0,
                    backgroundColor: Colors.transparent,
                    foregroundColor: const Color(0xFF1A1D29),
                    systemOverlayStyle: SystemUiOverlayStyle.dark,
                    flexibleSpace: FlexibleSpaceBar(
                      background: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Color(0xFFF8F9FA),
                              Color(0xFFE9ECEF),
                            ],
                          ),
                        ),
                        padding: const EdgeInsets.fromLTRB(24, 60, 24, 20),
                        child: FadeTransition(
                          opacity: _fadeAnimation,
                          child: SlideTransition(
                            position: _slideAnimation,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(
                                  'Shop by Categories',
                                  style: TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF1A1D29),
                                    height: 1.2,
                                    shadows: [
                                      Shadow(
                                        offset: const Offset(0, 1),
                                        blurRadius: 3,
                                        color: Colors.black.withOpacity(0.1),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Discover premium wellness products curated for your lifestyle',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF6C757D),
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  
                  // Categories Content
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    sliver: productProvider.isLoading
                        ? SliverToBoxAdapter(
                            child: _buildModernLoadingState(),
                          )
                        : _buildCategoriesGrid(productProvider),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildModernLoadingState() {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.6,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6C63FF), Color(0xFF8B7ED8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(40),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF6C63FF).withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Center(
              child: SizedBox(
                width: 30,
                height: 30,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Loading Categories...',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1A1D29),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Discovering amazing wellness products for you',
            style: TextStyle(
              fontSize: 14,
              color: const Color(0xFF6C757D),
            ),
          ),
        ],
      ),
    );
  }

  SliverGrid _buildCategoriesGrid(ProductProvider productProvider) {
    final categories = productProvider.categories.isNotEmpty
        ? productProvider.categories
            .where((cat) => cat.isActive)
            .toList()
        : _getFallbackCategories();

    return SliverGrid(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          return FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: _buildModernCategoryCard(categories[index], index),
            ),
          );
        },
        childCount: categories.length,
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.85,
        crossAxisSpacing: 16,
        mainAxisSpacing: 20,
      ),
    );
  }

  Widget _buildModernCategoryCard(dynamic category, int index) {
    final gradients = _getCategoryGradients();
    final currentGradient = gradients[index % gradients.length];
    final isRealCategory = category is model.Category;
    
    final categoryName = isRealCategory ? category.name : category['name'];
    final productCount = isRealCategory 
        ? (category.productCount ?? 0)
        : category['productCount'] ?? 0;
    final icon = isRealCategory 
        ? _getCategoryIcon(category.name)
        : category['icon'];

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: currentGradient,
        ),
        boxShadow: [
          BoxShadow(
            color: currentGradient.first.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            HapticFeedback.lightImpact();
            Navigator.pushNamed(
              context,
              '/products',
              arguments: {'category': categoryName.toLowerCase()},
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon Container
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    icon,
                    size: 28,
                    color: Colors.white,
                  ),
                ),
                
                const Spacer(),
                
                // Category Name
                Text(
                  categoryName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: 8),
                
                // Product Count
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    '$productCount products',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<List<Color>> _getCategoryGradients() {
    return [
      [const Color(0xFF6C63FF), const Color(0xFF8B7ED8)],
      [const Color(0xFFFF6B6B), const Color(0xFFEE5A52)],
      [const Color(0xFF4ECDC4), const Color(0xFF44A08D)],
      [const Color(0xFFFFBE0B), const Color(0xFFFB8500)],
      [const Color(0xFF6A4C93), const Color(0xFF9A6FB0)],
      [const Color(0xFF38B2AC), const Color(0xFF319795)],
      [const Color(0xFFE53E3E), const Color(0xFFFC8181)],
      [const Color(0xFF805AD5), const Color(0xFFB794F6)],
      [const Color(0xFF3182CE), const Color(0xFF63B3ED)],
      [const Color(0xFFD69E2E), const Color(0xFFF6E05E)],
      [const Color(0xFF38A169), const Color(0xFF68D391)],
      [const Color(0xFFE53E3E), const Color(0xFFFEB2B2)],
    ];
  }

  IconData _getCategoryIcon(String categoryName) {
    final lowerName = categoryName.toLowerCase();
    if (lowerName.contains('vitamin') || lowerName.contains('supplement')) {
      return Icons.medication_rounded;
    } else if (lowerName.contains('fitness') || lowerName.contains('sports')) {
      return Icons.fitness_center_rounded;
    } else if (lowerName.contains('beauty') || lowerName.contains('personal')) {
      return Icons.face_rounded;
    } else if (lowerName.contains('organic') || lowerName.contains('natural')) {
      return Icons.eco_rounded;
    } else if (lowerName.contains('health') && lowerName.contains('device')) {
      return Icons.health_and_safety_rounded;
    } else if (lowerName.contains('baby') || lowerName.contains('kids')) {
      return Icons.child_care_rounded;
    } else if (lowerName.contains('herbal') || lowerName.contains('ayurveda')) {
      return Icons.local_florist_rounded;
    } else if (lowerName.contains('weight') || lowerName.contains('management')) {
      return Icons.monitor_weight_rounded;
    } else if (lowerName.contains('protein') || lowerName.contains('nutrition')) {
      return Icons.restaurant_rounded;
    } else if (lowerName.contains('mental') || lowerName.contains('wellness')) {
      return Icons.psychology_rounded;
    } else if (lowerName.contains('home') && lowerName.contains('healthcare')) {
      return Icons.home_rounded;
    } else if (lowerName.contains('sexual')) {
      return Icons.favorite_rounded;
    }
    return Icons.category_rounded;
  }

  List<Map<String, dynamic>> _getFallbackCategories() {
    return [
      {
        'name': 'Vitamins & Supplements',
        'icon': Icons.medication_rounded,
        'productCount': 150,
      },
      {
        'name': 'Fitness & Sports',
        'icon': Icons.fitness_center_rounded,
        'productCount': 89,
      },
      {
        'name': 'Beauty & Personal Care',
        'icon': Icons.face_rounded,
        'productCount': 234,
      },
      {
        'name': 'Organic & Natural',
        'icon': Icons.eco_rounded,
        'productCount': 78,
      },
      {
        'name': 'Health Devices',
        'icon': Icons.health_and_safety_rounded,
        'productCount': 45,
      },
      {
        'name': 'Baby & Kids',
        'icon': Icons.child_care_rounded,
        'productCount': 112,
      },
    ];
  }
}