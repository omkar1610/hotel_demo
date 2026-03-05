'use client'

import { useState } from 'react'
import AdminRoomTable from '@/components/AdminRoomTable'
import type { Room, RoomType, Booking } from '@/types'

interface Props {
  rooms: (Room & { room_type: RoomType })[]
  roomTypes: RoomType[]
  bookings: Booking[]
}

type Tab = 'rooms' | 'room-types' | 'bookings'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function AdminClient({ rooms: initRooms, roomTypes: initRoomTypes, bookings }: Props) {
  const [tab, setTab] = useState<Tab>('rooms')
  const [rooms, setRooms] = useState(initRooms)
  const [roomTypes, setRoomTypes] = useState(initRoomTypes)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ── Room status change ──────────────────────────────────────────────────
  function handleRoomStatusChange(roomId: string, status: Room['status']) {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status } : r)))
  }

  // ── Edit room type price inline ─────────────────────────────────────────
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string } | null>(null)

  async function handlePriceSave(id: string) {
    if (!editingPrice) return
    const price = parseFloat(editingPrice.value)
    if (isNaN(price) || price <= 0) {
      setError('Invalid price')
      return
    }

    const res = await fetch('/api/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, base_price: price }),
    })
    const json = await res.json()
    if (json.success) {
      setRoomTypes((prev) => prev.map((rt) => (rt.id === id ? { ...rt, base_price: price } : rt)))
      setRooms((prev) => prev.map((r) => r.room_type_id === id ? { ...r, room_type: { ...r.room_type, base_price: price } } : r))
      setSuccess('Price updated')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(json.error)
    }
    setEditingPrice(null)
  }

  // ── Create new room type ────────────────────────────────────────────────
  const [newRoomType, setNewRoomType] = useState({ name: '', description: '', capacity: '', base_price: '' })
  const [creating, setCreating] = useState(false)

  async function handleCreateRoomType(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoomType.name,
        description: newRoomType.description,
        capacity: parseInt(newRoomType.capacity),
        base_price: parseFloat(newRoomType.base_price),
        images: [],
      }),
    })
    const json = await res.json()
    if (json.success) {
      setRoomTypes((prev) => [...prev, json.data])
      setNewRoomType({ name: '', description: '', capacity: '', base_price: '' })
      setSuccess('Room type created')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(json.error)
    }
    setCreating(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Manage rooms, pricing, and bookings.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {success}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-2 mb-8">
        <button className={tabClass('rooms')} onClick={() => setTab('rooms')}>
          Rooms ({rooms.length})
        </button>
        <button className={tabClass('room-types')} onClick={() => setTab('room-types')}>
          Room Types ({roomTypes.length})
        </button>
        <button className={tabClass('bookings')} onClick={() => setTab('bookings')}>
          Bookings ({bookings.length})
        </button>
      </div>

      {/* ── Tab: Rooms ─────────────────────────────────────────────── */}
      {tab === 'rooms' && (
        <AdminRoomTable rooms={rooms} onStatusChange={handleRoomStatusChange} />
      )}

      {/* ── Tab: Room Types ────────────────────────────────────────── */}
      {tab === 'room-types' && (
        <div className="space-y-6">
          {/* Existing room types */}
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Capacity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Price / night</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Images</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roomTypes.map((rt) => (
                  <tr key={rt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{rt.name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{rt.description}</td>
                    <td className="px-4 py-3 text-gray-600">{rt.capacity}</td>
                    <td className="px-4 py-3">
                      {editingPrice?.id === rt.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingPrice.value}
                            onChange={(e) => setEditingPrice({ id: rt.id, value: e.target.value })}
                            className="w-24 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                          <button
                            onClick={() => handlePriceSave(rt.id)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPrice(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">${rt.base_price}</span>
                          <button
                            onClick={() => setEditingPrice({ id: rt.id, value: String(rt.base_price) })}
                            className="text-brand-500 hover:text-brand-700 text-xs"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {rt.images?.length ?? 0} image{(rt.images?.length ?? 0) !== 1 ? 's' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Create new room type */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Create New Room Type</h3>
            <form onSubmit={handleCreateRoomType} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  required
                  value={newRoomType.name}
                  onChange={(e) => setNewRoomType({ ...newRoomType, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Deluxe Suite"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Base Price / Night ($)</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={newRoomType.base_price}
                  onChange={(e) => setNewRoomType({ ...newRoomType, base_price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="299"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Capacity (guests)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newRoomType.capacity}
                  onChange={(e) => setNewRoomType({ ...newRoomType, capacity: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input
                  value={newRoomType.description}
                  onChange={(e) => setNewRoomType({ ...newRoomType, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Spacious room with city views…"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create Room Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tab: Bookings ──────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Guest</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Room</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Dates</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nights</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => {
                const bAny = b as any
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.booking_code}</td>
                    <td className="px-4 py-3 text-gray-700">{bAny.user?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {bAny.room?.room_number} · {bAny.room?.room_type?.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(b.check_in)} – {formatDate(b.check_out)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.nights}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">${b.total_price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
