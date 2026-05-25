// ─────────────────────────────────────────────────────────────
// Enums (mirror the PostgreSQL enum types)
// ─────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin' | 'support' | 'pharmacist' | 'delivery';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type CallType = 'audio' | 'video';

export type CallStatus = 'requesting' | 'active' | 'ended' | 'declined' | 'missed';

export type MessageType = 'text' | 'image' | 'file' | 'system';

export type NotificationType = 'order' | 'chat' | 'call' | 'promo';

export type DiscountType = 'percentage' | 'fixed';

// ─────────────────────────────────────────────────────────────
// Common helpers
// ─────────────────────────────────────────────────────────────

/** ISO-8601 datetime string returned by Supabase */
export type ISODateString = string;

/** Represents a JSONB column value that can be any JSON-serialisable shape */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// ─────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  fcm_token: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;

// ─────────────────────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: ISODateString;
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'> & {
  id?: string;
};

export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>;

/** Category with its children eagerly loaded */
export interface CategoryWithChildren extends Category {
  children?: Category[];
}

// ─────────────────────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────────────────────

export interface ProductVariant {
  name: string;
  options: string[];
  price_modifier?: number;
  stock?: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  category_id: string | null;
  images: string[];
  stock: number;
  sku: string | null;
  tags: string[];
  variants: ProductVariant[];
  is_active: boolean;
  is_featured: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at'>>;

/** Product joined with its category */
export interface ProductWithCategory extends Product {
  category: Category | null;
}

// ─────────────────────────────────────────────────────────────
// Address
// ─────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  country: string;
  is_default: boolean;
  created_at: ISODateString;
}

export type AddressInsert = Omit<Address, 'id' | 'created_at'> & {
  id?: string;
};

export type AddressUpdate = Partial<Omit<Address, 'id' | 'created_at' | 'user_id'>>;

/** Snapshot of the delivery address stored inside an order (denormalised) */
export interface AddressSnapshot {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  country: string;
}

// ─────────────────────────────────────────────────────────────
// Delivery Zone
// ─────────────────────────────────────────────────────────────

export interface DeliveryZone {
  id: string;
  name: string;
  regions: string[];
  fee: number;
  min_days: number;
  max_days: number;
  is_active: boolean;
}

export type DeliveryZoneInsert = Omit<DeliveryZone, 'id'> & {
  id?: string;
};

export type DeliveryZoneUpdate = Partial<Omit<DeliveryZone, 'id'>>;

// ─────────────────────────────────────────────────────────────
// Coupon
// ─────────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: ISODateString | null;
  is_active: boolean;
  created_at: ISODateString;
}

export type CouponInsert = Omit<Coupon, 'id' | 'uses_count' | 'created_at'> & {
  id?: string;
};

export type CouponUpdate = Partial<Omit<Coupon, 'id' | 'created_at'>>;

// ─────────────────────────────────────────────────────────────
// Order
// ─────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_reference: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  coupon_id: string | null;
  /** Denormalised copy of the delivery address at time of order */
  address: AddressSnapshot;
  delivery_zone_id: string | null;
  notes: string | null;
  estimated_delivery: ISODateString | null;
  delivered_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'> & {
  id?: string;
  order_number?: string;
};

export type OrderUpdate = Partial<
  Omit<Order, 'id' | 'order_number' | 'user_id' | 'created_at'>
>;

/** Order with line-items and status history eagerly loaded */
export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  order_status_history?: OrderStatusHistory[];
}

// ─────────────────────────────────────────────────────────────
// Order Item
// ─────────────────────────────────────────────────────────────

export interface SelectedVariant {
  name: string;
  value: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  /** The selected variant option(s) at time of purchase */
  variant: SelectedVariant | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type OrderItemInsert = Omit<OrderItem, 'id'> & {
  id?: string;
};

// ─────────────────────────────────────────────────────────────
// Order Status History
// ─────────────────────────────────────────────────────────────

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_by: string | null;
  created_at: ISODateString;
}

export type OrderStatusHistoryInsert = Omit<OrderStatusHistory, 'id' | 'created_at'> & {
  id?: string;
};

// ─────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────

export interface Chat {
  id: string;
  customer_id: string;
  assigned_to: string | null;
  last_message_at: ISODateString;
  is_active: boolean;
  created_at: ISODateString;
}

export type ChatInsert = Omit<Chat, 'id' | 'last_message_at' | 'created_at'> & {
  id?: string;
};

export type ChatUpdate = Partial<Omit<Chat, 'id' | 'customer_id' | 'created_at'>>;

