import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../config/constants.dart';
import '../../../data/providers/auth_provider.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  double _walletBalance = 0.0;
  int _rewardPoints = 0;
  List<WalletTransaction> _transactions = [];
  List<RewardTransaction> _rewardTransactions = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadWalletData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadWalletData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Load wallet data from API
      await Future.delayed(const Duration(milliseconds: 800));
      
      setState(() {
        _walletBalance = 250.50;
        _rewardPoints = 1250;
        _transactions = _generateMockTransactions();
        _rewardTransactions = _generateMockRewardTransactions();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading wallet data: $e')),
        );
      }
    }
  }

  List<WalletTransaction> _generateMockTransactions() {
    return [
      WalletTransaction(
        id: '1',
        amount: -150.00,
        type: WalletTransactionType.orderPayment,
        description: 'Order payment for #WN000123',
        date: DateTime.now().subtract(const Duration(days: 1)),
        status: TransactionStatus.completed,
        orderId: 'WN000123',
      ),
      WalletTransaction(
        id: '2',
        amount: 100.00,
        type: WalletTransactionType.refund,
        description: 'Refund for cancelled order #WN000122',
        date: DateTime.now().subtract(const Duration(days: 3)),
        status: TransactionStatus.completed,
        orderId: 'WN000122',
      ),
      WalletTransaction(
        id: '3',
        amount: 500.00,
        type: WalletTransactionType.topUp,
        description: 'Wallet top-up via UPI',
        date: DateTime.now().subtract(const Duration(days: 5)),
        status: TransactionStatus.completed,
      ),
      WalletTransaction(
        id: '4',
        amount: -75.00,
        type: WalletTransactionType.orderPayment,
        description: 'Order payment for #WN000121',
        date: DateTime.now().subtract(const Duration(days: 7)),
        status: TransactionStatus.completed,
        orderId: 'WN000121',
      ),
      WalletTransaction(
        id: '5',
        amount: 25.00,
        type: WalletTransactionType.cashback,
        description: 'Cashback on order #WN000120',
        date: DateTime.now().subtract(const Duration(days: 10)),
        status: TransactionStatus.completed,
        orderId: 'WN000120',
      ),
    ];
  }

  List<RewardTransaction> _generateMockRewardTransactions() {
    return [
      RewardTransaction(
        id: '1',
        points: 50,
        type: RewardTransactionType.earned,
        description: 'Points earned from order #WN000123',
        date: DateTime.now().subtract(const Duration(days: 1)),
        orderId: 'WN000123',
      ),
      RewardTransaction(
        id: '2',
        points: -500,
        type: RewardTransactionType.redeemed,
        description: 'Redeemed for ₹50 wallet credit',
        date: DateTime.now().subtract(const Duration(days: 2)),
        walletCredit: 50.00,
      ),
      RewardTransaction(
        id: '3',
        points: 100,
        type: RewardTransactionType.bonus,
        description: 'Welcome bonus points',
        date: DateTime.now().subtract(const Duration(days: 4)),
      ),
      RewardTransaction(
        id: '4',
        points: 75,
        type: RewardTransactionType.earned,
        description: 'Points earned from order #WN000122',
        date: DateTime.now().subtract(const Duration(days: 6)),
        orderId: 'WN000122',
      ),
      RewardTransaction(
        id: '5',
        points: 200,
        type: RewardTransactionType.referral,
        description: 'Referral bonus for friend signup',
        date: DateTime.now().subtract(const Duration(days: 8)),
      ),
    ];
  }

  void _showTopUpDialog() {
    showDialog(
      context: context,
      builder: (context) => TopUpWalletDialog(
        onTopUp: (amount) {
          // TODO: Process wallet top-up
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Top-up of ${AppConstants.formatPrice(amount)} initiated'),
            ),
          );
          _loadWalletData(); // Refresh data
        },
      ),
    );
  }

  void _showRedeemDialog() {
    if (_rewardPoints < 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Minimum 100 points required to redeem'),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => RedeemPointsDialog(
        currentPoints: _rewardPoints,
        onRedeem: (points, walletCredit) {
          // TODO: Process points redemption
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Redeemed $points points for ${AppConstants.formatPrice(walletCredit)}',
              ),
            ),
          );
          _loadWalletData(); // Refresh data
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wallet & Rewards'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Wallet'),
            Tab(text: 'Rewards'),
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
                _buildWalletTab(),
                _buildRewardsTab(),
              ],
            ),
    );
  }

  Widget _buildWalletTab() {
    return RefreshIndicator(
      onRefresh: _loadWalletData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildWalletBalanceCard(),
            const SizedBox(height: 24),
            _buildQuickActions(),
            const SizedBox(height: 24),
            _buildTransactionHistory(),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardsTab() {
    return RefreshIndicator(
      onRefresh: _loadWalletData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildRewardPointsCard(),
            const SizedBox(height: 24),
            _buildRewardBenefits(),
            const SizedBox(height: 24),
            _buildRewardHistory(),
          ],
        ),
      ),
    );
  }

  Widget _buildWalletBalanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.account_balance_wallet,
                color: Colors.white,
                size: 28,
              ),
              const SizedBox(width: 12),
              const Text(
                'Wallet Balance',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: _loadWalletData,
                icon: const Icon(Icons.refresh, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            AppConstants.formatPrice(_walletBalance),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _showTopUpDialog,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Top Up'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Theme.of(context).colorScheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // TODO: Navigate to transaction history
                  },
                  icon: const Icon(Icons.history, size: 18),
                  label: const Text('History'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            _buildActionCard(
              icon: Icons.payment,
              title: 'Pay with Wallet',
              subtitle: 'Use wallet for orders',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Select wallet during checkout')),
                );
              },
            ),
            const SizedBox(width: 12),
            _buildActionCard(
              icon: Icons.card_giftcard,
              title: 'Gift Cards',
              subtitle: 'Buy gift cards',
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Gift cards coming soon')),
                );
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: Card(
        elevation: AppConstants.cardElevation,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(
                  icon,
                  size: 32,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 8),
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
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
      ),
    );
  }

  Widget _buildTransactionHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Recent Transactions',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: () {
                // TODO: Navigate to full transaction history
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_transactions.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('No transactions yet'),
            ),
          )
        else
          ...(_transactions.take(5).map((transaction) => _buildTransactionTile(transaction))),
      ],
    );
  }

  Widget _buildTransactionTile(WalletTransaction transaction) {
    final isCredit = transaction.amount > 0;
    
    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (isCredit ? Colors.green : Colors.red).withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            _getTransactionIcon(transaction.type),
            color: isCredit ? Colors.green : Colors.red,
            size: 20,
          ),
        ),
        title: Text(
          transaction.description,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          _formatTransactionDate(transaction.date),
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${isCredit ? '+' : ''}${AppConstants.formatPrice(transaction.amount)}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: isCredit ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: _getStatusColor(transaction.status).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                transaction.status.displayText,
                style: TextStyle(
                  fontSize: 10,
                  color: _getStatusColor(transaction.status),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardPointsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.orange,
            Colors.orange.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.stars,
                color: Colors.white,
                size: 28,
              ),
              const SizedBox(width: 12),
              const Text(
                'Reward Points',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: _loadWalletData,
                icon: const Icon(Icons.refresh, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '$_rewardPoints Points',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Worth ${AppConstants.formatPrice(_rewardPoints / 10)}',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _showRedeemDialog,
                  icon: const Icon(Icons.redeem, size: 18),
                  label: const Text('Redeem'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.orange,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    // TODO: Navigate to earn points guide
                  },
                  icon: const Icon(Icons.help_outline, size: 18),
                  label: const Text('How to Earn'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppConstants.buttonBorderRadius),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRewardBenefits() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'How to Earn Points',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        _buildBenefitTile(
          icon: Icons.shopping_bag,
          title: 'Shop & Earn',
          subtitle: '1 point for every ₹10 spent',
        ),
        _buildBenefitTile(
          icon: Icons.person_add,
          title: 'Refer Friends',
          subtitle: '200 points for each successful referral',
        ),
        _buildBenefitTile(
          icon: Icons.star,
          title: 'Product Reviews',
          subtitle: '25 points for each review',
        ),
        _buildBenefitTile(
          icon: Icons.cake,
          title: 'Birthday Bonus',
          subtitle: '100 points on your birthday',
        ),
      ],
    );
  }

  Widget _buildBenefitTile({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.orange.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: Colors.orange,
            size: 20,
          ),
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(subtitle),
      ),
    );
  }

  Widget _buildRewardHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Recent Activity',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: () {
                // TODO: Navigate to full reward history
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_rewardTransactions.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Text('No reward activity yet'),
            ),
          )
        else
          ...(_rewardTransactions.take(5).map((transaction) => _buildRewardTransactionTile(transaction))),
      ],
    );
  }

  Widget _buildRewardTransactionTile(RewardTransaction transaction) {
    final isEarned = transaction.points > 0;
    
    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (isEarned ? Colors.green : Colors.orange).withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            _getRewardTransactionIcon(transaction.type),
            color: isEarned ? Colors.green : Colors.orange,
            size: 20,
          ),
        ),
        title: Text(
          transaction.description,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          _formatTransactionDate(transaction.date),
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: Text(
          '${isEarned ? '+' : ''}${transaction.points} pts',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: isEarned ? Colors.green : Colors.orange,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  IconData _getTransactionIcon(WalletTransactionType type) {
    switch (type) {
      case WalletTransactionType.topUp:
        return Icons.add_circle_outline;
      case WalletTransactionType.orderPayment:
        return Icons.shopping_cart_outlined;
      case WalletTransactionType.refund:
        return Icons.undo;
      case WalletTransactionType.cashback:
        return Icons.savings_outlined;
    }
  }

  IconData _getRewardTransactionIcon(RewardTransactionType type) {
    switch (type) {
      case RewardTransactionType.earned:
        return Icons.add_circle_outline;
      case RewardTransactionType.redeemed:
        return Icons.redeem;
      case RewardTransactionType.bonus:
        return Icons.card_giftcard;
      case RewardTransactionType.referral:
        return Icons.person_add;
    }
  }

  Color _getStatusColor(TransactionStatus status) {
    switch (status) {
      case TransactionStatus.completed:
        return Colors.green;
      case TransactionStatus.pending:
        return Colors.orange;
      case TransactionStatus.failed:
        return Colors.red;
    }
  }

  String _formatTransactionDate(DateTime date) {
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

// Models for wallet and rewards
enum WalletTransactionType {
  topUp,
  orderPayment,
  refund,
  cashback,
}

enum RewardTransactionType {
  earned,
  redeemed,
  bonus,
  referral,
}

enum TransactionStatus {
  completed,
  pending,
  failed,
}

extension TransactionStatusExtension on TransactionStatus {
  String get displayText {
    switch (this) {
      case TransactionStatus.completed:
        return 'Completed';
      case TransactionStatus.pending:
        return 'Pending';
      case TransactionStatus.failed:
        return 'Failed';
    }
  }
}

class WalletTransaction {
  final String id;
  final double amount;
  final WalletTransactionType type;
  final String description;
  final DateTime date;
  final TransactionStatus status;
  final String? orderId;

  WalletTransaction({
    required this.id,
    required this.amount,
    required this.type,
    required this.description,
    required this.date,
    required this.status,
    this.orderId,
  });
}

class RewardTransaction {
  final String id;
  final int points;
  final RewardTransactionType type;
  final String description;
  final DateTime date;
  final String? orderId;
  final double? walletCredit;

  RewardTransaction({
    required this.id,
    required this.points,
    required this.type,
    required this.description,
    required this.date,
    this.orderId,
    this.walletCredit,
  });
}

// Dialog for wallet top-up
class TopUpWalletDialog extends StatefulWidget {
  final Function(double) onTopUp;

  const TopUpWalletDialog({super.key, required this.onTopUp});

  @override
  State<TopUpWalletDialog> createState() => _TopUpWalletDialogState();
}

class _TopUpWalletDialogState extends State<TopUpWalletDialog> {
  double _selectedAmount = 100;
  final List<double> _quickAmounts = [100, 200, 500, 1000, 2000];
  final TextEditingController _customAmountController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Add Money to Wallet',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _quickAmounts.map((amount) {
                return ChoiceChip(
                  label: Text(AppConstants.formatPrice(amount)),
                  selected: _selectedAmount == amount,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedAmount = amount;
                        _customAmountController.clear();
                      });
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _customAmountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Custom Amount',
                prefixText: '₹ ',
                border: OutlineInputBorder(),
              ),
              onChanged: (value) {
                final amount = double.tryParse(value);
                if (amount != null && amount > 0) {
                  setState(() {
                    _selectedAmount = amount;
                  });
                }
              },
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onTopUp(_selectedAmount);
                      Navigator.of(context).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Add ${AppConstants.formatPrice(_selectedAmount)}'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Dialog for redeeming points
class RedeemPointsDialog extends StatefulWidget {
  final int currentPoints;
  final Function(int, double) onRedeem;

  const RedeemPointsDialog({
    super.key,
    required this.currentPoints,
    required this.onRedeem,
  });

  @override
  State<RedeemPointsDialog> createState() => _RedeemPointsDialogState();
}

class _RedeemPointsDialogState extends State<RedeemPointsDialog> {
  int _pointsToRedeem = 100;
  double get _walletCredit => _pointsToRedeem / 10;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Redeem Reward Points',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Available: ${widget.currentPoints} points',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            Text(
              'Points to Redeem',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            Slider(
              value: _pointsToRedeem.toDouble(),
              min: 100,
              max: widget.currentPoints.toDouble(),
              divisions: ((widget.currentPoints - 100) / 50).floor(),
              label: '$_pointsToRedeem points',
              onChanged: (value) {
                setState(() {
                  _pointsToRedeem = value.round();
                });
              },
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$_pointsToRedeem points =',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  Text(
                    AppConstants.formatPrice(_walletCredit),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onRedeem(_pointsToRedeem, _walletCredit);
                      Navigator.of(context).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Redeem'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}