"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, RefreshCcw, Eye, FileText, Truck, Package, DollarSign } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { toast } from "react-hot-toast"

// Mock API for admin orders
const adminApi = {
  get: async (url: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (url === "/orders") {
      return {
        data: {
          orders: Array.from({ length: 20 }, (_, i) => ({
            order_id: `ORD-${String(1000 + i).padStart(4, "0")}`,
            customer_name: `Customer ${i + 1}`,
            customer_email: `customer${i + 1}@example.com`,
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split("T")[0],
            status: ["pending", "processing", "shipped", "delivered", "cancelled"][Math.floor(Math.random() * 5)],
            total: (Math.floor(Math.random() * 500) + 20).toFixed(2),
            items: Math.floor(Math.random() * 5) + 1,
            payment_method: Math.random() > 0.5 ? "Credit Card" : "PayPal",
            shipping_address: `${Math.floor(Math.random() * 1000) + 1} Main St, City, State`,
          })),
        },
      }
    }
    return { data: {} }
  },
  put: async (url: string, data: any) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (url.includes("/orders/") && url.includes("/status")) {
      return { data: { success: true } }
    }

    return { data: {} }
  },
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await adminApi.get("/orders")
      setOrders(response.data.orders)
    } catch (error) {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrder = (order: any) => {
    router.push(`/admin/orders/${order.order_id}`)
  }

  const handleUpdateStatus = async (order: any, newStatus: string) => {
    try {
      await adminApi.put(`/orders/${order.order_id}/status`, { status: newStatus })

      // Update local state
      setOrders(orders.map((o) => (o.order_id === order.order_id ? { ...o, status: newStatus } : o)))

      toast.success(`Order ${order.order_id} updated to ${newStatus}`)
    } catch (error) {
      toast.error("Failed to update order status")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning"
      case "processing":
        return "secondary"
      case "shipped":
        return "info"
      case "delivered":
        return "success"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === "all") return matchesSearch
    return matchesSearch && order.status === statusFilter
  })

  // Calculate statistics
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + Number.parseFloat(order.total), 0).toFixed(2)
  const pendingOrders = orders.filter((order) => order.status === "pending").length
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Order Management</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search orders..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStatusFilter(statusFilter === "all" ? "pending" : "all")}
                title="Filter by status"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={fetchOrders} title="Refresh orders">
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button onClick={() => router.push("/admin/orders/export")} title="Export orders">
                <FileText className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-gray-500" />
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-amber-500" />
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Truck className="h-5 w-5 mr-2 text-green-500" />
              <div className="text-2xl font-bold">{deliveredOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              <div className="text-2xl font-bold">${totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell>{order.order_id}</TableCell>
                    <TableCell className="hidden md:table-cell">{order.customer_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{order.date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status) as any}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{order.items}</TableCell>
                    <TableCell>${order.total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} title="View Order">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}
