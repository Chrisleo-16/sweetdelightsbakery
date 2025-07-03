"use client"

import { useEffect, useState, useCallback } from "react"
import { Star, Filter, Menu, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import AddToCartButton from "@/components/add-to-cart-button"
import { getProducts, Product, Pagination, ProductsResponse } from "@/utils/api"
import { toast } from "@/hooks/use-toast"

const categories = [
  { value: "all", label: "All" },
  { value: "pastries", label: "Pastries" },
  { value: "cakes", label: "Cakes" },
  { value: "beverages", label: "Beverages" },
  { value: "cold-drinks", label: "Cold Drinks" },
  { value: "creamery", label: "Creamery" },
  { value: "ice-cream", label: "Ice Cream" },
]

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
]

export default function ProductsPage() {
  // Filters & pagination state
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [page, setPage] = useState<number>(1)
  const limit = 20

  // Data state
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, limit }
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory
      }
      if (searchTerm) {
        params.search = searchTerm
      }
      const data: ProductsResponse = await getProducts(params)
      let items = data.products || []

      // Client-side sorting
      items = [...items].sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return a.price - b.price
          case "price-high":
            return b.price - a.price
          case "rating":
            return (b.rating || 0) - (a.rating || 0)
          case "name":
          default:
            return a.name.localeCompare(b.name)
        }
      })

      setProducts(items)
      setPagination(data.pagination)
    } catch (err) {
      console.error(err)
      setError("Failed to load products.")
      toast({
        title: "Error",
        description: "Unable to fetch products.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchTerm, sortBy, page])

  // Fetch on filter/page change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Handle search submit (on Enter key)
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setPage(1)
      fetchProducts()
    }
  }

  // Pagination handlers
  const goPrev = () => {
    if (pagination && page > 1) {
      setPage(page - 1)
    }
  }
  const goNext = () => {
    if (pagination && page < pagination.pages) {
      setPage(page + 1)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">All Products</h1>
        <p className="text-gray-600 text-lg">Browse our bakery items</p>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <Tabs value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1) }}>
            <TabsList className="grid w-full grid-cols-7">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {/* Mobile Sheet */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>
                  {categories.find((c) => c.value === selectedCategory)?.label || "All Categories"}
                </span>
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <div className="py-4">
                <h3 className="text-lg font-semibold mb-4">Select Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={selectedCategory === cat.value ? "default" : "outline"}
                      className={`justify-start ${selectedCategory === cat.value ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                      onClick={() => {
                        setSelectedCategory(cat.value)
                        setPage(1)
                      }}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search & Sort & Count */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        {/* Search input */}
        <div className="relative w-full lg:w-1/3">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKey}
            className="pl-10"
          />
        </div>

        {/* Count */}
        <p className="text-gray-600">
          {loading ? "Loading..." : `${pagination?.total ?? 0} products`}
        </p>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-24 text-gray-500">Loading products...</div>
      ) : error ? (
        <div className="text-center py-24 text-red-500">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-gray-500">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative h-48">
                <img
                  src={`https://echoschribbie.pythonanywhere.com/uploads/${product.image}`|| "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                    {product.category_name.replace("-", " ")}
                  </span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm ml-1 font-medium">{product.rating?.toFixed(1)}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg mt-1 truncate">{product.name}</h3>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <span className="font-bold text-lg">KSHS . {product.price.toFixed(2)}</span>
                <AddToCartButton product={product} size="sm" showQuantity />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button variant="outline" onClick={goPrev} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-gray-700">
            Page {page} of {pagination.pages}
          </span>
          <Button variant="outline" onClick={goNext} disabled={page >= pagination.pages}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
