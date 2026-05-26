export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  compare_price?: number
  images: string[]
  category_id: string
  category?: Category
  stock: number
  featured: boolean
  tags: string[]
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  product_count?: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  address: Address
  delivery_method: string
  payment_reference?: string
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: string
  product_id: string
  product: Product
  quantity: number
  unit_price: number
  total_price: number
}

export interface Address {
  id?: string
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  region: string
  country: string
  is_default?: boolean
}

export interface UserProfile {
  id: string
  email?: string
  phone?: string
  full_name?: string
  avatar_url?: string
  addresses: Address[]
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface StreamTokenResponse {
  chatToken: string
  videoToken: string
  userId: string
}

export interface GuestAuthResponse {
  guestId: string
  chatToken: string
  videoToken: string
}

export interface CallCreateResponse {
  callId: string
  type: string
}
