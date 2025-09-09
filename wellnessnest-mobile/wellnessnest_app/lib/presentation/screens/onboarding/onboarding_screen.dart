import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../config/theme.dart';
import '../../../config/constants.dart';
import '../../../config/routes.dart';
import 'widgets/onboarding_page.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  late AnimationController _fadeAnimationController;
  late AnimationController _slideAnimationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  final List<OnboardingItem> _onboardingItems = [
    OnboardingItem(
      title: AppConstants.onboardingTitles[0],
      description: AppConstants.onboardingDescriptions[0],
      icon: Icons.coffee,
      gradientColors: [AppTheme.primary, AppTheme.secondary],
    ),
    OnboardingItem(
      title: AppConstants.onboardingTitles[1],
      description: AppConstants.onboardingDescriptions[1],
      icon: Icons.shopping_bag_outlined,
      gradientColors: [AppTheme.secondary, AppTheme.accent],
    ),
    OnboardingItem(
      title: AppConstants.onboardingTitles[2],
      description: AppConstants.onboardingDescriptions[2],
      icon: Icons.track_changes_outlined,
      gradientColors: [AppTheme.accent, AppTheme.darkGreen],
    ),
    OnboardingItem(
      title: AppConstants.onboardingTitles[3],
      description: AppConstants.onboardingDescriptions[3],
      icon: Icons.security_outlined,
      gradientColors: [AppTheme.darkGreen, AppTheme.primary],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fadeAnimationController = AnimationController(
      duration: Duration(milliseconds: AppConstants.defaultAnimationDuration),
      vsync: this,
    );
    _slideAnimationController = AnimationController(
      duration: Duration(milliseconds: AppConstants.defaultAnimationDuration),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeAnimationController,
      curve: Curves.easeInOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideAnimationController,
      curve: Curves.easeOutCubic,
    ));
    
    // Start animations
    _fadeAnimationController.forward();
    _slideAnimationController.forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fadeAnimationController.dispose();
    _slideAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBuilder(
        animation: _fadeAnimation,
        builder: (context, child) {
          return FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Stack(
                children: [
                  // Main PageView
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: _onPageChanged,
                    itemCount: _onboardingItems.length,
                    itemBuilder: (context, index) {
                      return OnboardingPageWidget(
                        item: _onboardingItems[index],
                      );
                    },
                  ),
                  
                  // Skip Button (top-right)
                  if (_currentIndex < _onboardingItems.length - 1)
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 16,
                      right: 16,
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(20),
                          onTap: _completeOnboarding,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.3),
                                width: 1,
                              ),
                            ),
                            child: const Text(
                              'Skip',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  
                  // Bottom Controls
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      padding: EdgeInsets.only(
                        left: AppConstants.largePadding,
                        right: AppConstants.largePadding,
                        bottom: MediaQuery.of(context).padding.bottom + AppConstants.largePadding,
                        top: AppConstants.largePadding,
                      ),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(AppConstants.bottomSheetBorderRadius),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 10,
                            offset: const Offset(0, -2),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Page Indicators
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: _buildPageIndicators(),
                          ),
                          
                          const SizedBox(height: AppConstants.largePadding),
                          
                          // Navigation Buttons
                          Row(
                            children: [
                              // Previous Button
                              if (_currentIndex > 0)
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: _previousPage,
                                    style: Theme.of(context).outlinedButtonTheme.style,
                                    child: const Text('Previous'),
                                  ),
                                ),
                              
                              if (_currentIndex > 0) 
                                const SizedBox(width: AppConstants.defaultPadding),
                              
                              // Next/Get Started Button
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _currentIndex < _onboardingItems.length - 1
                                      ? _nextPage
                                      : _completeOnboarding,
                                  style: Theme.of(context).elevatedButtonTheme.style,
                                  child: Text(
                                    _currentIndex < _onboardingItems.length - 1
                                        ? 'Next'
                                        : 'Get Started',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });
    
    // Reset and replay animations for each page
    _fadeAnimationController.reset();
    _slideAnimationController.reset();
    _fadeAnimationController.forward();
    _slideAnimationController.forward();
  }

  List<Widget> _buildPageIndicators() {
    return List.generate(
      _onboardingItems.length,
      (index) => AnimatedContainer(
        duration: Duration(milliseconds: AppConstants.defaultAnimationDuration),
        width: _currentIndex == index ? 32 : 8,
        height: 8,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          color: _currentIndex == index
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
        ),
      ),
    );
  }

  void _previousPage() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: Duration(milliseconds: AppConstants.pageTransitionDuration),
        curve: Curves.easeInOut,
      );
    }
  }

  void _nextPage() {
    if (_currentIndex < _onboardingItems.length - 1) {
      _pageController.nextPage(
        duration: Duration(milliseconds: AppConstants.pageTransitionDuration),
        curve: Curves.easeInOut,
      );
    }
  }

  void _completeOnboarding() async {
    try {
      // Mark onboarding as completed
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(AppConstants.onboardingCompletedKey, true);
      
      if (!mounted) return;
      
      // Navigate to main app with smooth transition
      AppRoutes.navigateToAndClearAll(context, AppRoutes.main);
    } catch (e) {
      // Handle error gracefully
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error completing onboarding: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
}

class OnboardingItem {
  final String title;
  final String description;
  final IconData icon;
  final List<Color> gradientColors;

  OnboardingItem({
    required this.title,
    required this.description,
    required this.icon,
    required this.gradientColors,
  });
}