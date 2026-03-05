import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config'

// Public client — uses anon key, respects Supabase RLS policies.
// Safe to use in server components and API routes for user-scoped queries.
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

// Admin client — uses service role key, bypasses RLS.
// Use ONLY in server-side code (API routes) for admin operations.
export const supabaseAdmin = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
