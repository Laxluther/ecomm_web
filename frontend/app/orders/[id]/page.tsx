"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, MapPin, CreditCard } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface OrderDetail {
  order_id: number
  order_number: string
  order_date: string
  status: string
  payment_method: string
  payment_status: string
  subtotal: number
  shipping_fee: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  shipping_address: {
    name: string
    phone: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  items: {
    item_id: number
    product_id: number
    product_name: string
    quantity: number
    price: number
    total: number
    image_url: string
  }[]
  timeline: {
    status: string
    timestamp: string
    description: string
  }[]
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const orderId = Number.parseInt(params.id)

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/orders")
      return
    }

    if (isNaN(orderId)) {
      router.push("/orders")
      return
    }

    loadOrderDetails()
  }, [user, router, orderId])

  const loadOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await api.getOrderDetails(orderId)
      if (response.data?.order) {
        setOrder(response.data.order)
      } else {
        router.push("/orders")
      }
    } catch (error) {
      console.error("Failed to load order details:", error)
      router.push("/orders")
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-orange-100 text-orange-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container py-16 min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-heading font-bold text-green-800 mb-4">Order not found</h2>
          <p className="text-green-700 mb-8">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-green-800">Order #{order.order_number}</h1>
        <Link href="/orders">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-green-800">Order Status</h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                  order.status,
                )}`}
              >
                {order.status}
              </span>
            </div>
            <div className="border-t border-green-100 pt-4">
              <div className="relative">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex mb-6 last:mb-0">
                    <div className="mr-4 relative">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-green-600"></div>
                      </div>
                      {index < order.timeline.length - 1 && (
                        <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -ml-px bg-green-200"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-green-800">{event.status}</p>
                      <p className="text-sm text-green-600">{new Date(event.timestamp).toLocaleString()}</p>
                      <p className="text-sm text-green-700 mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-green-100">
              <h2 className="text-xl font-heading font-bold text-green-800">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-50 border-b border-green-100">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Product</th>
                    <th className="py-4 px-6 text-center text-sm font-medium text-green-800">Quantity</th>
                    <th className="py-4 px-6 text-right text-sm font-medium text-green-800">Price</th>
                    <th className="py-4 px-6 text-right text-sm font-medium text-green-800">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                  {order.items.map((item) => (
                    <tr key={item.item_id} className="hover:bg-green-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden relative">
                            <Image
                              src={item.image_url || "/placeholder.svg?height=64&width=64"}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/products/${item.product_id}`}
                              className="hover:text-green-600 transition-colors"
                            >
                              <h3 className="font-medium text-green-800">{item.product_name}</h3>
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-green-700">{item.quantity}</td>
                      <td className="py-4 px-6 text-right text-green-700">₹{item.price.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right font-medium text-green-800">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-heading font-bold text-green-800 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-green-700">
                <span>Order Date:</span>
                <span>{new Date(order.order_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Shipping:</span>
                <span>₹{order.shipping_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Tax:</span>
                <span>₹{order.tax_amount.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount:</span>
                  <span>-₹{order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-green-100 pt-3 flex justify-between font-bold text-green-800">
                <span>Total:</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-xl font-heading font-bold text-green-800">Shipping Address</h2>
            </div>
            <div className="text-green-700 space-y-1">
              <p className="font-medium">{order.shipping_address.name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
              </p>
              <p>{order.shipping_address.country}</p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-xl font-heading font-bold text-green-800">Payment Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-green-700">
                <span>Payment Method:</span>
                <span>{order.payment_method}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Payment Status:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.payment_status.toLowerCase() === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-heading font-bold text-green-800 mb-2">Need Help?</h3>
            <p className="text-green-700 mb-4">
              If you have any questions about your order, please contact our customer support.
            </p>
            <Link href="/contact">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
