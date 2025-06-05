"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import Input from "@/shared/ui/input/Input"

interface CheckoutSummary {
  subtotal: number
  discount_amount: number
  shipping_cost: number
  tax_amount: number
  total_amount: number
  promocode_applied: boolean
  promocode_description?: string
  promocode_discount_percentage?: number
  promocode_discount_amount?: number
  free_shipping: boolean
}

export default function CartPage() {
  const router = useRouter()
  const { state, removeFromCart, updateQuantity, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    if (state.items.length > 0) {
      loadCheckoutSummary()
    }
  }, [state.items, appliedPromo])

  // Add this new useEffect for debugging cart issues
  useEffect(() => {
    console.log("Cart state changed:", state)
  }, [state])

  const loadCheckoutSummary = async () => {
    try {
      setLoadingSummary(true)
      const response = await api.getCheckoutSummary({
        state_code: "MH", // Default to Maharashtra, should be from user's address
        promocode: appliedPromo || undefined,
      })

      if (response.data) {
        setCheckoutSummary(response.data)
      }
    } catch (error) {
      console.error("Failed to load checkout summary:", error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code")
      return
    }

    setPromoLoading(true)
    setPromoError(null)

    try {
      // Validate promo code with backend
      const response = await api.getCheckoutSummary({
        state_code: "MH",
        promocode: promoCode.trim(),
      })

      if (response.data && response.data.promocode_applied) {
        setAppliedPromo(promoCode.trim())
        setPromoCode("")
      } else {
        setPromoError(response.error || "Invalid promo code")
      }
    } catch (error) {
      setPromoError("Failed to apply promo code")
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromoCode = () => {
    setAppliedPromo(null)
    setPromoError(null)
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  if (state.loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="container py-12">
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="bg-green-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-green-800" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-green-800 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any products to your cart yet. Explore our collection and find something you'll
            love.
          </p>
          <Link href="/shop">
            <Button size="lg" className="px-8">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-heading font-bold text-green-800 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
            <div className="p-6 border-b border-green-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-heading font-bold text-green-800">
                  {state.items.length} {state.items.length === 1 ? "Item" : "Items"}
                </h2>
                <button onClick={clearCart} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="divide-y divide-green-100">
              {state.items.map((item) => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image_url || "/placeholder.svg?height=96&width=96"}
                      alt={item.product_name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-medium text-green-800">{item.product_name}</h3>
                    <div className="mt-1 text-sm text-gray-500">
                      ₹{(typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0).toFixed(2)}{" "}
                      per item
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 text-center min-w-[40px]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-medium text-green-800">
                          ₹
                          {(
                            (typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0) *
                            item.quantity
                          ).toFixed(2)}
                        </span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden sticky top-4">
            <div className="p-6 border-b border-green-100">
              <h2 className="text-xl font-heading font-bold text-green-800">Order Summary</h2>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-green-800 mb-2">Promo Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    error={promoError || undefined}
                    className="flex-grow"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyPromoCode}
                    disabled={!promoCode.trim() || promoLoading}
                    loading={promoLoading}
                  >
                    Apply
                  </Button>
                </div>
                {appliedPromo && checkoutSummary?.promocode_description && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-green-600">{checkoutSummary.promocode_description}</span>
                    <button onClick={handleRemovePromoCode} className="text-gray-500 hover:text-gray-700">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {loadingSummary ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800 mx-auto"></div>
                </div>
              ) : checkoutSummary ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{checkoutSummary.subtotal.toFixed(2)}</span>
                  </div>

                  {checkoutSummary.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{checkoutSummary.discount_amount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {checkoutSummary.shipping_cost === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `₹${checkoutSummary.shipping_cost.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  {checkoutSummary.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">₹{checkoutSummary.tax_amount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-green-800">
                    <span>Total</span>
                    <span>₹{checkoutSummary.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{state.summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-green-800">
                    <span>Total</span>
                    <span>₹{state.summary.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button className="w-full mt-6 flex items-center justify-center gap-2" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="mt-4 text-center">
                <Link href="/shop" className="text-sm text-green-800 hover:text-green-600">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
