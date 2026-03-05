import type { RoomType, PriceBreakdown } from '@/types'
import { calculatePrice } from '@/lib/pricing'

interface BookingSummaryProps {
  roomType: RoomType
  checkIn: string
  checkOut: string
  nights: number
  bookingCode?: string
}

export default function BookingSummary({
  roomType,
  checkIn,
  checkOut,
  nights,
  bookingCode,
}: BookingSummaryProps) {
  const pricing: PriceBreakdown = calculatePrice(roomType.base_price, nights)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Booking Summary</h3>

      {bookingCode && (
        <div className="bg-brand-50 rounded-lg px-4 py-3">
          <div className="text-xs text-brand-600 font-medium">Booking Code</div>
          <div className="text-brand-800 font-bold font-mono tracking-wide">{bookingCode}</div>
        </div>
      )}

      {/* Room */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 uppercase tracking-wide">Room</div>
        <div className="font-medium text-gray-800">{roomType.name}</div>
        <div className="text-sm text-gray-500">{roomType.description}</div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Check-in</div>
          <div className="text-sm font-medium text-gray-800">{formatDate(checkIn)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Check-out</div>
          <div className="text-sm font-medium text-gray-800">{formatDate(checkOut)}</div>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>₹{roomType.base_price} × {nights} night{nights > 1 ? 's' : ''}</span>
          <span>₹{pricing.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>GST (18%)</span>
          <span>₹{pricing.gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>
            Processing fee (2%)
            <span className="ml-1 text-xs text-orange-500">(non-refundable)</span>
          </span>
          <span>₹{pricing.razorpay_fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
          <span>Total</span>
          <span>₹{pricing.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
