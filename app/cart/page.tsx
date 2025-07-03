"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trash2, Plus, Minus, ArrowRight, Tag, ShoppingBag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCart } from "@/lib/cart-context"

interface PromoCode {
  code: string
  type: "percentage" | "fixed"
  value: number
  minOrder?: number
}

export default function CartPage() {
  const router = useRouter()
  const { state, updateQuantity, removeFromCart, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState("")
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Available promo codes (in a real app, these come from a database)
  const availablePromoCodes: PromoCode[] = [
    { code: "WELCOME10", type: "percentage", value: 10 },
    { code: "SAVE20", type: "percentage", value: 20, minOrder: 50 },
    { code: "FREESHIP", type: "fixed", value: 5.99 },
    { code: "SWEET5", type: "fixed", value: 5 },
  ]

  const applyPromoCode = () => {
    setIsApplyingPromo(true)
    setPromoError(null)

    setTimeout(() => {
      const foundPromo = availablePromoCodes.find(
        (promo) => promo.code.toLowerCase() === promoCode.toLowerCase()
      )

      if (!foundPromo) {
        setPromoError("Invalid promo code. Please try another code.")
        setIsApplyingPromo(false)
        return
      }

      // Check minimum order: convert state.total to number
      const totalNum = Number(state.total)
      if (foundPromo.minOrder && totalNum < foundPromo.minOrder) {
        setPromoError(
          `This promo code requires a minimum order of KSH${foundPromo.minOrder.toFixed(2)}`
        )
        setIsApplyingPromo(false)
        return
      }

      setAppliedPromo(foundPromo)
      toast({
        title: "Promo code applied!",
        description:
          foundPromo.type === "percentage"
            ? `${foundPromo.value}% discount applied to your order.`
            : `KSH${foundPromo.value.toFixed(2)} discount applied to your order.`,
      })
      setIsApplyingPromo(false)
    }, 1000)
  }

  const removePromoCode = () => {
    setAppliedPromo(null)
    setPromoCode("")
    setPromoError(null)
    toast({
      title: "Promo code removed",
      description: "The promo code has been removed from your order.",
    })
  }

  const handleProceedToCheckout = () => {
    setIsCheckingOut(true)
    const isLoggedIn = false // replace with real auth check

    if (!isLoggedIn) {
      setShowLoginDialog(true)
      setIsCheckingOut(false)
      return
    }
    proceedToCheckout()
  }

  const proceedToCheckout = () => {
    setTimeout(() => {
      let checkoutUrl = "/checkout"
      if (appliedPromo) {
        checkoutUrl += `?promo=${appliedPromo.code}`
      }
      router.push(checkoutUrl)
      setIsCheckingOut(false)
    }, 500)
  }

  const proceedAsGuest = () => {
    setShowLoginDialog(false)
    proceedToCheckout()
  }

  // Calculate discount amount
  const totalNum = Number(state.total) || 0
  const discountAmount = appliedPromo
    ? appliedPromo.type === "percentage"
      ? (totalNum * appliedPromo.value) / 100
      : appliedPromo.value
    : 0

  const shipping = 0.0
  const discountedSubtotal = totalNum - discountAmount
  const tax = discountedSubtotal * 0.00 // 8% tax
  const total = discountedSubtotal + shipping + tax

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      {state.items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link href="/products">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Cart Items and Promo */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Shopping Cart</h2>
                <div className="divide-y divide-gray-200">
                  {state.items.map((item) => {
                    // Ensure price is numeric
                    const priceNum = Number(item.price)
                    const quantityNum = Number(item.quantity) || 0
                    const lineTotal = priceNum * quantityNum
                    return (
                      <div key={item.id} className="py-6 flex flex-col sm:flex-row">
                        <div className="flex-shrink-0 w-full sm:w-24 h-24 mb-4 sm:mb-0">
                          <img
                            src={
                              item.image
                                ? `https://echoschribbie.pythonanywhere.com/uploads/${item.image}`
                                : "/placeholder.svg"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-grow sm:ml-6 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between">
                              <h3 className="text-lg font-medium">{item.name}</h3>
                              {isNaN(lineTotal) ? (
                                <p className="font-semibold text-red-500">Invalid price</p>
                              ) : (
                                <p className="font-semibold">KSH{lineTotal.toFixed(2)}</p>
                              )}
                            </div>
                            {isNaN(priceNum) ? (
                              <p className="text-red-500 mt-1">Invalid price</p>
                            ) : (
                              <p className="text-gray-600 mt-1">KSH{priceNum.toFixed(2)} each</p>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center border rounded-md">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-3 py-1">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Have a promo code?</h2>

                {appliedPromo ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="font-medium text-green-800">{appliedPromo.code}</p>
                          <p className="text-sm text-green-600">
                            {appliedPromo.type === "percentage"
                              ? `${appliedPromo.value}% off your order`
                              : `KSH${appliedPromo.value.toFixed(2)} off your order`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removePromoCode}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="flex">
                      <Input
                        type="text"
                        placeholder="Enter another promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="rounded-r-none"
                      />
                      <Button
                        onClick={applyPromoCode}
                        disabled={!promoCode || isApplyingPromo}
                        className="rounded-l-none bg-amber-500 hover:bg-amber-600"
                      >
                        {isApplyingPromo ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex">
                      <Input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="rounded-r-none"
                      />
                      <Button
                        onClick={applyPromoCode}
                        disabled={!promoCode || isApplyingPromo}
                        className="rounded-l-none bg-amber-500 hover:bg-amber-600"
                      >
                        {isApplyingPromo ? "Applying..." : "Apply"}
                      </Button>
                    </div>

                    {promoError && (
                      <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
                        <AlertDescription>{promoError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="text-sm text-gray-600">
                      <p>Available promo codes:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>
                          Use <span className="font-medium">WELCOME10</span> for 10% off your first order
                        </li>
                        <li>
                          Use <span className="font-medium">SAVE20</span> for 20% off orders over KSH50
                        </li>
                        <li>
                          Use <span className="font-medium">FREESHIP</span> for free shipping
                        </li>
                        <li>
                          Use <span className="font-medium">SWEET5</span> for KSH5 off your order
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({state.itemCount} items)</span>
                    <span>
                      {isNaN(totalNum)
                        ? "KSH0.00"
                        : `KSH${totalNum.toFixed(2)}`}
                    </span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedPromo.code})</span>
                      <span>-KSH{isNaN(discountAmount) ? "0.00" : discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>KSH{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span>KSH{isNaN(tax) ? "0.00" : tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>KSH{isNaN(total) ? "0.00" : total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full mt-6 bg-amber-500 hover:bg-amber-600"
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    "Processing..."
                  ) : (
                    <>
                      Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="mt-6 text-center">
                  <Link href="/products" className="text-amber-600 hover:text-amber-700 text-sm">
                    Continue Shopping
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Secure checkout
                  </div>
                  <div className="flex justify-center space-x-2">
                    <img src="/images/visa.png" alt="Visa" className="h-8" />
                    <img src="/images/mastercard.png" alt="Mastercard" className="h-8" />
                    <img src="/images/amex.png" alt="American Express" className="h-8" />
                    <img src="/images/paypal.png" alt="PayPal" className="h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Sign in to your account or continue as a guest to complete your purchase.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Link href="/account/login" className="w-full">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">Sign In</Button>
            </Link>
            <Link href="/account/register" className="w-full">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button variant="ghost" onClick={proceedAsGuest}>
              Continue as Guest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
