import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/providers/product_provider.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  void _loadCategories() {
    final productProvider = context.read<ProductProvider>();
    // productProvider.loadCategories(); // Uncomment when implementation is ready
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Consumer<ProductProvider>(
        builder: (context, productProvider, child) {
          if (productProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Text(
                  'Shop by Categories',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Explore our wide range of wellness products',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Categories Grid
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.1,
                  ),
                  itemCount: _mockCategories.length,
                  itemBuilder: (context, index) {
                    final category = _mockCategories[index];
                    return _buildCategoryCard(category);
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCategoryCard(Map<String, dynamic> category) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          // Navigate to category products
          Navigator.pushNamed(
            context, 
            '/products',
            arguments: {'category': category['name']},
          );
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Category Icon
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: category['color'].withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  category['icon'],
                  size: 32,
                  color: category['color'],
                ),
              ),
              const SizedBox(height: 12),
              
              // Category Name
              Text(
                category['name'],
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              
              // Product Count
              Text(
                '${category['productCount']} products',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              
              // Popular Badge (if applicable)
              if (category['isPopular'] == true)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Popular',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // Mock categories data
  static final List<Map<String, dynamic>> _mockCategories = [
    {
      'name': 'Vitamins & Supplements',
      'icon': Icons.medication,
      'color': Colors.blue,
      'productCount': 150,
      'isPopular': true,
    },
    {
      'name': 'Fitness & Sports',
      'icon': Icons.fitness_center,
      'color': Colors.green,
      'productCount': 89,
      'isPopular': false,
    },
    {
      'name': 'Beauty & Personal Care',
      'icon': Icons.face,
      'color': Colors.pink,
      'productCount': 234,
      'isPopular': true,
    },
    {
      'name': 'Organic & Natural',
      'icon': Icons.eco,
      'color': Colors.green[600]!,
      'productCount': 78,
      'isPopular': false,
    },
    {
      'name': 'Health Devices',
      'icon': Icons.health_and_safety,
      'color': Colors.red,
      'productCount': 45,
      'isPopular': false,
    },
    {
      'name': 'Baby & Kids',
      'icon': Icons.child_care,
      'color': Colors.purple,
      'productCount': 112,
      'isPopular': true,
    },
    {
      'name': 'Herbal & Ayurveda',
      'icon': Icons.local_florist,
      'color': Colors.orange,
      'productCount': 67,
      'isPopular': false,
    },
    {
      'name': 'Weight Management',
      'icon': Icons.monitor_weight,
      'color': Colors.indigo,
      'productCount': 93,
      'isPopular': true,
    },
    {
      'name': 'Protein & Nutrition',
      'icon': Icons.restaurant,
      'color': Colors.brown,
      'productCount': 156,
      'isPopular': true,
    },
    {
      'name': 'Mental Wellness',
      'icon': Icons.psychology,
      'color': Colors.teal,
      'productCount': 34,
      'isPopular': false,
    },
    {
      'name': 'Home Healthcare',
      'icon': Icons.health_and_safety,
      'color': Colors.cyan,
      'productCount': 78,
      'isPopular': false,
    },
    {
      'name': 'Sexual Wellness',
      'icon': Icons.favorite,
      'color': Colors.red[300]!,
      'productCount': 23,
      'isPopular': false,
    },
  ];
}