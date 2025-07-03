"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Filter } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getProducts, Product } from "@/utils/api" // adjust path
import { useCart } from "@/lib/cart-context" // adjust path

export default function BeveragesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("name")
  const { addToCart } = useCart()
  const { toast } = useToast()
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const fetchBeverages = async () => {
      setIsLoading(true)
      try {
        const data = await getProducts({ category: "beverages" })
        setProducts(data.products.filter(p => p.isActive))
      } catch (error) {
        console.error("Failed to fetch beverages:", error)
        toast({
          title: "Error",
          description: "Could not load beverages.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchBeverages()
  }, [toast])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p>Loading beverages...</p>
      </div>
    )
  }

  const sorted = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "rating":
        return (b.rating ?? 0) - (a.rating ?? 0)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  const handleAdd = (product: Product) => {
    const inStock = product.stock > 0
    if (!inStock) {
      toast({
        title: "Out of stock",
        description: `${product.name} is out of stock.`,
        variant: "destructive",
      })
      return
    }
    addToCart(product.id).catch(err => {
      console.error("Add to cart failed:", err)
      toast({
        title: "Error",
        description: "Failed to add to cart.",
        variant: "destructive",
      })
    })
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Beverages</h1>
        <p className="text-gray-600 text-lg">Coffee, tea, and specialty hot drinks</p>
      </div>

      <div className="flex justify-between items-center mb-8">
        <p className="text-gray-600">{products.length} products</p>
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No beverages available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map(product => {
            let imageUrl = product.image
            if (product.image && !product.image.startsWith("http")) {
              imageUrl = `https://echoschribbie.pythonanywhere.com/uploads/${product.image}`
            }
            return (
              <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg">
                <Link href={`/product/${product.id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                </Link>
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">Beverages</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      <span className="text-sm font-medium ml-1">{product.rating ?? 0}</span>
                      <span className="text-xs text-gray-500 ml-1">({product.reviews ?? 0})</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mt-1 hover:text-amber-600 transition-colors">
                    {product.name}
                  </h3>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <span className="font-bold text-lg">KSH{product.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleAdd(product)}
                    disabled={product.stock <= 0}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      product.stock > 0
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {product.stock > 0 ? "Add to cart" : "Out of stock"}
                  </button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
