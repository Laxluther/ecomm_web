import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../config/constants.dart';
import '../../../config/routes.dart';
import '../../../data/models/product.dart';
import '../../../data/providers/product_provider.dart';

class SearchScreen extends StatefulWidget {
  final String? initialQuery;

  const SearchScreen({
    super.key,
    this.initialQuery,
  });

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with SingleTickerProviderStateMixin {
  late TextEditingController _searchController;
  late FocusNode _searchFocusNode;
  late TabController _tabController;
  
  Timer? _debounceTimer;
  List<String> _recentSearches = [];
  List<String> _searchSuggestions = [];
  List<Product> _searchResults = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  String _currentQuery = '';

  // Popular categories for suggestions
  final List<String> _popularCategories = [
    'Supplements',
    'Vitamins',
    'Protein',
    'Fitness Equipment',
    'Organic Foods',
    'Beauty Products',
    'Health Drinks',
    'Herbal Medicines',
  ];

  // Trending searches
  final List<String> _trendingSearches = [
    'vitamin d',
    'protein powder',
    'omega 3',
    'green tea',
    'turmeric',
    'multivitamin',
    'face serum',
    'yoga mat',
  ];

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.initialQuery ?? '');
    _searchFocusNode = FocusNode();
    _tabController = TabController(length: 2, vsync: this);
    
    _loadRecentSearches();
    _generateSearchSuggestions();
    
    if (widget.initialQuery?.isNotEmpty == true) {
      _currentQuery = widget.initialQuery!;
      _hasSearched = true;
      _performSearch(widget.initialQuery!);
    } else {
      // Auto-focus the search field when screen loads
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _searchFocusNode.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadRecentSearches() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recent = prefs.getStringList(AppConstants.recentSearchesKey) ?? [];
      setState(() {
        _recentSearches = recent;
      });
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _saveRecentSearch(String query) async {
    if (query.trim().isEmpty) return;
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final recent = prefs.getStringList(AppConstants.recentSearchesKey) ?? [];
      
      // Remove if already exists
      recent.remove(query);
      // Add to the beginning
      recent.insert(0, query);
      // Keep only the latest ones
      if (recent.length > AppConstants.maxRecentSearches) {
        recent.removeRange(AppConstants.maxRecentSearches, recent.length);
      }
      
      await prefs.setStringList(AppConstants.recentSearchesKey, recent);
      
      setState(() {
        _recentSearches = recent;
      });
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _clearRecentSearches() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(AppConstants.recentSearchesKey);
      
      setState(() {
        _recentSearches.clear();
      });
    } catch (e) {
      // Handle error silently
    }
  }

  void _generateSearchSuggestions() {
    // Combine popular categories and trending searches for suggestions
    _searchSuggestions = [..._trendingSearches, ..._popularCategories];
  }

  void _onSearchChanged(String query) {
    // Cancel previous timer
    _debounceTimer?.cancel();
    
    // Start new timer
    _debounceTimer = Timer(
      const Duration(milliseconds: AppConstants.searchDebounceDelay),
      () {
        if (query.length >= AppConstants.minSearchLength) {
          _performSearch(query);
        } else {
          setState(() {
            _searchResults.clear();
            _hasSearched = false;
          });
        }
      },
    );
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) return;
    
    setState(() {
      _isLoading = true;
      _currentQuery = query;
      _hasSearched = true;
    });

