import Image from 'next/image'
import type { RoomType, PriceBreakdown } from '@/types'
import { calculatePrice } from '@/lib/pricing'

interface RoomCardProps {
  roomType: RoomType
  nights?: number
  onSelect?: (roomType: RoomType) => void
  selected?: boolean
}

export default function RoomCard({ roomType, nights = 1, onSelect, selected }: RoomCardProps) {
  const pricing: PriceBreakdown = calculatePrice(roomType.base_price, nights)
  const hasImage = roomType.images && roomType.images.length > 0

  return (
    <div
      className={`
        bg-white rounded-xl border-2 overflow-hidden transition-all duration-200
        ${selected ? 'border-brand-500 shadow-lg' : 'border-gray-100 shadow-sm hover:border-brand-300 hover:shadow-md'}
        ${onSelect ? 'cursor-pointer' : ''}
      `}
      onClick={() => onSelect?.(roomType)}
    >
      {/* Room image */}
      <div className="relative h-48 bg-gray-100">
        {hasImage ? (
          <Image
            src={roomType.images[0]}
            alt={roomType.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
            🏨
          </div>
        )}
        {selected && (
          <div className="absolute top-3 right-3 bg-brand-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            Selected
          </div>
        )}
      </div>

      {/* Room details */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{roomType.name}</h3>
          <div className="text-right shrink-0">
            <div className="text-brand-600 font-bold text-lg">₹{roomType.base_price}</div>
            <div className="text-gray-400 text-xs">/ night</div>
          </div>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {roomType.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <span className="text-gray-400">👤</span>
            Up to {roomType.capacity} guests
          </span>
        </div>

        {/* Price breakdown (shown when selecting for a stay) */}
        {nights > 1 && (
          <div className="border-t border-gray-50 pt-3 mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>₹{roomType.base_price} × {nights} nights</span>
              <span>₹{pricing.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>GST (18%)</span>
              <span>₹{pricing.gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Processing fee (non-refundable)</span>
              <span>₹{pricing.razorpay_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>₹{pricing.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {onSelect && (
          <button
            className={`
              w-full mt-4 py-2.5 rounded-lg font-medium text-sm transition-colors
              ${selected
                ? 'bg-brand-600 text-white'
                : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }
            `}
          >
            {selected ? 'Selected' : 'Select Room'}
          </button>
        )}
      </div>
    </div>
  )
}
