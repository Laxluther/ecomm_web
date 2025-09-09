# Flutter App Critical Fixes - WellnessNest

## IMPORTANT: Actual Product Categories
WellnessNest ONLY sells:
1. **Coffee** (8 products total)
   - Robusta Coffee (unflavored)
   - Arabica Coffee (unflavored)  
   - 6 Flavored Coffee varieties

2. **Makhana** (Fox Nuts) (4 products total)
   - Peri Peri Makhana
   - Cheese Makhana
   - Ghee Roasted Makhana
   - Plain Makhana

**REMOVE ALL REFERENCES TO**: Honey, Nuts, Seeds, Dry Fruits - these don't exist!

## 1. Logo & Branding Fix

### Create Logo Widget
```dart
// lib/presentation/widgets/app_logo.dart
class AppLogo extends StatelessWidget {
  final double size;
  final bool withText;
  
  const AppLogo({this.size = 40, this.withText = true});
  
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF4CAF50), Color(0xFF8BC34A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(size * 0.2),
          ),
          child: Center(
            child: Text(
              'W',
              style: TextStyle(
                color: Colors.white,
                fontSize: size * 0.6,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ),
        if (withText) ...[
          SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'WellnessNest',
                style: TextStyle(
                  fontSize: size * 0.45,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2E7D32),
                ),
              ),
              Text(
                'Coffee & Makhana',
                style: TextStyle(
                  fontSize: size * 0.25,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
```

## 2. Offers Banner Section (Myntra-Style)

### Create Banner Model & Widget
```dart
// lib/data/models/offer_banner.dart
class OfferBanner {
  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String? offerCode;
  final String? actionUrl;
  final Color backgroundColor;
  
  const OfferBanner({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    this.offerCode,
    this.actionUrl,
    this.backgroundColor = const Color(0xFFFFF3E0),
  });
}

// lib/presentation/widgets/offer_banner_carousel.dart
class OfferBannerCarousel extends StatefulWidget {
  @override
  _OfferBannerCarouselState createState() => _OfferBannerCarouselState();
}

class _OfferBannerCarouselState extends State<OfferBannerCarousel> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _timer;
  
  // Hardcoded offers for now
  final List<OfferBanner> banners = [
    OfferBanner(
      id: '1',
      title: 'FLAT 30% OFF',
      subtitle: 'On Premium Coffee Range',
      imageUrl: 'assets/images/coffee_banner.jpg',
      offerCode: 'COFFEE30',
      backgroundColor: Color(0xFF6F4E37),
    ),
    OfferBanner(
      id: '2',
      title: 'BUY 2 GET 1 FREE',
      subtitle: 'On All Makhana Flavors',
      imageUrl: 'assets/images/makhana_banner.jpg',
      offerCode: 'MAKHANA2X1',
      backgroundColor: Color(0xFFFFE0B2),
    ),
    OfferBanner(
      id: '3',
      title: 'NEW USER OFFER',
      subtitle: 'Get ₹100 Off on First Order',
      imageUrl: 'assets/images/welcome_banner.jpg',
      offerCode: 'WELCOME100',
      backgroundColor: Color(0xFFE8F5E9),
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    // Auto-scroll timer
    _timer = Timer.periodic(Duration(seconds: 4), (Timer timer) {
      if (_currentPage < banners.length - 1) {
        _currentPage++;
      } else {
        _currentPage = 0;
      }
      _pageController.animateToPage(
        _currentPage,
        duration: Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 180,
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
            },
            itemCount: banners.length,
            itemBuilder: (context, index) {
              final banner = banners[index];
              return Container(
                margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      banner.backgroundColor,
                      banner.backgroundColor.withOpacity(0.8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Stack(
                  children: [
                    // Background pattern
                    Positioned(
                      right: -30,
                      top: -30,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    // Content
                    Padding(
                      padding: EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  banner.title,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Text(
                                  banner.subtitle,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.9),
                                    fontSize: 14,
                                  ),
                                ),
                                if (banner.offerCode != null) ...[
                                  SizedBox(height: 12),
                                  Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      'CODE: ${banner.offerCode}',
                                      style: TextStyle(
                                        color: banner.backgroundColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          // Placeholder for image
                          Expanded(
                            flex: 2,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                index == 0 ? Icons.coffee : Icons.fastfood,
                                size: 60,
                                color: Colors.white.withOpacity(0.8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          // Page indicators
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                banners.length,
                (index) => Container(
                  width: _currentPage == index ? 24 : 8,
                  height: 8,
                  margin: EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: _currentPage == index
                        ? Theme.of(context).primaryColor
                        : Colors.grey[400],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }
}
```

