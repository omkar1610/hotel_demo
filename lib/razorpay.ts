import Razorpay from 'razorpay'
import { CONFIG } from './config'

// Single Razorpay instance used across all API routes
export const razorpay = new Razorpay({
  key_id: CONFIG.RAZORPAY_KEY_ID,
  key_secret: CONFIG.RAZORPAY_KEY_SECRET,
})
