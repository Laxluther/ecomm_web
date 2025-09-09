import 'package:flutter/material.dart';
import '../../../../config/constants.dart';
import '../onboarding_screen.dart';

class OnboardingPageWidget extends StatefulWidget {
  final OnboardingItem item;

  const OnboardingPageWidget({
    super.key,
    required this.item,
  });

  @override
  State<OnboardingPageWidget> createState() => _OnboardingPageWidgetState();
}

class _OnboardingPageWidgetState extends State<OnboardingPageWidget>
    with TickerProviderStateMixin {
  late AnimationController _iconAnimationController;
  late AnimationController _textAnimationController;
  late Animation<double> _iconScaleAnimation;
  late Animation<double> _iconRotationAnimation;
  late Animation<double> _textFadeAnimation;
  late Animation<Offset> _textSlideAnimation;

  @override
  void initState() {
    super.initState();
    
    // Initialize animation controllers
    _iconAnimationController = AnimationController(
      duration: Duration(milliseconds: AppConstants.slowAnimationDuration),
      vsync: this,
    );
    
    _textAnimationController = AnimationController(
      duration: Duration(milliseconds: AppConstants.defaultAnimationDuration),
      vsync: this,
    );

    // Setup animations
    _iconScaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _iconAnimationController,
      curve: Curves.elasticOut,
    ));

    _iconRotationAnimation = Tween<double>(
      begin: -0.1,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _iconAnimationController,
      curve: Curves.easeOutBack,
    ));

    _textFadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _textAnimationController,
      curve: Curves.easeInOut,
    ));

    _textSlideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _textAnimationController,
      curve: Curves.easeOutCubic,
    ));

    // Start animations with slight delays
    _startAnimations();
  }

  void _startAnimations() {
    _iconAnimationController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) {
        _textAnimationController.forward();
      }
    });
  }

  @override
  void dispose() {
    _iconAnimationController.dispose();
    _textAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: widget.item.gradientColors,
          stops: const [0.0, 1.0],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppConstants.largePadding,
            vertical: AppConstants.largePadding,
          ),
          child: Column(
            children: [
              const Spacer(flex: 2),
              
              // Animated Icon
              AnimatedBuilder(
                animation: _iconAnimationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _iconScaleAnimation.value,
                    child: Transform.rotate(
                      angle: _iconRotationAnimation.value,
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Icon(
                          widget.item.icon,
                          size: 70,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 48),
              
              // Animated Text Content
              AnimatedBuilder(
                animation: _textAnimationController,
                builder: (context, child) {
                  return FadeTransition(
                    opacity: _textFadeAnimation,
                    child: SlideTransition(
                      position: _textSlideAnimation,
                      child: Column(
                        children: [
                          // Title
                          Text(
                            widget.item.title,
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              height: 1.2,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          
                          const SizedBox(height: AppConstants.defaultPadding),
                          
                          // Description
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: AppConstants.defaultPadding),
                            child: Text(
                              widget.item.description,
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                                height: 1.6,
                                fontSize: 16,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              
              const Spacer(flex: 3),
            ],
          ),
        ),
      ),
    );
  }
}

/// Alternative simpler onboarding page widget
class SimpleOnboardingPageWidget extends StatelessWidget {
  final OnboardingItem item;

  const SimpleOnboardingPageWidget({
    super.key,
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: item.gradientColors,
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppConstants.largePadding,
            vertical: AppConstants.largePadding * 2,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon Container
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
                child: Icon(
                  item.icon,
                  size: 60,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Title
              Text(
                item.title,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppConstants.defaultPadding),
              
              // Description
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppConstants.defaultPadding),
                child: Text(
                  item.description,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                    height: 1.6,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Custom painter for background decoration
class OnboardingBackgroundPainter extends CustomPainter {
  final List<Color> colors;

  const OnboardingBackgroundPainter({required this.colors});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: colors,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    // Draw background
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);

    // Draw decorative circles
    final circlePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.05)
      ..style = PaintingStyle.fill;

    // Large circle
    canvas.drawCircle(
      Offset(size.width * 0.8, size.height * 0.2),
      size.width * 0.3,
      circlePaint,
    );

    // Small circle
    canvas.drawCircle(
      Offset(size.width * 0.1, size.height * 0.7),
      size.width * 0.15,
      circlePaint,
    );
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}