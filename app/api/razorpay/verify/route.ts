import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sendBookingConfirmation } from '@/lib/email'
import { CONFIG } from '@/lib/config'
import type { ApiResponse } from '@/types'

// POST /api/razorpay/verify
// Called by the frontend after the Razorpay popup reports a successful payment.
// We verify the HMAC signature server-side before trusting the payment.
// Never trust the frontend payment result without this verification.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing payment verification fields' },
        { status: 400 }
      )
    }

    // HMAC-SHA256 verification:
    // expected = HMAC(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('[razorpay verify] Signature mismatch for booking', booking_id)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Signature is valid — update booking to confirmed + paid
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        razorpay_payment_id,
      })
      .eq('id', booking_id)
      .eq('user_id', user.userId)  // ensure user owns this booking
      .select('*, room:rooms(room_type:room_types(name)), user:users(name, email)')
      .single()

    if (error || !booking) {
      console.error('[razorpay verify] Failed to update booking:', error)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to confirm booking' },
        { status: 500 }
      )
    }

    // Send confirmation email (non-blocking)
    sendBookingConfirmation(booking as Parameters<typeof sendBookingConfirmation>[0]).catch(console.error)

    return NextResponse.json<ApiResponse<{ booking_code: string }>>({
      success: true,
      data: { booking_code: booking.booking_code },
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[razorpay verify]', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
