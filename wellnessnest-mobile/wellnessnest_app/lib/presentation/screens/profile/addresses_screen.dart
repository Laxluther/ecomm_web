import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';

import '../../../config/constants.dart';
import '../../../data/models/address.dart';
import '../../../data/providers/auth_provider.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  List<Address> _addresses = [];
  bool _isLoading = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Load addresses from API
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Mock addresses for now
      _addresses = _generateMockAddresses();
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading addresses: $e')),
        );
      }
    }
  }

  List<Address> _generateMockAddresses() {
    return [
      Address(
        addressId: 1,
        userId: 1,
        name: 'John Doe',
        phoneNumber: '9876543210',
        addressLine1: '123 MG Road',
        addressLine2: 'Near City Center',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        isDefault: true,
        addressType: 'Home',
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      Address(
        addressId: 2,
        userId: 1,
        name: 'John Doe',
        phoneNumber: '9876543210',
        addressLine1: 'Tech Park, Building A',
        addressLine2: 'Floor 5, Wing B',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411014',
        country: 'India',
        isDefault: false,
        addressType: 'Work',
        createdAt: DateTime.now().subtract(const Duration(days: 15)),
        updatedAt: DateTime.now().subtract(const Duration(days: 2)),
      ),
    ];
  }

  Future<void> _deleteAddress(Address address) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Address'),
        content: const Text('Are you sure you want to delete this address?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() {
        _isSubmitting = true;
      });

      try {
        // TODO: Delete address via API
        await Future.delayed(const Duration(milliseconds: 300));
        
        setState(() {
          _addresses.removeWhere((addr) => addr.addressId == address.addressId);
          _isSubmitting = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Address deleted successfully')),
          );
        }
      } catch (e) {
        setState(() {
          _isSubmitting = false;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting address: $e')),
          );
        }
      }
    }
  }

  Future<void> _setDefaultAddress(Address address) async {
    if (address.isDefault) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      // TODO: Set default address via API
      await Future.delayed(const Duration(milliseconds: 300));
      
      setState(() {
        // Update local state
        for (int i = 0; i < _addresses.length; i++) {
          _addresses[i] = _addresses[i].copyWith(
            isDefault: _addresses[i].addressId == address.addressId,
          );
        }
        _isSubmitting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Default address updated successfully')),
        );
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating default address: $e')),
        );
      }
    }
  }

  void _showAddEditAddressDialog({Address? address}) {
    showDialog(
      context: context,
      builder: (context) => AddEditAddressDialog(
        address: address,
        onSave: (newAddress) {
          setState(() {
            if (address == null) {
              // Add new address
              _addresses.add(newAddress.copyWith(
                addressId: _addresses.length + 1,
                userId: 1, // TODO: Get from auth provider
              ));
            } else {
              // Update existing address
              final index = _addresses.indexWhere((a) => a.addressId == address.addressId);
              if (index != -1) {
                _addresses[index] = newAddress.copyWith(
                  addressId: address.addressId,
                  userId: address.userId,
                );
              }
            }
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Addresses'),
        elevation: 0,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEditAddressDialog(),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Address'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_addresses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_on_outlined,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No addresses found',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add your delivery address to place orders',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _showAddEditAddressDialog(),
              icon: const Icon(Icons.add),
              label: const Text('Add Address'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAddresses,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: _addresses.length,
        itemBuilder: (context, index) {
          final address = _addresses[index];
          return _buildAddressCard(address);
        },
      ),
    );
  }

  Widget _buildAddressCard(Address address) {
    return Card(
      elevation: AppConstants.cardElevation,
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with name, type, and default badge
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: address.isDefault 
                  ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.1)
                  : null,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppConstants.cardBorderRadius),
              ),
            ),
            child: Row(
              children: [
                Text(
                  address.addressTypeIcon,
                  style: const TextStyle(fontSize: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            address.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              address.displayAddressType,
                              style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          if (address.isDefault) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.green.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Default',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.green,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        address.formattedPhoneNumber,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Address details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  address.fullAddress,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.local_shipping_outlined,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Delivery: ${address.formattedEstimatedDelivery}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: 16),
                    if (address.supportsCashOnDelivery) ...[
                      Icon(
                        Icons.payments_outlined,
                        size: 16,
                        color: Colors.green[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'COD Available',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.green[600],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          
          // Action buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(AppConstants.cardBorderRadius),
              ),
            ),
            child: Row(
              children: [
                if (!address.isDefault)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isSubmitting 
                          ? null 
                          : () => _setDefaultAddress(address),
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Set Default'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                if (!address.isDefault) const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showAddEditAddressDialog(address: address),
                    icon: const Icon(Icons.edit_outlined, size: 16),
                    label: const Text('Edit'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isSubmitting 
                        ? null 
                        : () => _deleteAddress(address),
                    icon: const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                    label: const Text('Delete', style: TextStyle(color: Colors.red)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      side: const BorderSide(color: Colors.red),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AddEditAddressDialog extends StatefulWidget {
  final Address? address;
  final Function(Address) onSave;

  const AddEditAddressDialog({
    super.key,
    this.address,
    required this.onSave,
  });

  @override
  State<AddEditAddressDialog> createState() => _AddEditAddressDialogState();
}

class _AddEditAddressDialogState extends State<AddEditAddressDialog> {
  final _formKey = GlobalKey<FormBuilderState>();
  bool _isSubmitting = false;

  final List<String> _addressTypes = ['Home', 'Work', 'Other'];
  final List<String> _states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  ];

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.address != null;
    
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppConstants.cardBorderRadius),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isEditing ? Icons.edit : Icons.add_location,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    isEditing ? 'Edit Address' : 'Add New Address',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),
            
            // Form
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: FormBuilder(
                  key: _formKey,
                  initialValue: {
                    'name': widget.address?.name ?? '',
                    'phoneNumber': widget.address?.phoneNumber ?? '',
                    'addressLine1': widget.address?.addressLine1 ?? '',
                    'addressLine2': widget.address?.addressLine2 ?? '',
                    'city': widget.address?.city ?? '',
                    'state': widget.address?.state ?? '',
                    'postalCode': widget.address?.postalCode ?? '',
                    'addressType': widget.address?.addressType ?? 'Home',
                    'isDefault': widget.address?.isDefault ?? false,
                  },
                  child: Column(
                    children: [
                      FormBuilderTextField(
                        name: 'name',
                        decoration: const InputDecoration(
                          labelText: 'Full Name',
                          prefixIcon: Icon(Icons.person_outline),
                          border: OutlineInputBorder(),
                        ),
                        validator: FormBuilderValidators.compose([
                          FormBuilderValidators.required(),
                          FormBuilderValidators.minLength(2),
                          FormBuilderValidators.maxLength(50),
                        ]),
                      ),
                      const SizedBox(height: 16),
                      
                      FormBuilderTextField(
                        name: 'phoneNumber',
                        decoration: const InputDecoration(
                          labelText: 'Phone Number',
                          prefixIcon: Icon(Icons.phone_outlined),
                          border: OutlineInputBorder(),
                          prefixText: '+91 ',
                        ),
                        keyboardType: TextInputType.phone,
                        validator: FormBuilderValidators.compose([
                          FormBuilderValidators.required(),
                          FormBuilderValidators.match(
                              RegExp(r'^[6-9]\d{9}$'),
                              errorText: 'Enter a valid 10-digit phone number'),
                        ]),
                      ),
                      const SizedBox(height: 16),
                      
                      FormBuilderTextField(
                        name: 'addressLine1',
                        decoration: const InputDecoration(
                          labelText: 'Address Line 1',
                          prefixIcon: Icon(Icons.home_outlined),
                          border: OutlineInputBorder(),
                          hintText: 'House/Flat/Block No.',
                        ),
                        validator: FormBuilderValidators.required(),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      
                      FormBuilderTextField(
                        name: 'addressLine2',
                        decoration: const InputDecoration(
                          labelText: 'Address Line 2 (Optional)',
                          prefixIcon: Icon(Icons.location_on_outlined),
                          border: OutlineInputBorder(),
                          hintText: 'Area, Landmark, Near by',
                        ),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      
                      Row(
                        children: [
                          Expanded(
                            child: FormBuilderTextField(
                              name: 'city',
                              decoration: const InputDecoration(
                                labelText: 'City',
                                prefixIcon: Icon(Icons.location_city_outlined),
                                border: OutlineInputBorder(),
                              ),
                              validator: FormBuilderValidators.required(),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: FormBuilderDropdown(
                              name: 'state',
                              decoration: const InputDecoration(
                                labelText: 'State',
                                prefixIcon: Icon(Icons.map_outlined),
                                border: OutlineInputBorder(),
                              ),
                              items: _states.map((state) => DropdownMenuItem(
                                value: state,
                                child: Text(state),
                              )).toList(),
                              validator: FormBuilderValidators.required(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      Row(
                        children: [
                          Expanded(
                            child: FormBuilderTextField(
                              name: 'postalCode',
                              decoration: const InputDecoration(
                                labelText: 'PIN Code',
                                prefixIcon: Icon(Icons.local_post_office_outlined),
                                border: OutlineInputBorder(),
                              ),
                              keyboardType: TextInputType.number,
                              validator: FormBuilderValidators.compose([
                                FormBuilderValidators.required(),
                                FormBuilderValidators.match(
                                    RegExp(r'^\d{6}$'),
                                    errorText: 'Enter a valid 6-digit PIN code'),
                              ]),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: FormBuilderDropdown(
                              name: 'addressType',
                              decoration: const InputDecoration(
                                labelText: 'Address Type',
                                prefixIcon: Icon(Icons.label_outline),
                                border: OutlineInputBorder(),
                              ),
                              items: _addressTypes.map((type) => DropdownMenuItem(
                                value: type,
                                child: Text(type),
                              )).toList(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      FormBuilderCheckbox(
                        name: 'isDefault',
                        title: const Text('Set as default delivery address'),
                        initialValue: widget.address?.isDefault ?? false,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Action buttons
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(AppConstants.cardBorderRadius),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSubmitting 
                          ? null 
                          : () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _saveAddress,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(isEditing ? 'Update' : 'Save'),
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

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.saveAndValidate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final formData = _formKey.currentState!.value;
      
      // Create Address object
      final address = Address.create(
        userId: 1, // TODO: Get from auth provider
        name: formData['name'],
        phoneNumber: formData['phoneNumber'],
        addressLine1: formData['addressLine1'],
        addressLine2: formData['addressLine2'],
        city: formData['city'],
        state: formData['state'],
        postalCode: formData['postalCode'],
        addressType: formData['addressType'],
        isDefault: formData['isDefault'] ?? false,
      );

      // TODO: Save via API
      await Future.delayed(const Duration(milliseconds: 500));
      
      widget.onSave(address);
      
      setState(() {
        _isSubmitting = false;
      });

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.address != null 
                ? 'Address updated successfully' 
                : 'Address added successfully'),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving address: $e')),
        );
      }
    }
  }
}