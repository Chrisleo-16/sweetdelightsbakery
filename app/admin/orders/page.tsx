"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Clock, CheckCircle, XCircle, Package, Truck, Search, Eye, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AdminLayout from "@/components/admin-layout"
import { getOrders } from "@/utils/api"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  orderDate: string
  paymentMethod: string
}

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load orders on mount and set up real-time updates
  useEffect(() => {
    loadOrders()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter orders when search or status changes
  useEffect(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const response = await getOrders()
      if (response.data) {
        setOrders(response.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "preparing":
        return <Package className="h-4 w-4" />
      case "ready":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "confirmed":
        return "bg-blue-500"
      case "preparing":
        return "bg-orange-500"
      case "ready":
        return "bg-green-500"
      case "delivered":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const orderIdNum = Number.parseInt(orderId.replace("ORD-", ""))
      const response = await apiClient.updateOrderStatus(orderIdNum, newStatus)

      if (response.data) {
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    revenue: orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.total, 0),
  }

  return (
    <AdminLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-sm lg:text-base text-gray-600">Track and manage customer orders in real-time</p>
          </div>
          <Badge variant="outline" className="text-green-600">
            Live Updates Active
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Preparing</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-orange-600">{stats.preparing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Ready</CardTitle>
              <Truck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-green-600">{stats.ready}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Revenue</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-green-600">${stats.revenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders by ID, customer name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl">Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Order ID</th>
                      <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Customer</th>
                      <th className="text-left p-2 lg:p-4 text-sm lg:text-base hidden sm:table-cell">Items</th>
                      <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Total</th>
                      <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Status</th>
                      <th className="text-left p-2 lg:p-4 text-sm lg:text-base hidden lg:table-cell">Order Time</th>
                      <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 lg:p-4 font-mono text-sm">{order.id}</td>
                        <td className="p-2 lg:p-4">
                          <div>
                            <div className="font-medium text-sm lg:text-base">{order.customerName}</div>
                            <div className="text-xs lg:text-sm text-gray-500">{order.customerEmail}</div>
                          </div>
                        </td>
                        <td className="p-2 lg:p-4 hidden sm:table-cell">
                          <div className="text-sm">
                            {order.items?.map((item, index) => (
                              <div key={index}>
                                {item.quantity}x {item.name}
                              </div>
                            )) || "No items"}
                          </div>
                        </td>
                        <td className="p-2 lg:p-4 font-medium text-sm lg:text-base">${order.total.toFixed(2)}</td>
                        <td className="p-2 lg:p-4">
                          <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1 w-fit`}>
                            {getStatusIcon(order.status)}
                            <span className="hidden sm:inline">
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </Badge>
                        </td>
                        <td className="p-2 lg:p-4 text-sm text-gray-500 hidden lg:table-cell">
                          {new Date(order.orderDate).toLocaleString()}
                        </td>
                        <td className="p-2 lg:p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsOrderDialogOpen(true)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "confirmed")}>
                                  Mark as Confirmed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "preparing")}>
                                  Mark as Preparing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "ready")}>
                                  Mark as Ready
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "delivered")}>
                                  Mark as Delivered
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "cancelled")}>
                                  Cancel Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-2xl mx-4">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Order Information</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>ID:</strong> {selectedOrder.id}
                      </div>
                      <div>
                        <strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}
                      </div>
                      <div>
                        <strong>Status:</strong> {selectedOrder.status}
                      </div>
                      <div>
                        <strong>Payment:</strong> {selectedOrder.paymentMethod}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <strong>Name:</strong> {selectedOrder.customerName}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedOrder.customerEmail}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedOrder.customerPhone}
                      </div>
                      <div>
                        <strong>Address:</strong> {selectedOrder.address}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Order Items</h3>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm">Item</th>
                          <th className="text-left p-3 text-sm">Quantity</th>
                          <th className="text-left p-3 text-sm">Price</th>
                          <th className="text-left p-3 text-sm">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3 text-sm">{item.name}</td>
                            <td className="p-3 text-sm">{item.quantity}</td>
                            <td className="p-3 text-sm">${item.price.toFixed(2)}</td>
                            <td className="p-3 text-sm">${(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="p-3 text-sm text-center text-gray-500">
                              No items found
                            </td>
                          </tr>
                        )}
                        <tr className="border-t bg-gray-50 font-medium">
                          <td colSpan={3} className="p-3 text-sm">
                            Total
                          </td>
                          <td className="p-3 text-sm">${selectedOrder.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
