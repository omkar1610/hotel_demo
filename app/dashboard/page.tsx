import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/db'
import DashboardClient from './DashboardClient'
import type { Booking } from '@/types'

// Server component: auth gate + data fetch
export default async function DashboardPage() {
  const user = await getServerUser()
  if (!user) redirect('/booking')

  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      room:rooms (
        room_type:room_types ( name, description, images )
      )
    `)
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })

  return <DashboardClient bookings={(bookings ?? []) as Booking[]} />
}
