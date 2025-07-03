"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrders, createOrder, OrderSummary } from "@/utils/api"

// For building a new order:
interface NewItem {
  product_id: number
  quantity: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [newItems, setNewItems] = useState<NewItem[]>([])
  const [form, setForm] = useState<NewItem>({ product_id: 0, quantity: 1 })
  const [isPlacing, setIsPlacing] = useState(false)

  // Load existing orders
  const loadOrders = async () => {
    try {
      const { orders } = await getOrders()
      setOrders(orders)
    } catch {
      setOrders([])
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const getStatusBadge = (o: OrderSummary) => (
    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
      <CheckCircle className="h-4 w-4" />
      Delivered
    </Badge>
  )

  // Handlers for new-order form
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: Number(value) }))
  }

  const addItem = () => {
    if (form.product_id > 0 && form.quantity > 0) {
      setNewItems((items) => [...items, form])
      setForm({ product_id: 0, quantity: 1 })
    }
  }

  const placeOrder = async () => {
    if (newItems.length === 0) return
    setIsPlacing(true)
    try {
      await createOrder(newItems)
      setNewItems([])
      await loadOrders()
    } catch (err) {
      console.error("Failed to create order:", err)
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 space-y-8">
      {/* New Order Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Create New Order</h2>
        <div className="flex gap-2">
          <input
            type="number"
            name="product_id"
            min={1}
            placeholder="Product ID"
            value={form.product_id || ""}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded w-32"
          />
          <input
            type="number"
            name="quantity"
            min={1}
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded w-24"
          />
          <Button onClick={addItem}>Add Item</Button>
        </div>

        {newItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>New Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {newItems.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>#{it.product_id} × {it.quantity}</span>
                </div>
              ))}
              <Button
                onClick={placeOrder}
                disabled={isPlacing}
                className="mt-2 bg-amber-500 hover:bg-amber-600"
              >
                {isPlacing ? "Placing..." : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Existing Orders */}
      <div>
        <h1 className="text-4xl font-bold mb-4">Your Orders</h1>
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">No orders yet</h2>
            <p className="text-gray-600 mb-8">
              Once you’ve placed orders, they’ll show up here.
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((o) => (
              <Card key={o.order_id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{o.order_id}
                      </CardTitle>
                      <p className="text-gray-600">
                        Placed on {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      {getStatusBadge(o)}
                      <span className="font-bold">
                        KSH{o.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {o.items.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex items-center space-x-4"
                      >
                        <span className="flex-1">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          KSH{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-6">
                    <Link href={`/track-order?order=${o.order_id}`}>
                      <Button variant="outline" size="sm">
                        Track Order
                      </Button>
                    </Link>
                    <Link href={`/account/orders/${o.order_id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
