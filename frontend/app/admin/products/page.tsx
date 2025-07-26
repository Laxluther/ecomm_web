"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { adminProductsAPI } from "@/lib/api"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-products", currentPage, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("per_page", "20")
      if (searchQuery) params.append("search", searchQuery)

      const response = await adminProductsAPI.getAll({
        page: currentPage,
        per_page: 20,
        search: searchQuery || undefined
      })
      return response
    },
  })

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await adminProductsAPI.delete(productId)
    },
    onSuccess: () => {
      toast.success("Product deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["admin-products"] })
      setDeleteConfirmOpen(false)
      setProductToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product")
      setDeleteConfirmOpen(false)
    },
  })

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.product_id)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setProductToDelete(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>
          <Button onClick={() => router.push("/admin/products/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products ({productsData?.pagination?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <div className="h-16 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData?.products?.map((product: any) => (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 relative bg-gray-100 rounded-lg overflow-hidden">
                            {product.primary_image ? (
                              <Image
                                src={product.primary_image}
                                alt={product.product_name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-400">No image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category_name || "N/A"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">₹{product.discount_price}</p>
                          {product.price !== product.discount_price && (
                            <p className="text-sm text-gray-500 line-through">₹{product.price}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.stock_quantity > 10 ? "default" : "destructive"}>
                          {product.stock_quantity} units
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                        {product.is_featured && (
                          <Badge variant="outline" className="ml-1">
                            Featured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/product/${product.product_id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.product_id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteClick(product)}
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

            {/* Pagination */}
            {productsData?.pagination && productsData.pagination.pages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {[...Array(productsData.pagination.pages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{productToDelete?.product_name}"? This action cannot be undone.
                The product will be removed from all carts and wishlists.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={deleteProductMutation.isLoading}
              >
                {deleteProductMutation.isLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}