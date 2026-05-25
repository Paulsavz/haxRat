-- ─────────────────────────────────────────────────────────────
-- Seed data for RetailHub
-- Run after 001_initial_schema.sql
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- Categories (3)
-- ─────────────────────────────────────────────────────────────
insert into categories (id, name, slug, icon, image_url, sort_order, is_active) values
  (
    '11111111-0000-0000-0000-000000000001',
    'Electronics',
    'electronics',
    'smartphone',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
    1,
    true
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'Fashion',
    'fashion',
    'shirt',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    2,
    true
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'Health & Beauty',
    'health-beauty',
    'heart-pulse',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
    3,
    true
  );

-- ─────────────────────────────────────────────────────────────
-- Products (6 — 2 per category)
-- ─────────────────────────────────────────────────────────────
insert into products (
  id, name, slug, description, price, compare_price,
  category_id, images, stock, sku, tags,
  variants, is_active, is_featured
) values
  -- Electronics 1: Wireless Headphones
  (
    '22222222-0000-0000-0000-000000000001',
    'ProSound Wireless Headphones',
    'prosound-wireless-headphones',
    'Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and foldable design for portability.',
    549.99,
    699.99,
    '11111111-0000-0000-0000-000000000001',
    array[
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'
    ],
    85,
    'ELEC-HP-001',
    array['headphones', 'wireless', 'noise-cancelling', 'audio'],
    '[{"name":"Color","options":["Midnight Black","Pearl White","Navy Blue"]}]'::jsonb,
    true,
    true
  ),
  -- Electronics 2: Smart Watch
  (
    '22222222-0000-0000-0000-000000000002',
    'VitaTrack Smart Watch',
    'vitatrack-smart-watch',
    'Feature-packed smartwatch with health monitoring, GPS tracking, 14-day battery, and a stunning AMOLED display. Compatible with Android and iOS.',
    899.00,
    1099.00,
    '11111111-0000-0000-0000-000000000001',
    array[
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80'
    ],
    42,
    'ELEC-SW-002',
    array['smartwatch', 'fitness', 'gps', 'health'],
    '[{"name":"Size","options":["42mm","46mm"]},{"name":"Band","options":["Silicone","Stainless Steel"]}]'::jsonb,
    true,
    true
  ),
  -- Fashion 1: Slim-Fit Chinos
  (
    '22222222-0000-0000-0000-000000000003',
    'Urban Slim-Fit Chinos',
    'urban-slim-fit-chinos',
    'Versatile slim-fit chinos crafted from stretch-cotton blend. Perfect for work or casual outings. Machine washable.',
    189.99,
    null,
    '11111111-0000-0000-0000-000000000002',
    array[
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'
    ],
    150,
    'FASH-CH-003',
    array['chinos', 'trousers', 'men', 'casual', 'office'],
    '[{"name":"Size","options":["28","30","32","34","36","38"]},{"name":"Color","options":["Khaki","Olive","Navy","Black"]}]'::jsonb,
    true,
    false
  ),
  -- Fashion 2: Printed Wrap Dress
  (
    '22222222-0000-0000-0000-000000000004',
    'Bloom Printed Wrap Dress',
    'bloom-printed-wrap-dress',
    'Effortlessly elegant wrap dress in a vibrant floral print. Made from lightweight viscose for all-day comfort.',
    220.00,
    280.00,
    '11111111-0000-0000-0000-000000000002',
    array[
      'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&q=80',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80'
    ],
    60,
    'FASH-DR-004',
    array['dress', 'women', 'floral', 'wrap', 'summer'],
    '[{"name":"Size","options":["XS","S","M","L","XL"]}]'::jsonb,
    true,
    true
  ),
  -- Health & Beauty 1: Vitamin C Serum
  (
    '22222222-0000-0000-0000-000000000005',
    'GlowLab Vitamin C Serum',
    'glowlab-vitamin-c-serum',
    '20% Vitamin C serum with hyaluronic acid and vitamin E. Brightens skin, reduces dark spots, and boosts collagen. Suitable for all skin types.',
    145.00,
    175.00,
    '11111111-0000-0000-0000-000000000003',
    array[
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80'
    ],
    200,
    'HB-VC-005',
    array['serum', 'vitamin-c', 'skincare', 'brightening', 'vegan'],
    '[{"name":"Size","options":["30ml","60ml"]}]'::jsonb,
    true,
    false
  ),
  -- Health & Beauty 2: Multivitamin Gummies
  (
    '22222222-0000-0000-0000-000000000006',
    'VitalBoost Multivitamin Gummies',
    'vitalboost-multivitamin-gummies',
    'Delicious daily multivitamin gummies packed with 15 essential vitamins and minerals. Sugar-free, gluten-free, and suitable for adults. 60-day supply per bottle.',
    89.99,
    null,
    '11111111-0000-0000-0000-000000000003',
    array[
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
      'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&q=80'
    ],
    320,
    'HB-MV-006',
    array['vitamins', 'supplements', 'gummies', 'health', 'wellness'],
    '[{"name":"Flavor","options":["Mixed Berry","Citrus Orange"]}]'::jsonb,
    true,
    false
  );

-- ─────────────────────────────────────────────────────────────
-- Banners (2)
-- ─────────────────────────────────────────────────────────────
insert into banners (id, title, subtitle, image_url, link, is_active, sort_order, starts_at, ends_at) values
  (
    '33333333-0000-0000-0000-000000000001',
    'Summer Sale — Up to 40% Off',
    'Shop the hottest deals on electronics, fashion, and more.',
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    '/products?tag=sale',
    true,
    1,
    now(),
    now() + interval '30 days'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    'New Arrivals in Health & Beauty',
    'Discover our curated collection of premium skincare and wellness products.',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80',
    '/categories/health-beauty',
    true,
    2,
    now(),
    now() + interval '14 days'
  );

-- ─────────────────────────────────────────────────────────────
-- Delivery Zone (1)
-- ─────────────────────────────────────────────────────────────
insert into delivery_zones (id, name, regions, fee, min_days, max_days, is_active) values
  (
    '44444444-0000-0000-0000-000000000001',
    'Greater Accra (Standard)',
    array['Greater Accra', 'Tema', 'Kasoa'],
    25.00,
    1,
    2,
    true
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    'Other Regions (Standard)',
    array['Ashanti', 'Western', 'Central', 'Eastern', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo', 'Oti', 'Savannah', 'North East', 'Ahafo', 'Bono East', 'Western North'],
    60.00,
    2,
    5,
    true
  );
