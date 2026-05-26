import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import {
  authRoutes,
  productsRoutes,
  categoriesRoutes,
  ordersRoutes,
  paymentsRoutes,
  chatRoutes,
  callsRoutes,
  adminRoutes,
  bannersRoutes,
  deliveryRoutes,
  couponsRoutes,
  settingsRoutes,
  notificationsRoutes,
} from './routes/index.js'

// ─── Rate limiting (simple in-memory per IP) ──────────────────────────────────
const rateLimitStore = new Map() // { ip: { count, resetAt } }
const RATE_LIMIT = 120           // requests
const RATE_WINDOW = 60 * 1000   // per 60 seconds

function rateLimit(c, next) {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'

  const now = Date.now()
  let record = rateLimitStore.get(ip)

  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + RATE_WINDOW }
    rateLimitStore.set(ip, record)
  }

  record.count++

  if (record.count > RATE_LIMIT) {
    return c.json(
      { success: false, message: 'Too many requests. Please slow down.' },
      429
    )
  }

  return next()
}

// Periodically clean up expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) rateLimitStore.delete(ip)
  }
}, 5 * 60 * 1000)

// ─── App ──────────────────────────────────────────────────────────────────────
const app = new Hono()

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
]

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin // allow server-to-server / curl
      if (allowedOrigins.includes(origin)) return origin
      return null
    },
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
  })
)

// ─── Logger ───────────────────────────────────────────────────────────────────
app.use('*', logger())

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use('*', rateLimit)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', version: '2.0.0' }))

// ─── API Routes ───────────────────────────────────────────────────────────────
app.route('/api/auth', authRoutes)
app.route('/api/products', productsRoutes)
app.route('/api/categories', categoriesRoutes)
app.route('/api/orders', ordersRoutes)
app.route('/api/payments', paymentsRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/calls', callsRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/banners', bannersRoutes)
app.route('/api/delivery', deliveryRoutes)
app.route('/api/coupons', couponsRoutes)
app.route('/api/settings', settingsRoutes)
app.route('/api/notifications', notificationsRoutes)

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ success: false, message: `Route ${c.req.method} ${c.req.path} not found` }, 404)
})

// ─── Global error handler ─────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[UNHANDLED ERROR]', err)
  return c.json({ success: false, message: 'Internal server error' }, 500)
})

// ─── Start server ─────────────────────────────────────────────────────────────
const port = Number(process.env.PORT || 4000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`RetailHub API running on http://localhost:${info.port}`)
})

export default app
