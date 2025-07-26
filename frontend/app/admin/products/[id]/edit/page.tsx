"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Save, X, Upload, Trash2 } from "lucide-react"
import { adminProductsAPI, adminCategoriesAPI } from "@/lib/api"
import toast from "react-hot-toast"
import Image from "next/image"

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const productId = parseInt(params.id as string)

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Fetch product data
  const { data: productData, isLoading } = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: async () => {
      return await adminProductsAPI.getById(productId)
    },
    enabled: !!productId,
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      return await adminCategoriesAPI.getAll()
    },
  })

  // Update form data when product data is loaded
  useEffect(() => {
    if (productData?.product) {
      const product = productData.product
      setFormData({
        product_name: product.product_name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        discount_price: product.discount_price?.toString() || "",
        weight: product.weight?.toString() || "",
        brand: product.brand || "",
        category_id: product.category_id?.toString() || "",
        sku: product.sku || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        status: product.status || "active",
        is_featured: product.is_featured || false,
      })
      setImages(productData.images?.map((img: any) => img.image_url) || [])
    }
  }, [productData])

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await adminProductsAPI.update(productId, data)
    },
    onSuccess: () => {
      toast.success("Product updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["admin-products"] })
      queryClient.invalidateQueries({ queryKey: ["admin-product", productId] })
      router.push("/admin/products")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update product")
    },
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      return await adminProductsAPI.delete(productId)
    },
    onSuccess: () => {
      toast.success("Product deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["admin-products"] })
      router.push("/admin/products")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product")
      setDeleteConfirmOpen(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.product_name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required")
      return
    }
    if (!formData.discount_price || parseFloat(formData.discount_price) <= 0) {
      toast.error("Valid selling price is required")
      return
    }
    if (!formData.category_id) {
      toast.error("Category is required")
      return
    }

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      discount_price: parseFloat(formData.discount_price),
      weight: formData.weight ? parseFloat(formData.weight) : 0,
      category_id: parseInt(formData.category_id),
      stock_quantity: parseInt(formData.stock_quantity) || 0,
    }

    updateProductMutation.mutate(submitData)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      try {
        for (const file of Array.from(files)) {
          const formData = new FormData()
          formData.append("image", file)
          formData.append("is_primary", "false")
          formData.append("alt_text", file.name)

          await adminProductsAPI.uploadImage(productId, formData)
        }
        
        toast.success("Images uploaded successfully!")
        queryClient.invalidateQueries({ queryKey: ["admin-product", productId] })
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to upload images")
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleDeleteProduct = () => {
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    deleteProductMutation.mutate()
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </AdminLayout>
    )
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
            <h1 className="text-3xl font-bold">Edit Product</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={formData.status === "active" ? "default" : "secondary"}>
              {formData.status}
            </Badge>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
              disabled={deleteProductMutation.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Product Details */}
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
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
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
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount_price">Selling Price (₹) *</Label>
                      <Input
                        id="discount_price"
                        type="number"
                        step="0.01"
                        value={formData.discount_price}
                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock_quantity">Stock Quantity</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

            {/* Right Column - Images */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="images">Upload Images</Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mt-1"
                    />
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={image}
                              alt={`Product image ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="200px"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProductMutation.isLoading}
                >
                  {updateProductMutation.isLoading ? (
                    <>Updating...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{formData.product_name}"? This action cannot be undone.
                The product will be removed from all carts, wishlists, and orders.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteProductMutation.isLoading}
              >
                {deleteProductMutation.isLoading ? "Deleting..." : "Delete Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}