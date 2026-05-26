# RetailHub — Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Firebase CLI: `npm install -g firebase-tools`
- Expo CLI (mobile only): `npm install -g expo-cli`

---

## Quick start (first time)

```bash
git clone <repo-url>
cd haxRat
bash setup.sh        # installs deps + copies .env files
```

Then fill in your credentials (see Section 3), and:

```bash
# Open 3 terminals:
cd apps/backend    && npm run dev    # port 4000
cd apps/storefront && npm run dev    # port 3000
cd apps/admin      && npm run dev    # port 3001
```

---

## 1. Clone & install

```bash
git clone <repo-url>
cd haxRat
npm install
```

---

## 2. Environment variables

```bash
cp apps/storefront/.env.local.example  apps/storefront/.env.local
cp apps/admin/.env.example             apps/admin/.env
cp apps/backend/.env.example           apps/backend/.env
cp apps/mobile-admin/.env.example      apps/mobile-admin/.env
```

| File | Used by | Key vars |
|---|---|---|
| `apps/storefront/.env.local` | Next.js | `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_API_URL` |
| `apps/admin/.env` | Vite | `VITE_SUPABASE_*`, `VITE_API_URL` |
| `apps/backend/.env` | Node.js | `SUPABASE_*`, `DAILY_API_KEY`, `PAYSTACK_*`, `FIREBASE_SERVICE_ACCOUNT` |
| `apps/mobile-admin/.env` | Expo | `EXPO_PUBLIC_*` |

---

## 3. External services

### Supabase (database + auth)
1. Create a project at [supabase.com](https://supabase.com)
2. **SQL Editor** → paste & run `supabase/migrations/001_initial_schema.sql`
3. Then run `supabase/seed.sql` for sample products/categories
4. Copy **Project URL** + **anon key** from Settings → API → fill into `.env` files

### Firebase (hosting + push notifications)
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a **new project** (e.g. `retailhub-prod`)
3. Add **two Hosting sites** (Project Settings → Hosting → Add site):
   - `retailhub-store` (customer storefront)
   - `retailhub-admin` (admin dashboard)
4. Enable **Cloud Messaging** (for push notifications)
5. **Service account key** (for backend push): Project Settings → Service Accounts → Generate new private key
   - Stringify it: `cat service-account.json | jq -c .`
   - Paste into `FIREBASE_SERVICE_ACCOUNT` in `apps/backend/.env`
6. Update `.firebaserc` with your real project and site IDs:

```json
{
  "projects": { "default": "retailhub-prod" },
  "targets": {
    "retailhub-prod": {
      "hosting": {
        "storefront": ["retailhub-store"],
        "admin":      ["retailhub-admin"]
      }
    }
  }
}
```

### Daily.co (video/audio calls)
1. Sign up at [daily.co](https://daily.co)
2. Copy API key → `DAILY_API_KEY` in backend `.env`
3. Note your domain (e.g. `myapp.daily.co`) → `NEXT_PUBLIC_DAILY_DOMAIN`

### Paystack (payments)
1. Sign up at [paystack.com](https://paystack.com)
2. Public key → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in storefront `.env.local`
3. Secret key → `PAYSTACK_SECRET_KEY` in backend `.env`
4. Webhook URL (after backend is deployed): `https://your-backend.com/api/payments/paystack/webhook`

---

## 4. Run locally

| App | Port | Command |
|---|---|---|
| Backend API | 4000 | `cd apps/backend && npm run dev` |
| Customer Storefront | 3000 | `cd apps/storefront && npm run dev` |
| Admin Dashboard | 3001 | `cd apps/admin && npm run dev` |
| Mobile Admin | Expo | `cd apps/mobile-admin && npx expo start` |

Or all at once from root:
```bash
npm run dev
```

---

## 5. First admin user

After the backend is running, promote your account in Supabase SQL Editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Log in at [http://localhost:3001](http://localhost:3001).

---

## 6. Deploy to Firebase Hosting

### A. Deploy the storefront and admin dashboard

```bash
# Login to Firebase
firebase login

# Link your hosting targets (do once)
firebase target:apply hosting storefront retailhub-store
firebase target:apply hosting admin      retailhub-admin

# Build admin dashboard
cd apps/admin && npm run build && cd ../..

# Deploy both sites
firebase deploy --only hosting
```

The storefront (Next.js) is deployed via Firebase Web Frameworks — Firebase detects Next.js automatically and handles SSR.

### B. Deploy the backend (Express API)

Firebase Hosting cannot run Node.js servers. Deploy the backend to one of these free options:

**Railway (recommended — 1-click):**
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the repo, set root directory to `apps/backend`
3. Add all env vars from `apps/backend/.env` in the Variables tab
4. Railway auto-detects Node.js and runs `node src/index.js`
5. Copy the deployed URL → update `NEXT_PUBLIC_API_URL` in your `.env` files

**Render (free tier):**
1. Go to [render.com](https://render.com) → New Web Service → Connect GitHub
2. Root directory: `apps/backend`, Build: `npm install`, Start: `node src/index.js`
3. Add env vars, deploy

### C. CI/CD with GitHub Actions

The workflow at `.github/workflows/firebase-deploy.yml` auto-deploys on every push to `main`.

Add these secrets to your GitHub repo (Settings → Secrets):

| Secret | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON (for CI deployments) |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Your deployed backend URL |
| `NEXT_PUBLIC_DAILY_DOMAIN` | Daily.co domain |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `VITE_SUPABASE_URL` | Supabase URL (for admin build) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (for admin build) |
| `VITE_API_URL` | Backend URL (for admin build) |

---

## 7. Mobile app (Expo)

```bash
cd apps/mobile-admin
npx expo start           # run on device via Expo Go
# or build for production:
npx eas build --platform android
npx eas build --platform ios
```

---

## Architecture

```
apps/
  storefront/     Next.js 14 — Customer PWA (port 3000) → Firebase Hosting
  admin/          React + Vite — Admin Dashboard (port 3001) → Firebase Hosting
  backend/        Node.js + Express + Socket.io (port 4000) → Railway / Render
  mobile-admin/   Expo React Native — Admin Mobile App → Expo EAS
packages/
  shared-types/   TypeScript types shared across apps
supabase/
  migrations/     PostgreSQL schema (run once)
  seed.sql        Sample data
.github/
  workflows/      Firebase auto-deploy CI/CD
firebase.json     Firebase Hosting config (storefront + admin)
.firebaserc       Firebase project + site targets
setup.sh          One-command local setup
```
