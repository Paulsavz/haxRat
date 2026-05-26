# RetailHub — Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm i -g expo-cli`) for mobile app

---

## 1. Clone & install

```bash
git clone <repo-url>
cd haxRat
npm install          # installs all workspaces
```

---

## 2. Configure environment variables

Copy the example files and fill in your credentials:

```bash
# Root (shared reference)
cp .env.example .env

# Per-app (these are what each app actually reads)
cp apps/storefront/.env.local.example apps/storefront/.env.local
cp apps/admin/.env.example            apps/admin/.env
cp apps/backend/.env.example          apps/backend/.env
cp apps/mobile-admin/.env.example     apps/mobile-admin/.env
```

Edit each `.env` file with your real keys (see below).

---

## 3. External services to set up

### Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase/migrations/001_initial_schema.sql`
3. Then run `supabase/seed.sql` for sample data
4. Copy **Project URL** and **anon key** from Settings → API

### Daily.co (video/audio calls)
1. Sign up at [daily.co](https://daily.co)
2. Copy your API key from Developers tab
3. Note your domain (e.g. `myapp.daily.co`)

### Paystack (payments)
1. Sign up at [paystack.com](https://paystack.com)
2. Copy **Public key** (storefront) and **Secret key** (backend)
3. Set a webhook secret and configure webhook URL: `https://your-backend.com/api/payments/paystack/webhook`

### Firebase (push notifications)
1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Generate a service account key (Project Settings → Service Accounts)
4. Stringify the JSON: `cat service-account.json | jq -c .`
5. Paste the result as `FIREBASE_SERVICE_ACCOUNT` in `apps/backend/.env`

---

## 4. Run locally

Each app runs on its own port:

| App | Port | Command |
|---|---|---|
| Backend API | 4000 | `cd apps/backend && npm run dev` |
| Customer Storefront | 3000 | `cd apps/storefront && npm run dev` |
| Admin Dashboard | 3001 | `cd apps/admin && npm run dev` |
| Mobile Admin | Expo | `cd apps/mobile-admin && npx expo start` |

**Or run all at once from the root (requires Turborepo):**

```bash
npm run dev
```

---

## 5. First-time admin setup

After the backend is running, create your first admin user directly in Supabase:

```sql
-- In Supabase SQL Editor
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Then log in to the Admin Dashboard at [http://localhost:3001](http://localhost:3001).

---

## 6. Deploy

| App | Platform | Notes |
|---|---|---|
| Storefront | [Vercel](https://vercel.com) | Zero-config for Next.js; set env vars in dashboard |
| Admin | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Set `VITE_API_URL` to your backend URL |
| Backend | [Railway](https://railway.app) or [Render](https://render.com) | Set all backend env vars; expose port 4000 |
| Mobile | [Expo EAS Build](https://expo.dev/eas) | `eas build --platform android` |

---

## Architecture

```
apps/
  storefront/     Next.js 14 — Customer PWA (port 3000)
  admin/          React + Vite — Admin Dashboard (port 3001)
  backend/        Node.js + Express + Socket.io (port 4000)
  mobile-admin/   Expo React Native — Admin Mobile App
packages/
  shared-types/   TypeScript types shared across apps
supabase/
  migrations/     PostgreSQL schema (run once on new project)
  seed.sql        Sample data (categories, products, banners)
```
