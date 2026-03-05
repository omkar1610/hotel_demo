import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/db'
import { signJWT, setAuthCookie, clearAuthCookie } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import type { ApiResponse, User } from '@/types'

// POST /api/auth?action=signup|login|logout
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  try {
    if (action === 'signup') return await handleSignup(req)
    if (action === 'login') return await handleLogin(req)
    if (action === 'logout') return await handleLogout()
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[auth]', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function handleSignup(req: NextRequest) {
  const body = await req.json()
  const { name, email, password, phone } = body

  if (!name || !email || !password) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Name, email and password required' }, { status: 400 })
  }

  // Check for existing account
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Email already registered' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, CONFIG.BCRYPT_ROUNDS)

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ name, email: email.toLowerCase(), phone: phone ?? null, password_hash, role: 'user' })
    .select('id, name, email, phone, role, created_at')
    .single<User>()

  if (error || !user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create account' }, { status: 500 })
  }

  const token = await signJWT({ userId: user.id, email: user.email, role: user.role })
  setAuthCookie(token)

  return NextResponse.json<ApiResponse<User>>({ success: true, data: user }, { status: 201 })
}

async function handleLogin(req: NextRequest) {
  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Email and password required' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, name, email, phone, role, created_at, password_hash')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signJWT({ userId: user.id, email: user.email, role: user.role })
  setAuthCookie(token)

  // Strip password_hash from response
  const { password_hash: _, ...safeUser } = user
  return NextResponse.json<ApiResponse<User>>({ success: true, data: safeUser as User })
}

async function handleLogout() {
  clearAuthCookie()
  return NextResponse.json<ApiResponse>({ success: true })
}
