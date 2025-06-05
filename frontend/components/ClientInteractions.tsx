"use client"
import { Heart, ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useWishlist } from "@/contexts/WishlistContext"
import { useToast } from "@/contexts/ToastContext"
import { Button } from "@/components/ui/Button"

interface ClientInteractionsProps {
  productId: number
  product?: any
  showAddToCart?: boolean
}

export function ClientInteractions({ productId, product, showAddToCart }: ClientInteractionsProps) {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { showToast } = useToast()

  const handleAddToCart = async () => {
    if (!product) return
    try {
      await addToCart({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.discount_price,
        quantity: 1,
        image_url: product.primary_image,
      })
      showToast("Added to cart!", "success")
    } catch (error) {
      showToast("Failed to add to cart", "error")
    }
  }

  const handleToggleWishlist = () => {
    if (isInWishlist(productId)) {
      removeFromWishlist(productId)
      showToast("Removed from wishlist", "info")
    } else {
      addToWishlist(productId)
      showToast("Added to wishlist", "success")
    }
  }

  if (showAddToCart) {
    return (
      <Button onClick={handleAddToCart} disabled={!product?.in_stock} className="w-full" size="sm">
        <ShoppingCart className="h-4 w-4 mr-2" />
        {product?.in_stock ? "Add to Cart" : "Out of Stock"}
      </Button>
    )
  }

  return (
    <button
      onClick={handleToggleWishlist}
      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
    >
      <Heart className={`h-4 w-4 ${isInWishlist(productId) ? "text-red-500 fill-current" : "text-gray-400"}`} />
    </button>
  )
}
