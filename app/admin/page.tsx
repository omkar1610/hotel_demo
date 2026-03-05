import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'
import AdminClient from './AdminClient'
import type { Room, RoomType, Booking } from '@/types'

// Server component: admin auth gate + data fetch
export default async function AdminPage() {
  const user = await getServerUser()
  if (!user || user.role !== 'admin') redirect('/')

  const [roomsResult, roomTypesResult, bookingsResult] = await Promise.all([
    supabaseAdmin
      .from('rooms')
      .select('*, room_type:room_types(*)')
      .order('room_number'),

    supabaseAdmin
      .from('room_types')
      .select('*')
      .order('base_price'),

    supabaseAdmin
      .from('bookings')
      .select(`
        *,
        room:rooms ( room_number, room_type:room_types ( name ) ),
        user:users ( name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <AdminClient
      rooms={(roomsResult.data ?? []) as (Room & { room_type: RoomType })[]}
      roomTypes={(roomTypesResult.data ?? []) as RoomType[]}
      bookings={(bookingsResult.data ?? []) as Booking[]}
    />
  )
}
