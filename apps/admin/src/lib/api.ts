import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }),
  me: () => api.get('/admin/auth/me'),
  logout: () => api.post('/admin/auth/logout'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRevenueChart: (days = 7) => api.get(`/admin/dashboard/revenue?days=${days}`),
  getRecentOrders: (limit = 10) => api.get(`/admin/dashboard/recent-orders?limit=${limit}`),
};

// Orders
export const ordersAPI = {
  list: (params?: Record<string, string>) => api.get('/admin/orders', { params }),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  getInvoice: (id: string) => api.get(`/admin/orders/${id}/invoice`),
};

// Products
export const productsAPI = {
  list: (params?: Record<string, string>) => api.get('/admin/products', { params }),
  getById: (id: string) => api.get(`/admin/products/${id}`),
  create: (data: FormData) =>
    api.post('/admin/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/admin/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
};

// Categories
export const categoriesAPI = {
  list: () => api.get('/admin/categories'),
  create: (data: object) => api.post('/admin/categories', data),
  update: (id: string, data: object) => api.put(`/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
};

// Customers
export const customersAPI = {
  list: (params?: Record<string, string>) => api.get('/admin/customers', { params }),
  getById: (id: string) => api.get(`/admin/customers/${id}`),
  getOrderHistory: (id: string) => api.get(`/admin/customers/${id}/orders`),
  getChatHistory: (id: string) => api.get(`/admin/customers/${id}/chats`),
};

// Chat
export const chatAPI = {
  getConversations: () => api.get('/admin/chat/conversations'),
  getMessages: (conversationId: string) =>
    api.get(`/admin/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/admin/chat/conversations/${conversationId}/messages`, { content }),
  assignStaff: (conversationId: string, staffId: string) =>
    api.patch(`/admin/chat/conversations/${conversationId}/assign`, { staffId }),
  markRead: (conversationId: string) =>
    api.patch(`/admin/chat/conversations/${conversationId}/read`),
};

// Calls
export const callsAPI = {
  getHistory: (params?: Record<string, string>) => api.get('/admin/calls', { params }),
  getActive: () => api.get('/admin/calls/active'),
  acceptCall: (callId: string) => api.post(`/admin/calls/${callId}/accept`),
  declineCall: (callId: string) => api.post(`/admin/calls/${callId}/decline`),
  endCall: (callId: string) => api.post(`/admin/calls/${callId}/end`),
  initiateCall: (customerId: string, type: 'audio' | 'video') =>
    api.post('/admin/calls/initiate', { customerId, type }),
  createRoom: () => api.post('/admin/calls/rooms'),
};

// Staff
export const staffAPI = {
  list: () => api.get('/admin/staff'),
  create: (data: object) => api.post('/admin/staff', data),
  update: (id: string, data: object) => api.put(`/admin/staff/${id}`, data),
  delete: (id: string) => api.delete(`/admin/staff/${id}`),
};

// Promotions
export const promotionsAPI = {
  listCoupons: () => api.get('/admin/promotions/coupons'),
  createCoupon: (data: object) => api.post('/admin/promotions/coupons', data),
  updateCoupon: (id: string, data: object) => api.put(`/admin/promotions/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/admin/promotions/coupons/${id}`),
  listBanners: () => api.get('/admin/promotions/banners'),
  createBanner: (data: FormData) =>
    api.post('/admin/promotions/banners', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteBanner: (id: string) => api.delete(`/admin/promotions/banners/${id}`),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data: object) => api.put('/admin/settings', data),
};
