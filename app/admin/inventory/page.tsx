"use client"

import { useState, useEffect } from "react"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import AdminLayout from "@/components/admin-layout"
import { getProducts, getAdminAnalytics, Product } from "@/utils/api"

interface InventoryItem {
  id: number
  name: string
  category: string
  currentStock: number
  lowStockThreshold: number
  lastUpdated: string    // iso string from product.updatedAt
  status: "out" | "low" | "good"
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtered, setFiltered] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<{
    totalItems: number
    outOfStock: number
    lowStock: number
  } | null>(null)

  // Fetch all products and derive inventory items
  const loadInventory = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      // Fetch all products: adjust limit if you have many
      const { products } = await getProducts({ page: 1, limit: 1000 })
      // Derive inventory items
      const items: InventoryItem[] = products
        .filter((p) => p.isActive)   // only active products
        .map((p) => {
          const stock = p.stock ?? 0
          // If backend provides lowStockThreshold, use it; else default to e.g. 10
          const threshold = p.lowStockThreshold ?? 10
          let status: "out" | "low" | "good" = "good"
          if (stock === 0) {
            status = "out"
          } else if (stock <= threshold) {
            status = "low"
          } else {
            status = "good"
          }
          return {
            id: p.id,
            name: p.name,
            category: p.category_name || p.category || "",
            currentStock: stock,
            lowStockThreshold: threshold,
            lastUpdated: p.updatedAt || p.createdAt || "",
            status,
          }
        })
      setInventory(items)
      // Compute stats
      const totalItems = items.length
      const outOfStock = items.filter((i) => i.status === "out").length
      const lowStock = items.filter((i) => i.status === "low").length
      setStats({ totalItems, outOfStock, lowStock })
      setFiltered(items)
    } catch (err: any) {
      console.error("Error loading inventory:", err)
      const msg = err.response?.data?.error || err.message || "Failed to load inventory"
      setLoadError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  // Filter by searchTerm
  useEffect(() => {
    if (!searchTerm) {
      setFiltered(inventory)
    } else {
      const lower = searchTerm.toLowerCase()
      setFiltered(
        inventory.filter(
          (item) =>
            item.name.toLowerCase().includes(lower) ||
            item.category.toLowerCase().includes(lower)
        )
      )
    }
  }, [searchTerm, inventory])

  // Helper to get badge props
  const getStatusBadge = (status: "out" | "low" | "good") => {
    switch (status) {
      case "out":
        return { label: "Out of Stock", color: "bg-red-500", textColor: "text-red-700" }
      case "low":
        return { label: "Low Stock", color: "bg-yellow-500", textColor: "text-yellow-700" }
      case "good":
      default:
        return { label: "In Stock", color: "bg-green-500", textColor: "text-green-700" }
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </AdminLayout>
    )
  }
  if (loadError) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">Error loading inventory: {loadError}</p>
          <Button onClick={loadInventory}>Retry</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">Monitor stock levels for all products</p>
          </div>
          <div className="relative">
            <Input
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">Active products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                <p className="text-xs text-muted-foreground">Need restocking</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <TrendingDown className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
                <p className="text-xs text-muted-foreground">Running low</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inventory List */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-xl">Products ({filtered.length})</CardTitle>
              {/* Could show last refresh time */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm">Product</th>
                    <th className="text-left p-2 text-sm hidden sm:table-cell">Category</th>
                    <th className="text-left p-2 text-sm">Stock</th>
                    <th className="text-left p-2 text-sm">Threshold</th>
                    <th className="text-left p-2 text-sm">Status</th>
                    <th className="text-left p-2 text-sm hidden md:table-cell">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const badge = getStatusBadge(item.status)
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            {/* If your image URL is available in product.image, you could show it here; omitted since InventoryPage focuses on text */}
                            <span className="font-medium truncate">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-2 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.currentStock}
                            disabled
                            className="w-16 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.lowStockThreshold}
                            disabled
                            className="w-16 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Badge className={`${badge.color} text-white text-xs`}>
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="p-2 hidden md:table-cell">
                          {item.lastUpdated
                            ? new Date(item.lastUpdated).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-4 text-center text-gray-500">No products found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
