-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type user_role as enum ('customer', 'admin', 'support', 'pharmacist', 'delivery');
create type order_status as enum ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type call_type as enum ('audio', 'video');
create type call_status as enum ('requesting', 'active', 'ended', 'declined', 'missed');
create type message_type as enum ('text', 'image', 'file', 'system');
create type notification_type as enum ('order', 'chat', 'call', 'promo');

-- ─────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────
create table users (
  id            uuid        primary key default uuid_generate_v4(),
  phone         text        unique,
  email         text        unique,
  name          text,
  avatar_url    text,
  role          user_role   not null default 'customer',
  fcm_token     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────────────────────
create table categories (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  slug        text        unique not null,
  icon        text,
  image_url   text,
  parent_id   uuid        references categories(id),
  sort_order  int         default 0,
  is_active   boolean     default true,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────
create table products (
  id              uuid           primary key default uuid_generate_v4(),
  name            text           not null,
  slug            text           unique not null,
  description     text,
  price           decimal(10,2)  not null,
  compare_price   decimal(10,2),
  category_id     uuid           references categories(id),
  images          text[]         default '{}',
  stock           int            default 0,
  sku             text           unique,
  tags            text[]         default '{}',
  variants        jsonb          default '[]',
  is_active       boolean        default true,
  is_featured     boolean        default false,
  created_at      timestamptz    default now(),
  updated_at      timestamptz    default now()
);

-- ─────────────────────────────────────────────────────────────
-- Addresses
-- ─────────────────────────────────────────────────────────────
create table addresses (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        references users(id) on delete cascade,
  name        text        not null,
  phone       text        not null,
  line1       text        not null,
  line2       text,
  city        text        not null,
  region      text,
  country     text        default 'Ghana',
  is_default  boolean     default false,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Delivery zones
-- ─────────────────────────────────────────────────────────────
create table delivery_zones (
  id          uuid           primary key default uuid_generate_v4(),
  name        text           not null,
  regions     text[]         not null,
  fee         decimal(10,2)  not null,
  min_days    int            default 1,
  max_days    int            default 3,
  is_active   boolean        default true
);

-- ─────────────────────────────────────────────────────────────
-- Coupons
-- ─────────────────────────────────────────────────────────────
create table coupons (
  id                uuid           primary key default uuid_generate_v4(),
  code              text           unique not null,
  discount_type     text           check (discount_type in ('percentage', 'fixed')) not null,
  discount_value    decimal(10,2)  not null,
  min_order_amount  decimal(10,2)  default 0,
  max_uses          int,
  uses_count        int            default 0,
  expires_at        timestamptz,
  is_active         boolean        default true,
  created_at        timestamptz    default now()
);

-- ─────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────
create table orders (
  id                  uuid           primary key default uuid_generate_v4(),
  order_number        text           unique not null default 'ORD-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  user_id             uuid           references users(id),
  status              order_status   default 'placed',
  payment_status      payment_status default 'pending',
  payment_method      text,
  payment_reference   text,
  subtotal            decimal(10,2)  not null,
  delivery_fee        decimal(10,2)  default 0,
  discount            decimal(10,2)  default 0,
  total               decimal(10,2)  not null,
  coupon_id           uuid           references coupons(id),
  address             jsonb          not null,
  delivery_zone_id    uuid           references delivery_zones(id),
  notes               text,
  estimated_delivery  timestamptz,
  delivered_at        timestamptz,
  created_at          timestamptz    default now(),
  updated_at          timestamptz    default now()
);

-- ─────────────────────────────────────────────────────────────
-- Order items
-- ─────────────────────────────────────────────────────────────
create table order_items (
  id              uuid           primary key default uuid_generate_v4(),
  order_id        uuid           references orders(id) on delete cascade,
  product_id      uuid           references products(id),
  product_name    text           not null,
  product_image   text,
  variant         jsonb,
  quantity        int            not null,
  unit_price      decimal(10,2)  not null,
  total_price     decimal(10,2)  not null
);

-- ─────────────────────────────────────────────────────────────
-- Order status history
-- ─────────────────────────────────────────────────────────────
create table order_status_history (
  id          uuid         primary key default uuid_generate_v4(),
  order_id    uuid         references orders(id) on delete cascade,
  status      order_status not null,
  note        text,
  created_by  uuid         references users(id),
  created_at  timestamptz  default now()
);

-- ─────────────────────────────────────────────────────────────
-- Chats
-- ─────────────────────────────────────────────────────────────
create table chats (
  id                uuid        primary key default uuid_generate_v4(),
  customer_id       uuid        references users(id),
  assigned_to       uuid        references users(id),
  last_message_at   timestamptz default now(),
  is_active         boolean     default true,
  created_at        timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Messages
-- ─────────────────────────────────────────────────────────────
create table messages (
  id          uuid         primary key default uuid_generate_v4(),
  chat_id     uuid         references chats(id) on delete cascade,
  sender_id   uuid         references users(id),
  content     text,
  type        message_type default 'text',
  file_url    text,
  read_at     timestamptz,
  created_at  timestamptz  default now()
);

-- ─────────────────────────────────────────────────────────────
-- Calls
-- ─────────────────────────────────────────────────────────────
create table calls (
  id                uuid        primary key default uuid_generate_v4(),
  customer_id       uuid        references users(id),
  admin_id          uuid        references users(id),
  type              call_type   not null,
  status            call_status default 'requesting',
  room_url          text,
  room_token        text,
  duration_seconds  int,
  started_at        timestamptz,
  ended_at          timestamptz,
  created_at        timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────────────────────
create table notifications (
  id            uuid              primary key default uuid_generate_v4(),
  user_id       uuid              references users(id) on delete cascade,
  title         text              not null,
  body          text              not null,
  type          notification_type not null,
  reference_id  uuid,
  is_read       boolean           default false,
  created_at    timestamptz       default now()
);

-- ─────────────────────────────────────────────────────────────
-- Banners / Promotions
-- ─────────────────────────────────────────────────────────────
create table banners (
  id          uuid        primary key default uuid_generate_v4(),
  title       text        not null,
  subtitle    text,
  image_url   text        not null,
  link        text,
  is_active   boolean     default true,
  sort_order  int         default 0,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Store settings
-- ─────────────────────────────────────────────────────────────
create table store_settings (
  key         text    primary key,
  value       jsonb   not null,
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table users              enable row level security;
alter table products           enable row level security;
alter table categories         enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table chats              enable row level security;
alter table messages           enable row level security;
alter table calls              enable row level security;
alter table notifications      enable row level security;
alter table addresses          enable row level security;
alter table banners            enable row level security;
alter table store_settings     enable row level security;
alter table coupons            enable row level security;
alter table delivery_zones     enable row level security;
alter table order_status_history enable row level security;

-- Public read policies (no auth required)
create policy "Products are publicly readable"
  on products for select
  using (is_active = true);

create policy "Categories are publicly readable"
  on categories for select
  using (is_active = true);

create policy "Banners are publicly readable"
  on banners for select
  using (is_active = true);

create policy "Delivery zones are publicly readable"
  on delivery_zones for select
  using (is_active = true);

create policy "Store settings are publicly readable"
  on store_settings for select
  using (true);

-- User self-service policies
create policy "Users can read own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);

create policy "Users can read own addresses"
  on addresses for select
  using (auth.uid() = user_id);

create policy "Users can insert own addresses"
  on addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own addresses"
  on addresses for update
  using (auth.uid() = user_id);

create policy "Users can delete own addresses"
  on addresses for delete
  using (auth.uid() = user_id);

create policy "Users can read own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Users can create orders"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "Users can read own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Users can read own order status history"
  on order_status_history for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_status_history.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark own notifications as read"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Users can read own chats"
  on chats for select
  using (auth.uid() = customer_id or auth.uid() = assigned_to);

create policy "Users can create chats"
  on chats for insert
  with check (auth.uid() = customer_id);

create policy "Users can read own messages"
  on messages for select
  using (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
        and (chats.customer_id = auth.uid() or chats.assigned_to = auth.uid())
    )
  );

create policy "Users can send messages in own chats"
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
        and (chats.customer_id = auth.uid() or chats.assigned_to = auth.uid())
    )
  );

create policy "Users can read own calls"
  on calls for select
  using (auth.uid() = customer_id or auth.uid() = admin_id);

create policy "Customers can initiate calls"
  on calls for insert
  with check (auth.uid() = customer_id);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────
create index idx_products_category    on products(category_id);
create index idx_products_slug        on products(slug);
create index idx_products_is_active   on products(is_active);
create index idx_products_is_featured on products(is_featured);
create index idx_categories_slug      on categories(slug);
create index idx_categories_parent    on categories(parent_id);
create index idx_orders_user          on orders(user_id);
create index idx_orders_status        on orders(status);
create index idx_orders_payment       on orders(payment_status);
create index idx_orders_created       on orders(created_at desc);
create index idx_order_items_order    on order_items(order_id);
create index idx_order_items_product  on order_items(product_id);
create index idx_order_history_order  on order_status_history(order_id);
create index idx_messages_chat        on messages(chat_id, created_at);
create index idx_chats_customer       on chats(customer_id);
create index idx_chats_assigned       on chats(assigned_to);
create index idx_notifications_user   on notifications(user_id, is_read);
create index idx_calls_customer       on calls(customer_id);
create index idx_calls_admin          on calls(admin_id);
create index idx_addresses_user       on addresses(user_id);

-- ─────────────────────────────────────────────────────────────
-- Triggers: auto-update updated_at
-- ─────────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

create trigger store_settings_updated_at
  before update on store_settings
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Trigger: auto-insert order status history on status change
-- ─────────────────────────────────────────────────────────────
create or replace function record_order_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into order_status_history (order_id, status, created_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger orders_status_history
  after update on orders
  for each row execute function record_order_status_change();

-- ─────────────────────────────────────────────────────────────
-- Trigger: update chats.last_message_at on new message
-- ─────────────────────────────────────────────────────────────
create or replace function update_chat_last_message()
returns trigger as $$
begin
  update chats set last_message_at = now() where id = new.chat_id;
  return new;
end;
$$ language plpgsql;

create trigger messages_update_chat
  after insert on messages
  for each row execute function update_chat_last_message();

-- ─────────────────────────────────────────────────────────────
-- Seed: default store settings
-- ─────────────────────────────────────────────────────────────
insert into store_settings (key, value) values
  ('store_name',      '"RetailHub"'),
  ('currency',        '"GHS"'),
  ('currency_symbol', '"GH₵"'),
  ('phone',           '"+233 00 000 0000"'),
  ('email',           '"store@retailhub.com"'),
  ('address',         '"Accra, Ghana"'),
  ('social',          '{"facebook": "", "instagram": "", "twitter": "", "whatsapp": ""}'),
  ('colors',          '{"primary": "#2563eb", "secondary": "#1e40af"}'),
  ('delivery_hours',  '{"open": "08:00", "close": "20:00"}'),
  ('min_order_amount','0');
