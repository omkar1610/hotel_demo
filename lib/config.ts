// Single source of truth for all configuration.
// All env vars are read here — nowhere else in the app should access process.env directly.

export const CONFIG = {
  // ── Site ──────────────────────────────────────────────────────────────────
  SITE_NAME: 'Hotel Demo',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',

  // ── Supabase ──────────────────────────────────────────────────────────────
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',

  // ── Auth ──────────────────────────────────────────────────────────────────
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_EXPIRES_IN: '7d',          // Token lifetime
  AUTH_COOKIE_NAME: 'auth_token',

  // ── Razorpay ──────────────────────────────────────────────────────────────
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',

  // ── Pricing ───────────────────────────────────────────────────────────────
  GST_RATE: 0.18,               // 18% goods & services tax
  RAZORPAY_FEE_RATE: 0.02,      // 2% Razorpay processing fee (non-refundable)
  CURRENCY: 'INR',

  // ── Booking ───────────────────────────────────────────────────────────────
  BOOKING_CODE_PREFIX: 'HTL',
  MIN_STAY_NIGHTS: 1,
  MAX_STAY_NIGHTS: 30,
  CANCELLATION_HOURS: 24,       // Hours before check-in that cancellation is allowed

  // ── Email (Zoho SMTP placeholder) ─────────────────────────────────────────
  SMTP_HOST: 'smtp.zoho.com',
  SMTP_PORT: 587,
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  EMAIL_FROM: 'noreply@hoteldemo.com',

  // ── Security ──────────────────────────────────────────────────────────────
  BCRYPT_ROUNDS: 12,
} as const
