import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../data/providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // Navigate to edit profile screen
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Edit profile feature coming soon!'),
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.currentUser;
          
          return SingleChildScrollView(
            child: Column(
              children: [
                // Profile Header
                _buildProfileHeader(user),
                
                // Profile Options
                _buildProfileOptions(authProvider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileHeader(dynamic user) {
    return Container(
      width: double.infinity,
      color: Theme.of(context).colorScheme.primary,
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        children: [
          // Profile Picture
          CircleAvatar(
            radius: 50,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            child: user != null && user.profileImage != null
                ? ClipOval(
                    child: Image.network(
                      user.profileImage!,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Text(
                          user.initials ?? 'U',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        );
                      },
                    ),
                  )
                : Text(
                    user?.initials ?? 'G',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
          ),
          const SizedBox(height: 16),
          
          // User Name
          Text(
            user?.fullName ?? 'Guest User',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          
          // User Email
          Text(
            user?.email ?? 'guest@wellnessnest.com',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          ),
          
          if (user != null) ...[
            const SizedBox(height: 8),
            
            // Verification Status
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: user.isEmailVerified && user.isPhoneVerified
                    ? Colors.green.withValues(alpha: 0.2)
                    : Colors.orange.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: user.isEmailVerified && user.isPhoneVerified
                      ? Colors.green
                      : Colors.orange,
                ),
              ),
              child: Text(
                user.verificationStatus,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: user.isEmailVerified && user.isPhoneVerified
                      ? Colors.green[700]
                      : Colors.orange[700],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProfileOptions(AuthProvider authProvider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Account Information Section
          _buildSectionTitle('Account Information'),
          _buildProfileOption(
            icon: Icons.person_outline,
            title: 'Personal Information',
            subtitle: 'Update your personal details',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Personal information feature coming soon!'),
                ),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.location_on_outlined,
            title: 'Addresses',
            subtitle: 'Manage your saved addresses',
            onTap: () {
              Navigator.pushNamed(context, '/addresses');
            },
          ),
          _buildProfileOption(
            icon: Icons.payment_outlined,
            title: 'Payment Methods',
            subtitle: 'Manage your payment options',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Payment methods feature coming soon!'),
                ),
              );
            },
          ),
          
          const SizedBox(height: 24),
          
          // Orders Section
          _buildSectionTitle('Orders & Returns'),
          _buildProfileOption(
            icon: Icons.shopping_bag_outlined,
            title: 'My Orders',
            subtitle: 'Track and manage your orders',
            onTap: () {
              Navigator.pushNamed(context, '/orders');
            },
          ),
          _buildProfileOption(
            icon: Icons.keyboard_return_outlined,
            title: 'Returns & Exchanges',
            subtitle: 'Manage returns and exchanges',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Returns & exchanges feature coming soon!'),
                ),
              );
            },
          ),
          
          const SizedBox(height: 24),
          
          // Wallet & Rewards Section
          _buildSectionTitle('Wallet & Rewards'),
          _buildProfileOption(
            icon: Icons.account_balance_wallet_outlined,
            title: 'My Wallet',
            subtitle: 'View your wallet balance and transactions',
            onTap: () {
              Navigator.pushNamed(context, '/wallet');
            },
          ),
          _buildProfileOption(
            icon: Icons.card_giftcard_outlined,
            title: 'Referrals & Rewards',
            subtitle: 'Invite friends and earn rewards',
            onTap: () {
              Navigator.pushNamed(context, '/referrals');
            },
          ),
          
          const SizedBox(height: 24),
          
          // Support Section
          _buildSectionTitle('Support'),
          _buildProfileOption(
            icon: Icons.help_outline,
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Help & support feature coming soon!'),
                ),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            subtitle: 'Read our privacy policy',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Privacy policy feature coming soon!'),
                ),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            subtitle: 'Read our terms of service',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Terms of service feature coming soon!'),
                ),
              );
            },
          ),
          
          const SizedBox(height: 32),
          
          // Logout Button
          if (authProvider.isAuthenticated) ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {
                  _showLogoutDialog(authProvider);
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Logout',
                  style: TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ] else ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/login');
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Sign In',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
          
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey[700],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: Theme.of(context).colorScheme.primary,
            size: 24,
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 13,
          ),
        ),
        trailing: const Icon(
          Icons.chevron_right,
          color: Colors.grey,
        ),
        onTap: onTap,
      ),
    );
  }

  void _showLogoutDialog(AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                final navigator = Navigator.of(context);
                navigator.pop();
                await authProvider.logout();
                if (mounted) {
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    '/login',
                    (route) => false,
                  );
                }
              },
              child: const Text(
                'Logout',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }
}