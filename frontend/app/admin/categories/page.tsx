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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Package } from "lucide-react"
import { adminCategoriesAPI } from "@/lib/api"
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
  })

  const queryClient = useQueryClient()

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["admin-categories", searchQuery],
    queryFn: async () => {
      return await adminCategoriesAPI.getAll()
    },
  })

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
      toast.error(error.response?.data?.message || "Failed to add category")
    },
  })

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
      toast.error(error.response?.data?.message || "Failed to update category")
    },
  })

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
      toast.error(error.response?.data?.message || "Failed to delete category")
      setDeleteConfirmOpen(false)
    },
  })

  const resetForm = () => {
    setFormData({
      category_name: "",
      description: "",
      image_url: "",
      sort_order: 0,
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
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (category: any) => {
    setCategoryToDelete(category)
    setDeleteConfirmOpen(true)
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
                placeholder="Search categories..."
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
            <CardTitle>All Categories ({categoriesData?.categories?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
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
                  {categoriesData?.categories?.map((category: any) => (
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
                            <p className="text-sm text-gray-500">{category.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {category.product_count || 0} products
                        </Badge>
                      </TableCell>
                      <TableCell>{category.sort_order || 0}</TableCell>
                      <TableCell>
                        <Badge variant={category.status === "active" ? "default" : "secondary"}>
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Products
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(category)}
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
          <DialogContent>
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
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Enter image URL"
                  />
                </div>

                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
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
            <p>
              Are you sure you want to delete "{categoryToDelete?.category_name}"? This action cannot be undone.
              All products in this category will need to be recategorized.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteCategoryMutation.isLoading}
              >
                {deleteCategoryMutation.isLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}