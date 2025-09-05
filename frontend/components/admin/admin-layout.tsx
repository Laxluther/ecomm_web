"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Package, Users, ShoppingCart, Gift, Settings, LogOut, Menu, X, Coffee, Bell, Search } from "lucide-react"
import { useAdminAuth } from "@/lib/auth"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, isAuthenticated, logout } = useAdminAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
            <p className="text-gray-600 mb-4">Please login to access the admin panel</p>
            <Button asChild>
              <Link href="/admin/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Settings },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Referrals", href: "/admin/referrals", icon: Gift },
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Enhanced Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header */}
          <div className="relative h-20 px-6 border-b border-gradient-to-r from-emerald-500/10 to-green-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600"></div>
            <div className="relative flex items-center justify-between h-full">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <Image
                    src="/images/welnest-logo.png"
                    alt="WellnessNest Logo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Image
                      src="/images/welnest-logo.png"
                      alt="WellnessNest"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    <span className="font-bold text-lg text-white">WellnessNest</span>
                  </div>
                  <p className="text-xs text-emerald-100">Admin Dashboard</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-1">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-200 border border-transparent hover:border-emerald-100 hover:shadow-sm"
                  onClick={() => setSidebarOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-emerald-100 group-hover:to-green-100 transition-all duration-200 mr-3 shadow-sm">
                    <item.icon className="h-4 w-4 text-slate-600 group-hover:text-emerald-600" />
                  </div>
                  {item.name}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* Enhanced User Info & Logout */}
          <div className="border-t border-slate-200/50 p-4 bg-gradient-to-r from-slate-50/50 to-gray-50/50">
            <div className="flex items-center space-x-3 mb-4 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {admin?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{admin?.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
                <Badge variant="outline" className="text-xs mt-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                  Administrator
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-100 hover:to-rose-100 hover:border-red-300 shadow-sm transition-all duration-200" 
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Enhanced Mobile Top bar */}
        <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Image
                  src="/images/welnest-logo.png"
                  alt="WellnessNest"
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="font-semibold text-slate-900">WellnessNest</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="hover:bg-slate-100">
                <Bell className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
                Admin Panel
              </Badge>
            </div>
          </div>
        </div>

        {/* Enhanced Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">{children}</main>
      </div>
    </div>
  )
}