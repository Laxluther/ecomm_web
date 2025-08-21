"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { Eye, EyeOff, Check, X, Mail, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    referralCode: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean | null
    message: string
    referrerName?: string
  }>({ isValid: null, message: "" })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralValidation({ isValid: null, message: "" })
      return
    }

    try {
      const response = await api.post("/referrals/validate", { code })
      setReferralValidation({
        isValid: true,
        message: response.data.message,
        referrerName: response.data.referrer_name,
      })
    } catch (error: any) {
      setReferralValidation({
        isValid: false,
        message: error.response?.data?.message || "Invalid referral code",
      })
    }
  }

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    setFormData((prev) => ({ ...prev, referralCode: code }))

    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateReferralCode(code)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await api.post("/auth/register", {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        referral_code: formData.referralCode || undefined,
      })

      setUserEmail(formData.email)
      setRegistrationSuccess(true)
      toast.success("Registration successful! Please check your email to verify your account.")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true)
      await api.post("/auth/resend-verification", { email: userEmail })
      toast.success("Verification email sent! Please check your inbox.")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend verification email")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-redirect to login after successful registration with countdown
  useEffect(() => {
    if (registrationSuccess) {
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            router.push('/login?message=Please check your email to verify your account')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [registrationSuccess, router])

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-600">Check Your Email</CardTitle>
                <CardDescription>We've sent a verification link to your email address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    A verification email has been sent to <strong>{userEmail}</strong>. Please click the link in the
                    email to verify your account.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    Didn't receive the email? Check your spam folder or click below to resend.
                  </p>

                  <Button onClick={resendVerificationEmail} variant="outline" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>

                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">
                      Redirecting to login in {redirectCountdown} seconds...
                    </p>
                    <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Go to Login Now
                    </Link>
                  </div>
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
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>Join us and start shopping premium natural products</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
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

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="referralCode"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleReferralCodeChange}
                      placeholder="Enter referral code"
                    />
                    {referralValidation.isValid !== null && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {referralValidation.isValid ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {referralValidation.message && (
                    <p className={`text-sm mt-1 ${referralValidation.isValid ? "text-green-600" : "text-red-600"}`}>
                      {referralValidation.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                    Sign in
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
