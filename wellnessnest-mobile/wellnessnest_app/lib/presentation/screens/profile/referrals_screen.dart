import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../config/constants.dart';
import '../../../data/providers/auth_provider.dart';

class ReferralsScreen extends StatefulWidget {
  const ReferralsScreen({super.key});

  @override
  State<ReferralsScreen> createState() => _ReferralsScreenState();
}

class _ReferralsScreenState extends State<ReferralsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _referralCode = '';
  int _totalReferrals = 0;
  int _pendingReferrals = 0;
  int _successfulReferrals = 0;
  double _totalEarnings = 0.0;
  List<ReferralTransaction> _referralHistory = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadReferralData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadReferralData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Load referral data from API
      await Future.delayed(const Duration(milliseconds: 800));
      
      setState(() {
        _referralCode = 'WN${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
        _totalReferrals = 15;
        _pendingReferrals = 3;
        _successfulReferrals = 12;
        _totalEarnings = 2400.0;
        _referralHistory = _generateMockReferralHistory();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading referral data: $e')),
        );
      }
    }
  }

  List<ReferralTransaction> _generateMockReferralHistory() {
    return [
      ReferralTransaction(
        id: '1',
        friendName: 'Priya Sharma',
        friendPhone: '+91 98765***10',
        referredDate: DateTime.now().subtract(const Duration(days: 2)),
        status: ReferralStatus.successful,
        reward: 200.0,
        firstOrderDate: DateTime.now().subtract(const Duration(days: 1)),
      ),
      ReferralTransaction(
        id: '2',
        friendName: 'Amit Kumar',
        friendPhone: '+91 87654***21',
        referredDate: DateTime.now().subtract(const Duration(days: 5)),
        status: ReferralStatus.pending,
        reward: 200.0,
      ),
      ReferralTransaction(
        id: '3',
        friendName: 'Sneha Gupta',
        friendPhone: '+91 76543***32',
        referredDate: DateTime.now().subtract(const Duration(days: 8)),
        status: ReferralStatus.successful,
        reward: 200.0,
        firstOrderDate: DateTime.now().subtract(const Duration(days: 6)),
      ),
      ReferralTransaction(
        id: '4',
        friendName: 'Rahul Singh',
        friendPhone: '+91 65432***43',
        referredDate: DateTime.now().subtract(const Duration(days: 12)),
        status: ReferralStatus.successful,
        reward: 200.0,
        firstOrderDate: DateTime.now().subtract(const Duration(days: 10)),
      ),
      ReferralTransaction(
        id: '5',
        friendName: 'Kavita Jain',
        friendPhone: '+91 54321***54',
        referredDate: DateTime.now().subtract(const Duration(days: 15)),
        status: ReferralStatus.expired,
        reward: 0.0,
      ),
    ];
  }

  void _shareReferralCode() async {
    final referralLink = 'https://wellnessnest.com/refer/$_referralCode';
    final message = '''
🌟 Hey! Join WellnessNest for premium wellness products! 

Use my referral code: $_referralCode

✅ Get ₹100 off on your first order
✅ Premium wellness products
✅ Fast delivery
✅ 100% authentic products

Download now: $referralLink

#WellnessNest #HealthyLiving
    '''.trim();

    try {
      // Try to share via system share dialog
      await Share.share(message);
    } catch (e) {
      // Fallback to copying to clipboard
      await Clipboard.setData(ClipboardData(text: message));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Referral message copied to clipboard!'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  void _shareViaWhatsApp() async {
    final referralLink = 'https://wellnessnest.com/refer/$_referralCode';
    final message = '''🌟 Hey! Join WellnessNest for premium wellness products! 

Use my referral code: $_referralCode

✅ Get ₹100 off on your first order
✅ Premium wellness products
✅ Fast delivery

Download now: $referralLink''';
    
    final whatsappUrl = 'whatsapp://send?text=${Uri.encodeComponent(message)}';
    final uri = Uri.parse(whatsappUrl);
    
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('WhatsApp not installed')),
        );
      }
    }
  }

  void _copyReferralCode() async {
    await Clipboard.setData(ClipboardData(text: _referralCode));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Referral code copied to clipboard!'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Refer & Earn'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Refer Friends'),
            Tab(text: 'My Referrals'),
          ],
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildReferFriendsTab(),
                _buildMyReferralsTab(),
              ],
            ),
    );
  }

  Widget _buildReferFriendsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildReferralStatsCard(),
          const SizedBox(height: 24),
          _buildHowItWorksSection(),
          const SizedBox(height: 24),
          _buildReferralCodeSection(),
          const SizedBox(height: 24),
          _buildShareOptionsSection(),
          const SizedBox(height: 24),
          _buildReferralBenefits(),
        ],
      ),
    );
  }

  Widget _buildMyReferralsTab() {
    return RefreshIndicator(
      onRefresh: _loadReferralData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildEarningsCard(),
            const SizedBox(height: 24),
            _buildReferralHistory(),
          ],
        ),
      ),
    );
  }

  Widget _buildReferralStatsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.purple,
            Colors.purple.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.purple.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          const Icon(
            Icons.people,
            size: 48,
            color: Colors.white,
          ),
          const SizedBox(height: 16),
          const Text(
            'Invite Friends & Earn',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Get ₹200 for each friend who places their first order',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _buildStatItem('Total Referrals', '$_totalReferrals'),
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.white30,
              ),
              Expanded(
                child: _buildStatItem('Successful', '$_successfulReferrals'),
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.white30,
              ),
              Expanded(
                child: _buildStatItem('Pending', '$_pendingReferrals'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildHowItWorksSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'How It Works',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        _buildHowItWorksStep(
          number: '1',
          title: 'Share Your Code',
          description: 'Share your unique referral code with friends',
          icon: Icons.share,
        ),
        _buildHowItWorksStep(
          number: '2',
          title: 'Friend Signs Up',
          description: 'Your friend downloads the app and signs up using your code',
          icon: Icons.person_add,
        ),
        _buildHowItWorksStep(
          number: '3',
          title: 'Friend Places Order',
          description: 'Your friend places their first order and gets ₹100 off',
          icon: Icons.shopping_cart,
        ),
        _buildHowItWorksStep(
          number: '4',
          title: 'You Earn Reward',
          description: 'You earn ₹200 in your wallet once the order is delivered',
          icon: Icons.stars,
          isLast: true,
        ),
      ],
    );
  }

  Widget _buildHowItWorksStep({
    required String number,
    required String title,
    required String description,
    required IconData icon,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  number,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: Colors.grey[300],
                margin: const EdgeInsets.symmetric(vertical: 8),
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    icon,
                    size: 20,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              if (!isLast) const SizedBox(height: 24),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReferralCodeSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        children: [
          Text(
            'Your Referral Code',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: Theme.of(context).colorScheme.primary,
                width: 2,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _referralCode,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _copyReferralCode,
                  child: Icon(
                    Icons.copy,
                    color: Theme.of(context).colorScheme.primary,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Tap to copy your referral code',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShareOptionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Share With Friends',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildShareOption(
                icon: Icons.share,
                title: 'Share',
                subtitle: 'Share via apps',
                color: Colors.blue,
                onTap: _shareReferralCode,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildShareOption(
                icon: Icons.message,
                title: 'WhatsApp',
                subtitle: 'Share on WhatsApp',
                color: Colors.green,
                onTap: _shareViaWhatsApp,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildShareOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: AppConstants.cardElevation,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 32,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReferralBenefits() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Benefits',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
          ),
          child: Column(
            children: [
              _buildBenefitItem(
                icon: Icons.monetization_on,
                title: 'Earn ₹200 per referral',
                subtitle: 'Get money in your wallet for each successful referral',
              ),
              const Divider(),
              _buildBenefitItem(
                icon: Icons.card_giftcard,
                title: 'Your friend gets ₹100 off',
                subtitle: 'They save money on their first order',
              ),
              const Divider(),
              _buildBenefitItem(
                icon: Icons.all_inclusive,
                title: 'No limit on referrals',
                subtitle: 'Refer unlimited friends and keep earning',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBenefitItem({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          color: Colors.green,
          size: 24,
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEarningsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green,
            Colors.green.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          const Icon(
            Icons.account_balance_wallet,
            size: 32,
            color: Colors.white,
          ),
          const SizedBox(height: 12),
          const Text(
            'Total Earnings',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            AppConstants.formatPrice(_totalEarnings),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'From $_successfulReferrals successful referrals',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReferralHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Referral History',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        if (_referralHistory.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(
                    Icons.people_outline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No referrals yet',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Start referring friends to see your history here',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          )
        else
          ...(_referralHistory.map((referral) => _buildReferralHistoryTile(referral))),
      ],
    );
  }

  Widget _buildReferralHistoryTile(ReferralTransaction referral) {
    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _getReferralStatusColor(referral.status).withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            _getReferralStatusIcon(referral.status),
            color: _getReferralStatusColor(referral.status),
            size: 20,
          ),
        ),
        title: Text(
          referral.friendName,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              referral.friendPhone,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 2),
            Text(
              'Referred on ${_formatDate(referral.referredDate)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            if (referral.firstOrderDate != null)
              Text(
                'First order: ${_formatDate(referral.firstOrderDate!)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.green,
                ),
              ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getReferralStatusColor(referral.status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                referral.status.displayText,
                style: TextStyle(
                  fontSize: 11,
                  color: _getReferralStatusColor(referral.status),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            if (referral.status == ReferralStatus.successful)
              Text(
                '+${AppConstants.formatPrice(referral.reward)}',
                style: const TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }

  IconData _getReferralStatusIcon(ReferralStatus status) {
    switch (status) {
      case ReferralStatus.pending:
        return Icons.hourglass_empty;
      case ReferralStatus.successful:
        return Icons.check_circle;
      case ReferralStatus.expired:
        return Icons.cancel;
    }
  }

  Color _getReferralStatusColor(ReferralStatus status) {
    switch (status) {
      case ReferralStatus.pending:
        return Colors.orange;
      case ReferralStatus.successful:
        return Colors.green;
      case ReferralStatus.expired:
        return Colors.red;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

// Models for referral system
enum ReferralStatus {
  pending,
  successful,
  expired,
}

extension ReferralStatusExtension on ReferralStatus {
  String get displayText {
    switch (this) {
      case ReferralStatus.pending:
        return 'Pending';
      case ReferralStatus.successful:
        return 'Successful';
      case ReferralStatus.expired:
        return 'Expired';
    }
  }
}

class ReferralTransaction {
  final String id;
  final String friendName;
  final String friendPhone;
  final DateTime referredDate;
  final ReferralStatus status;
  final double reward;
  final DateTime? firstOrderDate;

  ReferralTransaction({
    required this.id,
    required this.friendName,
    required this.friendPhone,
    required this.referredDate,
    required this.status,
    required this.reward,
    this.firstOrderDate,
  });
}

// Mock Share class since share_plus might not be available
class Share {
  static Future<void> share(String text) async {
    // This would normally use the share_plus package
    // For now, we'll just copy to clipboard
    await Clipboard.setData(ClipboardData(text: text));
  }
}