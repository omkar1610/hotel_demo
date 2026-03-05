import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { sendBookingCancellation } from '@/lib/email'
import { CONFIG } from '@/lib/config'
import type { ApiResponse, Booking } from '@/types'

// DELETE /api/bookings/[id] — cancel a booking
// Users can only cancel their own bookings; admins can cancel any
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req)
    const { id } = params

    // Fetch the booking to verify ownership and status
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, room:rooms(room_type:room_types(name)), user:users(name, email)')
      .eq('id', id)
      .single<Booking & { user: { name: string; email: string } }>()

    if (fetchError || !booking) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Users can only cancel their own bookings
    if (user.role !== 'admin' && booking.user_id !== user.userId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Booking already cancelled' }, { status: 400 })
    }

    // Enforce cancellation policy: must be > 24h before check-in
    const checkIn = new Date(booking.check_in)
    const hoursUntilCheckIn = (checkIn.getTime() - Date.now()) / (1000 * 60 * 60)

    if (user.role !== 'admin' && hoursUntilCheckIn < CONFIG.CANCELLATION_HOURS) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Cancellations must be made at least ${CONFIG.CANCELLATION_HOURS} hours before check-in` },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to cancel booking' }, { status: 500 })
    }

    // Send cancellation email (non-blocking)
    sendBookingCancellation(booking as Parameters<typeof sendBookingCancellation>[0]).catch(console.error)

    return NextResponse.json<ApiResponse>({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[bookings DELETE]', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
