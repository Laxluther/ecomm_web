"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { useCartStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import toast from "react-hot-toast"

export default function CartPage() {
  const { items, setItems, updateQuantity, removeItem, getTotalItems, getTotalPrice } = useCartStore()
  const { isAuthenticated } = useAuth()

  const { data: cartData, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const response = await api.get("/user/cart")
      return response.data
    },
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (cartData?.cart_items) {
      setItems(cartData.cart_items)
    }
  }, [cartData, setItems])

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    try {
      await api.put("/user/cart/update", {
        product_id: productId,
        quantity: newQuantity,
      })
      updateQuantity(productId, newQuantity)
      refetch()
    } catch (error) {
      toast.error("Failed to update quantity")
    }
  }

  const handleRemoveItem = async (productId: number) => {
    try {
      await api.delete(`/user/cart/remove/${productId}`)
      removeItem(productId)
      toast.success("Item removed from cart")
      refetch()
    } catch (error) {
      toast.error("Failed to remove item")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600 mb-8">You need to login to view your cart</p>
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some products to get started</p>
            <Button asChild>
              <Link href="/shop">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {getTotalItems()} items
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.cart_id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.image_url || "/placeholder.svg?height=80&width=80"}
                        alt={item.product_name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.product_id}`}>
                        <h3 className="font-semibold text-lg hover:text-amber-600 transition-colors">
                          {item.product_name}
                        </h3>
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-bold text-amber-600">₹{Number(item.discount_price || 0).toFixed(0)}</span>
                        {Number(item.price) > Number(item.discount_price) && (
                          <span className="text-sm text-gray-500 line-through">₹{Number(item.price || 0).toFixed(0)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-lg">₹{(Number(item.discount_price || 0) * item.quantity).toFixed(0)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span className="font-medium">₹{getTotalPrice().toFixed(0)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium">{getTotalPrice() >= 500 ? "Free" : "₹50"}</span>
                </div>

                {getTotalPrice() >= 500 && (
                  <div className="flex justify-between text-green-600">
                    <span>Free Shipping Discount</span>
                    <span>-₹50</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{(getTotalPrice() + (getTotalPrice() >= 500 ? 0 : 50)).toFixed(0)}</span>
                </div>

                {getTotalPrice() < 500 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    Add ₹{(500 - getTotalPrice()).toFixed(0)} more for free shipping!
                  </div>
                )}

                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/shop">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
