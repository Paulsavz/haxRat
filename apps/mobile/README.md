# RetailHub Admin — Mobile App

Expo React Native app for Android (and iOS). Features:
- Supabase authentication
- Stream Chat customer inbox with channel threading
- Stream Video audio + video calls with incoming-call UI
- Order management with status updates
- Push notifications via expo-notifications

## Setup

### 1. Install dependencies
```bash
cd apps/mobile
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Fill in:
| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `EXPO_PUBLIC_API_URL` | Base URL of the RetailHub API server |
| `EXPO_PUBLIC_STREAM_API_KEY` | Stream.io API key |

### 3. API endpoint: `/api/auth/stream-token`

The app calls `GET /api/auth/stream-token` (with the Supabase JWT as `Authorization: Bearer <token>`) and expects:
```json
{ "token": "<stream_chat_user_token>", "userId": "<user_id>" }
```

The Stream token must be generated server-side using your Stream secret.

## Development

### Android
```bash
npm run android
# or
npx expo start --android
```

Requires Android Studio + emulator, or a physical device with USB debugging enabled.

### iOS
```bash
npm run ios
```

Requires Xcode (macOS only).

## Build (Android APK / AAB)

Uses EAS Build:
```bash
npm install -g eas-cli
eas login
eas build --platform android
```

Or for a local build:
```bash
npx expo run:android
```

## Architecture

```
app/
  _layout.tsx          — Root layout, Stream providers, auth guard
  auth/login.tsx        — Login screen (Supabase)
  (tabs)/
    _layout.tsx         — Tab navigator with badges
    index.tsx           — Dashboard (stats + recent orders)
    orders.tsx          — Orders list + status update sheet
    chat.tsx            — Stream Chat channel list + channel view
    calls.tsx           — Stream Video incoming + active calls
    settings.tsx        — Profile, notifications, logout
components/
  OrderCard.tsx         — Reusable order card
  StatCard.tsx          — Reusable stat card
lib/
  supabase.ts           — Supabase client (AsyncStorage session)
  api.ts                — Axios API client + typed helpers
  stream.ts             — Stream Chat + Video client singletons
store/
  adminStore.ts         — Zustand store (persisted via AsyncStorage)
```

## Permissions

The following device permissions are requested:
- **Camera** — video calls
- **Microphone** — audio + video calls
- **Notifications** — push alerts for orders, chat, calls

Permissions are requested lazily at the moment they are needed (before joining a call, etc.).
