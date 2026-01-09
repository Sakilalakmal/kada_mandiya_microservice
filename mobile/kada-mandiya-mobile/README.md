# Kada Mandiya Mobile (Phase 0)

Expo + React Native app with Expo Router and foundation Auth UI (Login / Register / Forgot Password).

## Setup

```sh
cd mobile/kada-mandiya-mobile
npm install
```

## Run

```sh
# Android (emulator/device)
npm run android

# iOS (macOS required for simulator; otherwise use Expo Go)
npm run ios

# Web
npm run web
```

## Useful scripts

```sh
npm run lint
npm run format
npm run typecheck
```

## Structure

- `app/` — Expo Router routes + layouts
  - `app/index.tsx` — splash (600ms -> login)
  - `app/(auth)/login.tsx`
  - `app/(auth)/register.tsx`
  - `app/(auth)/forgot-password.tsx`
- `src/components/` — reusable UI + layout
- `src/constants/` — `theme.ts`, `config.ts`
- `src/providers/` — theme provider

