import axios from 'axios'
import { getSupabaseClient } from './supabase'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Supabase session token
apiClient.interceptors.request.use(async (config) => {
  try {
    const supabase = getSupabaseClient()
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`
    }
  } catch {
    // No session, proceed without auth header
  }
  return config
})

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

// Typed API helpers
export const api = {
  // Orders
  getOrders: (params?: Record<string, string | number>) =>
    apiClient.get('/admin/orders', { params }),
  getOrder: (id: string) => apiClient.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    apiClient.patch(`/admin/orders/${id}/status`, { status }),

  // Products
  getProducts: (params?: Record<string, string | number>) =>
    apiClient.get('/admin/products', { params }),
  getProduct: (id: string) => apiClient.get(`/admin/products/${id}`),
  createProduct: (data: FormData | Record<string, unknown>) =>
    apiClient.post('/admin/products', data),
  updateProduct: (id: string, data: FormData | Record<string, unknown>) =>
    apiClient.patch(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => apiClient.delete(`/admin/products/${id}`),

  // Categories
  getCategories: () => apiClient.get('/admin/categories'),
  createCategory: (data: Record<string, unknown>) =>
    apiClient.post('/admin/categories', data),
  updateCategory: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => apiClient.delete(`/admin/categories/${id}`),

  // Customers
  getCustomers: (params?: Record<string, string | number>) =>
    apiClient.get('/admin/customers', { params }),
  getCustomer: (id: string) => apiClient.get(`/admin/customers/${id}`),

  // Dashboard
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  getRevenueChart: () => apiClient.get('/admin/dashboard/revenue'),
  getRecentOrders: () => apiClient.get('/admin/dashboard/recent-orders'),

  // Promotions
  getCoupons: () => apiClient.get('/admin/promotions/coupons'),
  createCoupon: (data: Record<string, unknown>) =>
    apiClient.post('/admin/promotions/coupons', data),
  updateCoupon: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/promotions/coupons/${id}`, data),
  deleteCoupon: (id: string) =>
    apiClient.delete(`/admin/promotions/coupons/${id}`),
  getBanners: () => apiClient.get('/admin/promotions/banners'),
  createBanner: (data: FormData) =>
    apiClient.post('/admin/promotions/banners', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteBanner: (id: string) =>
    apiClient.delete(`/admin/promotions/banners/${id}`),

  // Settings
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data: Record<string, unknown>) =>
    apiClient.patch('/admin/settings', data),

  // Stream tokens
  getStreamToken: () => apiClient.get('/auth/stream-token'),

  // Call history
  getCallHistory: () => apiClient.get('/admin/calls/history'),
}
