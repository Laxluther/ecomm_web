"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, X, Upload } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"
import Image from "next/image"

export default function AddProductPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    price: "",
    discount_price: "",
    weight: "",
    brand: "",
    category_id: "",
    sku: "",
    stock_quantity: "",
    status: "active",
    is_featured: false,
  })

  const [images, setImages] = useState<string[]>([])

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await adminApi.get("/categories")
      return response.data
    },
  })

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.post("/products", data)
      return response.data
    },
    onSuccess: () => {
      toast.success("Product added successfully!")
      queryClient.invalidateQueries(["admin-products"])
      router.push("/admin/products")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add product")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.product_name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required")
      return
    }
    if (!formData.discount_price || Number.parseFloat(formData.discount_price) <= 0) {
      toast.error("Valid selling price is required")
      return
    }
    if (!formData.category_id) {
      toast.error("Category is required")
      return
    }
    if (!formData.stock_quantity || Number.parseInt(formData.stock_quantity) < 0) {
      toast.error("Valid stock quantity is required")
      return
    }

    const submitData = {
      ...formData,
      price: Number.parseFloat(formData.price),
      discount_price: Number.parseFloat(formData.discount_price),
      weight: formData.weight ? Number.parseFloat(formData.weight) : 0,
      category_id: Number.parseInt(formData.category_id),
      stock_quantity: Number.parseInt(formData.stock_quantity),
      images: images,
      primary_image: images[0] || "/placeholder.svg?height=300&width=300",
    }

    addProductMutation.mutate(submitData)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // In a real app, you'd upload to a file service
      // For now, we'll create placeholder URLs with file names
      const newImages = Array.from(files).map(
        (file, index) => `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(file.name.split(".")[0])}`,
      )
      setImages([...images, ...newImages])
      toast.success(`${files.length} image(s) added`)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    toast.success("Image removed")
  }

  const generateSKU = () => {
    const prefix = formData.brand ? formData.brand.substring(0, 3).toUpperCase() : "PRD"
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const sku = `${prefix}${random}`
    setFormData({ ...formData, sku })
    toast.success("SKU generated")
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Add New Product</h1>
          </div>
          <Badge variant="secondary">Draft</Badge>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Enter brand name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Enter SKU"
                      />
                      <Button type="button" variant="outline" onClick={generateSKU}>
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category_id">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData?.categories?.map((category: any) => (
                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Original Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_price">Selling Price (₹) *</Label>
                    <Input
                      id="discount_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount_price}
                      onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {formData.price &&
                  formData.discount_price &&
                  Number.parseFloat(formData.price) > Number.parseFloat(formData.discount_price) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        Savings: ₹
                        {(Number.parseFloat(formData.price) - Number.parseFloat(formData.discount_price)).toFixed(2)}(
                        {(
                          ((Number.parseFloat(formData.price) - Number.parseFloat(formData.discount_price)) /
                            Number.parseFloat(formData.price)) *
                          100
                        ).toFixed(1)}
                        % off)
                      </p>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Featured Product</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Images */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="images">Upload Images</Label>
                  <div className="mt-2">
                    <label htmlFor="images" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload images</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Uploaded Images ({images.length})</h4>
                      <Badge variant="outline">First image will be primary</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative overflow-hidden rounded-lg border">
                            <Image
                              src={image || "/placeholder.svg"}
                              alt={`Product image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {index === 0 && <Badge className="absolute bottom-2 left-2 bg-blue-600">Primary</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={addProductMutation.isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {addProductMutation.isLoading ? "Adding Product..." : "Add Product"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
