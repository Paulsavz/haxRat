// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin' | 'support' | 'pharmacist' | 'delivery';
export type OrderStatus = 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type CallType = 'audio' | 'video';
export type CallStatus = 'requesting' | 'active' | 'ended' | 'declined' | 'missed';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type NotificationType = 'order' | 'chat' | 'call' | 'promo';

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
  fcm_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  category_id?: string;
  category?: Category;
  images: string[];
  stock: number;
  sku?: string;
  tags: string[];
  variants: ProductVariant[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  regions: string[];
  fee: number;
  min_days: number;
  max_days: number;
  is_active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses?: number;
  uses_count: number;
  expires_at?: string;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  variant?: Record<string, string>;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string;
  created_by?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_reference?: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  coupon_id?: string;
  address: Omit<Address, 'id' | 'user_id' | 'is_default' | 'created_at'>;
  delivery_zone_id?: string;
  notes?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id?: string;
  sender?: User;
  content?: string;
  type: MessageType;
  file_url?: string;
  read_at?: string;
  created_at: string;
}

export interface Chat {
  id: string;
  customer_id?: string;
  assigned_to?: string;
  last_message_at: string;
  is_active: boolean;
  created_at: string;
  last_message?: Message;
}

export interface Call {
  id: string;
  customer_id?: string;
  admin_id?: string;
  type: CallType;
  status: CallStatus;
  room_url?: string;
  room_token?: string;
  duration_seconds?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link?: string;
  is_active: boolean;
  sort_order: number;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants: Record<string, string>;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export interface CheckoutData {
  address: Omit<Address, 'id' | 'user_id' | 'is_default' | 'created_at'>;
  delivery_zone_id: string;
  payment_method: string;
  coupon_code?: string;
  notes?: string;
}

// ─── Guest User ───────────────────────────────────────────────────────────────

export interface GuestUser {
  name: string;
  phone: string;
}
