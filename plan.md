# Hotel Booking Demo — Build Plan

## Overview
Production-ready but compact hotel booking demo for a consulting portfolio.
Stack: Next.js 14 App Router · Supabase · Stripe · JWT · Tailwind · TypeScript · Cloudflare Pages

---

## Folder Structure

```
hotel_demo/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── booking/page.tsx          # Booking flow (dates → rooms → payment)
│   ├── dashboard/page.tsx        # User: my bookings
│   ├── admin/page.tsx            # Admin: room management
│   ├── api/
│   │   ├── auth/route.ts         # POST /login, POST /signup, POST /logout
│   │   ├── rooms/route.ts        # GET /rooms?check_in&check_out
│   │   ├── bookings/route.ts     # GET/POST /bookings
│   │   ├── bookings/[id]/route.ts# DELETE (cancel)
│   │   ├── stripe/route.ts       # POST create-checkout-session
│   │   └── stripe/webhook/route.ts # POST stripe webhook
│   └── layout.tsx                # Root layout with Navbar
├── components/
│   ├── Navbar.tsx                # Site navigation + auth state
│   ├── RoomCard.tsx              # Room type card with book button
│   ├── DateSelector.tsx          # Check-in / check-out date picker
│   ├── BookingSummary.tsx        # Price breakdown (room + GST + Stripe fee)
│   └── AdminRoomTable.tsx        # Admin table for managing rooms
├── lib/
│   ├── config.ts                 # All env vars + business constants
│   ├── db.ts                     # Supabase client (singleton)
│   ├── auth.ts                   # JWT sign/verify, cookie helpers
│   ├── booking.ts                # Availability check + booking creation logic
│   ├── stripe.ts                 # Stripe client setup
│   └── email.ts                  # Placeholder Zoho SMTP email sender
├── types/
│   └── index.ts                  # All shared TypeScript interfaces
├── styles/
│   └── globals.css               # Tailwind base + custom tokens
├── supabase/
│   └── migration.sql             # Full DB schema
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── .env.example
```

---

## Build Order

### Phase 1 — Foundation
1. `package.json` — dependencies (next, react, supabase-js, stripe, jose, bcryptjs, tailwind)
2. `tsconfig.json` — strict TypeScript
3. `next.config.js` — edge runtime, CF Pages output
4. `tailwind.config.js` + `styles/globals.css`
5. `.env.example`

### Phase 2 — Types & Config
6. `types/index.ts` — User, RoomType, Room, Booking, ApiResponse interfaces
7. `lib/config.ts` — CONFIG object with all secrets/constants

### Phase 3 — Lib Utilities
8. `lib/db.ts` — createClient from @supabase/supabase-js
9. `lib/auth.ts` — signJWT, verifyJWT, setAuthCookie, getAuthUser
10. `lib/booking.ts` — checkAvailability, createBooking, generateBookingCode
11. `lib/stripe.ts` — Stripe instance
12. `lib/email.ts` — sendBookingConfirmation (placeholder)

### Phase 4 — API Routes
13. `app/api/auth/route.ts` — signup, login, logout
14. `app/api/rooms/route.ts` — list available room types
15. `app/api/bookings/route.ts` — list & create bookings
16. `app/api/bookings/[id]/route.ts` — cancel booking
17. `app/api/stripe/route.ts` — create Stripe checkout session
18. `app/api/stripe/webhook/route.ts` — confirm payment, update booking

### Phase 5 — Components
19. `components/Navbar.tsx`
20. `components/RoomCard.tsx`
21. `components/DateSelector.tsx`
22. `components/BookingSummary.tsx`
23. `components/AdminRoomTable.tsx`

### Phase 6 — Pages
24. `app/layout.tsx`
25. `app/page.tsx` — Landing: hero, room previews, amenities, CTA
26. `app/booking/page.tsx` — Multi-step: dates → available rooms → confirm
27. `app/dashboard/page.tsx` — User bookings list + cancel
28. `app/admin/page.tsx` — Admin: rooms table, price edit, create room type

### Phase 7 — Database
29. `supabase/migration.sql` — users, room_types, rooms, bookings tables + RLS policies

---

## Key Business Rules

### Availability Check
```sql
-- A room is unavailable if any booking overlaps:
existing.check_in < new_check_out AND existing.check_out > new_check_in
```

### Pricing Formula
```
subtotal    = base_price × nights
gst         = subtotal × GST_RATE (0.18)
stripe_fee  = subtotal × STRIPE_FEE (0.029)  ← non-refundable
total       = subtotal + gst + stripe_fee
```

### Booking Code Format
`HTL-YYYY-NNNNN` (e.g., HTL-2026-00021)
Generated server-side: current year + zero-padded count.

### Auth Flow
- Passwords hashed with bcrypt (saltRounds = 12)
- JWT signed with HS256, stored in httpOnly cookie (`auth_token`)
- Token payload: `{ userId, role, email }`
- Admin routes check `role === 'admin'`

### Stripe Flow
1. Frontend POSTs to `/api/stripe` → gets `sessionUrl`
2. Redirect to Stripe Checkout
3. On success, Stripe POSTs to `/api/stripe/webhook`
4. Webhook verifies signature → updates booking `payment_status = paid`, `status = confirmed`
5. Never trust the frontend success redirect for payment confirmation

### Room Privacy
- Users only see room **type** names (Deluxe, Premium, Suite)
- Admins see individual room numbers (101, 102, 103...)

---

## Security Checklist
- [x] bcrypt password hashing
- [x] JWT in httpOnly cookie (no localStorage)
- [x] Admin-only routes protected by role check
- [x] Stripe webhook signature verification
- [x] Input validation on all API routes
- [x] No room numbers exposed to users
- [x] Double-booking prevention via overlap query

---

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SITE_URL=
```
