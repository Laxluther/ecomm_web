"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, RefreshCcw, Check, X, Eye, Users, Gift, DollarSign } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { toast } from "react-hot-toast"
import { adminReferralsAPI } from "@/lib/api"

export default function AdminReferralsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch referrals using real API
  const { data: referralsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-referrals", currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const params: any = { 
        page: currentPage, 
        per_page: 20 
      }
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter
      }
      
      const result = await adminReferralsAPI.getAll(params)
      console.log("Referrals API Response:", result) // Debug log
      return result
    },
    retry: 2,
  })

  // Update referral status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ referralId, status }: { referralId: string; status: string }) => {
      return await adminReferralsAPI.updateStatus(referralId, status)
    },
    onSuccess: () => {
      toast.success("Referral status updated successfully")
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update referral status")
    },
  })

  const handleApproveReferral = async (referral: any) => {
    updateStatusMutation.mutate({ 
      referralId: referral.referral_id, 
      status: "approved" 
    })
  }

  const handleRejectReferral = async (referral: any) => {
    updateStatusMutation.mutate({ 
      referralId: referral.referral_id, 
      status: "rejected" 
    })
  }

  const filteredReferrals = referralsData?.referrals?.filter((referral: any) => {
    const matchesSearch = !searchTerm || 
      referral.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.referred_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700"
      case "rejected":
        return "bg-red-100 text-red-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load referrals</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Referrals Management</h1>
            <p className="text-gray-600">Manage referral codes and rewards</p>
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {referralsData?.referrals?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {referralsData?.referrals?.filter((r: any) => r.status === "pending")?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {referralsData?.referrals?.filter((r: any) => r.status === "approved")?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{referralsData?.referrals?.filter((r: any) => r.status === "approved")
                  ?.reduce((sum: number, r: any) => sum + (r.reward_amount || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by referrer, code, or referred user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCcw className="h-6 w-6 animate-spin mr-2" />
                        Loading referrals...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No referrals found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral: any) => (
                    <TableRow key={referral.referral_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.referrer_name}</div>
                          <div className="text-sm text-gray-500">{referral.referrer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.referred_name}</div>
                          <div className="text-sm text-gray-500">{referral.referred_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">{referral.code}</code>
                      </TableCell>
                      <TableCell>{new Date(referral.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{referral.reward}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {referral.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveReferral(referral)}
                                disabled={updateStatusMutation.isPending}
                                className="h-8 px-2"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectReferral(referral)}
                                disabled={updateStatusMutation.isPending}
                                className="h-8 px-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {referralsData?.pagination && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, referralsData.pagination.total)} of {referralsData.pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= referralsData.pagination.pages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}