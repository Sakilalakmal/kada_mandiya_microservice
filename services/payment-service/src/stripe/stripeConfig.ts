function requiredEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getStripeWebhookSecret(): string {
  return requiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripeCheckoutMode(): "payment" | "subscription" {
  const mode = String(process.env.STRIPE_CHECKOUT_MODE ?? "payment").toLowerCase();
  return mode === "subscription" ? "subscription" : "payment";
}

export function getStripeCurrency(): string {
  const currency = (process.env.STRIPE_CURRENCY ?? "LKR").trim();
  return currency.length ? currency : "LKR";
}

function applyOrderIdTemplate(url: string, orderId: string) {
  return url.split("{ORDER_ID}").join(encodeURIComponent(orderId));
}

export function getStripeSuccessUrl(orderId: string) {
  const template = process.env.STRIPE_SUCCESS_URL ?? "http://localhost:3000/payment/success?orderId={ORDER_ID}";
  return applyOrderIdTemplate(template, orderId);
}

export function getStripeCancelUrl(orderId: string) {
  const template = process.env.STRIPE_CANCEL_URL ?? "http://localhost:3000/payment/failed?orderId={ORDER_ID}";
  return applyOrderIdTemplate(template, orderId);
}

export function toStripeCurrencyCode(currency: string) {
  return String(currency ?? "").trim().toLowerCase() || "usd";
}

export function toStripeMinorAmount(amountMajor: number) {
  if (!Number.isFinite(amountMajor)) throw new Error("Invalid amount");
  return Math.max(0, Math.round(amountMajor * 100));
}
