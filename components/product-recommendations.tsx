"use client"

import { useState, useEffect } from "react"
import { Star, Plus } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AddToCartButton from "@/components/add-to-cart-button"
import { useCart } from "@/lib/cart-context"

interface Product {
  id: number
  name: string
  description: string
  price: number
  rating: number
  reviews: number
  image: string
  category: string
}

interface ProductRecommendationsProps {
  currentProduct?: Product
  currentCategory?: string
  type: "related" | "frequently-bought" | "recently-viewed" | "trending"
  title?: string
  maxItems?: number
  showAddAll?: boolean
}

// Mock product database
const allProducts: Product[] = [
  // Pastries
  {
    id: 1,
    name: "Chocolate Croissant",
    description: "Buttery croissant filled with rich chocolate",
    price: 4.99,
    rating: 4.8,
    reviews: 124,
    image: "/images/product-chocolate-croissant.jpg",
    category: "pastries",
  },
  {
    id: 2,
    name: "Blueberry Muffin",
    description: "Packed with fresh blueberries",
    price: 3.99,
    rating: 4.7,
    reviews: 64,
    image: "/images/product-blueberry-muffin.jpg",
    category: "pastries",
  },
  {
    id: 3,
    name: "Artisan Sourdough",
    description: "Naturally fermented with our house starter",
    price: 7.99,
    rating: 4.7,
    reviews: 56,
    image: "/images/product-sourdough.jpg",
    category: "pastries",
  },
  {
    id: 4,
    name: "Almond Danish",
    description: "Flaky pastry with sweet almond filling",
    price: 5.49,
    rating: 4.7,
    reviews: 89,
    image: "/images/product-almond-danish.jpg",
    category: "pastries",
  },
  {
    id: 5,
    name: "Cinnamon Roll",
    description: "Warm cinnamon roll with cream cheese glaze",
    price: 4.49,
    rating: 4.9,
    reviews: 112,
    image: "/images/product-cinnamon-roll.jpg",
    category: "pastries",
  },

  // Cakes
  {
    id: 21,
    name: "Red Velvet Cake",
    description: "Classic red velvet with cream cheese frosting",
    price: 32.99,
    rating: 4.9,
    reviews: 87,
    image: "/images/product-red-velvet.jpg",
    category: "cakes",
  },
  {
    id: 22,
    name: "Chocolate Fudge Cake",
    description: "Rich chocolate cake with fudge frosting",
    price: 29.99,
    rating: 4.8,
    reviews: 156,
    image: "/images/product-chocolate-fudge.jpg",
    category: "cakes",
  },
  {
    id: 23,
    name: "Vanilla Birthday Cake",
    description: "Classic vanilla cake perfect for celebrations",
    price: 28.99,
    rating: 4.7,
    reviews: 203,
    image: "/images/product-vanilla-birthday.jpg",
    category: "cakes",
  },

  // Beverages
  {
    id: 31,
    name: "Chai Tea Latte",
    description: "Spiced chai with steamed milk",
    price: 4.99,
    rating: 4.8,
    reviews: 47,
    image: "/images/product-chai-latte.jpg",
    category: "beverages",
  },
  {
    id: 32,
    name: "Cappuccino",
    description: "Rich espresso with steamed milk foam",
    price: 4.49,
    rating: 4.7,
    reviews: 89,
    image: "/images/product-cappuccino.jpg",
    category: "beverages",
  },
  {
    id: 33,
    name: "Hot Chocolate",
    description: "Rich chocolate drink with whipped cream",
    price: 3.99,
    rating: 4.9,
    reviews: 124,
    image: "/images/product-hot-chocolate.jpg",
    category: "beverages",
  },

  // Cold Drinks
  {
    id: 41,
    name: "Iced Caramel Latte",
    description: "Espresso with caramel and cold milk",
    price: 5.49,
    rating: 4.6,
    reviews: 38,
    image: "/images/product-iced-caramel-latte.jpg",
    category: "cold-drinks",
  },
  {
    id: 42,
    name: "Strawberry Smoothie",
    description: "Fresh strawberries blended with yogurt",
    price: 6.49,
    rating: 4.8,
    reviews: 67,
    image: "/images/product-strawberry-smoothie.jpg",
    category: "cold-drinks",
  },
  {
    id: 43,
    name: "Iced Coffee",
    description: "Cold brew coffee served over ice",
    price: 3.99,
    rating: 4.5,
    reviews: 92,
    image: "/images/product-iced-coffee.jpg",
    category: "cold-drinks",
  },

  // Creamery
  {
    id: 51,
    name: "Fresh Cream Cheese",
    description: "Locally sourced cream cheese",
    price: 8.99,
    rating: 4.8,
    reviews: 29,
    image: "/images/product-cream-cheese.jpg",
    category: "creamery",
  },
  {
    id: 52,
    name: "Artisan Butter",
    description: "Churned fresh daily from local cream",
    price: 12.99,
    rating: 4.9,
    reviews: 45,
    image: "/images/product-artisan-butter.jpg",
    category: "creamery",
  },

  // Ice Cream
  {
    id: 61,
    name: "Vanilla Bean Ice Cream",
    description: "Made with Madagascar vanilla beans",
    price: 6.99,
    rating: 4.9,
    reviews: 42,
    image: "/images/product-vanilla-ice-cream.jpg",
    category: "ice-cream",
  },
  {
    id: 62,
    name: "Chocolate Chip Ice Cream",
    description: "Rich chocolate ice cream with chocolate chips",
    price: 7.49,
    rating: 4.8,
    reviews: 67,
    image: "/images/product-chocolate-chip-ice-cream.jpg",
    category: "ice-cream",
  },
]

