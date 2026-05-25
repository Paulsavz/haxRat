'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

// Configs — initialise early so startup errors surface immediately
require('./config/supabase');
require('./config/firebase');

// Route handlers
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const callRoutes = require('./routes/calls');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const bannerRoutes = require('./routes/banners');
const deliveryRoutes = require('./routes/delivery');
const couponRoutes = require('./routes/coupons');
const settingsRoutes = require('./routes/settings');

// Services
const { createNotification } = require('./services/notifications');

// Utilities
const { AppError, ValidationError, NotFoundError, AuthError, ForbiddenError } = require('./utils/errors');

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins = [
  process.env.STOREFRONT_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3001',
  process.env.MOBILE_ADMIN_URL || 'http://localhost:3002',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Security Headers ─────────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Needed for Daily.co iframes
  })
);

// ─── Request Logging ──────────────────────────────────────────────────────────

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests, please slow down.' },
});

app.use(globalLimiter);

// ─── Body Parsers ─────────────────────────────────────────────────────────────

// Paystack webhook needs raw body — mount BEFORE json parser
app.use('/api/payments/paystack/webhook', express.raw({ type: 'application/json' }));

// Standard JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible to route handlers via req.app.get('io')
app.set('io', io);

// Also expose globally for Paystack webhook (which bypasses express context)
global._io = io;

// ─── Socket.io Middleware (Auth) ──────────────────────────────────────────────

const supabase = require('./config/supabase');

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return next(new Error('Invalid or expired token'));
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name, role, email')
      .eq('id', user.id)
      .single();

    socket.user = profile || { id: user.id, email: user.email, role: 'customer' };
    next();
  } catch (err) {
    next(new Error('Socket authentication failed'));
  }
});

// ─── Socket.io Event Handlers ─────────────────────────────────────────────────

io.on('connection', (socket) => {
  const user = socket.user;
  console.log(`[Socket] Connected: ${user.email} (${user.role}) — ${socket.id}`);

  // Auto-join personal room for targeted notifications
  socket.join(`user:${user.id}`);

  // Admins join an admins broadcast room
  if (['admin', 'support'].includes(user.role)) {
    socket.join('admins');
  }

  // ── Chat events ──────────────────────────────────────────────────────────

  socket.on('chat:join', (chatId) => {
    if (!chatId) return;
    socket.join(`chat:${chatId}`);
    console.log(`[Socket] ${user.email} joined chat:${chatId}`);
  });

  socket.on('chat:leave', (chatId) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
  });

  socket.on('chat:typing', ({ chat_id, is_typing }) => {
    if (!chat_id) return;
    socket.to(`chat:${chat_id}`).emit('chat:typing', {
      chat_id,
      user_id: user.id,
      full_name: user.full_name,
      is_typing: !!is_typing,
    });
  });

  // ── Order tracking events ─────────────────────────────────────────────────

  socket.on('order:track', (orderId) => {
    if (!orderId) return;
    socket.join(`order:${orderId}`);
  });

  socket.on('order:untrack', (orderId) => {
    if (!orderId) return;
    socket.leave(`order:${orderId}`);
  });

  // ── Call signaling events ─────────────────────────────────────────────────

  socket.on('call:join_room', ({ call_id }) => {
    if (!call_id) return;
    socket.join(`call:${call_id}`);
    socket.to(`call:${call_id}`).emit('call:peer_joined', {
      user_id: user.id,
      full_name: user.full_name,
      role: user.role,
    });
  });

  socket.on('call:leave_room', ({ call_id }) => {
    if (!call_id) return;
    socket.to(`call:${call_id}`).emit('call:peer_left', {
      user_id: user.id,
      full_name: user.full_name,
    });
    socket.leave(`call:${call_id}`);
  });

  // WebRTC signal relay (offer, answer, ICE candidates)
  socket.on('call:signal', ({ call_id, to, signal }) => {
    if (!call_id || !signal) return;
    io.to(`user:${to}`).emit('call:signal', {
      call_id,
      from: user.id,
      signal,
    });
  });

  // ── Connection lifecycle ──────────────────────────────────────────────────

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${user.email} — ${reason}`);
  });

  socket.on('error', (err) => {
    console.error(`[Socket] Error for ${user.email}:`, err.message);
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // Operational errors (our custom classes)
  if (err.isOperational) {
    const payload = {
      success: false,
      message: err.message,
      code: err.code,
    };

    if (err instanceof ValidationError && err.fields) {
      payload.fields = err.fields;
    }

    return res.status(err.statusCode).json(payload);
  }

  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File size exceeds the 10 MB limit' });
  }

  // Supabase / Postgres errors that leak through
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Duplicate entry', code: 'CONFLICT' });
  }

  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      message: 'Referenced record does not exist',
      code: 'FK_VIOLATION',
    });
  }

  // Unknown / programming errors
  console.error('[Error] Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    code: 'INTERNAL_ERROR',
  });
});

// ─── Server Start ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '4000', 10);

server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`[Server] Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  process.exit(1);
});

module.exports = { app, server, io };
