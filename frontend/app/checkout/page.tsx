"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { CreditCard, Wallet, Truck, Plus, MapPin, Home, Building, Edit } from "lucide-react"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { ordersAPI } from "@/lib/api"  // Add this import
// AddressForm component outside to prevent recreation and focus loss
interface AddressFormProps {
  isEdit?: boolean
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  formData: any
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onTypeChange: (value: string) => void
  onDefaultChange: (checked: boolean) => void
  onCancel: () => void
}

const AddressForm: React.FC<AddressFormProps> = ({
  isEdit = false,
  onSubmit,
  isLoading = false,
  formData,
  onFormChange,
  onTypeChange,
  onDefaultChange,
  onCancel
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <Label htmlFor="type">Address Type</Label>
      <Select value={formData.type} onValueChange={onTypeChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="home">Home</SelectItem>
          <SelectItem value="work">Work</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onFormChange}
          required
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={onFormChange}
          required
          autoComplete="tel"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="address_line_1">Address Line 1 *</Label>
      <Textarea
        id="address_line_1"
        name="address_line_1"
        value={formData.address_line_1}
        onChange={onFormChange}
        required
        autoComplete="address-line1"
      />
    </div>

    <div>
      <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
      <Input
        id="address_line_2"
        name="address_line_2"
        value={formData.address_line_2}
        onChange={onFormChange}
        autoComplete="address-line2"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="city">City *</Label>
        <Input
          id="city"
          name="city"
          value={formData.city}
          onChange={onFormChange}
          required
          autoComplete="address-level2"
        />
      </div>
      <div>
        <Label htmlFor="pincode">Pincode *</Label>
        <Input
          id="pincode"
          name="pincode"
          value={formData.pincode}
          onChange={onFormChange}
          required
          autoComplete="postal-code"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="state">State *</Label>
      <Input
        id="state"
        name="state"
        value={formData.state}
        onChange={onFormChange}
        required
        autoComplete="address-level1"
      />
    </div>

    <div>
      <Label htmlFor="landmark">Landmark (Optional)</Label>
      <Input
        id="landmark"
        name="landmark"
        value={formData.landmark}
        onChange={onFormChange}
      />
    </div>

    <div className="flex items-center space-x-2">
      <Checkbox
        id="is_default"
        checked={formData.is_default}
        onCheckedChange={onDefaultChange}
      />
      <Label htmlFor="is_default">Set as default address</Label>
    </div>

    <div className="flex justify-end space-x-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : (isEdit ? "Update Address" : "Add Address")}
      </Button>
    </div>
  </form>
)

interface Address {
  address_id: number
  type: string
  name: string
  phone: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  pincode: string
  landmark?: string
  is_default: boolean
}

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [isLoading, setIsLoading] = useState(false)

  const [newAddressData, setNewAddressData] = useState({
    type: "home",
    name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    is_default: false,
  })

  const subtotal = getTotalPrice()
  const shipping = subtotal >= 500 ? 0 : 50
  const total = subtotal + shipping

  // Fetch saved addresses
  const { 
    data: addressesData, 
    isLoading: addressesLoading, 
    error: addressesError,
    refetch: refetchAddresses 
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await api.get("/addresses")
      return response.data
    },
    enabled: isAuthenticated,
    retry: 3,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      const response = await api.post("/addresses", addressData)
      return response.data
    },
    onSuccess: async () => {
      toast.success("Address added successfully!")
      setIsAddressDialogOpen(false)
      
      // Reset form
      setNewAddressData({
        type: "home",
        name: "",
        phone: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        is_default: false,
      })
      
      // Force refetch
      await queryClient.invalidateQueries({ queryKey: ["addresses"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add address")
    },
  })

  // Update Address Mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put(`/addresses/${id}`, data)
      return response.data
    },
    onSuccess: async () => {
      toast.success("Address updated successfully!")
      setIsEditDialogOpen(false)
      setEditingAddress(null)
      
      // Force refetch
      await queryClient.invalidateQueries({ queryKey: ["addresses"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update address")
    },
  })

  // Set default address when addresses are loaded
  useEffect(() => {
    if (addressesData?.addresses?.length > 0 && !selectedAddressId) {
      const defaultAddress = addressesData.addresses.find((addr: Address) => addr.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.address_id)
      } else {
        setSelectedAddressId(addressesData.addresses[0].address_id)
      }
    }
  }, [addressesData, selectedAddressId])

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewAddressData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: string) => {
    setNewAddressData(prev => ({ ...prev, type: value }))
  }

  const handleDefaultChange = (checked: boolean) => {
    setNewAddressData(prev => ({ ...prev, is_default: checked }))
  }

  const handleCancelAdd = () => {
    setIsAddressDialogOpen(false)
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingAddress(null)
  }

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Validate required fields
    if (!newAddressData.name || !newAddressData.phone || !newAddressData.address_line_1 || 
        !newAddressData.city || !newAddressData.state || !newAddressData.pincode) {
      toast.error("Please fill in all required fields")
      return
    }
    
    addAddressMutation.mutate(newAddressData)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setNewAddressData({
      type: address.type,
      name: address.name,
      phone: address.phone,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
      is_default: address.is_default,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!editingAddress) return
    
    // Validate required fields
    if (!newAddressData.name || !newAddressData.phone || !newAddressData.address_line_1 || 
        !newAddressData.city || !newAddressData.state || !newAddressData.pincode) {
      toast.error("Please fill in all required fields")
      return
    }
    
    updateAddressMutation.mutate({
      id: editingAddress.address_id,
      data: newAddressData
    })
  }

  const handlePaymentMethodChange = (method: string) => {
    if (method === "online") {
      alert("🚧 Online Payment Coming Soon!\n\nWe're working on integrating secure online payment options. For now, please use Cash on Delivery (COD).\n\nThank you for your patience! 🙏")
      return
    }
    setPaymentMethod(method)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
  
    try {
      // Validate address selection
      if (!selectedAddressId) {
        toast.error("Please select a delivery address")
        setIsLoading(false)
        return
      }
  
      const selectedAddress = addressesData?.addresses?.find((addr: Address) => addr.address_id === selectedAddressId)
      
      if (!selectedAddress) {
        toast.error("Selected address not found")
        setIsLoading(false)
        return
      }
  
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name || item.name,
          quantity: item.quantity,
          price: item.price
        })),
        shipping_address: {
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address_line_1: selectedAddress.address_line_1,
          address_line_2: selectedAddress.address_line_2 || "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          landmark: selectedAddress.landmark || "",
          type: selectedAddress.type
        },
        payment_method: paymentMethod,
        subtotal: subtotal,
        shipping_amount: shipping,
        tax_amount: 0,
        total_amount: total
      }
  
      console.log("Creating order with data:", orderData) // Debug log
  
      // Use the API client instead of fetch
      const result = await ordersAPI.create(orderData)
  
      // Clear cart and redirect
      clearCart()
      toast.success(`Order #${result.data.order_number} placed successfully!`)
      router.push("/orders")
      
    } catch (error: any) {
      console.error("Order creation error:", error)
      
      // Better error handling for Axios
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Failed to place order"
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="h-4 w-4" />
      case "work":
        return <Building className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Delivery Address Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Address
                    </CardTitle>
                    <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Address
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Address</DialogTitle>
                        </DialogHeader>
                        <AddressForm
                          onSubmit={handleAddNewAddress}
                          isLoading={addAddressMutation.isPending}
                          formData={newAddressData}
                          onFormChange={handleNewAddressChange}
                          onTypeChange={handleTypeChange}
                          onDefaultChange={handleDefaultChange}
                          onCancel={handleCancelAdd}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {addressesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading addresses...</p>
                    </div>
                  ) : addressesError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">Error loading addresses. Please try again.</p>
                      <Button onClick={() => refetchAddresses()} className="mt-2">Retry</Button>
                    </div>
                  ) : !addressesData?.addresses?.length ? (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses saved</h3>
                      <p className="text-gray-500 mb-4">Add a delivery address to continue</p>
                    </div>
                  ) : (
                    <RadioGroup
                      value={selectedAddressId?.toString()}
                      onValueChange={(value) => setSelectedAddressId(Number.parseInt(value))}
                      className="space-y-3"
                    >
                      {addressesData.addresses.map((address: Address) => (
                        <div
                          key={address.address_id}
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <RadioGroupItem
                            value={address.address_id.toString()}
                            id={`address-${address.address_id}`}
                            className="mt-1"
                          />
                          <Label htmlFor={`address-${address.address_id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center space-x-2 mb-2">
                              {getAddressIcon(address.type)}
                              <span className="font-medium capitalize">{address.type}</span>
                              {address.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-700">
                              <p className="font-medium">{address.name} • {address.phone}</p>
                              <p>{address.address_line_1}</p>
                              {address.address_line_2 && <p>{address.address_line_2}</p>}
                              <p>{address.city}, {address.state} {address.pincode}</p>
                              {address.landmark && <p className="text-gray-500">Landmark: {address.landmark}</p>}
                            </div>
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEditAddress(address)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>

              {/* Edit Address Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Address</DialogTitle>
                  </DialogHeader>
                  <AddressForm
                    isEdit={true}
                    onSubmit={handleUpdateAddress}
                    isLoading={updateAddressMutation.isPending}
                    formData={newAddressData}
                    onFormChange={handleNewAddressChange}
                    onTypeChange={handleTypeChange}
                    onDefaultChange={handleDefaultChange}
                    onCancel={handleCancelEdit}
                  />
                </DialogContent>
              </Dialog>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                        <Wallet className="h-4 w-4" />
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Online Payment
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading || !selectedAddressId}
                  >
                    {isLoading ? "Placing Order..." : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}