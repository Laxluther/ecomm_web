import 'package:flutter/material.dart';

/// AppLogo widget with WellnessNest branding
/// 
/// A customizable logo widget that displays the WellnessNest brand identity
/// with gradient background, logo image, and optional text elements.
/// 
/// Features:
/// - Configurable size for responsive design
/// - Optional text display mode
/// - WellnessNest green theme branding
/// - Gradient background container
/// - Support for both icon-only and text modes
class AppLogo extends StatelessWidget {
  /// The size of the logo container
  final double size;
  
  /// Whether to show text alongside the logo
  final bool withText;
  
  /// Optional custom background color (overrides gradient if provided)
  final Color? backgroundColor;
  
  /// Creates an AppLogo widget
  /// 
  /// [size] determines the dimensions of the logo container (default: 120)
  /// [withText] controls whether text is displayed (default: true)
  /// [backgroundColor] optional solid color to override gradient background
  const AppLogo({
    super.key,
    this.size = 120,
    this.withText = true,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    // Calculate responsive dimensions
    final containerSize = size;
    final logoSize = size * 0.6;
    final titleFontSize = size * 0.15;
    final taglineFontSize = size * 0.08;
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo container with gradient background
        Container(
          width: containerSize,
          height: containerSize,
          decoration: BoxDecoration(
            gradient: backgroundColor == null 
                ? const LinearGradient(
                    colors: [
                      Color(0xFF4CAF50), // Primary green
                      Color(0xFF8BC34A), // Secondary light green
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: backgroundColor,
            borderRadius: BorderRadius.circular(containerSize * 0.2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4CAF50).withValues(alpha: 0.3),
                blurRadius: containerSize * 0.08,
                offset: Offset(0, containerSize * 0.04),
              ),
            ],
          ),
          child: Center(
            child: _buildLogoContent(logoSize, containerSize),
          ),
        ),
        
        // Text content (conditionally displayed)
        if (withText) ...[
          SizedBox(height: size * 0.15),
          
          // App name
          Text(
            'WellnessNest',
            style: TextStyle(
              fontSize: titleFontSize,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF2E7D32), // Dark green
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
          ),
          
          SizedBox(height: size * 0.05),
          
          // Tagline
          Text(
            'Coffee & Makhana',
            style: TextStyle(
              fontSize: taglineFontSize,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
              letterSpacing: 0.3,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  /// Builds the logo content (image or fallback 'W' letter)
  Widget _buildLogoContent(double logoSize, double containerSize) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(containerSize * 0.15),
      child: Image.asset(
        'assets/images/welnest-logo.png',
        width: logoSize,
        height: logoSize,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) {
          // Fallback to 'W' letter if image fails to load
          return _buildFallbackLogo(logoSize);
        },
      ),
    );
  }

  /// Builds fallback logo with 'W' letter
  Widget _buildFallbackLogo(double logoSize) {
    return Container(
      width: logoSize,
      height: logoSize,
      alignment: Alignment.center,
      child: Text(
        'W',
        style: TextStyle(
          fontSize: logoSize * 0.6,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          shadows: [
            Shadow(
              color: Colors.black.withValues(alpha: 0.3),
              offset: const Offset(1, 1),
              blurRadius: 2,
            ),
          ],
        ),
      ),
    );
  }
}

/// AppLogo variants for specific use cases

/// Small logo variant for headers/navigation
class AppLogoSmall extends StatelessWidget {
  final bool withText;
  
  const AppLogoSmall({
    super.key,
    this.withText = false,
  });

  @override
  Widget build(BuildContext context) {
    return AppLogo(
      size: 40,
      withText: withText,
    );
  }
}

/// Medium logo variant for cards/lists
class AppLogoMedium extends StatelessWidget {
  final bool withText;
  
  const AppLogoMedium({
    super.key,
    this.withText = true,
  });

  @override
  Widget build(BuildContext context) {
    return AppLogo(
      size: 80,
      withText: withText,
    );
  }
}

/// Large logo variant for splash screens/onboarding
class AppLogoLarge extends StatelessWidget {
  final bool withText;
  
  const AppLogoLarge({
    super.key,
    this.withText = true,
  });

  @override
  Widget build(BuildContext context) {
    return AppLogo(
      size: 160,
      withText: withText,
    );
  }
}

/// Horizontal logo layout for wide spaces
class AppLogoHorizontal extends StatelessWidget {
  final double height;
  final Color? backgroundColor;
  
  const AppLogoHorizontal({
    super.key,
    this.height = 60,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo icon
        Container(
          width: height,
          height: height,
          decoration: BoxDecoration(
            gradient: backgroundColor == null 
                ? const LinearGradient(
                    colors: [
                      Color(0xFF4CAF50),
                      Color(0xFF8BC34A),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: backgroundColor,
            borderRadius: BorderRadius.circular(height * 0.2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4CAF50).withValues(alpha: 0.3),
                blurRadius: height * 0.08,
                offset: Offset(0, height * 0.04),
              ),
            ],
          ),
          child: Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(height * 0.15),
              child: Image.asset(
                'assets/images/welnest-logo.png',
                width: height * 0.6,
                height: height * 0.6,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return Text(
                    'W',
                    style: TextStyle(
                      fontSize: height * 0.35,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  );
                },
              ),
            ),
          ),
        ),
        
        SizedBox(width: height * 0.3),
        
        // Text content
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'WellnessNest',
              style: TextStyle(
                fontSize: height * 0.35,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF2E7D32),
                letterSpacing: 0.5,
              ),
            ),
            SizedBox(height: height * 0.05),
            Text(
              'Coffee & Makhana',
              style: TextStyle(
                fontSize: height * 0.2,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ],
    );
  }
}