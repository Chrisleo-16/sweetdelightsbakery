"use client"

import { useState, useEffect, useContext } from "react"
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  RefreshCw,
  EyeOff,
  DollarSign,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin-layout"
import { AuthContext } from "@/context/AuthContext"
import {
  getProducts,
  getAdminAnalytics,
  addProduct,
  updateProduct,
  deleteProduct,
  Product as APIProduct,
  AnalyticsResponse,
} from "@/utils/api"

interface Product {
  id: number
  name: string
  description: string
  price: number
  category_name: string
  image: string
  stock: number
  lowStockThreshold: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface DashboardStats {
  totalProducts: number
  outOfStock: number
  lowStock: number
  totalValue: number
  recentOrders: number
  todaysRevenue: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { token } = useContext(AuthContext)

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [loadError, setLoadError] = useState<string | null>(null)

  const categories = ["pastries", "cakes", "beverages", "cold-drinks", "creamery", "ice-cream"]

  // Redirect if not admin
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

  // Form state for add/edit
  const emptyForm = {
    name: "",
    category: "",
    price: "",
    stock: "",
    lowStockThreshold: "10",
    description: "",
    image: null as File | null,
    isActive: true,
  }
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm })

  // Load products & stats
  const loadData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const prodResp = await getProducts({ page: 1, limit: 1000 })
      const statsResp: AnalyticsResponse = await getAdminAnalytics()
      // Map APIProduct to our Product if needed; assuming API returns matching fields
      const prods: Product[] = prodResp.products.map((p: APIProduct) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category_name ?? p.category, // adjust based on API
        image: p.image,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold ?? 10,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
      setProducts(prods)
      setStats(statsResp.analytics)
      setLastUpdated(new Date())
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load data"
      setLoadError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const iv = setInterval(loadData, 30000)
    return () => clearInterval(iv)
  }, [])

  // Filtering
  useEffect(() => {
    const filtered = products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const categoryMatch = selectedCategory === "all" || p.category === selectedCategory
      const stockMatch =
        stockFilter === "all" ||
        (stockFilter === "out-of-stock" && p.stock === 0) ||
        (stockFilter === "low-stock" && p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)) ||
        (stockFilter === "in-stock" && p.stock > (p.lowStockThreshold || 10))
      return nameMatch && categoryMatch && stockMatch
    })
    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory, stockFilter])

  // Dialog open handlers
  const openAdd = () => {
    setForm({ ...emptyForm })
    setIsAddOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setForm({
      name: p.name,
      category: p.category,
      price: p.price.toString(),
      stock: p.stock.toString(),
      lowStockThreshold: (p.lowStockThreshold || 10).toString(),
      description: p.description,
      image: null,
      isActive: p.isActive,
    })
    setIsEditOpen(true)
  }

  const closeDialogs = () => {
    setIsAddOpen(false)
    setIsEditOpen(false)
    setEditingProduct(null)
  }

  // Add
  const handleAdd = async () => {
    if (!form.name || !form.category || !form.price || !form.stock) {
      toast({ title: "Error", description: "Fill required fields", variant: "destructive" })
      return
    }
    try {
      const payload = new FormData()
      payload.append("name", form.name)
      payload.append("price", form.price)
      payload.append("category_name", form.category)
      payload.append("stock", form.stock)
      payload.append("lowStockThreshold", form.lowStockThreshold)
      payload.append("description", form.description)
      payload.append("isActive", String(form.isActive))
      if (form.image) {
        payload.append("image", form.image)
      }
      const resp = await addProduct(payload)
      if (resp.product_id || resp.data) {
        toast({ title: "Success", description: "Product added" })
        closeDialogs()
        loadData()
      } else {
        toast({ title: "Error", description: resp.error || "Add failed", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Add failed", variant: "destructive" })
    }
  }

  // Edit
  const handleEdit = async () => {
    if (!editingProduct) return
    if (!form.name || !form.category || !form.price || !form.stock) {
      toast({ title: "Error", description: "Fill required fields", variant: "destructive" })
      return
    }
    try {
      const payload: any = {
        name: form.name,
        category_name: form.category,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        description: form.description,
        isActive: form.isActive,
      }
      if (form.image) payload.image = form.image

      const resp = await updateProduct(editingProduct.id, payload)
      if (resp.success || resp.data) {
        toast({ title: "Success", description: "Product updated" })
        closeDialogs()
        loadData()
      } else {
        toast({ title: "Error", description: resp.error || "Update failed", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Update failed", variant: "destructive" })
    }
  }

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return
    try {
      const resp = await deleteProduct(id)
      if (resp.success || resp.data) {
        toast({ title: "Success", description: "Product deleted" })
        loadData()
      } else {
        toast({ title: "Error", description: resp.error || "Delete failed", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Delete failed", variant: "destructive" })
    }
  }

  const getStockStatus = (p: Product) => {
    if (p.stock === 0) return { label: "Out of Stock", color: "bg-red-500" }
    if (p.stock <= (p.lowStockThreshold || 10)) return { label: "Low Stock", color: "bg-yellow-500" }
    return { label: "In Stock", color: "bg-green-500" }
  }

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["Name", "Category", "Price", "Stock", "Status", "Last Updated"],
      ...filteredProducts.map((p) => [
        p.name,
        p.category,
        p.price.toString(),
        p.stock.toString(),
        getStockStatus(p).label,
        new Date(p.updatedAt).toLocaleDateString(),
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "products.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Early loading states
  if (isLoading && !loadError && !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      </AdminLayout>
    )
  }
  if (loadError) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">Error Loading dashboard: {loadError}</p>
          <Button onClick={loadData}>Retry</Button>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-sm lg:text-base text-gray-600">
              Manage your bakery's product inventory and stock levels
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-green-600">
              Live Updates Active
            </Badge>
            <Button onClick={exportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700" size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="add-name">Product Name *</Label>
                    <Input
                      id="add-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-category">Category *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) => setForm({ ...form, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="add-price">Price *</Label>
                      <Input
                        id="add-price"
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-stock">Initial Stock *</Label>
                      <Input
                        id="add-stock"
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="add-lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="add-lowStockThreshold"
                      type="number"
                      value={form.lowStockThreshold}
                      onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-description">Description</Label>
                    <Textarea
                      id="add-description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Product description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-image">Image File</Label>
                    <Input
                      id="add-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setForm({ ...form, image: e.target.files ? e.target.files[0] : null })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="add-isActive"
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                    />
                    <Label htmlFor="add-isActive">Active Product</Label>
                  </div>
                  <Button onClick={handleAdd} className="w-full bg-amber-600 hover:bg-amber-700">
                    Add Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* **Stats Cards** */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-6">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-xs">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats?.totalProducts ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-xs">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{stats?.outOfStock ?? 0}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-xs">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">{stats?.lowStock ?? 0}</div>
            <p className="text-xs text-muted-foreground">Running low</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-xs">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {typeof stats?.totalValue === "number"
                ? `KSH${stats.totalValue.toFixed(2)}`
                : "KSH0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Total worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-xs">Recent Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{stats?.recentOrders ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-xs">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">
              {typeof stats?.todaysRevenue === "number"
                ? `KSH${stats.todaysRevenue.toFixed(2)}`
                : "KSH0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Today's sales</p>
          </CardContent>
        </Card>
      </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 lg:w-96">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-lg lg:text-xl">Products ({filteredProducts.length})</CardTitle>
              <div className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Product</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base hidden sm:table-cell">Category</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Price</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Stock</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base hidden lg:table-cell">Status</th>
                    <th className="text-left p-2 lg:p-4 text-sm lg:text-base">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 lg:p-4">
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <img src={`https://echoschribbie.pythonanywhere.com/uploads/${product.image}`}
                              className="w-8 h-8 lg:w-12 lg:h-12 object-cover rounded"/>
                            <div className="min-w-0">
                              <div className="font-medium text-sm lg:text-base flex items-center gap-2">
                                <span className="truncate">{product.name}</span>
                                {!product.isActive && (
                                  <span className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" title="Inactive">
                                  <EyeOff  />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs lg:text-sm text-gray-500 line-clamp-1 hidden sm:block">
                                {product.description}
                              </div>
                              <div className="sm:hidden">
                                <Badge variant="outline" className="text-xs">
                                  {product.category.charAt(0).toUpperCase() +
                                    product.category.slice(1).replace("-", " ")}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 lg:p-4 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs lg:text-sm">
                            {product.category.charAt(0).toUpperCase() + product.category.slice(1).replace("-", " ")}
                          </Badge>
                        </td>
                        <td className="p-2 lg:p-4 font-medium text-sm lg:text-base">
                          KSH{product.price.toFixed(2)}
                        </td>
                        <td className="p-2 lg:p-4">
                          <div className="flex items-center space-x-1 lg:space-x-2">
                            <Input
                              type="number"
                              value={product.stock}
                              onChange={(e) =>
                                handleEdit // inline stock update could call an API; omitted here for brevity
                                // If you have a handleStockUpdate, implement similarly
                              }
                              className="w-12 lg:w-20 text-xs lg:text-sm"
                              min="0"
                              readOnly
                            />
                            <span className="text-xs text-gray-500 hidden lg:inline">units</span>
                          </div>
                          <div className="lg:hidden mt-1">
                            <Badge className={`${stockStatus.color} text-white text-xs`}>
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2 lg:p-4 hidden lg:table-cell">
                          <Badge className={`${stockStatus.color} text-white`}>
                            {stockStatus.label}
                          </Badge>
                        </td>
                        <td className="p-2 lg:p-4">
                          <div className="flex space-x-1 lg:space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(product)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(product.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm({ ...form, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price">Price</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-stock">Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-threshold">Low Stock Threshold</Label>
                  <Input
                    id="edit-threshold"
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-image">Image File</Label>
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.files ? e.target.files[0] : null })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <Label htmlFor="edit-active">Active Product</Label>
                </div>
                <Button onClick={handleEdit} className="w-full bg-amber-600 hover:bg-amber-700">
                  Update Product
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
