"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProduct, Product } from "@/utils/api"
import { useCart } from "@/lib/cart-context"
import { toast } from "@/hooks/use-toast"
import {
  Star,
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingCart,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProductDetail {
  id: number
  name: string
  description: string
  price: number
  rating: number
  image: string
  category: string
  stock: number
  inStock: boolean
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.id
  const productId = rawId ? Number(rawId) : NaN

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const { addToCart, getItemQuantity } = useCart()

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setError("Invalid product ID.")
      setLoading(false)
      return
    }
    setLoading(true)
    getProduct(productId)
      .then((res) => {
        const data: Product = res.product
        const mapped: ProductDetail = {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          rating: data.rating ?? 0,
          image: data.image,
          category: data.category_name,
          stock: data.stock ?? 0,
          inStock: Boolean(data.isActive !== false && (data.stock ?? 0) > 0),
        }
        setProduct(mapped)
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        setError("Product not found or failed to load.")
        toast({
          title: "Error",
          description: "Unable to load product details.",
          variant: "destructive",
        })
        setProduct(null)
      })
      .finally(() => setLoading(false))
  }, [productId])

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    setQuantity(1)
    toast({
      title: "Added to cart",
      description: `${product.name} (x${quantity}) added to cart.`,
    })
  }

  const handleShare = () => {
    if (!product) return
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard.",
      })
    }
  }

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev)
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite
        ? "Item removed from your favorites."
        : "Item added to your favorites.",
    })
  }

  const goBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-gray-500">
        Loading product...
      </div>
    )
  }
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={goBack} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Go Back
        </Button>
      </div>
    )
  }
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-4">Product not found.</p>
        <Button onClick={goBack} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Go Back
        </Button>
      </div>
    )
  }

  const currentCartQuantity = getItemQuantity(product.id)

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Go Back */}
      <Button variant="link" className="mb-6" onClick={goBack}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg">
            <img
                                src={`https://echoschribbie.pythonanywhere.com/uploads/${product.image}`|| "/placeholder.svg"}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
            {!product.inStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <Badge className="mb-2 bg-amber-100 text-amber-800 uppercase">
            {product.category.replace("-", " ")}
          </Badge>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? "fill-amber-500 text-amber-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 font-medium">{product.rating.toFixed(1)}</span>
              {/* <span className="text-gray-500 ml-1">({product.reviews} reviews)</span> */}
            </div>
          </div>

          <p className="text-2xl font-bold text-amber-600">
            KSH:{product.price.toFixed(2)}
          </p>
          <p className="text-gray-700 leading-relaxed">{product.description}</p>

          <div className="flex items-center space-x-2">
            {product.inStock ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">
                  In Stock ({product.stock} available)
                </span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-medium">Out of Stock</span>
              </>
            )}
          </div>

          {product.inStock && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {currentCartQuantity > 0 && (
                  <span className="text-sm text-gray-600">
                    ({currentCartQuantity} in cart)
                  </span>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart - KSH{(product.price * quantity).toFixed(2)}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleFavorite}
                  className={isFavorite ? "text-red-500 border-red-500" : ""}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500" : ""}`} />
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optionally: you could include recommendations or related products here */}
    </div>
  )
}
