import 'package:flutter/material.dart';
import '../../data/models/product.dart';
import '../../config/theme.dart';

class ModernProductCard extends StatefulWidget {
  final Product product;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final VoidCallback? onAddToWishlist;
  final bool isWishlisted;

  const ModernProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.onAddToCart,
    this.onAddToWishlist,
    this.isWishlisted = false,
  });

  @override
  State<ModernProductCard> createState() => _ModernProductCardState();
}

class _ModernProductCardState extends State<ModernProductCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isImageError = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: AppTheme.fastAnimation,
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    _animationController.forward();
  }

  void _onTapUp(TapUpDetails details) {
    _animationController.reverse();
  }

  void _onTapCancel() {
    _animationController.reverse();
  }

  void _navigateToProduct() {
    if (widget.onTap != null) {
      widget.onTap!();
    }
  }

  void _addToWishlist() {
    if (widget.onAddToWishlist != null) {
      widget.onAddToWishlist!();
    }
  }

  void _addToCart() {
    if (widget.onAddToCart != null) {
      widget.onAddToCart!();
    }
  }

  Color _getCategoryColor() {
    final category = widget.product.categoryName.toLowerCase();
    if (category.contains('coffee')) {
      return const Color(0xFF8D6E63); // Brown for coffee
    } else if (category.contains('makhana')) {
      return const Color(0xFFFF9800); // Orange for makhana
    }
    return AppTheme.primary; // Default green
  }

  IconData _getCategoryIcon() {
    final category = widget.product.categoryName.toLowerCase();
    if (category.contains('coffee')) {
      return Icons.local_cafe; // Coffee icon
    } else if (category.contains('makhana')) {
      return Icons.grain; // Grain icon for makhana
    }
    return Icons.category; // Default category icon
  }

  Widget _buildImageSection() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.grey[100]!,
            Colors.grey[50]!,
          ],
        ),
      ),
      child: Stack(
        children: [
          // Product Image
          Positioned.fill(
            child: ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
              child: _isImageError
                  ? Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Colors.grey[100]!,
                            Colors.grey[200]!,
                          ],
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _getCategoryIcon(),
                              size: 48,
                              color: _getCategoryColor(),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              widget.product.categoryName,
                              style: TextStyle(
                                fontSize: 12,
                                color: _getCategoryColor(),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Image.network(
                      widget.product.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          setState(() {
                            _isImageError = true;
                          });
                        });
                        return Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Colors.grey[100]!,
                                Colors.grey[200]!,
                              ],
                            ),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _getCategoryIcon(),
                                  size: 48,
                                  color: _getCategoryColor(),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  widget.product.categoryName,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: _getCategoryColor(),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Colors.grey[100]!,
                                Colors.grey[50]!,
                              ],
                            ),
                          ),
                          child: Center(
                            child: CircularProgressIndicator(
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded /
                                      loadingProgress.expectedTotalBytes!
                                  : null,
                              strokeWidth: 2,
                              color: _getCategoryColor(),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),

          // Smart Badges
          Positioned(
            top: 12,
            left: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Discount Badge
                if (widget.product.hasDiscount)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFE53E3E), Color(0xFFFC8181)],
                      ),
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFE53E3E).withValues(alpha: 0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      '${widget.product.discountPercentage}% OFF',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                // Rating Badge
                if (widget.product.rating != null && widget.product.rating! >= 4.0)
                  Container(
                    margin: const EdgeInsets.only(top: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber[600],
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.amber.withValues(alpha: 0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.star,
                          size: 12,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          widget.product.ratingDisplay,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // Wishlist Button
          Positioned(
            top: 12,
            right: 12,
            child: GestureDetector(
              onTap: _addToWishlist,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  widget.isWishlisted
                      ? Icons.favorite
                      : Icons.favorite_border,
                  size: 18,
                  color: widget.isWishlisted
                      ? Colors.red
                      : Colors.grey[600],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentSection() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Name
          Text(
            widget.product.productName,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2E2E2E),
              height: 1.3,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 6),

          // Category Tag
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _getCategoryColor().withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _getCategoryIcon(),
                  size: 12,
                  color: _getCategoryColor(),
                ),
                const SizedBox(width: 4),
                Text(
                  widget.product.categoryName,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _getCategoryColor(),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Pricing Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Current/Discount Price
              Text(
                widget.product.formattedEffectivePrice,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF4CAF50),
                ),
              ),

              const SizedBox(width: 8),

              // Original Price (if discounted)
              if (widget.product.hasDiscount)
                Text(
                  widget.product.formattedPrice,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                    decoration: TextDecoration.lineThrough,
                  ),
                ),

              const Spacer(),

              // Stock Status
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: widget.product.isInStock 
                      ? Colors.green.withValues(alpha: 0.1)
                      : Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  widget.product.isInStock ? 'In Stock' : 'Out of Stock',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: widget.product.isInStock 
                        ? Colors.green[700]
                        : Colors.red[700],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Add to Cart Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: widget.product.isInStock ? _addToCart : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: widget.product.isInStock
                    ? const Color(0xFF4CAF50)
                    : Colors.grey[400],
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    widget.product.isInStock
                        ? Icons.add_shopping_cart
                        : Icons.remove_shopping_cart,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.product.isInStock ? 'Add to Cart' : 'Out of Stock',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _navigateToProduct,
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 40,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildImageSection(),
                  _buildContentSection(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// Extension for additional product card utilities
extension ModernProductCardUtils on Product {
  /// Returns appropriate category color based on product category
  Color get categoryColor {
    final category = categoryName.toLowerCase();
    if (category.contains('coffee')) {
      return const Color(0xFF8D6E63); // Brown
    } else if (category.contains('makhana')) {
      return const Color(0xFFFF9800); // Orange
    }
    return AppTheme.primary; // Default green
  }

  /// Returns appropriate category icon based on product category
  IconData get categoryIcon {
    final category = categoryName.toLowerCase();
    if (category.contains('coffee')) {
      return Icons.local_cafe;
    } else if (category.contains('makhana')) {
      return Icons.grain;
    }
    return Icons.category;
  }

  /// Returns stock status color
  Color get stockStatusColor {
    if (isOutOfStock) return AppTheme.error;
    if (isLowStock) return Colors.orange;
    return AppTheme.primary;
  }
}