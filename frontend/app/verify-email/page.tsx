"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import api from "@/lib/api"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function VerifyEmailPage() {
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus("error")
        setMessage("Invalid verification link. Please check your email for the correct link.")
        return
      }

      try {
        const response = await api.post("/auth/verify-email", { token })
        setVerificationStatus("success")
        setMessage(response.data.message || "Email verified successfully!")
        toast.success("Email verified! You can now login to your account.")
      } catch (error: any) {
        setVerificationStatus("error")
        setMessage(error.response?.data?.message || "Email verification failed. The link may be expired or invalid.")
        toast.error("Email verification failed")
      }
    }

    verifyEmail()
  }, [token])

  const handleGoToLogin = () => {
    router.push("/login")
  }

  const handleResendVerification = async () => {
    try {
      // You might want to get email from URL params or ask user to enter it
      toast.info("Please go to the registration page to resend verification email")
      router.push("/register")
    } catch (error) {
      toast.error("Failed to resend verification email")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {verificationStatus === "loading" && <Loader2 className="h-8 w-8 text-gray-600 animate-spin" />}
                {verificationStatus === "success" && <CheckCircle className="h-8 w-8 text-green-600" />}
                {verificationStatus === "error" && <XCircle className="h-8 w-8 text-red-600" />}
              </div>
              <CardTitle className="text-2xl font-bold">
                {verificationStatus === "loading" && "Verifying Email..."}
                {verificationStatus === "success" && "Email Verified!"}
                {verificationStatus === "error" && "Verification Failed"}
              </CardTitle>
              <CardDescription>
                {verificationStatus === "loading" && "Please wait while we verify your email address"}
                {verificationStatus === "success" && "Your email has been successfully verified"}
                {verificationStatus === "error" && "There was a problem verifying your email"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              <div className="space-y-3">
                {verificationStatus === "success" && (
                  <Button onClick={handleGoToLogin} className="w-full">
                    Continue to Login
                  </Button>
                )}

                {verificationStatus === "error" && (
                  <>
                    <Button onClick={handleResendVerification} className="w-full">
                      Resend Verification Email
                    </Button>
                    <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                      Back to Login
                    </Button>
                  </>
                )}

                {verificationStatus === "loading" && (
                  <div className="text-center text-sm text-gray-600">This may take a few moments...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
