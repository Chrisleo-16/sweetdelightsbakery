"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { getProduct as fetchProductAPI } from "@/utils/api"
import { getProducts as fetchProductsAPI } from "@/utils/api"

export interface Product {
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
  rating?: number
  reviews?: number
}

interface ProductState {
  products: Product[]
  isLoading: boolean
}

type ProductAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: number }
  | { type: "UPDATE_STOCK"; payload: { id: number; quantity: number } }
  | { type: "DECREASE_STOCK"; payload: { id: number; quantity: number } }

const ProductContext = createContext<{
  state: ProductState
  dispatch: React.Dispatch<ProductAction>
  fetchProducts: () => Promise<void>
  fetchProductById: (id: number) => Promise<Product | undefined>
  updateProduct: (product: Product) => void
  deleteProduct: (id: number) => void
  updateStock: (id: number, quantity: number) => void
  decreaseStock: (id: number, quantity: number) => void
  getProductsByCategory: (category: string) => Product[]
  checkStock: (id: number) => { inStock: boolean; quantity: number; isLowStock: boolean }
} | null>(null)

function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_PRODUCTS":
      return { ...state, products: action.payload, isLoading: false }
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] }
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.id ? action.payload : product,
        ),
      }
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.payload),
      }
    case "UPDATE_STOCK":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.id
            ? { ...product, stock: action.payload.quantity, updatedAt: new Date().toISOString() }
            : product,
        ),
      }
    case "DECREASE_STOCK":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.id
            ? {
                ...product,
                stock: Math.max(0, product.stock - action.payload.quantity),
                updatedAt: new Date().toISOString(),
              }
            : product,
        ),
      }
    default:
      return state
  }
}

// ⬇️ Same mock initialProducts definition

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(productReducer, {
    products: [],
    isLoading: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem("bakery-products")
    try {
      const parsed = saved ? JSON.parse(saved) : []
      if (Array.isArray(parsed)) {
        dispatch({ type: "SET_PRODUCTS", payload: parsed })
      } else {
        dispatch({ type: "SET_PRODUCTS", payload: initialProducts })
      }
    } catch (error) {
      console.error("Invalid products data:", error)
      dispatch({ type: "SET_PRODUCTS", payload: initialProducts })
    }
  }, [])

  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem("bakery-products", JSON.stringify(state.products))
    }
  }, [state.products, state.isLoading])

  const addProduct = (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const existingProduct = state.products.find(
      (p) => p.name.toLowerCase() === productData.name.toLowerCase(),
    )
    if (existingProduct) {
      toast({
        title: "Product already exists",
        description: `A product named "${productData.name}" already exists.`,
        variant: "destructive",
      })
      return
    }

    const newProduct: Product = {
      ...productData,
      id: Math.max(...state.products.map((p) => p.id), 0) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: "ADD_PRODUCT", payload: newProduct })
    toast({
      title: "Product added",
      description: `${newProduct.name} has been added.`,
    })
  }

  const updateProduct = (product: Product) => {
    dispatch({
      type: "UPDATE_PRODUCT",
      payload: { ...product, updatedAt: new Date().toISOString() },
    })
    toast({
      title: "Product updated",
      description: `${product.name} has been updated.`,
    })
  }

  const deleteProduct = (id: number) => {
    const product = state.products.find((p) => p.id === id)
    dispatch({ type: "DELETE_PRODUCT", payload: id })
    toast({
      title: "Product deleted",
      description: `${product?.name || "Product"} removed.`,
    })
  }

  const updateStock = (id: number, quantity: number) => {
    const product = state.products.find((p) => p.id === id)
    dispatch({ type: "UPDATE_STOCK", payload: { id, quantity } })
    toast({
      title: "Stock updated",
      description: `${product?.name || "Product"} now has ${quantity} units.`,
    })
  }

  const decreaseStock = (id: number, quantity: number) => {
    const product = state.products.find((p) => p.id === id)
    if (product && product.stock >= quantity) {
      dispatch({ type: "DECREASE_STOCK", payload: { id, quantity } })

      const newStock = product.stock - quantity
      if (newStock === 0) {
        toast({
          title: "Out of stock",
          description: `${product.name} is now out of stock.`,
          variant: "destructive",
        })
      } else if (newStock <= product.lowStockThreshold) {
        toast({
          title: "Low stock",
          description: `${product.name} is low (${newStock} left).`,
        })
      }
    }
  }

  const getProduct = (id: number) => {
    return Array.isArray(state.products)
      ? state.products.find((product) => product.id === id)
      : undefined
  }

  const getProductsByCategory = (category: string) => {
    return Array.isArray(state.products)
      ? state.products.filter((p) => p.category === category && p.isActive)
      : []
  }

  const checkStock = (id: number) => {
    const product = Array.isArray(state.products)
      ? state.products.find((p) => p.id === id)
      : undefined
    if (!product) return { inStock: false, quantity: 0, isLowStock: false }

    return {
      inStock: product.stock > 0,
      quantity: product.stock,
      isLowStock: product.stock <= product.lowStockThreshold && product.stock > 0,
    }
  }

  return (
    <ProductContext.Provider
      value={{
        state,
        dispatch,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        decreaseStock,
        getProduct,
        getProductsByCategory,
        checkStock,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (!context) throw new Error("useProducts must be used within a ProductProvider")
  return context
}