import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { createBooking } from '@/lib/booking'
import type { ApiResponse, Booking } from '@/types'

// GET /api/bookings — returns bookings for the current user (or all bookings for admin)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)

    const query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        room:rooms (
          room_number,
          room_type:room_types ( name, description, images )
        )
      `)
      .order('created_at', { ascending: false })

    // Regular users only see their own bookings; admins see all
    if (user.role !== 'admin') {
      query.eq('user_id', user.userId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
    }

    // Strip room_number from results for non-admin users
    const bookings = user.role === 'admin'
      ? data
      : data?.map(({ room, ...b }) => ({
          ...b,
          room: { room_type: room?.room_type },
        }))

    return NextResponse.json<ApiResponse<typeof bookings>>({ success: true, data: bookings })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[bookings GET]', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bookings — create a new booking (status: pending, payment: unpaid)
// Stripe payment is handled separately via /api/stripe
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const { room_type_id, check_in, check_out } = body

    if (!room_type_id || !check_in || !check_out) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'room_type_id, check_in and check_out required' },
        { status: 400 }
      )
    }

    // Validate date format and logical order
    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid date format' }, { status: 400 })
    }
    if (checkInDate < today) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Check-in cannot be in the past' }, { status: 400 })
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Check-out must be after check-in' }, { status: 400 })
    }

    const booking = await createBooking({
      userId: user.userId,
      roomTypeId: room_type_id,
      checkIn: check_in,
      checkOut: check_out,
    })

    return NextResponse.json<ApiResponse<Booking>>({ success: true, data: booking }, { status: 201 })
  } catch (err) {
    if (err instanceof Response) return err
    const message = err instanceof Error ? err.message : 'Failed to create booking'
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 })
  }
}
