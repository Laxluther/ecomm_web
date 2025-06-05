"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import Button from "@/shared/ui/button/Button"
import Input from "@/shared/ui/input/Input"

interface Address {
  id: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  type: "home" | "work" | "other"
  isDefault: boolean
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    type: "home" as "home" | "work" | "other",
    isDefault: false,
  })

  const { user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/addresses")
      return
    }
    loadAddresses()
  }, [user, router])

  const loadAddresses = () => {
    // Mock addresses - replace with actual API call
    const mockAddresses: Address[] = [
      {
        id: "1",
        name: "John Doe",
        phone: "+91 98765 43210",
        address: "123 Green Street, Apartment 4B",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        type: "home",
        isDefault: true,
      },
      {
        id: "2",
        name: "John Doe",
        phone: "+91 98765 43210",
        address: "456 Business Park, Floor 5",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400070",
        type: "work",
        isDefault: false,
      },
    ]
    setAddresses(mockAddresses)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingAddress) {
        // Update existing address
        setAddresses((prev) => prev.map((addr) => (addr.id === editingAddress.id ? { ...addr, ...formData } : addr)))
        showToast("Address updated successfully", "success")
      } else {
        // Add new address
        const newAddress: Address = {
          id: Date.now().toString(),
          ...formData,
        }
        setAddresses((prev) => [...prev, newAddress])
        showToast("Address added successfully", "success")
      }

      setShowForm(false)
      setEditingAddress(null)
      setFormData({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        type: "home",
        isDefault: false,
      })
    } catch (error) {
      showToast("Failed to save address", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      type: address.type,
      isDefault: address.isDefault,
    })
    setShowForm(true)
  }

  const handleDelete = (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
      showToast("Address deleted successfully", "success")
    }
  }

  const handleSetDefault = (addressId: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      })),
    )
    showToast("Default address updated", "success")
  }

  const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
    "Chandigarh",
    "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
  ]

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-green-800">My Addresses</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-green-100 p-6 mb-8">
          <h2 className="text-xl font-heading font-bold text-green-800 mb-6">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
              <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required />
            </div>

            <Input label="Address" name="address" value={formData.address} onChange={handleInputChange} required />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="City" name="city" value={formData.city} onChange={handleInputChange} required />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <Input label="PIN Code" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                  Set as default address
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" loading={loading}>
                {editingAddress ? "Update Address" : "Add Address"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingAddress(null)
                  setFormData({
                    name: "",
                    phone: "",
                    address: "",
                    city: "",
                    state: "",
                    pincode: "",
                    type: "home",
                    isDefault: false,
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((address) => (
          <div key={address.id} className="bg-white rounded-lg shadow-sm border border-green-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 capitalize">{address.type}</span>
                {address.isDefault && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Default</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(address)} className="p-1 text-green-600 hover:text-green-800">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(address.id)} className="p-1 text-red-600 hover:text-red-800">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-green-700">
              <p className="font-medium">{address.name}</p>
              <p>{address.phone}</p>
              <p>{address.address}</p>
              <p>
                {address.city}, {address.state} {address.pincode}
              </p>
            </div>

            {!address.isDefault && (
              <button
                onClick={() => handleSetDefault(address.id)}
                className="mt-4 text-sm text-green-600 hover:text-green-800 font-medium"
              >
                Set as Default
              </button>
            )}
          </div>
        ))}
      </div>

      {addresses.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold text-green-800 mb-2">No addresses yet</h2>
          <p className="text-green-700 mb-6">Add your first address to get started with orders.</p>
          <Button onClick={() => setShowForm(true)}>Add Address</Button>
        </div>
      )}
    </div>
  )
}