    try {
      // TODO: Replace with actual API call through ProductProvider
      await Future.delayed(const Duration(milliseconds: 800));
      
      // Mock search results
      final mockResults = _generateMockSearchResults(query);
      
      if (mounted) {
        setState(() {
          _searchResults = mockResults;
          _isLoading = false;
        });
        
        // Save to recent searches
        await _saveRecentSearch(query);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Search failed: $e')),
        );
      }
    }
  }

  List<Product> _generateMockSearchResults(String query) {
    final List<Product> results = [];
    final searchLower = query.toLowerCase();
    
    // Generate mock results based on query
    for (int i = 0; i < 20; i++) {
      final productName = 'Product ${i + 1} - $query';
      if (productName.toLowerCase().contains(searchLower)) {
        results.add(Product(
          productId: i + 1,
          productName: productName,
          description: 'High-quality product matching your search for $query',
          price: 150.0 + (i % 10) * 50.0,
          discountPrice: i % 3 == 0 ? 120.0 + (i % 10) * 40.0 : null,
          primaryImage: null,
          brand: 'Brand ${(i % 5) + 1}',
          categoryName: 'Health & Wellness',
          stockQuantity: 10 + (i % 20),
          rating: 3.5 + (i % 3) * 0.5,
          reviewCount: 10 + (i % 100),
          isFeatured: i % 4 == 0,
        ));
      }
    }
    
    return results;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildSearchAppBar(),
      body: Column(
        children: [
          if (!_hasSearched || _searchResults.isEmpty)
            _buildTabBar(),
          Expanded(
            child: _hasSearched
                ? _buildSearchResults()
                : _buildSearchSuggestions(),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildSearchAppBar() {
    return AppBar(
      backgroundColor: Theme.of(context).colorScheme.primary,
      foregroundColor: Colors.white,
      elevation: 0,
      title: Container(
        height: 40,
        child: TextField(
          controller: _searchController,
          focusNode: _searchFocusNode,
          decoration: InputDecoration(
            hintText: 'Search products...',
            hintStyle: TextStyle(color: Colors.grey[600]),
            prefixIcon: const Icon(Icons.search, color: Colors.grey),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey),
                    onPressed: () {
                      _searchController.clear();
                      setState(() {
                        _searchResults.clear();
                        _hasSearched = false;
                        _currentQuery = '';
                      });
                      _searchFocusNode.requestFocus();
                    },
                  )
                : null,
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
          ),
          textInputAction: TextInputAction.search,
          onChanged: _onSearchChanged,
          onSubmitted: (query) {
            if (query.trim().isNotEmpty) {
              _performSearch(query);
            }
          },
        ),
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: Border(
          bottom: BorderSide(
            color: Colors.grey[300]!,
            width: 0.5,
          ),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        tabs: const [
          Tab(text: 'Recent'),
          Tab(text: 'Trending'),
        ],
        labelColor: Theme.of(context).colorScheme.primary,
        unselectedLabelColor: Colors.grey[600],
        indicatorColor: Theme.of(context).colorScheme.primary,
      ),
    );
  }

  Widget _buildSearchSuggestions() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return TabBarView(
      controller: _tabController,
      children: [
        _buildRecentSearches(),
        _buildTrendingSearches(),
      ],
    );
  }

  Widget _buildRecentSearches() {
    if (_recentSearches.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No recent searches',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your search history will appear here',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Row(
            children: [
              Text(
                'Recent Searches',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: _clearRecentSearches,
                child: const Text('Clear All'),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _recentSearches.length,
            itemBuilder: (context, index) {
              final search = _recentSearches[index];
              return ListTile(
                leading: const Icon(Icons.history, color: Colors.grey),
                title: Text(search),
                trailing: IconButton(
                  icon: const Icon(Icons.call_made, size: 16),
                  onPressed: () {
                    _searchController.text = search;
                    _performSearch(search);
                  },
                ),
                onTap: () {
                  _searchController.text = search;
                  _performSearch(search);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTrendingSearches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Text(
            'Trending Searches',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(horizontal: AppConstants.defaultPadding),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 4,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: _trendingSearches.length,
            itemBuilder: (context, index) {
              final search = _trendingSearches[index];
              return InkWell(
                onTap: () {
                  _searchController.text = search;
                  _performSearch(search);
                },
                borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.trending_up, size: 16, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          search,
                          style: Theme.of(context).textTheme.bodyMedium,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        // Popular Categories
        Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Popular Categories',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _popularCategories.map((category) {
                  return InkWell(
                    onTap: () {
                      _searchController.text = category;
                      _performSearch(category);
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        category,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSearchResults() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Searching...'),
          ],
        ),
      );
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try searching with different keywords',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                _searchController.clear();
                setState(() {
                  _hasSearched = false;
                  _searchResults.clear();
                });
                _searchFocusNode.requestFocus();
              },
              child: const Text('Try New Search'),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Text(
            '${_searchResults.length} results for "$_currentQuery"',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: AppConstants.defaultPadding),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final product = _searchResults[index];
              return _buildProductTile(product);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildProductTile(Product product) {
    return Card(
      elevation: AppConstants.cardElevation,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
          ),
          child: const Icon(
            Icons.image,
            color: Colors.grey,
            size: 30,
          ),
        ),
        title: Text(
          product.productName,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w500,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              product.brand,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                if (product.isOnSale) ...[
                  Text(
                    product.formattedPrice,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      decoration: TextDecoration.lineThrough,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                Text(
                  product.formattedEffectivePrice,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const Spacer(),
                if (product.rating != null) ...[
                  const Icon(
                    Icons.star,
                    color: Colors.amber,
                    size: 16,
                  ),
                  const SizedBox(width: 2),
                  Text(
                    product.ratingDisplay,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          AppRoutes.navigateToProductDetails(context, product);
        },
      ),
    );
  }
}