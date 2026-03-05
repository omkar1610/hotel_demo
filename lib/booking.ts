import { supabaseAdmin } from './db'
import { CONFIG } from './config'
import { calculatePrice } from './pricing'
import type { Booking, RoomType } from '@/types'

// ── Availability ─────────────────────────────────────────────────────────────

/**
 * Find all rooms of a given type that are free for the requested dates.
 * Uses standard overlap check: existing.check_in < new_check_out AND existing.check_out > new_check_in
 */
export async function findAvailableRoom(
  roomTypeId: string,
  checkIn: string,
  checkOut: string
): Promise<string | null> {
  // Get all room IDs for this room type that are marked as available
  const { data: rooms, error: roomsError } = await supabaseAdmin
    .from('rooms')
    .select('id')
    .eq('room_type_id', roomTypeId)
    .eq('status', 'available')

  if (roomsError || !rooms || rooms.length === 0) return null

  const roomIds = rooms.map((r) => r.id)

  // Find rooms that have a conflicting booking
  const { data: bookedRooms } = await supabaseAdmin
    .from('bookings')
    .select('room_id')
    .in('room_id', roomIds)
    .in('status', ['pending', 'confirmed'])
    .lt('check_in', checkOut)   // existing.check_in < new_check_out
    .gt('check_out', checkIn)   // existing.check_out > new_check_in

  const bookedIds = new Set((bookedRooms ?? []).map((b) => b.room_id))

  // Return the first room not in the booked set
  const freeRoom = rooms.find((r) => !bookedIds.has(r.id))
  return freeRoom?.id ?? null
}

// ── Booking Code ──────────────────────────────────────────────────────────────

/**
 * Generate a unique booking code: HTL-YYYY-NNNNN
 * Counts existing bookings in the current year to build the sequence number.
 */
export async function generateBookingCode(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `${CONFIG.BOOKING_CODE_PREFIX}-${year}-`

  const { count } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .like('booking_code', `${prefix}%`)

  const sequence = String((count ?? 0) + 1).padStart(5, '0')
  return `${prefix}${sequence}`
}

// ── Create Booking ────────────────────────────────────────────────────────────

export interface CreateBookingParams {
  userId: string
  roomTypeId: string
  checkIn: string
  checkOut: string
}

/**
 * Full booking creation flow:
 * 1. Find available room
 * 2. Calculate price
 * 3. Generate booking code
 * 4. Insert booking record (status: pending, payment: unpaid)
 */
export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const { userId, roomTypeId, checkIn, checkOut } = params

  // Validate dates
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.round(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (nights < CONFIG.MIN_STAY_NIGHTS || nights > CONFIG.MAX_STAY_NIGHTS) {
    throw new Error(`Stay must be between ${CONFIG.MIN_STAY_NIGHTS} and ${CONFIG.MAX_STAY_NIGHTS} nights`)
  }

  // Find an available room
  const roomId = await findAvailableRoom(roomTypeId, checkIn, checkOut)
  if (!roomId) throw new Error('No rooms available for selected dates')

  // Get room type pricing
  const { data: roomType, error: rtError } = await supabaseAdmin
    .from('room_types')
    .select('base_price')
    .eq('id', roomTypeId)
    .single<Pick<RoomType, 'base_price'>>()

  if (rtError || !roomType) throw new Error('Room type not found')

  const pricing = calculatePrice(roomType.base_price, nights)
  const bookingCode = await generateBookingCode()

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      booking_code: bookingCode,
      user_id: userId,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      nights,
      total_price: pricing.total,
      payment_status: 'unpaid',
      status: 'pending',
    })
    .select()
    .single<Booking>()

  if (error || !booking) throw new Error('Failed to create booking')

  return booking
}
