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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Package } from "lucide-react"
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
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Products
            </h1>
            <p className="text-slate-600 mt-2">Manage your coffee products and inventory</p>
          </div>
          <Button 
            onClick={() => router.push("/admin/products/add")}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-white to-slate-50 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5"></div>
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <Search className="h-5 w-5 mr-2 text-emerald-600" />
              Search & Filter Products
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-3 border-slate-200 focus:border-emerald-300 focus:ring-emerald-200 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <Button 
                variant="outline" 
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Products Table */}
        <Card className="relative overflow-hidden border-0 bg-white shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-emerald-600" />
                All Products ({productsData?.pagination?.total || 0})
              </CardTitle>
              <Badge variant="outline" className="text-slate-600 border-slate-200 bg-white">
                {productsData?.pagination?.page || 1} of {productsData?.pagination?.pages || 1} pages
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg animate-pulse">
                    <div className="h-16 w-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl shadow-sm"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg"></div>
                      <div className="h-3 bg-slate-200 rounded-lg w-2/3"></div>
                      <div className="h-3 bg-slate-200 rounded-lg w-1/2"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 w-20 bg-emerald-200 rounded-full"></div>
                      <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                      <TableHead className="font-semibold text-slate-900">Product</TableHead>
                      <TableHead className="font-semibold text-slate-900">Category</TableHead>
                      <TableHead className="font-semibold text-slate-900">Price</TableHead>
                      <TableHead className="font-semibold text-slate-900">Stock</TableHead>
                      <TableHead className="font-semibold text-slate-900">Status</TableHead>
                      <TableHead className="font-semibold text-slate-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsData?.products?.map((product: any, index: number) => (
                      <TableRow 
                        key={product.product_id} 
                        className="group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/50 border-b border-slate-100 transition-all duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-14 w-14 relative bg-gradient-to-br from-slate-100 to-gray-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                              {product.primary_image ? (
                                <Image
                                  src={product.primary_image}
                                  alt={product.product_name}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-gray-300 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {product.product_name}
                              </p>
                              <p className="text-sm text-slate-500 font-mono">SKU: {product.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            {product.category_name || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-900">₹{product.discount_price}</p>
                            {product.price !== product.discount_price && (
                              <p className="text-sm text-slate-500 line-through">₹{product.price}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.stock_quantity > 10 ? "default" : "destructive"}
                            className={
                              product.stock_quantity > 10 
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {product.stock_quantity} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={product.status === "active" ? "default" : "secondary"}
                              className={
                                product.status === "active" 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }
                            >
                              {product.status}
                            </Badge>
                            {product.is_featured && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-sm"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="shadow-xl border-slate-200">
                              <DropdownMenuItem onClick={() => router.push(`/product/${product.product_id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Product
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/products/${product.product_id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteClick(product)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Enhanced Pagination */}
            {productsData?.pagination && productsData.pagination.pages > 1 && (
              <div className="border-t bg-gradient-to-r from-slate-50 to-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, productsData.pagination.total)} of {productsData.pagination.total} products
                  </div>
                  <div className="flex justify-center space-x-1">
                    {[...Array(productsData.pagination.pages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                        className={
                          currentPage === i + 1 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg" 
                            : "border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                        }
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                </div>
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