// Mock recommendation rules
const recommendationRules = {
  // Products frequently bought together
  frequentlyBought: {
    1: [31, 32, 33], // Chocolate Croissant -> Coffee/Tea
    2: [31, 32, 41], // Blueberry Muffin -> Coffee/Tea
    21: [31, 61, 62], // Red Velvet Cake -> Coffee + Ice Cream
    22: [33, 61, 62], // Chocolate Cake -> Hot Chocolate + Ice Cream
    31: [1, 2, 3], // Chai Latte -> Pastries
    32: [1, 2, 4], // Cappuccino -> Pastries
    41: [2, 42, 43], // Iced Caramel Latte -> Cold items
    51: [3, 21, 22], // Cream Cheese -> Bread/Cakes
    61: [21, 22, 23], // Ice Cream -> Cakes
  },

  // Category-based related products
  related: {
    pastries: [1, 2, 3, 4, 5],
    cakes: [21, 22, 23],
    beverages: [31, 32, 33],
    "cold-drinks": [41, 42, 43],
    creamery: [51, 52],
    "ice-cream": [61, 62],
  },
}

export default function ProductRecommendations({
  currentProduct,
  currentCategory,
  type,
  title,
  maxItems = 4,
  showAddAll = false,
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    generateRecommendations()
  }, [currentProduct, currentCategory, type])

  const generateRecommendations = () => {
    setIsLoading(true)

    // Simulate API delay
    setTimeout(() => {
      let recommendedIds: number[] = []

      switch (type) {
        case "frequently-bought":
          if (currentProduct) {
            recommendedIds =
              recommendationRules.frequentlyBought[
                currentProduct.id as keyof typeof recommendationRules.frequentlyBought
              ] || []
          }
          break

        case "related":
          if (currentCategory) {
            const categoryProducts =
              recommendationRules.related[currentCategory as keyof typeof recommendationRules.related] || []
            recommendedIds = categoryProducts.filter((id) => id !== currentProduct?.id)
          } else if (currentProduct) {
            const categoryProducts =
              recommendationRules.related[currentProduct.category as keyof typeof recommendationRules.related] || []
            recommendedIds = categoryProducts.filter((id) => id !== currentProduct.id)
          }
          break

        case "trending":
          // Get highest rated products
          recommendedIds = allProducts
            .sort((a, b) => b.rating - a.rating)
            .slice(0, maxItems * 2)
            .map((p) => p.id)
          break

        case "recently-viewed":
          // Mock recently viewed (in real app, this would come from localStorage/session)
          recommendedIds = [1, 21, 31, 41, 51, 61].slice(0, maxItems)
          break
      }

      // Get product details and shuffle for variety
      const recommendedProducts = recommendedIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter(Boolean) as Product[]

      // Shuffle and limit results
      const shuffled = recommendedProducts.sort(() => Math.random() - 0.5)
      setRecommendations(shuffled.slice(0, maxItems))
      setIsLoading(false)
    }, 500)
  }

  const addAllToCart = () => {
    recommendations.forEach((product) => {
      addToCart(product)
    })
  }

  const getDefaultTitle = () => {
    switch (type) {
      case "frequently-bought":
        return "Frequently Bought Together"
      case "related":
        return "You Might Also Like"
      case "trending":
        return "Trending Now"
      case "recently-viewed":
        return "Recently Viewed"
      default:
        return "Recommended for You"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title || getDefaultTitle()}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: maxItems }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-3 rounded mb-2"></div>
              <div className="bg-gray-200 h-6 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title || getDefaultTitle()}</h3>
        {showAddAll && recommendations.length > 1 && (
          <Button variant="outline" onClick={addAllToCart} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add All to Cart
          </Button>
        )}
      </div>

      {type === "frequently-bought" && recommendations.length > 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-amber-800">Bundle Deal</h4>
              <p className="text-sm text-amber-600">
                Buy these {recommendations.length + 1} items together and save 10%
              </p>
            </div>
            <Badge className="bg-amber-500 text-white">
              Save ${(recommendations.reduce((sum, p) => sum + p.price, currentProduct?.price || 0) * 0.1).toFixed(2)}
            </Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg">
            <div className="relative h-40 overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-start">
                <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                  {product.category.replace("-", " ")}
                </span>
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-medium ml-1">{product.rating}</span>
                </div>
              </div>
              <h4 className="font-medium text-sm mt-1 line-clamp-2">{product.name}</h4>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <p className="text-gray-600 text-xs line-clamp-2">{product.description}</p>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-between items-center">
              <span className="font-bold text-sm">${product.price.toFixed(2)}</span>
              <AddToCartButton product={product} size="sm" />
            </CardFooter>
          </Card>
        ))}
      </div>

      {type === "frequently-bought" && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            {Math.floor(Math.random() * 50) + 20}% of customers who bought this item also purchased these products
          </p>
        </div>
      )}
    </div>
  )
}
