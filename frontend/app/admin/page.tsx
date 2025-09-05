"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Package, ShoppingCart, Gift, TrendingUp, TrendingDown, AlertTriangle, ArrowUp, Eye, Plus, BarChart3 } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { adminApi, adminReferralsAPI, adminUsersAPI, adminOrdersAPI, adminProductsAPI } from "@/lib/api"
import Link from "next/link"

export default function AdminDashboard() {
  // Fetch real data from individual endpoints instead of mock dashboard
  const { data: referralsData } = useQuery({
    queryKey: ["dashboard-referrals"],
    queryFn: async () => await adminReferralsAPI.getAll({ per_page: 1 }),
    retry: 2,
  })

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await adminApi.get("/dashboard")
      console.log("Dashboard API Response:", response.data) // Debug log
      return response.data
    },
    retry: 3,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Use real data for referrals, mock data for others until backend is fixed
  const stats = {
    ...dashboardData?.stats,
    referrals: {
      total_codes: referralsData?.referrals?.length || 0,
      successful_referrals: referralsData?.referrals?.filter((r: any) => r.status === "approved")?.length || 0,
      total_rewards_paid: referralsData?.referrals?.filter((r: any) => r.status === "approved")
        ?.reduce((sum: number, r: any) => sum + (r.reward_amount || 0), 0) || 0
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-emerald-200 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 shadow-xl animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    <div className="h-6 w-6 bg-emerald-200 rounded-full"></div>
                  </div>
                  <div className="h-8 w-16 bg-slate-300 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
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
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-600 mt-1">Welcome back to your admin control center</p>
            </div>
          </div>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-rose-50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5"></div>
            <CardContent className="p-8 text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Dashboard Temporarily Unavailable</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                We're experiencing some technical difficulties loading your dashboard data. Please try refreshing the page or contact support if the issue persists.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-lg shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Refresh Dashboard
              </button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Modern Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-600 mt-2">Welcome back to your admin control center</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
              Admin Panel
            </Badge>
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl group hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-6 translate-x-6"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Users</CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-2">{stats?.users?.total_users || 0}</div>
              <div className="flex items-center space-x-2">
                <ArrowUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-slate-600">
                  +{stats?.users?.new_users_30d || 0} new this month
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Products Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-50 shadow-xl group hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full -translate-y-6 translate-x-6"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Products</CardTitle>
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Package className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-2">{stats?.products?.total_products || 0}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {stats?.products?.featured_products || 0} featured
                </span>
                {stats?.products?.low_stock > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.products.low_stock} low stock
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-violet-50 shadow-xl group hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-violet-400/20 rounded-full -translate-y-6 translate-x-6"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Orders</CardTitle>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-2">{stats?.orders?.total_orders || 0}</div>
              <div className="text-sm text-slate-600">
                ₹{(stats?.orders?.total_revenue || 0).toLocaleString()} revenue
              </div>
            </CardContent>
          </Card>

          {/* Referrals Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl group hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full -translate-y-6 translate-x-6"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Referrals</CardTitle>
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Gift className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-slate-900 mb-2">{stats?.referrals?.total_codes || 0}</div>
              <div className="text-sm text-slate-600">
                {stats?.referrals?.successful_referrals || 0} successful
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Revenue */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl group hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full translate-y-8 -translate-x-8"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">This Month's Revenue</CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ₹{(stats?.orders?.revenue_this_month || 0).toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-600">
                  {stats?.orders?.orders_this_week || 0} orders this week
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-amber-50 shadow-xl group hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-amber-400/10 rounded-full translate-y-8 -translate-x-8"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Pending Orders</CardTitle>
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg animate-pulse">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats?.orders?.pending_orders || 0}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Need attention</span>
                {(stats?.orders?.pending_orders || 0) > 0 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                    Action Required
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rewards Paid */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-50 to-purple-50 shadow-xl group hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-full translate-y-8 -translate-x-8"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Rewards Paid</CardTitle>
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <Gift className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ₹{(stats?.referrals?.total_rewards_paid || 0).toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                From {stats?.referrals?.successful_referrals || 0} successful referrals
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-gray-50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-emerald-600" />
                  Recent Orders
                </CardTitle>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                  Live Updates
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {dashboardData?.recent_orders?.length > 0 ? (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {dashboardData.recent_orders.map((order: any, index: number) => (
                    <div 
                      key={order.order_id} 
                      className="group flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                          #{order.order_id.slice(-2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Order #{order.order_id}</p>
                          <p className="text-sm text-slate-500">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{order.total?.toLocaleString()}</p>
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
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No recent orders</p>
                  <p className="text-sm text-slate-400">New orders will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10"></div>
            <CardHeader className="relative">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-emerald-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/admin/products" 
                  className="group relative p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Manage Products</p>
                    <p className="text-xs text-slate-500 mt-1">Add, edit & organize</p>
                  </div>
                </Link>

                <Link 
                  href="/admin/orders" 
                  className="group relative p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">View Orders</p>
                    <p className="text-xs text-slate-500 mt-1">Track & manage</p>
                  </div>
                </Link>

                <Link 
                  href="/admin/users" 
                  className="group relative p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">Manage Users</p>
                    <p className="text-xs text-slate-500 mt-1">Customer accounts</p>
                  </div>
                </Link>

                <Link 
                  href="/admin/referrals" 
                  className="group relative p-6 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 text-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl mb-3 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">Referrals</p>
                    <p className="text-xs text-slate-500 mt-1">Rewards program</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}