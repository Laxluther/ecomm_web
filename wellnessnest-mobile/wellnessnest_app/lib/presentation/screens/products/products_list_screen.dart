import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../config/constants.dart';
import '../../../config/routes.dart';
import '../../../data/models/product.dart';
import '../../../data/providers/product_provider.dart';
import '../../../data/providers/cart_provider.dart';
import '../../../data/providers/wishlist_provider.dart';

class ProductsListScreen extends StatefulWidget {
  final int? categoryId;
  final String? categoryName;
  final String? searchQuery;

  const ProductsListScreen({
    super.key,
    this.categoryId,
    this.categoryName,
    this.searchQuery,
  });

  @override
  State<ProductsListScreen> createState() => _ProductsListScreenState();
}

class _ProductsListScreenState extends State<ProductsListScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  
  String _currentSortOption = AppConstants.sortOptions[0];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  List<Product> _products = [];
  bool _hasMoreProducts = true;
  int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    if (widget.searchQuery != null) {
      _searchController.text = widget.searchQuery!;
    }
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProducts();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _hasMoreProducts) {
        _loadMoreProducts();
      }
    }
  }

  Future<void> _loadProducts({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _products.clear();
        _hasMoreProducts = true;
      });
    }

    setState(() {
      _isLoading = refresh || _products.isEmpty;
    });

    try {
      final filters = ProductFilters(
        categoryId: widget.categoryId,
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        sortBy: _getSortByFromOption(_currentSortOption),
        sortOrder: _getSortOrderFromOption(_currentSortOption),
        page: _currentPage,
        limit: AppConstants.productsPerPage,
      );

      // TODO: Replace with actual API call through ProductProvider
      await Future.delayed(const Duration(milliseconds: 500));
      final mockProducts = _generateMockProducts(_currentPage);
      
      if (mounted) {
        setState(() {
          if (refresh || _currentPage == 1) {
            _products = mockProducts;
          } else {
            _products.addAll(mockProducts);
          }
          _hasMoreProducts = mockProducts.length == AppConstants.productsPerPage;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading products: $e')),
        );
      }
    }
  }

  Future<void> _loadMoreProducts() async {
    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });

    await _loadProducts();

    setState(() {
      _isLoadingMore = false;
    });
  }

  String _getSortByFromOption(String option) {
    switch (option) {
      case 'Price: Low to High':
      case 'Price: High to Low':
        return 'price';
      case 'Best Rated':
        return 'rating';
      case 'Most Popular':
        return 'popularity';
      default:
        return 'created_at';
    }
  }

  String _getSortOrderFromOption(String option) {
    switch (option) {
      case 'Price: High to Low':
      case 'Best Rated':
        return 'desc';
      default:
        return 'asc';
    }
  }

  List<Product> _generateMockProducts(int page) {
    final List<Product> products = [];
    final startIndex = (page - 1) * AppConstants.productsPerPage;
    
    for (int i = startIndex; i < startIndex + AppConstants.productsPerPage && i < 100; i++) {
      products.add(Product(
        productId: i + 1,
        productName: 'Product ${i + 1}',
        description: 'High-quality wellness product for your health needs',
        price: 100.0 + (i % 10) * 50.0,
        discountPrice: i % 3 == 0 ? 80.0 + (i % 10) * 40.0 : null,
        primaryImage: null,
        brand: 'Brand ${(i % 5) + 1}',
        categoryName: widget.categoryName ?? 'Wellness',
        categoryId: widget.categoryId,
        stockQuantity: 10 + (i % 20),
        rating: 3.5 + (i % 3) * 0.5,
        reviewCount: 10 + (i % 100),
        isFeatured: i % 4 == 0,
      ));
    }
    return products;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.categoryName ?? 'Products'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              AppRoutes.navigateToSearch(context);
            },
          ),
          IconButton(
            icon: const Icon(Icons.shopping_cart),
            onPressed: () {
              AppRoutes.navigateToCart(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchAndFilters(),
          Expanded(
            child: _buildProductsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Search bar
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search products...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _loadProducts(refresh: true);
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onSubmitted: (value) {
              _loadProducts(refresh: true);
            },
          ),
          const SizedBox(height: 12),
          // Sort dropdown
          Row(
            children: [
              const Icon(Icons.sort, size: 20),
              const SizedBox(width: 8),
              Text('Sort by:', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButton<String>(
                  value: _currentSortOption,
                  isExpanded: true,
                  items: AppConstants.sortOptions.map((String option) {
                    return DropdownMenuItem<String>(
                      value: option,
                      child: Text(option),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    if (newValue != null) {
                      setState(() {
                        _currentSortOption = newValue;
                      });
                      _loadProducts(refresh: true);
                    }
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProductsList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_products.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No products found',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filters',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => _loadProducts(refresh: true),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadProducts(refresh: true),
      child: GridView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: AppConstants.homeProductsGridColumns,
          childAspectRatio: 0.7,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: _products.length + (_isLoadingMore ? 2 : 0),
        itemBuilder: (context, index) {
          if (index >= _products.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            );
          }

          final product = _products[index];
          return _buildProductCard(product);
        },
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    return Card(
      elevation: AppConstants.cardElevation,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
      ),
      child: InkWell(
        onTap: () {
          AppRoutes.navigateToProductDetails(context, product);
        },
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(AppConstants.cardBorderRadius),
                      ),
                    ),
                    child: const Icon(
                      Icons.image,
                      size: 48,
                      color: Colors.grey,
                    ),
                  ),
                  // Discount badge
                  if (product.isOnSale)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${product.discountPercentage}% OFF',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  // Wishlist button
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Consumer<WishlistProvider>(
                      builder: (context, wishlistProvider, child) {
                        final isInWishlist = false; // TODO: Check actual wishlist status
                        return CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.white,
                          child: IconButton(
                            icon: Icon(
                              isInWishlist ? Icons.favorite : Icons.favorite_border,
                              color: isInWishlist ? Colors.red : Colors.grey,
                              size: 16,
                            ),
                            onPressed: () {
                              // TODO: Toggle wishlist
                            },
                            padding: EdgeInsets.zero,
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            // Product Details
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.productName,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      product.brand,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    // Price and rating row
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (product.isOnSale)
                                Text(
                                  product.formattedPrice,
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    decoration: TextDecoration.lineThrough,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              Text(
                                product.formattedEffectivePrice,
                                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (product.rating != null)
                          Row(
                            children: [
                              const Icon(
                                Icons.star,
                                color: Colors.amber,
                                size: 14,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                product.ratingDisplay,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Add to cart button
                    SizedBox(
                      width: double.infinity,
                      child: Consumer<CartProvider>(
                        builder: (context, cartProvider, child) {
                          return ElevatedButton(
                            onPressed: product.isInStock
                                ? () {
                                    // TODO: Add to cart functionality
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Added ${product.productName} to cart'),
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  }
                                : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Theme.of(context).colorScheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                              ),
                            ),
                            child: Text(
                              product.isInStock ? 'Add to Cart' : 'Out of Stock',
                              style: const TextStyle(fontSize: 12),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}