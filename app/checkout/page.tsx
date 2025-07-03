"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CreditCard, Truck, Shield, ArrowLeft, Tag, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { useCart } from "@/lib/cart-context"
import { mpesaPayment } from "@/utils/api"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

type PaymentMethod = "mpesa" | "card"

type Promo = {
  code: string
  type: "percentage" | "fixed"
  value: number
  minOrder?: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { state: cartState, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    county: "",
    zipCode: "",
    paymentMethod: "mpesa" as PaymentMethod,
    mpesaPhone: "",
    cardNumber: "",
    nameOnCard: "",
    expiryDate: "",
    cvv: "",
  })

  const IMG_BASE = "https://echoschribbie.pythonanywhere.com/uploads"

  const kenyanLocations = [
    "Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Naivasha",
    "Kitale","Nyeri","Machakos","Kakamega","Malindi","Kisii","Bungoma","Meru",
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const cartItems: CartItem[] = cartState.items.map((it) => ({
    id: it.id,
    name: it.name,
    price: it.price,
    quantity: it.quantity,
    image: it.image,
  }))

  // <-- Explicit number types to avoid `never`
  const subtotal: number = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const promoParam = params.get("promo")
    if (promoParam) {
      const availablePromoCodes: Promo[] = [
        { code: "WELCOME10", type: "percentage", value: 10 },
        { code: "SAVE20",  type: "percentage", value: 20, minOrder: 50 },
        { code: "FREESHIP", type: "fixed",      value: 5.99 },
        { code: "SWEET5",   type: "fixed",      value: 5 },
      ]
      const found = availablePromoCodes.find(
        (p) => p.code.toLowerCase() === promoParam.toLowerCase()
      )
      if (found) {
        if (found.minOrder && subtotal < found.minOrder) {
          toast({
            title: "Promo not applied",
            description: `Promo ${found.code} requires minimum KSH${found.minOrder.toFixed(2)}`,
            variant: "destructive",
          })
        } else {
          setAppliedPromo(found)
          toast({
            title: "Promo applied",
            description:
              found.type === "percentage"
                ? `${found.value}% off`
                : `KSH${found.value.toFixed(2)} off`,
          })
        }
      }
    }
  }, [subtotal])

  const discountAmount: number = appliedPromo
    ? appliedPromo.type === "percentage"
      ? (subtotal * appliedPromo.value) / 100
      : appliedPromo.value
    : 0

  const discountedSubtotal: number = Math.max(0, subtotal - discountAmount)
  const shipping: number           = subtotal > 5000 ? 0 : 0
  const tax: number                = discountedSubtotal * 0
  const total: number              = discountedSubtotal + shipping + tax

  const validateForm = (): boolean => {
    const {
      email, firstName, lastName, address,
      city, county, zipCode, paymentMethod, mpesaPhone,
      cardNumber, nameOnCard, expiryDate, cvv,
    } = formData

    if (!email) {
      toast({ title: "Missing email", description: "Please enter your email.", variant: "destructive" })
      return false
    }
    if (!firstName || !lastName) {
      toast({ title: "Missing name", description: "Please enter your full name.", variant: "destructive" })
      return false
    }
    if (!address) {
      toast({ title: "Missing address", description: "Please enter your address.", variant: "destructive" })
      return false
    }
    if (!city) {
      toast({ title: "Missing city", description: "Please select your city.", variant: "destructive" })
      return false
    }
    if (!county) {
      toast({ title: "Missing county", description: "Please select your county.", variant: "destructive" })
      return false
    }
    if (!zipCode) {
      toast({ title: "Missing ZIP", description: "Please enter ZIP/postal code.", variant: "destructive" })
      return false
    }
    if (paymentMethod === "mpesa") {
      const re = /^254\d{9}$/
      if (!mpesaPhone || !re.test(mpesaPhone)) {
        toast({
          title: "Invalid M-PESA number",
          description: "Enter phone as 254XXXXXXXXX (e.g., 254712345678).",
          variant: "destructive",
        })
        return false
      }
    } else {
      if (!cardNumber || cardNumber.replace(/\s+/g, "").length < 12) {
        toast({ title: "Invalid card number", description: "Please enter a valid card number.", variant: "destructive" })
        return false
      }
      if (!nameOnCard) {
        toast({ title: "Missing name on card", description: "Please enter the name on card.", variant: "destructive" })
        return false
      }
      if (!expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        toast({ title: "Invalid expiry date", description: "Enter expiry as MM/YY.", variant: "destructive" })
        return false
      }
      if (!cvv || !/^\d{3,4}$/.test(cvv)) {
        toast({ title: "Invalid CVV", description: "Enter a 3- or 4-digit CVV.", variant: "destructive" })
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsProcessing(true)

    try {
      const resp = await mpesaPayment(total, formData.mpesaPhone)
      toast({ title: "M-PESA Prompt Sent", description: resp.message })
      clearCart()
      setTimeout(() => router.push("/order-confirmation"), 1000)
    } catch (err: any) {
      console.error("MPESA payment failed:", err)
      toast({
        title: "Payment Failed",
        description: err?.response?.data?.error || err.message || "Try again",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add items before checking out.</p>
          <Link href="/products">
            <Button className="bg-amber-500 hover:bg-amber-600">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex items-center mb-8">
        <Link href="/cart">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input Forms */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" /> Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="123 Example Street"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(val) => handleSelectChange("city", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {kenyanLocations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="county">County *</Label>
                    <Select
                      value={formData.county}
                      onValueChange={(val) => handleSelectChange("county", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select County" />
                      </SelectTrigger>
                      <SelectContent>
                        {kenyanLocations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="00000"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" /> Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(val) => handleSelectChange("paymentMethod", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-PESA</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.paymentMethod === "mpesa" ? (
                  <div>
                    <Label htmlFor="mpesaPhone">M-PESA Phone *</Label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <Input
                        id="mpesaPhone"
                        name="mpesaPhone"
                        placeholder="2547XXXXXXXX"
                        value={formData.mpesaPhone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nameOnCard">Name on Card *</Label>
                      <Input
                        id="nameOnCard"
                        name="nameOnCard"
                        placeholder="John Doe"
                        value={formData.nameOnCard}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date (MM/YY) *</Label>
                        <Input
                          id="expiryDate"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          name="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const imageUrl = item.image.startsWith("http")
                      ? item.image
                      : `${IMG_BASE}/${item.image}`
                    return (
                      <div key={item.id} className="flex items-center space-x-3">
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-grow">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium">
                          KSH{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>KSH{subtotal.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        {appliedPromo.code}
                      </span>
                      <span>-KSH{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `KSH${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-green-600 text-sm">
                      🎉 Free shipping on orders over KSH5000!
                    </p>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (0%)</span>
                    <span>KSH{tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>KSH{total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing Payment..." : `Pay KSH ${total.toFixed(2)}`}
                </Button>
                <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
                  <Shield className="h-4 w-4 mr-1" />
                  Secure checkout
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
