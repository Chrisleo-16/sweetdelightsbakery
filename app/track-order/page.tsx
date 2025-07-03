"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Search,
  Calendar,
  User,
} from "lucide-react";

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
}

interface Order {
  order_id: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  // if your backend returns these, include them:
  statusHistory?: Array<{
    id: string;
    status: string;
    timestamp: string;
    location?: string;
    description: string;
    isCompleted: boolean;
  }>;
  // you can expand with shippingAddress, carrier, etc.
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "";
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrder = () => {
    if (!orderNumber.trim()) {
      setError("Please enter an order number");
      return;
    }
    setIsLoading(true);
    setError("");
    fetch("/api/orders", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        const found = data.orders.find(
          (o: any) => String(o.order_id) === orderNumber.trim()
        );
        if (found) {
          setOrder(found);
        } else {
          setError("Order not found.");
          setOrder(null);
        }
      })
      .catch(() => setError("Error fetching order."))
      .finally(() => setIsLoading(false));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusIcon = (status: string, done: boolean) => {
    const cls = `h-6 w-6 ${done ? "text-green-600" : "text-gray-400"}`;
    switch (status) {
      case "order-placed":
        return <CheckCircle className={cls} />;
      case "preparing":
        return <Clock className={cls} />;
      case "ready-for-pickup":
      case "picked-up":
        return <Package className={cls} />;
      case "in-transit":
      case "out-for-delivery":
        return <Truck className={cls} />;
      case "delivered":
        return <CheckCircle className={cls} />;
      default:
        return <Clock className={cls} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "order-placed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "ready-for-pickup":
      case "picked-up":
        return "bg-purple-100 text-purple-800";
      case "in-transit":
        return "bg-orange-100 text-orange-800";
      case "out-for-delivery":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Track Your Order</h1>
          <p className="text-gray-600">
            Enter your order number to see real-time tracking information
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g. 123"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && fetchOrder()
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={fetchOrder}
                  disabled={isLoading}
                  className="bg-amber-500 hover:bg-amber-600 w-full sm:w-auto"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? "Tracking..." : "Track Order"}
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {order && (
          <div className="space-y-6">
            {/* If you have statusHistory in your backend, render it here */}
            {order.statusHistory && (
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {order.statusHistory.map((s, i) => (
                      <div
                        key={s.id}
                        className="flex items-start space-x-4"
                      >
                        <div className="flex flex-col items-center">
                          {getStatusIcon(s.status, s.isCompleted)}
                          {i < order.statusHistory!.length - 1 && (
                            <div
                              className={`w-0.5 h-12 mt-2 ${
                                s.isCompleted
                                  ? "bg-green-300"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`font-medium ${
                                s.isCompleted
                                  ? "text-gray-900"
                                  : "text-gray-500"
                              }`}
                            >
                              {s.status
                                .replace(/-/g, " ")
                                .replace(
                                  /\b\w/g,
                                  (c) => c.toUpperCase()
                                )}
                            </h3>
                            {s.timestamp && (
                              <span className="text-sm text-gray-500">
                                {formatDate(s.timestamp)}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm ${
                              s.isCompleted
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {s.description}
                          </p>
                          {s.location && (
                            <div className="flex items-center mt-1">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">
                                {s.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
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
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>KSH{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
