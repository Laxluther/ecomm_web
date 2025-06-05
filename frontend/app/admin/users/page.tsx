"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Search, UserCheck, UserMinus, Users, Send, Filter, RefreshCcw } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { toast } from "react-hot-toast"

// Mock API for admin users
const adminApi = {
  get: async (url: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (url === "/users") {
      return {
        data: {
          users: Array.from({ length: 20 }, (_, i) => ({
            user_id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            phone: `+1 555-${String(1000 + i).padStart(4, "0")}`,
            status: Math.random() > 0.2 ? "active" : "suspended",
            orders: Math.floor(Math.random() * 20),
            spent: Math.floor(Math.random() * 1000) + 50,
            joined: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split("T")[0],
            last_login: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString().split("T")[0],
          })),
        },
      }
    }
    return { data: {} }
  },
  post: async (url: string, data: any) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (url.includes("/users/") && url.includes("/send-email")) {
      return { data: { success: true } }
    }

    if (url === "/newsletter/send") {
      return { data: { success: true, recipients: 20 } }
    }

    return { data: {} }
  },
  put: async (url: string, data: any) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (url.includes("/users/") && url.includes("/status")) {
      return { data: { success: true } }
    }

    return { data: {} }
  },
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false)
  const [newsletterSubject, setNewsletterSubject] = useState("")
  const [newsletterMessage, setNewsletterMessage] = useState("")
  const [newsletterTarget, setNewsletterTarget] = useState("all")
  const [sendingNewsletter, setSendingNewsletter] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await adminApi.get("/users")
      setUsers(response.data.users)
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = (user: any) => {
    router.push(`/admin/users/${user.user_id}`)
  }

  const handleSendEmail = (user: any) => {
    setSelectedUser(user)
    setEmailModalOpen(true)
  }

  const handleToggleStatus = async (user: any) => {
    try {
      const newStatus = user.status === "active" ? "suspended" : "active"
      await adminApi.put(`/users/${user.user_id}/status`, { status: newStatus })

      // Update local state
      setUsers(users.map((u) => (u.user_id === user.user_id ? { ...u, status: newStatus } : u)))

      toast.success(`User ${user.name} ${newStatus === "active" ? "activated" : "suspended"}`)
    } catch (error) {
      toast.error("Failed to update user status")
    }
  }

  const submitEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setSendingEmail(true)
    try {
      await adminApi.post(`/users/${selectedUser.user_id}/send-email`, {
        subject: emailSubject,
        message: emailMessage,
      })

      toast.success(`Email sent to ${selectedUser.name}`)
      setEmailModalOpen(false)
      setEmailSubject("")
      setEmailMessage("")
    } catch (error) {
      toast.error("Failed to send email")
    } finally {
      setSendingEmail(false)
    }
  }

  const submitNewsletter = async () => {
    if (!newsletterSubject.trim() || !newsletterMessage.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setSendingNewsletter(true)
    try {
      const response = await adminApi.post("/newsletter/send", {
        subject: newsletterSubject,
        message: newsletterMessage,
        target: newsletterTarget,
      })

      toast.success(`Newsletter sent to ${response.data.recipients} recipients`)
      setNewsletterModalOpen(false)
      setNewsletterSubject("")
      setNewsletterMessage("")
    } catch (error) {
      toast.error("Failed to send newsletter")
    } finally {
      setSendingNewsletter(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)

    if (statusFilter === "all") return matchesSearch
    return matchesSearch && user.status === statusFilter
  })

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">User Management</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStatusFilter(statusFilter === "all" ? "active" : "all")}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={fetchUsers}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button onClick={() => setNewsletterModalOpen(true)}>
                <Send className="h-4 w-4 mr-2" /> Send Newsletter
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((user) => user.status === "active").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">New Users (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  users.filter((user) => {
                    const joinDate = new Date(user.joined)
                    const thirtyDaysAgo = new Date()
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                    return joinDate >= thirtyDaysAgo
                  }).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>
              All Users
            </TabsTrigger>
            <TabsTrigger value="active" onClick={() => setStatusFilter("active")}>
              Active
            </TabsTrigger>
            <TabsTrigger value="suspended" onClick={() => setStatusFilter("suspended")}>
              Suspended
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Orders</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.user_id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.joined}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "success" : "destructive"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.orders}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewUser(user)} title="View Profile">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleSendEmail(user)} title="Send Email">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === "active" ? "Suspend User" : "Activate User"}
                        >
                          {user.status === "active" ? (
                            <UserMinus className="h-4 w-4 text-red-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Your message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEmail} disabled={sendingEmail}>
              {sendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newsletter Modal */}
      <Dialog open={newsletterModalOpen} onOpenChange={setNewsletterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Newsletter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="target" className="text-sm font-medium">
                Target Audience
              </label>
              <select
                id="target"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={newsletterTarget}
                onChange={(e) => setNewsletterTarget(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="active">Active Users Only</option>
                <option value="premium">Premium Users Only</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="newsletter-subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="newsletter-subject"
                placeholder="Newsletter subject"
                value={newsletterSubject}
                onChange={(e) => setNewsletterSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="newsletter-message" className="text-sm font-medium">
                Message
              </label>
              <textarea
                id="newsletter-message"
                rows={6}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Newsletter content"
                value={newsletterMessage}
                onChange={(e) => setNewsletterMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewsletterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNewsletter} disabled={sendingNewsletter}>
              {sendingNewsletter ? "Sending..." : "Send Newsletter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
