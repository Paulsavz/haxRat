import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['admin_token', 'admin_user']);
      // Navigation handled in store
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/admin/auth/login', { email, password }),
  me: () => api.get('/admin/auth/me'),
  logout: () => api.post('/admin/auth/logout'),
};

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: (limit = 10) => api.get(`/admin/dashboard/recent-orders?limit=${limit}`),
};

export const ordersAPI = {
  list: (params?: Record<string, string>) => api.get('/admin/orders', { params }),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
};

export const chatAPI = {
  getConversations: () => api.get('/admin/chat/conversations'),
  getMessages: (conversationId: string) =>
    api.get(`/admin/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/admin/chat/conversations/${conversationId}/messages`, { content }),
  markRead: (conversationId: string) =>
    api.patch(`/admin/chat/conversations/${conversationId}/read`),
};

export const callsAPI = {
  getHistory: () => api.get('/admin/calls'),
  acceptCall: (callId: string) => api.post(`/admin/calls/${callId}/accept`),
  declineCall: (callId: string) => api.post(`/admin/calls/${callId}/decline`),
};

export const settingsAPI = {
  get: () => api.get('/admin/settings'),
  update: (data: object) => api.put('/admin/settings', data),
};