## 3. Fix Categories (Only Coffee & Makhana)

```dart
// lib/presentation/screens/home/home_screen.dart - Categories Section
Widget _buildCategoriesSection() {
  final categories = [
    {
      'id': 1,
      'name': 'Coffee',
      'icon': Icons.coffee,
      'color': Color(0xFF6F4E37),
      'bgColor': Color(0xFFFFF8E1),
      'description': '8 Premium Varieties',
    },
    {
      'id': 2,
      'name': 'Makhana',
      'icon': Icons.grain,
      'color': Color(0xFFFF6B35),
      'bgColor': Color(0xFFFFF3E0),
      'description': '4 Delicious Flavors',
    },
  ];
  
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Text(
          'Shop by Category',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      Container(
        height: 140,
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: categories.map((category) {
            return Expanded(
              child: GestureDetector(
                onTap: () => _navigateToCategory(category['id']),
                child: Container(
                  margin: EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: category['bgColor'],
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: category['color'],
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          category['icon'],
                          color: Colors.white,
                          size: 30,
                        ),
                      ),
                      SizedBox(height: 12),
                      Text(
                        category['name'],
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        category['description'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    ],
  );
}
```

## 4. Modern Product Grid (12 Products)

```dart
// lib/presentation/widgets/modern_product_card.dart
class ModernProductCard extends StatelessWidget {
  final Product product;
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _navigateToProduct(context, product),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image with Badge
            Stack(
              children: [
                Container(
                  height: 180,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: Center(
                    child: _buildProductImage(product),
                  ),
                ),
                // Discount Badge
                if (product.hasDiscount)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.red[400]!, Colors.red[600]!],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${product.discountPercentage}% OFF',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                // Wishlist Button
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: IconButton(
                      padding: EdgeInsets.zero,
                      icon: Icon(
                        Icons.favorite_border,
                        size: 18,
                        color: Colors.grey[700],
                      ),
                      onPressed: () => _addToWishlist(product),
                    ),
                  ),
                ),
              ],
            ),
            // Product Details
            Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category tag
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: product.categoryId == 1 
                          ? Color(0xFFFFF8E1) 
                          : Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      product.categoryName.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: product.categoryId == 1 
                            ? Color(0xFF6F4E37) 
                            : Color(0xFFFF6B35),
                      ),
                    ),
                  ),
                  SizedBox(height: 8),
                  // Product Name
                  Text(
                    product.productName,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  // Description
                  Text(
                    product.description,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 8),
                  // Price Row
                  Row(
                    children: [
                      Text(
                        '₹${product.discountPrice?.toStringAsFixed(0) ?? product.price.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2E7D32),
                        ),
                      ),
                      if (product.hasDiscount) ...[
                        SizedBox(width: 8),
                        Text(
                          '₹${product.price.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[500],
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                  SizedBox(height: 8),
                  // Add to Cart Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _addToCart(product),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF4CAF50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: Text(
                        'Add to Cart',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildProductImage(Product product) {
    // Use placeholder images for now
    final placeholders = {
      'Coffee': Icons.coffee,
      'Makhana': Icons.grain,
    };
    
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      child: Icon(
        placeholders[product.categoryName] ?? Icons.shopping_bag,
        size: 60,
        color: product.categoryId == 1 
            ? Color(0xFF6F4E37) 
            : Color(0xFFFF6B35),
      ),
    );
  }
}
```

## 5. Complete Home Screen Layout

