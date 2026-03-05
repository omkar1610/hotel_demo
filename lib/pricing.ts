// Pure pricing utility — no DB imports, safe to use in client components.
import { CONFIG } from './config'
import type { PriceBreakdown } from '@/types'

export function calculatePrice(basePrice: number, nights: number): PriceBreakdown {
  const subtotal = basePrice * nights
  const gst = subtotal * CONFIG.GST_RATE
  const razorpay_fee = subtotal * CONFIG.RAZORPAY_FEE_RATE
  const total = subtotal + gst + razorpay_fee

  return {
    subtotal: round(subtotal),
    gst: round(gst),
    razorpay_fee: round(razorpay_fee),
    total: round(total),
    nights,
    base_price_per_night: basePrice,
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}
