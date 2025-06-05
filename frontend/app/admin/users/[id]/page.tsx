"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, ShoppingBag, Wallet, Crown, Ban, UserCheck, Send } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = params.id as string

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    status: "active",
    is_premium: false,
  })

  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")

  // Fetch user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const response = await adminApi.get(`/users/${userId}`)
      return response.data
    },
    onSuccess: (data) => {
      if (data.user) {
        setFormData({
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          status: data.user.status || "active",
          is_premium: data.user.is_premium || false,
        })
      }
    },
  })

  // Mock user data
  const mockUserData = {
    user: {
      user_id: userId,
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      phone: "9876543210",
      status: "active",
      is_premium: false,
      total_orders: 5,
      total_spent: 2450,
      wallet_balance: 150,
      referral_code: "REFTES123",
      created_at: "2024-01-01T00:00:00Z",
      last_login: "2024-01-22T10:30:00Z",
    },
    orders: [
      {
        order_id: "ORD001",
        total_amount: 599,
        status: "delivered",
        created_at: "2024-01-20T00:00:00Z",
        items_count: 2,
      },
      {
        order_id: "ORD002",
        total_amount: 899,
        status: "shipped",
        created_at: "2024-01-18T00:00:00Z",
        items_count: 1,
      },
    ],
    addresses: [
      {
        address_id: 1,
        type: "home",
        address_line_1: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
    ],
  }

  const data = userData || mockUserData

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.put(`/users/${userId}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success("User updated successfully!")
      queryClient.invalidateQueries(["admin-users"])
      queryClient.invalidateQueries(["admin-user", userId])
    },
    onError: () => {
      toast.error("Failed to update user")
    },
  })

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      const response = await adminApi.post(`/users/${userId}/send-email`, emailData)
      return response.data
    },
    onSuccess: () => {
      toast.success("Email sent successfully!")
      setEmailSubject("")
      setEmailMessage("")
    },
    onError: () => {
      toast.error("Failed to send email")
    },
  })

  // Suspend/Activate user mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await adminApi.put(`/users/${userId}/status`, { status })
      return response.data
    },
    onSuccess: (data, status) => {
      toast.success(`User ${status === "suspended" ? "suspended" : "activated"} successfully!`)
      queryClient.invalidateQueries(["admin-users"])
      queryClient.invalidateQueries(["admin-user", userId])
    },
    onError: () => {
      toast.error("Failed to update user status")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUserMutation.mutate(formData)
  }

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Please fill in both subject and message")
      return
    }

    sendEmailMutation.mutate({
      subject: emailSubject,
      message: emailMessage,
    })
  }

  const handleToggleStatus = () => {
    const newStatus = data.user.status === "active" ? "suspended" : "active"
    toggleUserStatusMutation.mutate(newStatus)
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {data.user.first_name} {data.user.last_name}
              </h1>
              <p className="text-gray-500">{data.user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(data.user.status)}>{data.user.status}</Badge>
            {data.user.is_premium && (
              <Badge variant="outline" className="text-amber-600">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between">
                    <Button type="submit" disabled={updateUserMutation.isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {updateUserMutation.isLoading ? "Saving..." : "Save Changes"}
                    </Button>

                    <Button
                      type="button"
                      variant={data.user.status === "active" ? "destructive" : "default"}
                      onClick={handleToggleStatus}
                      disabled={toggleUserStatusMutation.isLoading}
                    >
                      {data.user.status === "active" ? (
                        <>
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend User
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activate User
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Send Email */}
            <Card>
              <CardHeader>
                <CardTitle>Send Email</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <Label htmlFor="email_subject">Subject</Label>
                    <Input
                      id="email_subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_message">Message</Label>
                    <textarea
                      id="email_message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Email message..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={sendEmailMutation.isLoading}>
                    <Send className="h-4 w-4 mr-2" />
                    {sendEmailMutation.isLoading ? "Sending..." : "Send Email"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* User Stats and Activity */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-xl font-bold">{data.user.total_orders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-500">Total Spent</p>
                      <p className="text-xl font-bold">₹{data.user.total_spent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Details */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">User ID</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{data.user.user_id}</code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Referral Code</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{data.user.referral_code}</code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Wallet Balance</span>
                  <span className="font-medium">₹{data.user.wallet_balance}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Joined</span>
                  <span className="text-sm">{new Date(data.user.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last Login</span>
                  <span className="text-sm">{new Date(data.user.last_login).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {data.orders?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((order: any) => (
                        <TableRow key={order.order_id}>
                          <TableCell className="font-medium">{order.order_id}</TableCell>
                          <TableCell>₹{order.total_amount}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-4">No orders found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
