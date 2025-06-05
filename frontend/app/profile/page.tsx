"use client"

import { useQuery } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Wallet, Gift, ShoppingBag, Copy, MapPin, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import toast from "react-hot-toast"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth()

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const response = await api.get("/user/wallet")
      return response.data
    },
    enabled: isAuthenticated,
  })

  const { data: referralData } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const response = await api.get("/user/referrals")
      return response.data
    },
    enabled: isAuthenticated,
  })

  const copyReferralCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code)
      toast.success("Referral code copied!")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600">You need to login to view your profile</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">First Name</p>
                    <p className="font-medium">{user?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Name</p>
                    <p className="font-medium">{user?.last_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user?.phone}</p>
                </div>
                <Button variant="outline">Edit Profile</Button>
              </CardContent>
            </Card>

            {/* Wallet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="text-2xl font-bold text-green-600">₹{walletData?.balance?.toFixed(0) || "0"}</p>
                  </div>
                  <Button variant="outline">Add Money</Button>
                </div>

                <Separator className="my-4" />

                <div>
                  <h4 className="font-medium mb-3">Recent Transactions</h4>
                  {walletData?.transactions?.length > 0 ? (
                    <div className="space-y-2">
                      {walletData.transactions.slice(0, 5).map((transaction: any) => (
                        <div
                          key={transaction.transaction_id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={transaction.transaction_type === "credit" ? "default" : "secondary"}>
                            {transaction.transaction_type === "credit" ? "+" : "-"}₹{transaction.amount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No transactions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Referral Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Your Referral Code</p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-3 py-2 rounded font-mono text-sm flex-1">
                      {referralData?.referral_code || "Loading..."}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyReferralCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{referralData?.stats?.total_referrals || 0}</p>
                    <p className="text-xs text-gray-500">Total Referrals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">₹{referralData?.stats?.total_earned || 0}</p>
                    <p className="text-xs text-gray-500">Total Earned</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Share your referral code and earn ₹50 for each successful referral!
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/orders">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    View Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/profile/addresses">
                    <MapPin className="h-4 w-4 mr-2" />
                    Manage Addresses
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/referrals">
                    <Gift className="h-4 w-4 mr-2" />
                    Referral Details
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
