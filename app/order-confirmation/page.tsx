"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, Truck, Tag, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getOrders, OrderSummary } from "@/utils/api"

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get("order")
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("")

  useEffect(() => {
    if (!orderNumber) {
      router.push("/products")
      return
    }

    // compute estimated delivery (today + 4 days)
    const today = new Date()
    const delivery = new Date(today)
    delivery.setDate(today.getDate() + 4)
    setEstimatedDelivery(
      delivery.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )

    // fetch and find the matching order
    async function loadOrder() {
      try {
        const { orders } = await getOrders()        // { orders: OrderSummary[] }
        const found = orders.find(
          (o) => String(o.order_id) === orderNumber
        ) ?? null
        if (!found) {
          setOrder(null)
          return
        }
        setOrder(found)
      } catch {
        setOrder(null)
      }
    }
    loadOrder()
  }, [orderNumber, router])

  if (order === null) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">Order not found.</p>
        <Button onClick={() => router.push("/products")}>
          Back to Shop
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600">
            Thank you for your order. We'll send you a confirmation email
            shortly.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Order Number:</span>
              <span className="font-mono text-amber-600">
                #{order.order_id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Order Date:</span>
              <span>
                {new Date(order.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Delivery:</span>
              <span className="text-green-600 font-medium">
                {estimatedDelivery}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.product_id} className="flex justify-between">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>
                  KSH{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>KSH{order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center p-4">
            <Mail className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <h3 className="font-medium mb-1">Confirmation Email</h3>
            <p className="text-sm text-gray-600">Sent to your email</p>
          </Card>
          <Card className="text-center p-4">
            <Package className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <h3 className="font-medium mb-1">Order Processing</h3>
            <p className="text-sm text-gray-600">1-2 business days</p>
          </Card>
          <Card className="text-center p-4">
            <Truck className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <h3 className="font-medium mb-1">Delivery</h3>
            <p className="text-sm text-gray-600">3-5 business days</p>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/track-order?order=${order.order_id}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              Track Your Order
            </Button>
          </Link>
          <Link href="/account/orders">
            <Button variant="outline" className="w-full sm:w-auto">
              View All Orders
            </Button>
          </Link>
          <Link href="/products">
            <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
