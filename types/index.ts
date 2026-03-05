// Shared TypeScript interfaces for the entire application

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  created_at: string
}

export interface RoomType {
  id: string
  name: string
  description: string
  capacity: number
  base_price: number
  images: string[]  // Array of Supabase storage URLs
}

export interface Room {
  id: string
  room_type_id: string
  room_number: string
  status: 'available' | 'unavailable' | 'maintenance'
  room_type?: RoomType  // Joined from room_types
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export interface Booking {
  id: string
  booking_code: string
  user_id: string
  room_id: string
  check_in: string   // ISO date string YYYY-MM-DD
  check_out: string  // ISO date string YYYY-MM-DD
  nights: number
  total_price: number
  payment_status: PaymentStatus
  razorpay_payment_id: string | null
  status: BookingStatus
  created_at: string
  room?: Room & { room_type: RoomType }  // Joined
  user?: User  // Joined (admin view)
}

// JWT token payload
export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}

// Standardised API response wrapper
export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
}

// Price breakdown shown on checkout
export interface PriceBreakdown {
  subtotal: number
  gst: number
  razorpay_fee: number
  total: number
  nights: number
  base_price_per_night: number
}

// Request body for creating a booking
export interface CreateBookingInput {
  room_type_id: string
  check_in: string
  check_out: string
}
