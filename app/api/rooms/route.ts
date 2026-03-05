import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { findAvailableRoom } from '@/lib/booking'
import type { ApiResponse, RoomType } from '@/types'

// GET /api/rooms?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
// Returns room types that have at least one available room for the requested dates.
// Without dates, returns all room types (used by admin).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')

    const { data: roomTypes, error } = await supabaseAdmin
      .from('room_types')
      .select('id, name, description, capacity, base_price, images')
      .order('base_price', { ascending: true })

    if (error || !roomTypes) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch rooms' }, { status: 500 })
    }

    // If dates are provided, filter to only available room types
    if (checkIn && checkOut) {
      const available = await Promise.all(
        roomTypes.map(async (rt) => {
          const roomId = await findAvailableRoom(rt.id, checkIn, checkOut)
          return roomId ? rt : null
        })
      )
      const filtered = available.filter(Boolean) as RoomType[]
      return NextResponse.json<ApiResponse<RoomType[]>>({ success: true, data: filtered })
    }

    return NextResponse.json<ApiResponse<RoomType[]>>({ success: true, data: roomTypes })
  } catch (err) {
    console.error('[rooms GET]', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/rooms — Admin: update a room type (price, name, description, images)
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req)
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Room type ID required' }, { status: 400 })
    }

    // Only allow safe fields to be updated
    const allowed = ['name', 'description', 'capacity', 'base_price', 'images']
    const patch = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    )

    const { data, error } = await supabaseAdmin
      .from('room_types')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update room type' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({ success: true, data })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[rooms PATCH]', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/rooms — Admin: create a new room type
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req)
    const body = await req.json()
    const { name, description, capacity, base_price, images } = body

    if (!name || !capacity || !base_price) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'name, capacity and base_price required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('room_types')
      .insert({ name, description: description ?? '', capacity, base_price, images: images ?? [] })
      .select()
      .single()

    if (error) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create room type' }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({ success: true, data }, { status: 201 })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[rooms POST]', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
