import { NextResponse } from 'next/server'

// This endpoint has been replaced by /api/razorpay/verify
// Stripe is not available in India — Razorpay is used instead.
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'This endpoint is deprecated. Use /api/razorpay/verify instead.' },
    { status: 410 }
  )
}
