"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingCart } from "lucide-react"
import { useWishlist } from "@/contexts/WishlistContext"
import { useCart } from "@/contexts/CartContext"
import { useToast } from "@/contexts/ToastContext"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

export default function WishlistPage() {
  const { items, loading, removeFromWishlist } = useWishlist()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [isClient, setIsClient] = useState(false)
  const [movingToCart, setMovingToCart] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  const handleRemoveFromWishlist = async (productId: number) => {
    setRemoving(productId)
    try {
      await removeFromWishlist(productId)
    } finally {
      setRemoving(null)
    }
  }

  const handleMoveToCart = async (productId: number) => {
    setMovingToCart(productId)
    try {
      await addItem(productId, 1)
      await removeFromWishlist(productId)
      showToast("Item moved to cart", "success")
    } catch (error) {
      showToast("Failed to move item to cart", "error")
    } finally {
      setMovingToCart(null)
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
      <h1 className="text-3xl font-heading font-bold text-green-800 mb-8">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-green-800 mb-4">Your wishlist is empty</h2>
          <p className="text-green-700 mb-8">
            Add items to your wishlist to keep track of products you're interested in.
          </p>
          <Link href="/shop">
            <Button size="lg">Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50 border-b border-green-100">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Product</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Price</th>
                  <th className="py-4 px-6 text-left text-sm font-medium text-green-800">Status</th>
                  <th className="py-4 px-6 text-right text-sm font-medium text-green-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {items.map((item) => (
                  <tr key={item.wishlist_id} className="hover:bg-green-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden relative">
                          <Image
                            src={item.image_url || "/placeholder.svg?height=64&width=64"}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/products/${item.product_id}`}
                            className="hover:text-green-600 transition-colors"
                          >
                            <h3 className="font-medium text-green-800">{item.product_name}</h3>
                          </Link>
                          <p className="text-sm text-green-600">
                            Added on {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-green-800">₹{item.discount_price.toFixed(2)}</span>
                        {item.discount_price < item.price && (
                          <span className="text-sm text-gray-500 line-through">₹{item.price.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "in_stock" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.status === "in_stock" ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromWishlist(item.product_id)}
                          disabled={removing === item.product_id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {removing === item.product_id ? (
                            <LoadingSpinner size="sm" className="text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleMoveToCart(item.product_id)}
                          disabled={movingToCart === item.product_id || item.status !== "in_stock"}
                        >
                          {movingToCart === item.product_id ? (
                            <LoadingSpinner size="sm" className="text-white" />
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Add to Cart</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
