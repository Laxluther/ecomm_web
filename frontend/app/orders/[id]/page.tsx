"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, Truck, CheckCircle, Clock, ArrowLeft, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order] = useState({
    order_id: orderId,
    order_date: "2024-01-15",
    status: "shipped",
    total: 1299,
    subtotal: 1098,
    shipping: 0,
    tax: 201,
    payment_method: "COD",
    shipping_address: {
      name: "John Doe",
      phone: "+91 98765 43210",
      email: "john@example.com",
      address: "123 Main Street, Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    items: [
      {
        product_id: 1,
        product_name: "Raw Forest Honey",
        quantity: 2,
        price: 549,
        image_url: "/placeholder.svg?height=80&width=80",
      },
    ],
    tracking: [
      {
        status: "Order Placed",
        date: "2024-01-15 10:30 AM",
        description: "Your order has been placed successfully",
        completed: true,
      },
      {
        status: "Order Confirmed",
        date: "2024-01-15 02:15 PM",
        description: "Your order has been confirmed and is being prepared",
        completed: true,
      },
      {
        status: "Shipped",
        date: "2024-01-16 09:00 AM",
        description: "Your order has been shipped via Express Delivery",
        completed: true,
      },
      {
        status: "Out for Delivery",
        date: "Expected: 2024-01-17 11:00 AM",
        description: "Your order is out for delivery",
        completed: false,
      },
      {
        status: "Delivered",
        date: "Expected: 2024-01-17 06:00 PM",
        description: "Your order will be delivered",
        completed: false,
      },
    ],
  })

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "order placed":
        return <Clock className="h-4 w-4" />
      case "order confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "out for delivery":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <Package className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button asChild variant="ghost" size="sm" className="mr-4">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_id}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.product_name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{item.product_name}</h4>
                        <p className="text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-emerald-600 font-medium">₹{item.price} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">₹{(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Order Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {order.tracking.map((track, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${track.completed ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <div className={track.completed ? "text-emerald-600" : "text-gray-400"}>
                          {getStatusIcon(track.status)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${track.completed ? "text-gray-900" : "text-gray-500"}`}>
                            {track.status}
                          </h4>
                          {track.completed && <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{track.date}</p>
                        <p className="text-sm text-gray-600 mt-1">{track.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Shipping */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹{order.tax}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600">₹{order.total}</span>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm text-gray-600">{order.payment_method}</p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{order.shipping_address.name}</p>
                    <p className="text-sm text-gray-600">{order.shipping_address.address}</p>
                    <p className="text-sm text-gray-600">
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{order.shipping_address.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{order.shipping_address.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    Download Invoice
                  </Button>
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                  {order.status === "delivered" && (
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Write Review</Button>
                  )}
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
