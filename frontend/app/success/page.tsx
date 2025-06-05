"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react"
import Button from "@/shared/ui/button/Button"

export default function SuccessPage() {
  const router = useRouter()

  // Redirect if accessed directly without checkout
  useEffect(() => {
    const hasCompletedCheckout = localStorage.getItem("orderCompleted")

    if (!hasCompletedCheckout) {
      router.push("/")
    } else {
      // Clear the flag after 5 minutes
      setTimeout(
        () => {
          localStorage.removeItem("orderCompleted")
        },
        5 * 60 * 1000,
      )
    }
  }, [router])

  return (
    <div className="container py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <CheckCircle className="h-24 w-24 text-green-600" />
        </div>

        <h1 className="text-4xl font-heading font-bold text-green-800 mb-4">Order Placed Successfully!</h1>

        <p className="text-lg text-gray-600 mb-8">
          Thank you for your purchase. We've received your order and will begin processing it right away. You will
          receive an email confirmation shortly.
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-6 mb-8">
          <h2 className="text-xl font-heading font-bold text-green-800 mb-4">Order Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-medium">#ORD-{Math.floor(100000 + Math.random() * 900000)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">Credit Card</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Shipping Method</p>
              <p className="font-medium">Standard Delivery</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop">
            <Button variant="outline" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>

          <Link href="/orders">
            <Button className="flex items-center gap-2">
              View Orders
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
