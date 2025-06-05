"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, RefreshCcw, Check, X, Eye, Users, Gift, DollarSign } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { toast } from "react-hot-toast"

// Mock API for admin referrals
const adminApi = {
  get: async (url: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (url === "/referrals") {
      return {
        data: {
          referrals: Array.from({ length: 20 }, (_, i) => ({
            referral_id: i + 1,
            referrer_name: `User ${Math.floor(Math.random() * 100) + 1}`,
            referrer_email: `user${Math.floor(Math.random() * 100) + 1}@example.com`,
            referred_name: `New User ${i + 1}`,
            referred_email: `newuser${i + 1}@example.com`,
            code: `REF${String(1000 + i).padStart(4, "0")}`,
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split("T")[0],
            status: ["pending", "approved", "rejected"][Math.floor(Math.random() * 3)],
            reward: (Math.floor(Math.random() * 20) + 5).toFixed(2),
          })),
        },
      }
    }
    return { data: {} }
  },
  put: async (url: string, data: any) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (url.includes("/referrals/") && url.includes("/status")) {
      return { data: { success: true } }
    }

    return { data: {} }
  },
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchReferrals()
  }, [])

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const response = await adminApi.get("/referrals")
      setReferrals(response.data.referrals)
    } catch (error) {
      toast.error("Failed to load referrals")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReferral = async (referral: any) => {
    try {
      await adminApi.put(`/referrals/${referral.referral_id}/status`, { status: "approved" })

      // Update local state
      setReferrals(referrals.map((r) => (r.referral_id === referral.referral_id ? { ...r, status: "approved" } : r)))

      toast.success(`Referral #${referral.referral_id} approved`)
    } catch (error) {
      toast.error("Failed to approve referral")
    }
  }

  const handleRejectReferral = async (referral: any) => {
    try {
      await adminApi.put(`/referrals/${referral.referral_id}/status`, { status: "rejected" })

      // Update local state
      setReferrals(referrals.map((r) => (r.referral_id === referral.referral_id ? { ...r, status: "rejected" } : r)))

      toast.success(`Referral #${referral.referral_id} rejected`)
    } catch (error) {
      toast.error("Failed to reject referral")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning"
      case "approved":
        return "success"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referrer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referred_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referred_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.code.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === "all") return matchesSearch
    return matchesSearch && referral.status === statusFilter
  })

  // Calculate statistics
  const totalReferrals = referrals.length
  const pendingReferrals = referrals.filter((r) => r.status === "pending").length
  const approvedReferrals = referrals.filter((r) => r.status === "approved").length
  const totalRewards = referrals
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + Number.parseFloat(r.reward), 0)
    .toFixed(2)

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Referral Management</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search referrals..."
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
              <Button variant="outline" size="icon" onClick={fetchReferrals} title="Refresh referrals">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              <div className="text-2xl font-bold">{totalReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-amber-500" />
              <div className="text-2xl font-bold">{pendingReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved Referrals</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-green-500" />
              <div className="text-2xl font-bold">{approvedReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards Paid</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              <div className="text-2xl font-bold">${totalRewards}</div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead className="hidden md:table-cell">Referrer</TableHead>
                <TableHead className="hidden md:table-cell">Referred</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
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
              ) : filteredReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    No referrals found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((referral) => (
                  <TableRow key={referral.referral_id}>
                    <TableCell>{referral.referral_id}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <div>{referral.referrer_name}</div>
                        <div className="text-xs text-gray-500">{referral.referrer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <div>{referral.referred_name}</div>
                        <div className="text-xs text-gray-500">{referral.referred_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{referral.code}</TableCell>
                    <TableCell className="hidden md:table-cell">{referral.date}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(referral.status) as any}>{referral.status}</Badge>
                    </TableCell>
                    <TableCell>${referral.reward}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {}} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {referral.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApproveReferral(referral)}
                              title="Approve Referral"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRejectReferral(referral)}
                              title="Reject Referral"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
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
