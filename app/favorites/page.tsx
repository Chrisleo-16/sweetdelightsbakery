"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

interface FavoriteItem {
  id: number
  name: string
  price: number
  image: string
  category: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    {
      id: 1,
      name: "Chocolate Croissant",
      price: 4.99,
      image: "/images/product-chocolate-croissant.jpg",
      category: "pastries",
    },
    {
      id: 2,
      name: "Red Velvet Cake",
      price: 32.99,
      image: "/images/product-red-velvet.jpg",
      category: "cakes",
    },
    {
      id: 3,
      name: "Vanilla Bean Ice Cream",
      price: 6.99,
      image: "/images/product-vanilla-ice-cream.jpg",
      category: "ice-cream",
    },
  ])

  const removeFavorite = (id: number) => {
    setFavorites(favorites.filter((item) => item.id !== id))
    toast({
      title: "Removed from favorites",
      description: "The item has been removed from your favorites.",
    })
  }

  const addToCart = (item: FavoriteItem) => {
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Your Favorites</h1>
        <p className="text-gray-600 text-lg">Items you've saved for later</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">No favorites yet</h2>
          <p className="text-gray-600 mb-8">Start browsing and save items you love!</p>
          <Link href="/products">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((item) => (
            <Card key={item.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
                <button
                  onClick={() => removeFavorite(item.id)}
                  className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
              <CardHeader className="p-4 pb-0">
                <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                  {item.category.replace("-", " ")}
                </span>
                <h3 className="font-bold text-lg mt-1">{item.name}</h3>
              </CardHeader>
              <CardFooter className="p-4 pt-2 flex justify-between items-center">
                <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => addToCart(item)}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
