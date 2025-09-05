"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, RefreshCcw, Eye, Package, DollarSign, ShoppingBag, Clock } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { toast } from "react-hot-toast"
import { adminOrdersAPI } from "@/lib/api"

interface Order {
  order_id: string
  total_amount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  created_at: string
  first_name: string
  last_name: string
  email: string
  item_count: number
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch orders with real API
  const { data: ordersData, isLoading, refetch, error } = useQuery({
    queryKey: ["admin-orders", currentPage, statusFilter],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        per_page: 20,
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const response = await adminOrdersAPI.getAll(params)
      return response
    },
    staleTime: 30000, // Cache for 30 seconds
    retry: 2,
  })

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await adminOrdersAPI.updateStatus(orderId, status)
    },
    onSuccess: () => {
      toast.success("Order status updated successfully")
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update order status")
    },
  })

  const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : []
  
  // Ensure all orders have valid numeric total_amount
  const safeOrders = orders.map((order: Order) => ({
    ...order,
    total_amount: Number(order.total_amount) || 0
  }))
  const totalPages = Math.ceil((ordersData?.total || 0) / 20)

  const handleViewOrder = (order: Order) => {
    router.push(`/admin/orders/${order.order_id}`)
  }

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus })
  }

  // Filter orders by search term
  const filteredOrders = safeOrders.filter((order: Order) => {
    const fullName = `${order.first_name || ''} ${order.last_name || ''}`.trim()
    const searchLower = searchTerm.toLowerCase()
    
    return (
      fullName.toLowerCase().includes(searchLower) ||
      (order.email || '').toLowerCase().includes(searchLower) ||
      order.order_id.toLowerCase().includes(searchLower)
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "processing": return "bg-purple-100 text-purple-800"
      case "shipped": return "bg-indigo-100 text-indigo-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      case "refunded": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "confirmed": return <Package className="h-4 w-4" />
      case "processing": return <Package className="h-4 w-4" />
      case "shipped": return <ShoppingBag className="h-4 w-4" />
      case "delivered": return <Package className="h-4 w-4" />
      case "cancelled": return <Package className="h-4 w-4" />
      case "refunded": return <DollarSign className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      "pending": "confirmed",
      "confirmed": "processing", 
      "processing": "shipped",
      "shipped": "delivered"
    }
    return statusFlow[currentStatus as keyof typeof statusFlow]
  }

  // Stats calculations
  const stats = {
    total: safeOrders.length || 0,
    pending: safeOrders.filter((o: Order) => o.status === "pending").length || 0,
    processing: safeOrders.filter((o: Order) => ["confirmed", "processing"].includes(o.status)).length || 0,
    shipped: safeOrders.filter((o: Order) => o.status === "shipped").length || 0,
    delivered: safeOrders.filter((o: Order) => o.status === "delivered").length || 0,
    totalRevenue: safeOrders.reduce((sum: number, o: Order) => sum + o.total_amount, 0) || 0,
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Order Management</h1>
            <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Order Management</h1>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Failed to load orders</p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders by customer, email, or order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="shipped">Shipped</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  <TabsTrigger value="refunded">Refunded</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: Order) => (
                    <TableRow 
                      key={order.order_id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewOrder(order)}
                    >
                      <TableCell className="font-mono text-sm">
                        {order.order_id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {`${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Unknown Customer'}
                          </div>
                          <div className="text-sm text-gray-500">{order.email || 'No email'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{order.item_count || 0} items</TableCell>
                      <TableCell className="font-medium">₹{order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleViewOrder(order)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Status Update Button */}
                          {getNextStatus(order.status) && (
                            <Button
                              onClick={() => handleUpdateStatus(order.order_id, getNextStatus(order.status)!)}
                              variant="outline"
                              size="sm"
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending ? "..." : `Mark ${getNextStatus(order.status)}`}
                            </Button>
                          )}
                          
                          {/* Cancel Button (only for pending/confirmed orders) */}
                          {["pending", "confirmed"].includes(order.status) && (
                            <Button
                              onClick={() => handleUpdateStatus(order.order_id, "cancelled")}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              disabled={updateStatusMutation.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No orders found matching your search" : "No orders found"}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, ordersData?.total || 0)} of {ordersData?.total || 0} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}