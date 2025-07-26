"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Package, Upload, ExternalLink } from "lucide-react"
import { adminCategoriesAPI } from "@/lib/api"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function AdminCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null)
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    image_url: "",
    sort_order: 0,
    status: "active",
  })

  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["admin-categories", searchQuery],
    queryFn: async () => {
      return await adminCategoriesAPI.getAll()
    },
  })

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return await adminCategoriesAPI.add(categoryData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      toast.success("Category added successfully!")
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to add category")
    },
  })

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await adminCategoriesAPI.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      toast.success("Category updated successfully!")
      setIsDialogOpen(false)
      setEditingCategory(null)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update category")
    },
  })

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      return await adminCategoriesAPI.delete(categoryId)
    },
    onSuccess: () => {
      toast.success("Category deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      setDeleteConfirmOpen(false)
      setCategoryToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete category")
      setDeleteConfirmOpen(false)
    },
  })

  const resetForm = () => {
    setFormData({
      category_name: "",
      description: "",
      image_url: "",
      sort_order: 0,
      status: "active",
    })
    setEditingCategory(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      category_name: category.category_name || "",
      description: category.description || "",
      image_url: category.image_url || "",
      sort_order: category.sort_order || 0,
      status: category.status || "active",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (category: any) => {
    setCategoryToDelete(category)
    setDeleteConfirmOpen(true)
  }

  const handleViewProducts = (category: any) => {
    router.push(`/admin/products?category=${category.category_id}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category_name.trim()) {
      toast.error("Category name is required")
      return
    }

    const submitData = {
      ...formData,
      sort_order: parseInt(formData.sort_order.toString()) || 0,
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.category_id, data: submitData })
    } else {
      addCategoryMutation.mutate(submitData)
    }
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.category_id)
    }
  }

  // Filter categories based on search
  const filteredCategories = categoriesData?.categories?.filter((category: any) => 
    category.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Categories</h1>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories ({filteredCategories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery ? "No categories found matching your search." : "No categories yet. Add your first category!"}
                </p>
                {!searchQuery && (
                  <Button onClick={handleAdd} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category: any) => (
                    <TableRow key={category.category_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 relative bg-gray-100 rounded-lg overflow-hidden">
                            {category.image_url ? (
                              <Image
                                src={category.image_url}
                                alt={category.category_name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{category.category_name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {category.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {category.product_count || 0} products
                          </Badge>
                          {(category.product_count || 0) > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProducts(category)}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.sort_order || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            category.status === "active" 
                              ? "default" 
                              : category.status === "inactive" 
                              ? "secondary" 
                              : "destructive"
                          }
                        >
                          {category.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(category.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProducts(category)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Products ({category.product_count || 0})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(category)}
                              disabled={(category.product_count || 0) > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category_name">Category Name *</Label>
                  <Input
                    id="category_name"
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-2">Image preview:</p>
                      <div className="h-20 w-20 relative bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={formData.image_url}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                    />
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addCategoryMutation.isLoading || updateCategoryMutation.isLoading}
                >
                  {addCategoryMutation.isLoading || updateCategoryMutation.isLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete "<strong>{categoryToDelete?.category_name}</strong>"?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Package className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Notes:
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>This action cannot be undone</li>
                        <li>Products in this category will need to be recategorized</li>
                        <li>Category with products cannot be deleted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {(categoryToDelete?.product_count || 0) > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Cannot delete:</strong> This category contains {categoryToDelete.product_count} products. 
                    Please move or delete the products first.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteCategoryMutation.isLoading || (categoryToDelete?.product_count || 0) > 0}
              >
                {deleteCategoryMutation.isLoading ? "Deleting..." : "Delete Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}