```dart
// lib/presentation/screens/home/home_screen.dart
class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: CustomScrollView(
        slivers: [
          // App Bar with Logo
          SliverAppBar(
            floating: true,
            elevation: 0,
            backgroundColor: Colors.white,
            title: AppLogo(size: 36),
            actions: [
              IconButton(
                icon: Icon(Icons.search, color: Colors.grey[700]),
                onPressed: () => _navigateToSearch(context),
              ),
              IconButton(
                icon: Icon(Icons.notifications_outlined, color: Colors.grey[700]),
                onPressed: () => _showNotifications(context),
              ),
            ],
          ),
          
          // Content
          SliverToBoxAdapter(
            child: Column(
              children: [
                // Offer Banners
                OfferBannerCarousel(),
                
                SizedBox(height: 16),
                
                // Categories
                _buildCategoriesSection(),
                
                SizedBox(height: 24),
                
                // Featured Products Title
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Featured Products',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () => _navigateToAllProducts(context),
                        child: Text('View All'),
                      ),
                    ],
                  ),
                ),
                
                // Products Grid
                _buildProductsGrid(),
                
                SizedBox(height: 24),
                
                // Trust Badges
                _buildTrustBadges(),
                
                SizedBox(height: 80), // Bottom nav space
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildProductsGrid() {
    return Consumer<ProductProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return _buildLoadingSkeleton();
        }
        
        final products = provider.featuredProducts;
        
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: GridView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.65,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: products.length > 12 ? 12 : products.length,
            itemBuilder: (context, index) {
              return ModernProductCard(product: products[index]);
            },
          ),
        );
      },
    );
  }
  
  Widget _buildTrustBadges() {
    final badges = [
      {'icon': Icons.local_shipping, 'text': 'Free Delivery\nAbove ₹500'},
      {'icon': Icons.verified_user, 'text': '100% Natural\nProducts'},
      {'icon': Icons.card_giftcard, 'text': 'Reward Points\nOn Every Order'},
      {'icon': Icons.support_agent, 'text': '24/7 Customer\nSupport'},
    ];
    
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: badges.map((badge) {
          return Column(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Color(0xFFE8F5E9),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  badge['icon'] as IconData,
                  color: Color(0xFF4CAF50),
                  size: 24,
                ),
              ),
              SizedBox(height: 8),
              Text(
                badge['text'] as String,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[700],
                  height: 1.2,
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}
```

## 6. Update Constants File

```dart
// lib/config/constants.dart - Update to reflect actual products
class AppConstants {
  static const List<Map<String, dynamic>> actualProducts = [
    // Coffee Products (8)
    {'id': 1, 'name': 'Robusta Coffee', 'category': 'Coffee', 'price': 449},
    {'id': 2, 'name': 'Arabica Coffee', 'category': 'Coffee', 'price': 549},
    {'id': 3, 'name': 'Vanilla Coffee', 'category': 'Coffee', 'price': 499},
    {'id': 4, 'name': 'Caramel Coffee', 'category': 'Coffee', 'price': 499},
    {'id': 5, 'name': 'Hazelnut Coffee', 'category': 'Coffee', 'price': 499},
    {'id': 6, 'name': 'Mocha Coffee', 'category': 'Coffee', 'price': 499},
    {'id': 7, 'name': 'Irish Cream Coffee', 'category': 'Coffee', 'price': 529},
    {'id': 8, 'name': 'Cinnamon Coffee', 'category': 'Coffee', 'price': 479},
    
    // Makhana Products (4)
    {'id': 9, 'name': 'Peri Peri Makhana', 'category': 'Makhana', 'price': 299},
    {'id': 10, 'name': 'Cheese Makhana', 'category': 'Makhana', 'price': 299},
    {'id': 11, 'name': 'Ghee Roasted Makhana', 'category': 'Makhana', 'price': 349},
    {'id': 12, 'name': 'Plain Makhana', 'category': 'Makhana', 'price': 249},
  ];
}
```

## Required Assets

Create these placeholder images in `assets/images/`:
- `coffee_placeholder.png` - Coffee cup icon
- `makhana_placeholder.png` - Bowl of makhana
- `logo.png` - WellnessNest logo
- `coffee_banner.jpg` - Coffee promotional banner
- `makhana_banner.jpg` - Makhana promotional banner
- `welcome_banner.jpg` - Welcome offer banner

## Implementation Order

1. First, update constants to remove wrong categories
2. Add the logo widget everywhere
3. Implement offer banner carousel on home screen
4. Fix categories section (only Coffee & Makhana)
5. Update product card design
6. Implement modern product grid
7. Add trust badges section
8. Test with actual API data

This will give you a beautiful, modern app optimized for your 12 products with proper branding!