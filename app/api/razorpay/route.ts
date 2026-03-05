import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { razorpay } from '@/lib/razorpay'
import { CONFIG } from '@/lib/config'
import type { ApiResponse, Booking } from '@/types'

// POST /api/razorpay — create a Razorpay order for a pending booking.
// The frontend uses the returned order_id to open the Razorpay checkout popup.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const { booking_id } = await req.json()

    if (!booking_id) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'booking_id required' }, { status: 400 })
    }

    // Verify the booking belongs to this user and is still unpaid
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, room:rooms(room_type:room_types(name))')
      .eq('id', booking_id)
      .eq('user_id', user.userId)
      .eq('payment_status', 'unpaid')
      .eq('status', 'pending')
      .single<Booking & { room: { room_type: { name: string } } }>()

    if (error || !booking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Booking not found or already paid' },
        { status: 404 }
      )
    }

    // Razorpay amount is in paise (1 INR = 100 paise)
    const order = await razorpay.orders.create({
      amount: Math.round(booking.total_price * 100),
      currency: CONFIG.CURRENCY,
      receipt: booking.booking_code,
      notes: {
        booking_id: booking.id,
        booking_code: booking.booking_code,
      },
    })

    return NextResponse.json<ApiResponse<{
      order_id: string
      amount: number
      currency: string
      key_id: string
      booking_code: string
      description: string
    }>>({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount as number,
        currency: order.currency,
        key_id: CONFIG.RAZORPAY_KEY_ID,
        booking_code: booking.booking_code,
        description: `${booking.room.room_type.name} — ${booking.nights} night${booking.nights > 1 ? 's' : ''}`,
      },
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[razorpay POST]', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