/** Chat with the last message and participant profiles loaded */
export interface ChatWithDetails extends Chat {
  customer?: Pick<User, 'id' | 'name' | 'avatar_url' | 'phone'>;
  agent?: Pick<User, 'id' | 'name' | 'avatar_url'> | null;
  last_message?: Message | null;
}

// ─────────────────────────────────────────────────────────────
// Message
// ─────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  type: MessageType;
  file_url: string | null;
  read_at: ISODateString | null;
  created_at: ISODateString;
}

export type MessageInsert = Omit<Message, 'id' | 'created_at'> & {
  id?: string;
};

export type MessageUpdate = Partial<Pick<Message, 'read_at'>>;

/** Message with the sender's profile loaded */
export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'name' | 'avatar_url' | 'role'>;
}

// ─────────────────────────────────────────────────────────────
// Call
// ─────────────────────────────────────────────────────────────

export interface Call {
  id: string;
  customer_id: string;
  admin_id: string | null;
  type: CallType;
  status: CallStatus;
  room_url: string | null;
  room_token: string | null;
  duration_seconds: number | null;
  started_at: ISODateString | null;
  ended_at: ISODateString | null;
  created_at: ISODateString;
}

export type CallInsert = Omit<Call, 'id' | 'created_at'> & {
  id?: string;
};

export type CallUpdate = Partial<
  Omit<Call, 'id' | 'customer_id' | 'created_at'>
>;

/** Call with participant profiles eagerly loaded */
export interface CallWithParticipants extends Call {
  customer: Pick<User, 'id' | 'name' | 'avatar_url'>;
  admin: Pick<User, 'id' | 'name' | 'avatar_url'> | null;
}

// ─────────────────────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  /** UUID of the related entity (order, chat, call, etc.) */
  reference_id: string | null;
  is_read: boolean;
  created_at: ISODateString;
}

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'> & {
  id?: string;
};

export type NotificationUpdate = Partial<Pick<Notification, 'is_read'>>;

// ─────────────────────────────────────────────────────────────
// Banner
// ─────────────────────────────────────────────────────────────

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: ISODateString | null;
  ends_at: ISODateString | null;
  created_at: ISODateString;
}

export type BannerInsert = Omit<Banner, 'id' | 'created_at'> & {
  id?: string;
};

export type BannerUpdate = Partial<Omit<Banner, 'id' | 'created_at'>>;

// ─────────────────────────────────────────────────────────────
// Store Settings
// ─────────────────────────────────────────────────────────────

export interface StoreSettings {
  key: string;
  value: Json;
  updated_at: ISODateString;
}

/** Strongly-typed map of all known store setting keys */
export interface StoreSettingsMap {
  store_name: string;
  currency: string;
  currency_symbol: string;
  phone: string;
  email: string;
  address: string;
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    whatsapp: string;
  };
  colors: {
    primary: string;
    secondary: string;
  };
  delivery_hours: {
    open: string;
    close: string;
  };
  min_order_amount: number;
}

// ─────────────────────────────────────────────────────────────
// API / utility types
// ─────────────────────────────────────────────────────────────

/** Generic paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Standard API error shape */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Standard API success response */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ─────────────────────────────────────────────────────────────
// Cart (client-side only, not persisted in the DB)
// ─────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  selected_variant: SelectedVariant | null;
}

export interface Cart {
  items: CartItem[];
  coupon: Coupon | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
}

// ─────────────────────────────────────────────────────────────
// Supabase Database type map (for use with createClient<Database>)
// ─────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      addresses: {
        Row: Address;
        Insert: AddressInsert;
        Update: AddressUpdate;
      };
      delivery_zones: {
        Row: DeliveryZone;
        Insert: DeliveryZoneInsert;
        Update: DeliveryZoneUpdate;
      };
      coupons: {
        Row: Coupon;
        Insert: CouponInsert;
        Update: CouponUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: Partial<OrderItem>;
      };
      order_status_history: {
        Row: OrderStatusHistory;
        Insert: OrderStatusHistoryInsert;
        Update: never;
      };
      chats: {
        Row: Chat;
        Insert: ChatInsert;
        Update: ChatUpdate;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
      calls: {
        Row: Call;
        Insert: CallInsert;
        Update: CallUpdate;
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      banners: {
        Row: Banner;
        Insert: BannerInsert;
        Update: BannerUpdate;
      };
      store_settings: {
        Row: StoreSettings;
        Insert: Omit<StoreSettings, 'updated_at'>;
        Update: Partial<Pick<StoreSettings, 'value'>>;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      call_type: CallType;
      call_status: CallStatus;
      message_type: MessageType;
      notification_type: NotificationType;
    };
  };
}
