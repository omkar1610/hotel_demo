# Hotel Booking Demo

A production-ready hotel booking platform demo built for consulting portfolio purposes. Demonstrates a full booking system architecture — from landing page through Razorpay payment — in a clean, compact codebase.

## Live Features

- **Landing page** — hero, room previews, amenities, call-to-action
- **Room availability** — date-based search with double-booking prevention
- **Booking flow** — choose dates → select room → login/signup → Razorpay payment → confirmation
- **User dashboard** — view bookings, statuses, cancel bookings
- **Admin dashboard** — manage rooms, set prices, create room types, mark room unavailability

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | JWT in HttpOnly cookies |
| Payments | Razorpay (UPI, cards, net banking, wallets) |
| Email | Zoho SMTP (placeholder) |
| Hosting | Cloudflare Pages |

## Project Structure

```
app/                  # Next.js pages and API routes
  page.tsx            # Landing page
  booking/page.tsx    # Booking flow
  dashboard/page.tsx  # User dashboard
  admin/page.tsx      # Admin dashboard
  api/                # API route handlers
    auth/             # Login, signup, logout
    rooms/            # Room availability + admin CRUD
    bookings/         # Booking CRUD
    razorpay/         # Create order + HMAC payment verification
components/           # Reusable UI components
lib/                  # Server-side utilities
  config.ts           # All config constants (single source of truth)
  db.ts               # Supabase client (anon + admin)
  auth.ts             # JWT sign/verify + cookie helpers
  booking.ts          # Availability logic + booking creation
  razorpay.ts         # Razorpay client
  email.ts            # Email placeholder (Zoho SMTP)
types/index.ts        # Shared TypeScript interfaces
supabase/migration.sql # Database schema + seed data
```

## Getting Started

### 1. Clone and install

```bash
git clone <repo>
cd hotel_demo
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-32-char-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set up the database

Run the migration in your Supabase SQL editor:

```bash
# Copy contents of supabase/migration.sql and run in Supabase dashboard
# Or use Supabase CLI:
supabase db push
```

This creates all tables, RLS policies, and seed data (3 room types, 8 rooms, admin account).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Cloudflare Pages)

```bash
npm run build
# Output is in .next/standalone/
# Deploy via Cloudflare Pages connected to your git repo,
# or use @opennextjs/cloudflare for full edge compatibility.
# Set all environment variables in the CF Pages dashboard.
```

## Key Architecture Decisions

**Single config module** (`lib/config.ts`) — all environment variables and business constants in one place. No scattered `process.env` calls.

**Double-booking prevention** — availability query uses overlap logic:
```sql
existing.check_in < new_check_out AND existing.check_out > new_check_in
```

**Razorpay payment flow** — the backend creates an order, the frontend opens the Razorpay embedded popup (no redirect), then sends the payment response to the backend for HMAC-SHA256 signature verification before confirming the booking. Never trust the frontend result without this verification.

**Role-based access** — JWT payload includes `role`. Admin routes reject tokens where `role !== 'admin'`.

**Room number privacy** — users see room type names only. Room numbers (101, 102...) are only visible in the admin dashboard.

## Payment Flow

```
1. POST /api/razorpay        → backend creates Razorpay order
2. Razorpay popup opens      → user pays (UPI / card / net banking / wallet)
3. POST /api/razorpay/verify → backend verifies HMAC-SHA256 signature
4. Booking confirmed + email sent → redirect to dashboard
```

## Pricing

```
subtotal        = base_price x nights
GST             = subtotal x 18%
Processing fee  = subtotal x 2%  (non-refundable)
──────────────────────────────────────────────────
Total           = subtotal + GST + processing fee
```

Currency: INR

## Booking Code Format

`HTL-YYYY-NNNNN` (e.g., `HTL-2026-00021`)

## Default Admin Account

Seed data creates an admin account. Change credentials before any real deployment.

```
Email:    admin@hoteldemo.com
Password: admin123  <- change this
```

## License

MIT — free to use as a portfolio or starter template.
