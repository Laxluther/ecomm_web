"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/lib/auth"
import { authAPI } from "@/lib/api"
import toast from "react-hot-toast"
import { Eye, EyeOff, AlertCircle, Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setEmailNotVerified(false)

    try {
      const response = await authAPI.login(email, password, rememberMe)
      const { token, user } = response
      login(token, user)
      toast.success("Login successful! Welcome back!")
      router.push("/")
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials."

      // Check if error is due to unverified email
      if (errorMessage.toLowerCase().includes("verify") || errorMessage.toLowerCase().includes("verification")) {
        setEmailNotVerified(true)
      }

      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authAPI.forgotPassword(forgotPasswordEmail)
      setForgotPasswordSent(true)
      toast.success("Password reset email sent! Please check your inbox.")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send password reset email")
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true)
      await authAPI.resendVerification(email)
      toast.success("Verification email sent! Please check your inbox.")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend verification email")
    } finally {
      setIsLoading(false)
    }
  }

  if (showForgotPassword) {
    if (forgotPasswordSent) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-blue-600">Check Your Email</CardTitle>
                  <CardDescription>We've sent a password reset link to your email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      A password reset link has been sent to <strong>{forgotPasswordEmail}</strong>. Please click the
                      link in the email to reset your password.
                    </AlertDescription>
                  </Alert>
                  <div className="text-center space-y-3">
                    <Button
                      onClick={() => {
                        setShowForgotPassword(false)
                        setForgotPasswordSent(false)
                        setForgotPasswordEmail("")
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <Footer />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a password reset link</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="forgotEmail">Email</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    Back to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to your account to continue shopping</CardDescription>
            </CardHeader>
            <CardContent>
              {emailNotVerified && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your email is not verified. Please check your inbox for a verification email.
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-emerald-600 ml-1"
                      onClick={resendVerificationEmail}
                      disabled={isLoading}
                    >
                      Resend verification email
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm text-emerald-600 hover:text-emerald-700"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {"Don't have an account? "}
                  <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
