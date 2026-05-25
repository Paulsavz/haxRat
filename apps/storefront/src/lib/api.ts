import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ─── Auth Header ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: Record<string, string | number | boolean>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return apiFetch<{ data: import('../types').Product[]; total: number; totalPages: number }>(`/api/products${qs}`);
  },

  get: (slug: string) =>
    apiFetch<{ data: import('../types').Product }>(`/api/products/${slug}`),

  related: (productId: string) =>
    apiFetch<{ data: import('../types').Product[] }>(`/api/products/${productId}/related`),

  featured: () =>
    apiFetch<{ data: import('../types').Product[] }>('/api/products/featured'),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () =>
    apiFetch<{ data: import('../types').Category[] }>('/api/categories'),
};

// ─── Banners ──────────────────────────────────────────────────────────────────

export const bannersApi = {
  list: () =>
    apiFetch<{ data: import('../types').Banner[] }>('/api/banners'),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  create: (payload: import('../types').CheckoutData & { items: { product_id: string; quantity: number; variant?: Record<string, string> }[] }) =>
    apiFetch<{ data: import('../types').Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  get: (id: string) =>
    apiFetch<{ data: import('../types').Order }>(`/api/orders/${id}`),

  myOrders: () =>
    apiFetch<{ data: import('../types').Order[] }>('/api/orders/my'),
};

// ─── Delivery Zones ───────────────────────────────────────────────────────────

export const deliveryApi = {
  zones: () =>
    apiFetch<{ data: import('../types').DeliveryZone[] }>('/api/delivery-zones'),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const couponsApi = {
  validate: (code: string, orderAmount: number) =>
    apiFetch<{ data: import('../types').Coupon }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, order_amount: orderAmount }),
    }),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  createOrGet: (guestName?: string, guestPhone?: string) =>
    apiFetch<{ data: import('../types').Chat }>('/api/chats', {
      method: 'POST',
      body: JSON.stringify({ guest_name: guestName, guest_phone: guestPhone }),
    }),

  messages: (chatId: string) =>
    apiFetch<{ data: import('../types').Message[] }>(`/api/chats/${chatId}/messages`),
};

// ─── Calls ────────────────────────────────────────────────────────────────────

export const callsApi = {
  request: (chatId: string, type: 'audio' | 'video') =>
    apiFetch<{ data: import('../types').Call }>('/api/calls', {
      method: 'POST',
      body: JSON.stringify({ chat_id: chatId, type }),
    }),

  end: (callId: string) =>
    apiFetch<{ data: import('../types').Call }>(`/api/calls/${callId}/end`, {
      method: 'POST',
    }),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  profile: () =>
    apiFetch<{ data: import('../types').User }>('/api/auth/profile'),

  updateProfile: (payload: Partial<import('../types').User>) =>
    apiFetch<{ data: import('../types').User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  addresses: () =>
    apiFetch<{ data: import('../types').Address[] }>('/api/auth/addresses'),

  addAddress: (addr: Omit<import('../types').Address, 'id' | 'user_id' | 'created_at'>) =>
    apiFetch<{ data: import('../types').Address }>('/api/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(addr),
    }),

  deleteAddress: (id: string) =>
    apiFetch<void>(`/api/auth/addresses/${id}`, { method: 'DELETE' }),
};
