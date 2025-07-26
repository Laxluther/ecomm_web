"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Package, ShoppingCart, Gift, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { adminApi } from "@/lib/api"

export default function AdminDashboard() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await adminApi.get("/dashboard")
      return response.data
    },
    retry: 3,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const stats = dashboardData?.stats

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Dashboard</h2>
              <p className="text-red-600">Failed to load dashboard data. Please try refreshing the page.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Badge variant="secondary">Admin Panel</Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users?.total_users || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.users?.new_users_30d || 0} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.products?.total_products || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.products?.featured_products || 0} featured
                {stats?.products?.low_stock > 0 && (
                  <span className="text-red-500 ml-2">
                    • {stats.products.low_stock} low stock
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.orders?.total_orders || 0}</div>
              <p className="text-xs text-muted-foreground">
                ₹{(stats?.orders?.total_revenue || 0).toLocaleString()} revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referrals</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.referrals?.total_codes || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.referrals?.successful_referrals || 0} successful
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{(stats?.orders?.revenue_this_month || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.orders?.orders_this_week || 0} orders this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.orders?.pending_orders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards Paid</CardTitle>
              <Gift className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ₹{(stats?.referrals?.total_rewards_paid || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From referrals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.recent_orders?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recent_orders.map((order: any) => (
                    <div key={order.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Order #{order.order_id}</p>
                        <p className="text-sm text-gray-500">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{order.total?.toLocaleString()}</p>
                        <Badge 
                          variant={
                            order.status === "delivered" ? "default" :
                            order.status === "pending" ? "secondary" :
                            order.status === "processing" ? "outline" :
                            "destructive"
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <a 
                  href="/admin/products" 
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Package className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium">Manage Products</p>
                </a>
                <a 
                  href="/admin/orders" 
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium">View Orders</p>
                </a>
                <a 
                  href="/admin/users" 
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-sm font-medium">Manage Users</p>
                </a>
                <a 
                  href="/admin/referrals" 
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Gift className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm font-medium">Referrals</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}