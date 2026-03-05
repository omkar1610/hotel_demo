'use client'

import { useState } from 'react'
import type { Booking } from '@/types'

interface Props {
  bookings: Booking[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const PAYMENT_STYLES: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-blue-100 text-blue-700',
}

export default function DashboardClient({ bookings: initial }: Props) {
  const [bookings, setBookings] = useState(initial)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleCancel(id: string) {
    if (!confirm('Cancel this booking? The Razorpay processing fee is non-refundable.')) return
    setCancelling(id)
    setError('')

    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setCancelling(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
      <p className="text-gray-500 mb-8">All your reservations in one place.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🛏️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h2>
          <p className="text-gray-500 mb-6">Book your first stay and it will appear here.</p>
          <a
            href="/booking"
            className="inline-block bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            Book a Room
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const roomType = (booking as any).room?.room_type
            return (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="font-mono text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-1 rounded-full">
                        {booking.booking_code}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[booking.status]}`}>
                        {booking.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STYLES[booking.payment_status]}`}>
                        {booking.payment_status}
                      </span>
                    </div>

                    {/* Room name */}
                    {roomType && (
                      <p className="font-semibold text-gray-900 mb-1">{roomType.name}</p>
                    )}

                    {/* Dates */}
                    <p className="text-sm text-gray-500">
                      {formatDate(booking.check_in)} → {formatDate(booking.check_out)} &nbsp;·&nbsp; {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Price + cancel */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">${booking.total_price.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mb-3">total incl. taxes</div>

                    {booking.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelling === booking.id}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {cancelling === booking.id ? 'Cancelling…' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
