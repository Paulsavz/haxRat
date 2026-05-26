import { supabase } from './supabase'
import type {
  Product,
  Category,
  Order,
  PaginatedResponse,
  StreamTokenResponse,
  GuestAuthResponse,
  CallCreateResponse,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (data.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`
  }
  return headers
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `Request failed: ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ---- Products API ----
export const productsApi = {
  list(params?: {
    page?: number
    per_page?: number
    category?: string
    search?: string
    min_price?: number
    max_price?: number
    sort?: string
    featured?: boolean
  }): Promise<PaginatedResponse<Product>> {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v))
      })
    }
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return apiFetch<PaginatedResponse<Product>>(`/products${query}`)
  },

  getBySlug(slug: string): Promise<Product> {
    return apiFetch<Product>(`/products/${slug}`)
  },
}

// ---- Categories API ----
export const categoriesApi = {
  list(): Promise<Category[]> {
    return apiFetch<Category[]>('/categories')
  },
}

// ---- Orders API ----
export const ordersApi = {
  list(): Promise<Order[]> {
    return apiFetch<Order[]>('/orders')
  },

  getById(id: string): Promise<Order> {
    return apiFetch<Order>(`/orders/${id}`)
  },

  create(payload: {
    items: Array<{ product_id: string; quantity: number }>
    address: {
      full_name: string
      phone: string
      line1: string
      line2?: string
      city: string
      region: string
      country: string
    }
    delivery_method: string
    coupon_code?: string
  }): Promise<Order> {
    return apiFetch<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

// ---- Cart API (server-side sync) ----
export const cartApi = {
  sync(items: Array<{ product_id: string; quantity: number }>): Promise<void> {
    return apiFetch<void>('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  },

  applyCoupon(code: string): Promise<{ discount: number; type: 'percent' | 'fixed' }> {
    return apiFetch('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },
}

// ---- Auth / Stream tokens ----
export const authApi = {
  getStreamToken(): Promise<StreamTokenResponse> {
    return apiFetch<StreamTokenResponse>('/auth/stream-token')
  },

  registerGuest(payload: { name: string; phone: string }): Promise<GuestAuthResponse> {
    return apiFetch<GuestAuthResponse>('/auth/register-guest', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

// ---- Chat API ----
export const chatApi = {
  getOrCreateChannel(channelId: string): Promise<{ channelId: string }> {
    return apiFetch('/chat/channel', {
      method: 'POST',
      body: JSON.stringify({ channelId }),
    })
  },
}

// ---- Calls API ----
export const callsApi = {
  create(type: 'audio_room' | 'default'): Promise<CallCreateResponse> {
    return apiFetch<CallCreateResponse>('/calls/create', {
      method: 'POST',
      body: JSON.stringify({ type }),
    })
  },
}
