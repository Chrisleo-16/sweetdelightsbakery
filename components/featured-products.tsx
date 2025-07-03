"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getProducts, Product } from "@/utils/api" // adjust path if needed
import { useCart } from "@/lib/cart-context" // adjust path if needed

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addToCart } = useCart()
  const { toast } = useToast()
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

useEffect(() => {
  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const data = await getProducts(); // fetch all products
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({
        title: "Error",
        description: "Could not load featured products.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  fetchAll();
}, [toast]);

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p>Loading featured products...</p>
        </div>
      </section>
    )
  }

  // Filter active & in-stock, then top-rated 4
  const featuredProductsList = products
    .filter(p => p.isActive && p.stock > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 4)

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Featured Products</h2>
          <div className="w-20 h-1 bg-amber-500 mb-6"></div>
          <p className="text-gray-600 text-center max-w-2xl">Our most popular items loved by customers</p>
        </div>

        {featuredProductsList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No featured products to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {featuredProductsList.map(product => {
              const inStock = product.stock > 0
              let imageUrl = product.image
              if (product.image && !product.image.startsWith("http")) {
                imageUrl = `https://echoschribbie.pythonanywhere.com/uploads/${product.image}`
              }

              const handleAdd = () => {
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

              // Display category name: prefer category_name if present
              const categoryLabel = product.category_name || product.category

              return (
                <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg">
                  <Link href={`/product/${product.id}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  </Link>
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <Link href={`/category/${encodeURIComponent(categoryLabel)}`}>
                        <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                          {categoryLabel}
                        </span>
                      </Link>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-medium ml-1">{product.rating ?? 0}</span>
                        <span className="text-xs text-gray-500 ml-1">({product.reviews ?? 0})</span>
                      </div>
                    </div>
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-bold text-lg mt-1 hover:text-amber-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                  </CardContent>
                  <CardFooter className="p-3 pt-0 flex justify-between items-center">
                    <span className="font-bold text-lg">KSH{product.price.toFixed(2)}</span>
                    <button
                      onClick={handleAdd}
                      disabled={!inStock}
                      className={`px-3 py-1 text-sm rounded-md transition ${
                        inStock
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {inStock ? "Add to cart" : "Out of stock"}
                    </button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Link href="/products">
            <button className="px-6 py-3 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-md transition-colors">
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
