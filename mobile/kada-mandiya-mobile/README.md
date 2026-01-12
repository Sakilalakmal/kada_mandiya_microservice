# Kada Mandiya Mobile

Expo + React Native app with Expo Router, Redux Toolkit (RTK Query), customer browsing + cart + checkout.

## Setup

```sh
cd mobile/kada-mandiya-mobile
npm install
```

## Environment

- `EXPO_PUBLIC_API_URL` (recommended): API Gateway base, e.g. `http://<LAN_IP>:4001/api`
- `EXPO_PUBLIC_UPLOADTHING_URL` (optional)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional; reserved for future native Stripe SDK integration)

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

## Customer checkout flow

- Add items: Product details -> **Add to cart**
- Cart: Update qty/remove/clear -> **Checkout**
- Checkout:
  - **COD**: places order immediately
  - **Card (Stripe)**: uses backend Stripe **Checkout Session** (opens hosted payment page in the browser), then the app polls payment status and routes to success/failure.

Note: The backend currently returns a hosted Stripe Checkout URL (`/api/payments/:orderId/checkout-session`), not a PaymentIntent `clientSecret`. If you later switch to `@stripe/stripe-react-native` (in-app card entry), you will need a dev build (EAS) and backend support for PaymentIntents.

## E2E test steps

1) Browse products -> open product -> **Add to cart**
2) Open **Cart** tab -> update qty/remove/clear -> **Checkout**
3) Checkout with **COD** -> see success screen -> open **Orders** tab
4) Checkout with **Card (Stripe)** -> pay in browser -> return to app -> success/failure -> **Orders** tab updates

## Structure

- `app/` - Expo Router routes + layouts
- `src/components/` - reusable UI + layout
- `src/constants/` - `theme.ts`, `config.ts`
- `src/providers/` - theme provider
- `src/api/` - RTK Query slices
- `src/types/` - shared TypeScript types

