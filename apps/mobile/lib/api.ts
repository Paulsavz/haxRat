import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from storage on every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // ignore storage errors
  }
  return config
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  imageUrl?: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  address: string
  createdAt: string
  updatedAt: string
  channelId?: string
}

export interface DashboardStats {
  ordersToday: number
  revenue: number
  activeChats: number
  pendingOrders: number
}

export interface AdminProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getStreamToken(): Promise<{ token: string; userId: string }> {
  const res = await api.get('/api/auth/stream-token')
  return res.data
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api.get('/api/admin/stats')
  return res.data
}

export async function fetchRecentOrders(limit = 20): Promise<Order[]> {
  const res = await api.get('/api/admin/orders/recent', { params: { limit } })
  return res.data
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function fetchOrders(status?: OrderStatus): Promise<Order[]> {
  const res = await api.get('/api/admin/orders', { params: status ? { status } : {} })
  return res.data
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const res = await api.get(`/api/admin/orders/${orderId}`)
  return res.data
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const res = await api.patch(`/api/admin/orders/${orderId}/status`, { status })
  return res.data
}

// ─── Admin profile ────────────────────────────────────────────────────────────

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const res = await api.get('/api/admin/profile')
  return res.data
}

export default api
