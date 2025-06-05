"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
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
import { useCartStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { CreditCard, Wallet, Truck, Plus, MapPin, Home, Building } from "lucide-react"
import api from "@/lib/api"
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

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
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
      const response = await api.get("/user/addresses")
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
    try {
      const response = await api.post("/user/addresses", newAddressData)
      toast.success("Address added successfully!")
      setIsAddressDialogOpen(false)
      // Refresh addresses and select the new one
      window.location.reload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add address")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let shippingAddress

      if (useNewAddress) {
        // Validate new address
        if (
          !newAddressData.name ||
          !newAddressData.phone ||
          !newAddressData.address_line_1 ||
          !newAddressData.city ||
          !newAddressData.state ||
          !newAddressData.pincode
        ) {
          toast.error("Please fill all required address fields")
          setIsLoading(false)
          return
        }
        shippingAddress = newAddressData
      } else {
        // Use selected saved address
        if (!selectedAddressId) {
          toast.error("Please select a delivery address")
          setIsLoading(false)
          return
        }
        shippingAddress = addressesData?.addresses?.find((addr: Address) => addr.address_id === selectedAddressId)
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
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address Selection Options */}
                  <RadioGroup
                    value={useNewAddress ? "new" : "saved"}
                    onValueChange={(value) => setUseNewAddress(value === "new")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="saved" id="saved" />
                      <Label htmlFor="saved">Use saved address</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new">Use new address</Label>
                    </div>
                  </RadioGroup>

                  {/* Saved Addresses */}
                  {!useNewAddress && (
                    <div className="space-y-3">
                      {addressesData?.addresses?.length === 0 ? (
                        <div className="text-center py-6">
                          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 mb-4">No saved addresses found</p>
                          <Button type="button" variant="outline" onClick={() => setUseNewAddress(true)}>
                            Add New Address
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <Label>Select delivery address:</Label>
                            <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add New
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
                                      onValueChange={(value) => setNewAddressData((prev) => ({ ...prev, type: value }))}
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
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                      id="phone"
                                      name="phone"
                                      type="tel"
                                      value={newAddressData.phone}
                                      onChange={handleNewAddressChange}
                                      required
                                    />
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
                                        setNewAddressData((prev) => ({ ...prev, is_default: checked as boolean }))
                                      }
                                    />
                                    <Label htmlFor="is_default" className="text-sm">
                                      Set as default address
                                    </Label>
                                  </div>

                                  <div className="flex space-x-3 pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => setIsAddressDialogOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                                      Add Address
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <RadioGroup
                            value={selectedAddressId?.toString()}
                            onValueChange={(value) => setSelectedAddressId(Number.parseInt(value))}
                          >
                            {addressesData?.addresses?.map((address: Address) => (
                              <div
                                key={address.address_id}
                                className="flex items-start space-x-3 p-4 border rounded-lg"
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
                                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <p className="font-medium">
                                      {address.name} • {address.phone}
                                    </p>
                                    <p>{address.address_line_1}</p>
                                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                                    <p>
                                      {address.city}, {address.state} {address.pincode}
                                    </p>
                                    {address.landmark && <p className="text-gray-500">Landmark: {address.landmark}</p>}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </>
                      )}
                    </div>
                  )}

                  {/* New Address Form */}
                  {useNewAddress && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-medium">Enter new delivery address:</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="new_name">Full Name</Label>
                          <Input
                            id="new_name"
                            name="name"
                            value={newAddressData.name}
                            onChange={handleNewAddressChange}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="new_phone">Phone</Label>
                          <Input
                            id="new_phone"
                            name="phone"
                            type="tel"
                            value={newAddressData.phone}
                            onChange={handleNewAddressChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="new_address_line_1">Address</Label>
                        <Textarea
                          id="new_address_line_1"
                          name="address_line_1"
                          value={newAddressData.address_line_1}
                          onChange={handleNewAddressChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="new_city">City</Label>
                          <Input
                            id="new_city"
                            name="city"
                            value={newAddressData.city}
                            onChange={handleNewAddressChange}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="new_state">State</Label>
                          <Input
                            id="new_state"
                            name="state"
                            value={newAddressData.state}
                            onChange={handleNewAddressChange}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="new_pincode">Pincode</Label>
                          <Input
                            id="new_pincode"
                            name="pincode"
                            value={newAddressData.pincode}
                            onChange={handleNewAddressChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-gray-500">Pay when you receive your order</p>
                          </div>
                          <Truck className="h-5 w-5 text-gray-400" />
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Wallet Payment</p>
                            <p className="text-sm text-gray-500">Pay using your wallet balance</p>
                          </div>
                          <Wallet className="h-5 w-5 text-gray-400" />
                        </div>
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
                  {/* Order Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.cart_id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₹{(item.discount_price * item.quantity).toFixed(0)}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(0)}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                    disabled={isLoading}
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
