"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Gift, Copy, Share2, Users, DollarSign, TrendingUp, Heart, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth"
import api from "@/lib/api"
import toast from "react-hot-toast"
import Link from "next/link"

export default function ReferralsPage() {
  const { isAuthenticated } = useAuth()
  const [shareUrl, setShareUrl] = useState("")

  const { data: referralData, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const response = await api.get("/referrals")
      return response.data
    },
    enabled: isAuthenticated,
  })

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const response = await api.get("/wishlist")
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

  const copyReferralLink = () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/register?ref=${referralData?.referral_code}`
    navigator.clipboard.writeText(link)
    toast.success("Referral link copied!")
  }

  const shareReferral = () => {
    const text = `Join lorem ipsum and get premium natural products! Use my referral code ${referralData?.referral_code} and get ₹50 bonus on your first purchase!`
    const link = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/register?ref=${referralData?.referral_code}`

    if (navigator.share) {
      navigator.share({
        title: "Join lorem ipsum",
        text: text,
        url: link,
      })
    } else {
      navigator.clipboard.writeText(`${text}\n${link}`)
      toast.success("Referral message copied!")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600 mb-8">You need to login to view your referrals</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login">Login</Link>
            </Button>
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
        <div className="flex items-center mb-8">
          <Button asChild variant="ghost" size="sm" className="mr-4">
            <Link href="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Referrals</p>
                      <p className="text-2xl font-bold">{referralData?.stats?.total_referrals || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Successful</p>
                      <p className="text-2xl font-bold">{referralData?.stats?.successful_referrals || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Earned</p>
                      <p className="text-2xl font-bold">₹{referralData?.stats?.total_earned || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle>How Referral Program Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-emerald-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Share Your Code</h3>
                    <p className="text-sm text-gray-600">Share your unique referral code with friends and family</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-emerald-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">Friend Signs Up</h3>
                    <p className="text-sm text-gray-600">Your friend registers using your referral code</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-emerald-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">Both Earn Rewards</h3>
                    <p className="text-sm text-gray-600">You both get ₹50 bonus after their first purchase</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral History */}
            <Card>
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
              </CardHeader>
              <CardContent>
                {referralData?.referrals?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Friend's Name</TableHead>
                        <TableHead>Date Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reward</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralData.referrals.map((referral: any) => (
                        <TableRow key={referral.id}>
                          <TableCell>{referral.friend_name}</TableCell>
                          <TableCell>{new Date(referral.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={referral.status === "completed" ? "default" : "secondary"}>
                              {referral.status}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{referral.reward_amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No referrals yet. Start sharing your code!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Referral Code Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Your Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Share this code with friends</p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-3 py-2 rounded font-mono text-lg flex-1 text-center">
                      {referralData?.referral_code || "Loading..."}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyReferralCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button onClick={copyReferralLink} variant="outline" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Referral Link
                  </Button>
                  <Button onClick={shareReferral} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share with Friends
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Share your code and earn ₹50 for each successful referral!
                </div>
              </CardContent>
            </Card>

            {/* Wishlist Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Your Wishlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 mb-1">{wishlistData?.items?.length || 0}</p>
                  <p className="text-sm text-gray-500 mb-4">Items in wishlist</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/wishlist">
                      <Heart className="h-4 w-4 mr-2" />
                      View Wishlist
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Referral bonus is credited after friend's first purchase</p>
                <p>• Minimum order value of ₹500 required</p>
                <p>• Bonus expires after 90 days if unused</p>
                <p>• Cannot be combined with other offers</p>
                <p>• lorem ipsum reserves the right to modify terms</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
