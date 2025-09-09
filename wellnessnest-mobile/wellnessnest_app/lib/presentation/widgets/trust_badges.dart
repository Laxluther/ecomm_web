import 'package:flutter/material.dart';
import '../../config/theme.dart';

/// Trust badges widget for building customer confidence
/// 
/// Displays 4 trust badges in a row:
/// 1. Free Delivery Above ₹500
/// 2. 100% Natural Products  
/// 3. Reward Points On Every Order
/// 4. 24/7 Customer Support
class TrustBadges extends StatelessWidget {
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final Color? iconColor;
  final Color? textColor;

  const TrustBadges({
    super.key,
    this.padding,
    this.backgroundColor,
    this.iconColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildTrustBadge(
            icon: Icons.local_shipping,
            title: 'Free Delivery',
            subtitle: 'Above ₹500',
          ),
          _buildTrustBadge(
            icon: Icons.verified_user,
            title: '100% Natural',
            subtitle: 'Products',
          ),
          _buildTrustBadge(
            icon: Icons.card_giftcard,
            title: 'Reward Points',
            subtitle: 'On Every Order',
          ),
          _buildTrustBadge(
            icon: Icons.support_agent,
            title: '24/7 Customer',
            subtitle: 'Support',
          ),
        ],
      ),
    );
  }

  Widget _buildTrustBadge({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Circular icon container
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: backgroundColor ?? const Color(0xFFE8F5E9),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            size: 24,
            color: iconColor ?? AppTheme.primary, // #4CAF50
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Badge text
        Column(
          children: [
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: textColor ?? AppTheme.grey,
                height: 1.2,
              ),
            ),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: textColor ?? AppTheme.grey,
                height: 1.2,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Compact version of trust badges for smaller spaces
class CompactTrustBadges extends StatelessWidget {
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final Color? iconColor;
  final Color? textColor;

  const CompactTrustBadges({
    super.key,
    this.padding,
    this.backgroundColor,
    this.iconColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildCompactBadge(
            icon: Icons.local_shipping,
            text: 'Free Delivery',
          ),
          _buildCompactBadge(
            icon: Icons.verified_user,
            text: '100% Natural',
          ),
          _buildCompactBadge(
            icon: Icons.card_giftcard,
            text: 'Reward Points',
          ),
          _buildCompactBadge(
            icon: Icons.support_agent,
            text: '24/7 Support',
          ),
        ],
      ),
    );
  }

  Widget _buildCompactBadge({
    required IconData icon,
    required String text,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: backgroundColor ?? const Color(0xFFE8F5E9),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            size: 16,
            color: iconColor ?? AppTheme.primary,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w500,
            color: textColor ?? AppTheme.grey,
          ),
        ),
      ],
    );
  }
}

/// Themed trust badges that adapt to the app's color scheme
class ThemedTrustBadges extends StatelessWidget {
  final bool isCompact;
  final EdgeInsetsGeometry? padding;

  const ThemedTrustBadges({
    super.key,
    this.isCompact = false,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    if (isCompact) {
      return CompactTrustBadges(
        padding: padding,
        backgroundColor: AppTheme.lightGreen,
        iconColor: AppTheme.primary,
        textColor: AppTheme.darkGrey,
      );
    }
    
    return TrustBadges(
      padding: padding,
      backgroundColor: AppTheme.lightGreen,
      iconColor: AppTheme.primary,
      textColor: AppTheme.grey,
    );
  }
}

/// Trust badges data model for customization
class TrustBadgeData {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color? backgroundColor;
  final Color? iconColor;
  final Color? textColor;

  const TrustBadgeData({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.backgroundColor,
    this.iconColor,
    this.textColor,
  });

  /// Default WellnessNest trust badges
  static List<TrustBadgeData> get defaultBadges => [
    TrustBadgeData(
      icon: Icons.local_shipping,
      title: 'Free Delivery',
      subtitle: 'Above ₹500',
    ),
    TrustBadgeData(
      icon: Icons.verified_user,
      title: '100% Natural',
      subtitle: 'Products',
    ),
    TrustBadgeData(
      icon: Icons.card_giftcard,
      title: 'Reward Points',
      subtitle: 'On Every Order',
    ),
    TrustBadgeData(
      icon: Icons.support_agent,
      title: '24/7 Customer',
      subtitle: 'Support',
    ),
  ];
}

/// Customizable trust badges widget
class CustomTrustBadges extends StatelessWidget {
  final List<TrustBadgeData> badges;
  final EdgeInsetsGeometry? padding;
  final MainAxisAlignment alignment;
  final bool showBackground;

  const CustomTrustBadges({
    super.key,
    required this.badges,
    this.padding,
    this.alignment = MainAxisAlignment.spaceAround,
    this.showBackground = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: showBackground
          ? BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            )
          : null,
      child: Row(
        mainAxisAlignment: alignment,
        children: badges
            .map((badge) => _buildCustomBadge(badge))
            .toList(),
      ),
    );
  }

  Widget _buildCustomBadge(TrustBadgeData badge) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: badge.backgroundColor ?? const Color(0xFFE8F5E9),
            shape: BoxShape.circle,
          ),
          child: Icon(
            badge.icon,
            size: 24,
            color: badge.iconColor ?? AppTheme.primary,
          ),
        ),
        
        const SizedBox(height: 8),
        
        Column(
          children: [
            Text(
              badge.title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: badge.textColor ?? AppTheme.grey,
                height: 1.2,
              ),
            ),
            Text(
              badge.subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: badge.textColor ?? AppTheme.grey,
                height: 1.2,
              ),
            ),
          ],
        ),
      ],
    );
  }
}