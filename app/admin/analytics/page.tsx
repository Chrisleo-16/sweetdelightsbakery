"use client"

import { useState, useEffect, useContext } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdminLayout from "@/components/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { AuthContext } from "@/context/AuthContext"
import { getAdminAnalytics } from "@/utils/api"

interface AnalyticsData {
  revenue: { current: number; previous: number; change: number }
  orders: { current: number; previous: number; change: number }
  customers: { current: number; previous: number; change: number }
  avgOrderValue: { current: number; previous: number; change: number }
  topProducts: { name: string; sales: number; revenue: number }[]
  revenueByDay: { day: string; revenue: number }[]
  categoryPerformance: { category: string; orders: number; revenue: number }[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { token } = useContext(AuthContext)

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7") // "1", "7", "30", "90"
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Auth guard: redirect if no token or non-admin
  useEffect(() => {
    if (!token) {
      router.push("/account/login")
      return
    }
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null
    if (role !== "admin") {
      router.push("/")
    }
  }, [token, router])

  // Load analytics on mount and when timeRange changes
  useEffect(() => {
    if (!token) return
    loadAnalytics()
    const interval = setInterval(loadAnalytics, 120000) // every 2 minutes
    return () => clearInterval(interval)
  }, [timeRange, token])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const resp = await getAdminAnalytics(Number.parseInt(timeRange))
      if (resp) {
        setAnalytics(resp as AnalyticsData)
        setLastUpdated(new Date())
      } else {
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || error.message || "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatChange = (change: number) => {
    const isPositive = change > 0
    return (
      <span className={`flex items-center text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </span>
    )
  }

  if (isLoading && !analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm lg:text-base text-gray-600">Track performance and business insights</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <Badge variant="outline" className="text-green-600">
              Live Updates Active
            </Badge>
            <div className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {analytics?.revenue.current != null
                  ? "$" + analytics.revenue.current.toFixed(2)
                  : "$0.00"}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {analytics && formatChange(analytics.revenue.change)} from last period
              </p>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {analytics?.orders.current != null ? analytics.orders.current : 0}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {analytics && formatChange(analytics.orders.change)} from last period
              </p>
            </CardContent>
          </Card>

          {/* Active Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {analytics?.customers.current != null ? analytics.customers.current : 0}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {analytics && formatChange(analytics.customers.change)} from last period
              </p>
            </CardContent>
          </Card>

          {/* Avg Order Value */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">Avg Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {analytics?.avgOrderValue.current != null
                  ? "$" + analytics.avgOrderValue.current.toFixed(2)
                  : "$0.00"}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {analytics && formatChange(analytics.avgOrderValue.change)} from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Revenue by Day */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Revenue by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.revenueByDay.map((day, index) => {
                  const revenues = analytics.revenueByDay.map((d) => d.revenue)
                  const maxRevenue = revenues.length ? Math.max(...revenues) : 1
                  const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 lg:space-x-3 flex-1">
                        <span className="w-8 text-sm font-medium">{day.day}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium ml-3">
                        {"$" + day.revenue.toFixed(2)}
                      </span>
                    </div>
                  )
                }) || []}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-xs lg:text-sm font-medium text-amber-700">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm lg:text-base">{product.name}</div>
                        <div className="text-xs lg:text-sm text-gray-500">
                          {product.sales} sales
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm lg:text-base">
                        {"$" + product.revenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl">Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Category</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Orders</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Revenue</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base hidden lg:table-cell">
                      Avg Order Value
                    </th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.categoryPerformance.map((cat, idx) => {
                    const avgOrderValue = cat.orders > 0 ? cat.revenue / cat.orders : 0
                    const revenues = analytics.categoryPerformance.map((c) => c.revenue)
                    const maxRevenue = revenues.length ? Math.max(...revenues) : 1
                    const performancePercentage = maxRevenue > 0 ? (cat.revenue / maxRevenue) * 100 : 0
                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2 lg:p-4">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium text-sm lg:text-base">{cat.category}</span>
                          </div>
                        </td>
                        <td className="p-2 lg:p-4 text-sm lg:text-base">{cat.orders}</td>
                        <td className="p-2 lg:p-4 font-medium text-sm lg:text-base">
                          {"$" + cat.revenue.toFixed(2)}
                        </td>
                        <td className="p-2 lg:p-4 text-sm lg:text-base hidden lg:table-cell">
                          {"$" + avgOrderValue.toFixed(2)}
                        </td>
                        <td className="p-2 lg:p-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-16 lg:w-20">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${performancePercentage}%` }}
                              />
                            </div>
                            <span className="text-xs lg:text-sm text-gray-600">
                              {performancePercentage.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  }) || []}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
