"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Plus, Minus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { getProduct, GetProductResponse } from "@/utils/api"

interface AddToCartButtonProps {
  product: {
    id: number
    name: string
    price: number
    image: string
    category: string
  }
  size?: "sm" | "md" | "lg"
  variant?: "default" | "outline" | "ghost"
  showQuantity?: boolean
}

export default function AddToCartButton({
  product,
  size = "md",
  variant = "default",
  showQuantity = false,
}: AddToCartButtonProps) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [stock, setStock] = useState<number | null>(null)
  const currentQuantity = getItemQuantity(product.id)

  // Fetch up-to-date stock on mount and when product.id changes
  useEffect(() => {
    let cancelled = false
    const fetchStock = async () => {
      try {
        const res: GetProductResponse = await getProduct(product.id)
        if (!cancelled) {
          setStock(res.product.stock)
        }
      } catch (err) {
        console.error("Failed to fetch product stock:", err)
        // In case of error, leave stock as null
      }
    }
    fetchStock()
    return () => {
      cancelled = true
    }
  }, [product.id])

  // After adding to cart, re-fetch stock to update button state
  const refreshStock = async () => {
    try {
      const res: GetProductResponse = await getProduct(product.id)
      setStock(res.product.stock)
    } catch (err) {
      console.error("Failed to refresh stock:", err)
    }
  }

  const handleAddToCart = async () => {
    if (stock !== null && stock <= 0) {
      // Out of stock
      return
    }
    setIsAdding(true)
    try {
      await addToCart(product.id)
      // After adding, refresh stock
      await refreshStock()
    } catch (err) {
      console.error("Error in addToCart:", err)
    } finally {
      // Brief animation delay
      setTimeout(() => {
        setIsAdding(false)
      }, 500)
    }
  }

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0) return
    const difference = newQuantity - currentQuantity

    if (difference > 0) {
      // Attempt to add more: check if stock sufficient
      if (stock !== null && stock >= difference) {
        updateQuantity(product.id, newQuantity)
        // After updating quantity, refresh stock
        await refreshStock()
      }
    } else if (difference < 0) {
      // Reducing quantity in cart
      updateQuantity(product.id, newQuantity)
      // After reducing, re-fetch stock in case backend has updated or to show correct stock
      await refreshStock()
    }
  }

  // If stock is still loading, disable
  const isOutOfStock = stock !== null ? stock <= 0 : false

  // While fetching stock (stock === null), we can show loading or assume in stock
  const disableButton = isAdding || (stock !== null && stock <= 0)

  // If showQuantity is true and item in cart
  if (showQuantity && currentQuantity > 0) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuantityChange(currentQuantity - 1)}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="min-w-[2rem] text-center font-medium">{currentQuantity}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuantityChange(currentQuantity + 1)}
          className="h-8 w-8 p-0"
          disabled={stock !== null && stock <= 0}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  // If out of stock, show disabled button
  if (stock !== null && stock <= 0) {
    return (
      <Button size={size} variant="outline" disabled className="text-gray-400">
        Out of Stock
      </Button>
    )
  }

  // Default "Add to Cart" button
  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleAddToCart}
      disabled={disableButton}
      className={`${variant === "default" ? "bg-amber-500 hover:bg-amber-600" : ""} transition-all duration-200`}
    >
      {isAdding ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
