"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Phone, MapPin, Edit2, Save } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface UserProfile {
  user_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  date_joined: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  })

  const { user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile")
      return
    }

    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.getUserProfile()
      if (response.data?.profile) {
        setProfile(response.data.profile)
        setFormData({
          first_name: response.data.profile.first_name,
          last_name: response.data.profile.last_name,
          phone: response.data.profile.phone,
        })
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
      showToast("Failed to load profile", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await api.updateUserProfile(formData)
      if (response.data?.message) {
        showToast(response.data.message, "success")
        setEditing(false)
        loadProfile()
      } else if (response.error) {
        showToast(response.error, "error")
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      showToast("Failed to update profile", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-16 min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-heading font-bold text-green-800 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-green-50 border-b border-green-100 flex justify-between items-center">
              <h2 className="text-xl font-heading font-bold text-green-800">Personal Information</h2>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-green-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-green-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-green-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-green-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profile?.email || ""}
                    className="w-full px-4 py-2 bg-gray-50 border border-green-200 rounded-lg text-gray-500"
                    disabled
                  />
                  <p className="mt-1 text-xs text-green-600">Email address cannot be changed</p>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-start space-x-4">
                  <User className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-600">Full Name</h3>
                    <p className="text-green-800 font-medium">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-600">Email Address</h3>
                    <p className="text-green-800 font-medium">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-600">Phone Number</h3>
                    <p className="text-green-800 font-medium">{profile?.phone || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-5 w-5 flex items-center justify-center text-green-600 mt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-600">Member Since</h3>
                    <p className="text-green-800 font-medium">
                      {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-xl font-heading font-bold text-green-800">Addresses</h2>
            </div>
            <p className="text-green-700 mb-4">Manage your shipping and billing addresses</p>
            <Button variant="outline" className="w-full" onClick={() => router.push("/addresses")}>
              Manage Addresses
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-heading font-bold text-green-800 mb-4">Account Security</h2>
            <p className="text-green-700 mb-4">Update your password and security settings</p>
            <Button variant="outline" className="w-full" onClick={() => router.push("/change-password")}>
              Change Password
            </Button>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-heading font-bold text-green-800 mb-2">Need Help?</h3>
            <p className="text-green-700 mb-4">
              If you have any questions about your account, please contact our customer support.
            </p>
            <Button variant="outline" className="w-full" onClick={() => router.push("/contact")}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
