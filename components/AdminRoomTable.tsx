'use client'

import { useState } from 'react'
import type { Room, RoomType } from '@/types'

interface AdminRoomTableProps {
  rooms: (Room & { room_type: RoomType })[]
  onStatusChange: (roomId: string, status: Room['status']) => void
}

export default function AdminRoomTable({ rooms, onStatusChange }: AdminRoomTableProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  async function handleStatusChange(roomId: string, status: Room['status']) {
    setUpdating(roomId)
    try {
      await fetch('/api/admin/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, status }),
      })
      onStatusChange(roomId, status)
    } finally {
      setUpdating(null)
    }
  }

  const statusBadge: Record<Room['status'], string> = {
    available: 'bg-green-100 text-green-700',
    unavailable: 'bg-red-100 text-red-700',
    maintenance: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Room #</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Capacity</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Price / night</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rooms.map((room) => (
            <tr key={room.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-gray-800">{room.room_number}</td>
              <td className="px-4 py-3 text-gray-700">{room.room_type.name}</td>
              <td className="px-4 py-3 text-gray-500">{room.room_type.capacity} guests</td>
              <td className="px-4 py-3 text-gray-700 font-medium">${room.room_type.base_price}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[room.status]}`}>
                  {room.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={room.status}
                  onChange={(e) => handleStatusChange(room.id, e.target.value as Room['status'])}
                  disabled={updating === room.id}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
