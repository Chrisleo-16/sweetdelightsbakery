"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CreditCard,
  Truck,
  Shield,
  ArrowLeft,
  Tag,
  Phone,
} from "lucide-react"
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
    "Nairobi",
    "Mombasa",
    "Kisumu",
    "Nakuru",
    "Eldoret",
    "Thika",
    "Naivasha",
    "Kitale",
    "Nyeri",
    "Machakos",
    "Kakamega",
    "Malindi",
    "Kisii",
    "Bungoma",
    "Meru",
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((p) => ({ ...p, [name]: value }))
  }

  const handleSelectChange = (field: keyof typeof formData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }))
  }

  const cartItems: CartItem[] = cartState.items.map((it) => ({
    id: it.id,
    name: it.name,
    price: it.price,
    quantity: it.quantity,
    image: it.image,
  }))

  const subtotal: number = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const promoParam = params.get("promo")
    if (!promoParam) return

    const promos: Promo[] = [
      { code: "WELCOME10", type: "percentage", value: 10 },
      { code: "SAVE20", type: "percentage", value: 20, minOrder: 50 },
      { code: "FREESHIP", type: "fixed", value: 5.99 },
      { code: "SWEET5", type: "fixed", value: 5 },
    ]
    const found = promos.find(
      (p) => p.code.toLowerCase() === promoParam.toLowerCase()
    )
    if (found) {
      if (found.minOrder && subtotal < found.minOrder) {
        toast({
          title: "Promo not applied",
          description: `Requires min KSH${found.minOrder}`,
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
  }, [subtotal])

  const discountAmount = appliedPromo
    ? appliedPromo.type === "percentage"
      ? (subtotal * appliedPromo.value) / 100
      : appliedPromo.value
    : 0
  const discountedSubtotal = Math.max(0, subtotal - discountAmount)
  const shipping = subtotal > 5000 ? 0 : 0
  const tax = 0
  const total = discountedSubtotal + shipping + tax

  const validateForm = () => {
    const {
      email,
      firstName,
      lastName,
      address,
      city,
      county,
      zipCode,
      paymentMethod,
      mpesaPhone,
      cardNumber,
      nameOnCard,
      expiryDate,
      cvv,
    } = formData

    if (!email) {
      toast({ title: "Missing email", variant: "destructive" })
      return false
    }
    if (!firstName || !lastName) {
      toast({ title: "Missing name", variant: "destructive" })
      return false
    }
    if (!address) {
      toast({ title: "Missing address", variant: "destructive" })
      return false
    }
    if (!city || !county || !zipCode) {
      toast({ title: "Complete your address", variant: "destructive" })
      return false
    }

    if (paymentMethod === "mpesa") {
      if (!/^254\d{9}$/.test(mpesaPhone)) {
        toast({ title: "Invalid M-PESA number", variant: "destructive" })
        return false
      }
    } else {
      if (
        !cardNumber ||
        cardNumber.replace(/\s+/g, "").length < 12 ||
        !nameOnCard ||
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate) ||
        !/^\d{3,4}$/.test(cvv)
      ) {
        toast({ title: "Invalid card details", variant: "destructive" })
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

      // Always show Safaricom's message (this is what appears on the phone)
      toast({
        title: "M-PESA Prompt Sent",
        description: resp.CustomerMessage || resp.ResponseDescription,
      })

      clearCart()
      setTimeout(() => router.push("/order-confirmation"), 800)
    } catch (err: any) {
      console.error("MPESA payment failed:", err)

      // Only show "Payment Failed" if the HTTP call itself errored
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        "Payment failed – please try again"
      toast({ title: "Payment Failed", description: msg, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
        <Link href="/products">
          <Button>Continue Shopping</Button>
        </Link>
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

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Forms */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
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
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(v) => handleSelectChange("city", v)}
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
                    onValueChange={(v) => handleSelectChange("county", v)}
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

              <Label htmlFor="zipCode">ZIP/Postal *</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" /> Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="paymentMethod">Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(v) => handleSelectChange("paymentMethod", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-PESA</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                </SelectContent>
              </Select>

              {formData.paymentMethod === "mpesa" ? (
                <div>
                  <Label htmlFor="mpesaPhone">M-PESA Phone *</Label>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
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
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                  />
                  <Label htmlFor="nameOnCard">Name on Card *</Label>
                  <Input
                    id="nameOnCard"
                    name="nameOnCard"
                    placeholder="John Doe"
                    value={formData.nameOnCard}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry (MM/YY) *</Label>
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

        {/* Right Column: Summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => {
                const img = item.image.startsWith("http")
                  ? item.image
                  : `${IMG_BASE}/${item.image}`
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={img}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">
                      KSH{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                )
              })}

              <Separator />

              <div className="space-y-2 text-right">
                <div>
                  Subtotal: KSH{subtotal.toFixed(2)}
                </div>
                {appliedPromo && (
                  <div className="text-green-600">
                    {appliedPromo.code} −KSH{discountAmount.toFixed(2)}
                  </div>
                )}
                <div>
                  Shipping: {shipping === 0 ? "Free" : `KSH${shipping.toFixed(2)}`}
                </div>
                <div>Tax: KSH{tax.toFixed(2)}</div>
                <Separator />
                <div className="font-bold text-lg">
                  Total: KSH{total.toFixed(2)}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600"
                disabled={isProcessing}
              >
                {isProcessing
                  ? "Processing Payment..."
                  : `Pay KSH ${total.toFixed(2)}`}
              </Button>

              <p className="flex items-center justify-center text-sm mt-2 text-gray-600">
                <Shield className="h-4 w-4 mr-1" /> Secure checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
