"use client"

import { useState, useEffect, useContext } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  BarChart3,
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

export default function CustomersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { token } = useContext(AuthContext)

  // State
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null)
  const [periodCustomersData, setPeriodCustomersData] = useState<{
    current: number
    previous: number
    change: number
  } | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState("30") // days for period view
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Auth guard
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

  // Load total customers (all-time approximation) once, and period analytics on timeRange change
  useEffect(() => {
    if (!token) return
    loadAllTimeCustomers()
    loadPeriodAnalytics()
    // refresh total monthly (e.g. once a day) and period every 2 minutes
    const intervalTotal = setInterval(loadAllTimeCustomers, 24 * 60 * 60 * 1000)
    const intervalPeriod = setInterval(loadPeriodAnalytics, 2 * 60 * 1000)
    return () => {
      clearInterval(intervalTotal)
      clearInterval(intervalPeriod)
    }
  }, [token, timeRange])

  const loadAllTimeCustomers = async () => {
    // Use a large range to approximate all-time, e.g. 3650 days
    try {
      const resp = await getAdminAnalytics(3650)
      if (resp?.customers?.current != null) {
        setTotalCustomers(resp.customers.current)
      } else {
        console.warn("Unexpected analytics shape for total customers:", resp)
      }
    } catch (error: any) {
      console.error("Failed to load total customers:", error)
    }
  }

  const loadPeriodAnalytics = async () => {
    setIsLoading(true)
    try {
      const days = Number.parseInt(timeRange)
      const resp = await getAdminAnalytics(days)
      if (resp && resp.customers) {
        setPeriodCustomersData({
          current: resp.customers.current,
          previous: resp.customers.previous,
          change: resp.customers.change,
        })
        setAnalytics(resp)
        setLastUpdated(new Date())
      } else {
        toast({
          title: "Error",
          description: "Failed to load customer analytics",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || error.message || "Failed to load analytics",
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

  if (isLoading && analytics === null && totalCustomers === null) {
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Customer Overview
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              Summary of customer metrics
            </p>
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
                <SelectItem value="1">Last 1 Day</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
          {/* Total Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {totalCustomers != null ? totalCustomers : "—"}
              </div>
              <p className="text-xs text-muted-foreground">Approx. all-time</p>
            </CardContent>
          </Card>

          {/* Customers in Period */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Customers (last {timeRange}d)
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {periodCustomersData ? periodCustomersData.current : "—"}
              </div>
              {periodCustomersData && (
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {formatChange(periodCustomersData.change)} vs previous
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue in Period */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Revenue (last {timeRange}d)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-green-600">
                {analytics?.revenue.current != null
                  ? "$" + analytics.revenue.current.toFixed(2)
                  : "—"}
              </div>
              {analytics && (
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {formatChange(analytics.revenue.change)} vs previous
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total Orders in Period */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Orders (last {timeRange}d)
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                {analytics?.orders.current != null
                  ? analytics.orders.current
                  : "—"}
              </div>
              {analytics && (
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {formatChange(analytics.orders.change)} vs previous
                </p>
              )}
            </CardContent>
          </Card>

          {/* Avg Order Value in Period */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium">
                Avg Order Value ({timeRange}d)
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-purple-600">
                {analytics?.avgOrderValue.current != null
                  ? "$" + analytics.avgOrderValue.current.toFixed(2)
                  : "—"}
              </div>
              {analytics && (
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {formatChange(analytics.avgOrderValue.change)} vs previous
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
