// Complete replacement for frontend/app/orders/[id]/page.tsx

"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Truck, CheckCircle, Clock, ArrowLeft, MapPin, Phone, Mail, AlertCircle } from "lucide-react"
import { ordersAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"
import toast from "react-hot-toast"

interface OrderItem {
  product_id?: number
  product_name?: string
  quantity?: number
  unit_price?: number
  total_price?: number
}

interface OrderDetails {
  order_id: string
  order_number?: string
  status: string
  subtotal?: number
  shipping_amount?: number
  tax_amount?: number
  total_amount?: number
  payment_method?: string
  payment_status?: string
  shipping_address?: any
  created_at: string
  updated_at?: string
  items?: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { isAuthenticated } = useAuth()

  // Fetch real order details from API
  const { data: orderData, isLoading, error, refetch } = useQuery({
    queryKey: ["order-details", orderId],
    queryFn: async () => {
      const response = await ordersAPI.getById(orderId)
      return response
    },
    enabled: isAuthenticated && !!orderId,
    retry: 2,
  })

  const order: OrderDetails | undefined = orderData?.order

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />
      case "confirmed":
        return <CheckCircle className="h-5 w-5" />
      case "processing":
        return <Package className="h-5 w-5" />
      case "shipped":
        return <Truck className="h-5 w-5" />
      case "delivered":
        return <CheckCircle className="h-5 w-5" />
      case "cancelled":
      case "refunded":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available'
    
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getOrderTimeline = (status: string, createdAt: string, updatedAt?: string) => {
    const baseSteps = [
      { status: "Order Placed", date: createdAt, completed: true },
      { status: "Order Confirmed", date: null, completed: ["confirmed", "processing", "shipped", "delivered"].includes(status) },
      { status: "Processing", date: null, completed: ["processing", "shipped", "delivered"].includes(status) },
      { status: "Shipped", date: null, completed: ["shipped", "delivered"].includes(status) },
      { status: "Delivered", date: null, completed: status === "delivered" },
    ]

    if (status === "cancelled") {
      return [
        baseSteps[0],
        { status: "Order Cancelled", date: updatedAt || null, completed: true }
      ]
    }

    return baseSteps
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
                <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
                <div className="space-x-4">
                  <Button onClick={() => refetch()}>Try Again</Button>
                  <Button variant="outline" asChild>
                    <Link href="/orders">Back to Orders</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  const timeline = getOrderTimeline(order.status, order.created_at, order.updated_at)
  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number || order.order_id}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product_name || 'Product'}</h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity || 0}</p>
                        <p className="text-sm text-gray-600">Price: ₹{(item.unit_price || 0).toFixed(2)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{(item.total_price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No items found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.status}
                        </p>
                        {step.date && (
                          <p className="text-sm text-gray-600">{formatDate(step.date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{shippingAddress?.name}</p>
                  {shippingAddress?.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {shippingAddress.phone}
                    </p>
                  )}
                  <div className="text-sm text-gray-600">
                    <p>{shippingAddress?.address_line_1}</p>
                    {shippingAddress?.address_line_2 && <p>{shippingAddress.address_line_2}</p>}
                    <p>{shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.pincode}</p>
                    {shippingAddress?.landmark && <p>Landmark: {shippingAddress.landmark}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge className={getStatusColor(order.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </Badge>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{(order.subtotal || 0).toFixed(2)}</span>
                </div>

                {(order.shipping_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>₹{(order.shipping_amount || 0).toFixed(2)}</span>
                  </div>
                )}

                {(order.tax_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₹{(order.tax_amount || 0).toFixed(2)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{(order.total_amount || 0).toFixed(2)}</span>
                </div>

                <div className="pt-4 space-y-2 text-sm text-gray-600">
                  <p><strong>Payment Method:</strong> {order.payment_method?.toUpperCase() || 'N/A'}</p>
                  <p><strong>Payment Status:</strong> <span className="capitalize">{order.payment_status || 'pending'}</span></p>
                  <p><strong>Order Date:</strong> {formatDate(order.created_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    Download Invoice
                  </Button>
                  {order.status === "delivered" && (
                    <Button className="w-full" variant="outline">
                      Return/Exchange
                    </Button>
                  )}
                  <Button className="w-full" variant="outline">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}