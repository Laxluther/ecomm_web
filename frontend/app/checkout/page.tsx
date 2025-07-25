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
import api from "@/lib/api" // Using api directly like profile page
import toast from "react-hot-toast"

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

  // Fetch saved addresses - Using same pattern as profile page
  const { 
    data: addressesData, 
    isLoading: addressesLoading, 
    error: addressesError,
    refetch: refetchAddresses 
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      console.log("🔄 Fetching addresses in checkout...")
      const response = await api.get("/addresses")
      console.log("✅ Addresses API Response:", response.data)
      console.log("📊 Addresses Array:", response.data?.addresses)
      console.log("📈 Addresses Count:", response.data?.addresses?.length || 0)
      return response.data
    },
    enabled: isAuthenticated,
    retry: 3,
    staleTime: 0, // Don't use stale data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })

  // Debug logging
  useEffect(() => {
    console.log("🔍 Checkout Debug Info:")
    console.log("- isAuthenticated:", isAuthenticated)
    console.log("- addressesLoading:", addressesLoading)
    console.log("- addressesError:", addressesError)
    console.log("- addressesData:", addressesData)
    console.log("- addresses array:", addressesData?.addresses)
    console.log("- addresses length:", addressesData?.addresses?.length)
    console.log("- selectedAddressId:", selectedAddressId)
  }, [isAuthenticated, addressesLoading, addressesError, addressesData, selectedAddressId])

  // Add Address Mutation
  const addAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      console.log("➕ Adding new address:", addressData)
      const response = await api.post("/addresses", addressData)
      console.log("✅ Add address response:", response.data)
      return response.data
    },
    onSuccess: async () => {
      console.log("🎉 Address added successfully, refetching...")
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
      setTimeout(() => {
        refetchAddresses()
      }, 100)
    },
    onError: (error: any) => {
      console.error("❌ Add address error:", error)
      toast.error(error.response?.data?.message || "Failed to add address")
    },
  })

  // Update Address Mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log("✏️ Updating address:", id, data)
      const response = await api.put(`/addresses/${id}`, data)
      console.log("✅ Update address response:", response.data)
      return response.data
    },
    onSuccess: async () => {
      console.log("🎉 Address updated successfully, refetching...")
      toast.success("Address updated successfully!")
      setIsEditDialogOpen(false)
      setEditingAddress(null)
      
      // Force refetch
      await queryClient.invalidateQueries({ queryKey: ["addresses"] })
      setTimeout(() => {
        refetchAddresses()
      }, 100)
    },
    onError: (error: any) => {
      console.error("❌ Update address error:", error)
      toast.error(error.response?.data?.message || "Failed to update address")
    },
  })

  // Set default address when addresses are loaded
  useEffect(() => {
    console.log("🎯 Setting default address...")
    console.log("- addressesData:", addressesData)
    console.log("- addresses:", addressesData?.addresses)
    console.log("- currentSelected:", selectedAddressId)
    
    if (addressesData?.addresses?.length > 0 && !selectedAddressId) {
      const defaultAddress = addressesData.addresses.find((addr: Address) => addr.is_default)
      console.log("- defaultAddress found:", defaultAddress)
      
      if (defaultAddress) {
        console.log("✅ Setting default address:", defaultAddress.address_id)
        setSelectedAddressId(defaultAddress.address_id)
      } else {
        console.log("✅ Setting first address:", addressesData.addresses[0].address_id)
        setSelectedAddressId(addressesData.addresses[0].address_id)
      }
    }
  }, [addressesData, selectedAddressId])

  const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewAddressData((prev) => ({ ...prev, [name]: value }))
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
    console.log("✏️ Editing address:", address)
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

      // Simulate order placement
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Clear cart and redirect
      clearCart()
      toast.success("Order placed successfully!")
      router.push("/orders")
    } catch (error) {
      toast.error("Failed to place order")
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

  // Force refresh addresses button for debugging
  const handleRefreshAddresses = () => {
    console.log("🔄 Manually refreshing addresses...")
    queryClient.invalidateQueries({ queryKey: ["addresses"] })
    refetchAddresses()
  }

  // Address form component
  const AddressForm = ({ 
    isEdit = false, 
    onSubmit, 
    isLoading = false 
  }: { 
    isEdit?: boolean; 
    onSubmit: (e: React.FormEvent) => void;
    isLoading?: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Address Type</Label>
        <Select 
          value={newAddressData.type} 
          onValueChange={(value) => setNewAddressData(prev => ({ ...prev, type: value }))}
        >
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
            value={newAddressData.name}
            onChange={handleNewAddressChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={newAddressData.phone}
            onChange={handleNewAddressChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address_line_1">Address Line 1 *</Label>
        <Textarea
          id="address_line_1"
          name="address_line_1"
          value={newAddressData.address_line_1}
          onChange={handleNewAddressChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
        <Input
          id="address_line_2"
          name="address_line_2"
          value={newAddressData.address_line_2}
          onChange={handleNewAddressChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            value={newAddressData.city}
            onChange={handleNewAddressChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            name="pincode"
            value={newAddressData.pincode}
            onChange={handleNewAddressChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="state">State *</Label>
        <Input
          id="state"
          name="state"
          value={newAddressData.state}
          onChange={handleNewAddressChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="landmark">Landmark (Optional)</Label>
        <Input
          id="landmark"
          name="landmark"
          value={newAddressData.landmark}
          onChange={handleNewAddressChange}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_default"
          checked={newAddressData.is_default}
          onCheckedChange={(checked) => 
            setNewAddressData(prev => ({ ...prev, is_default: !!checked }))
          }
        />
        <Label htmlFor="is_default">Set as default address</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false)
              setEditingAddress(null)
            } else {
              setIsAddressDialogOpen(false)
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : (isEdit ? "Update Address" : "Add Address")}
        </Button>
      </div>
    </form>
  )

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          {/* Debug button - remove in production */}
          <Button 
            onClick={handleRefreshAddresses}
            variant="outline"
            size="sm"
            className="bg-red-50 border-red-200 text-red-600"
          >
            🔄 Debug: Refresh Addresses
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Debug Info Card */}
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-yellow-800">🐛 Debug Info (Remove in Production)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-yellow-700">
                  <p>Authentication: {isAuthenticated ? "✅ Logged in" : "❌ Not logged in"}</p>
                  <p>Addresses Loading: {addressesLoading ? "⏳ Loading..." : "✅ Done"}</p>
                  <p>Addresses Error: {addressesError ? `❌ ${addressesError}` : "✅ No errors"}</p>
                  <p>Addresses Data: {addressesData ? "✅ Received" : "❌ None"}</p>
                  <p>Addresses Array: {addressesData?.addresses ? `✅ ${addressesData.addresses.length} addresses` : "❌ Empty"}</p>
                  <p>Selected Address ID: {selectedAddressId || "None"}</p>
                </CardContent>
              </Card>
              
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
                      <p className="text-red-500">Error loading addresses: {addressesError.message}</p>
                      <Button onClick={handleRefreshAddresses} className="mt-2">Retry</Button>
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