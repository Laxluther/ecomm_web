// Complete replacement for frontend/app/checkout/page.tsx

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
import { addressesAPI } from "@/lib/api"

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
  const { data: addressesData } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await addressesAPI.getAll()
      return response.data
    },
    enabled: isAuthenticated,
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

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // ✅ Prevent bubbling to parent form
    
    try {
      const response = await api.post("/addresses", newAddressData)
      toast.success("Address added successfully!")
      setIsAddressDialogOpen(false)
      
      // ✅ Properly refresh addresses using React Query
      await queryClient.invalidateQueries({ queryKey: ["addresses"] })
      
      // ✅ Reset form
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
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add address")
    }
  }

  // ✅ NEW: Handle payment method selection with alert for online payments
  const handlePaymentMethodChange = (method: string) => {
    if (method === "online") {
      // ✅ Alert for online payment
      alert("🚧 Online Payment Coming Soon!\n\nWe're working on integrating secure online payment options. For now, please use Cash on Delivery (COD).\n\nThank you for your patience! 🙏")
      return // Don't change the payment method
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
      case "office":
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
              
              {/* ✅ Delivery Address Section */}
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
                        <form onSubmit={handleAddNewAddress} className="space-y-4">
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
                                <SelectItem value="office">Office</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Full Name</Label>
                              <Input
                                id="name"
                                name="name"
                                value={newAddressData.name}
                                onChange={handleNewAddressChange}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone</Label>
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
                            <Label htmlFor="address_line_1">Address Line 1</Label>
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
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                name="city"
                                value={newAddressData.city}
                                onChange={handleNewAddressChange}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="pincode">Pincode</Label>
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
                            <Label htmlFor="state">State</Label>
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

                          <div className="flex space-x-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsAddressDialogOpen(false)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={(e) => {
                                // The form will handle the submission via onSubmit
                                e.stopPropagation()
                              }}
                            >
                              Add Address
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Show all addresses with radio buttons */}
                  {addressesData?.addresses?.length === 0 ? (
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
                      {addressesData?.addresses?.map((address: Address) => (
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
                              toast.info("Edit functionality coming soon!")
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

              {/* ✅ Payment Method Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange} className="space-y-3">
                    {/* Cash on Delivery */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <Wallet className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-gray-500">Pay when your order arrives</p>
                        </div>
                      </Label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>
                    </div>

                    {/* Online Payment - with alert */}
                    <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-75 cursor-pointer" 
                         onClick={(e) => {
                           e.preventDefault()
                           e.stopPropagation()
                           handlePaymentMethodChange("online")
                         }}>
                      <RadioGroupItem value="online" id="online" disabled />
                      <Label htmlFor="online" className="flex items-center space-x-3 cursor-pointer flex-1">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Online Payment</p>
                          <p className="text-sm text-gray-500">UPI, Cards, Net Banking</p>
                        </div>
                      </Label>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">Coming Soon</Badge>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "cod" && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✅ Cash on Delivery selected. Pay ₹{total.toFixed(2)} when your order arrives.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product_id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-xs font-medium">{item.quantity}x</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-sm text-gray-500">₹{item.price} each</p>
                        </div>
                        <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading || !selectedAddressId}
                  >
                    {isLoading ? "Placing Order..." : `Place Order - ₹${total.toFixed(2)}`}
                  </Button>

                  {subtotal < 500 && (
                    <p className="text-xs text-center text-gray-500">
                      Add ₹{(500 - subtotal).toFixed(2)} more for free delivery
                    </p>
                  )}
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