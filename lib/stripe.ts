import Stripe from 'stripe'
import { CONFIG } from './config'

// Single Stripe instance used across all API routes
export const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
  typescript: true,
})
