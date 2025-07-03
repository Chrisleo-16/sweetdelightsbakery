import api from "./axios";

export interface SignUpData{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}
export interface LoginResponse{
    message: string;
    access_token: string;
    role: 'admin' | 'user';
    user: any
}
export const signup = async(data: SignUpData) =>{
    const resp = await api.post('/signup', data);
}
export const unifiedLogin = async(identifier: string, password:string): Promise<LoginResponse> =>{
    const resp = await api.post<LoginResponse>('/signin',{identifier, password});
    return resp.data
}

export interface Product{
    id:number;
    name: string;
    price: number;
    description: string;
    image: string;
    isActive: boolean;
    createdAt: string;
    rating: number;
    stock: number;
    category_name: string;
    lowStockThreshold:number;
    updatedAt: string;
    category:string;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages:number;
}

export interface ProductsResponse {
    products: Product[];
    pagination: Pagination;
}
export const getProducts = async (
    params?: {
        category?: string;
        sort?:string;
        page?: number;
        limit?: number;
        search?: string;
    }
) =>{
    const resp = await api.get<ProductsResponse>('/products',{ params });
    return resp.data;
};
export interface GetProductResponse {
  product: Product
}

export const getProduct = async (id: number): Promise<GetProductResponse> => {
  const res = await api.get<GetProductResponse>(`/products/${id}`)
  return res.data
}
export const getCategories = async () =>{
    const resp = await api.get<{categories: Array<{id:number; name: string; createdAt: string; isActive:boolean; products: Product[]}>}>(`/categories`);
    return resp.data;
}
// Orders API
export interface OrderItem {
    product_id: number;
    quantity: number;
}
export const createOrder = async (items: OrderItem[]) => {
    const resp = await api.post('/orders', { items });
    return resp.data;
}
export interface OrderSummary {
    order_id: number;
    total: number;
    createdAt: string;
    items: Array<{ product_id: number; name:string; quantity:number; price:number}>;
}
export const getOrders = async () => {
    const resp = await api.get<{orders: OrderSummary[]}>('/orders');
    return resp.data;
}
export const getAdminAnalytics = async (): Promise<AnalyticsResponse> => {
  try {
    const resp = await api.get<AnalyticsResponse>("/admin/analytics")
    return resp.data
  } catch (error) {
    throw error
  }
}

// Add product: expecting FormData if uploading image; adjust endpoint
export const addProduct = async (formData: FormData) => {
  try {
    const resp = await api.post("/add_products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return resp.data
  } catch (error) {
    throw error
  }
}

export interface UploadProductPayload{
  name?: string
  description?:string
  price?: number
  category_name?:string
  image?:string
  stock?:number
  lowStockThreshold?:number
  isActive?:boolean
}
// Update product: adjust endpoint path
export const updateProduct = async (id: number, payload: UploadProductPayload): Promise<any> => {
    const resp = await api.put(`/products/${id}`, payload)
    return resp.data
}

// Delete product
export const deleteProduct = async (id: number): Promise<any> => {
    const resp = await api.delete(`/products/${id}`)
    return resp.data
}
export const getProfile = async () => {
  const resp = await api.get('/profile');
  return resp.data;
};
export interface AnalyticsResponse {
  analytics: {
    totalProducts: number
    outOfStock: number
    lowStock: number
    totalValue: number
    recentOrders: number
    todaysRevenue: number
  }
}
export interface MpesaPaymentResponse {
  message: string
}

// 1) Trigger an STK Push
export const mpesaPayment = async (
  amount: number,
  phone: string
): Promise<MpesaPaymentResponse> => {
  // we send as form‐urlencoded so that Flask’s request.form[...] works
  const payload = new URLSearchParams()
  payload.append("amount", amount.toString())
  payload.append("phone", phone)

  const resp = await api.post<MpesaPaymentResponse>(
    "/mpesa_payment",
    payload,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  )
  return resp.data
}