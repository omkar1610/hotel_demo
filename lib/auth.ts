import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { CONFIG } from './config'
import type { JwtPayload, UserRole } from '@/types'

const secret = new TextEncoder().encode(CONFIG.JWT_SECRET)

// Sign a JWT with user data and a 7-day expiry
export async function signJWT(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(CONFIG.JWT_EXPIRES_IN)
    .sign(secret)
}

// Verify and decode a JWT — returns null if invalid or expired
export async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

// Set the auth cookie (httpOnly, secure in production)
export function setAuthCookie(token: string) {
  cookies().set(CONFIG.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  })
}

// Clear the auth cookie on logout
export function clearAuthCookie() {
  cookies().delete(CONFIG.AUTH_COOKIE_NAME)
}

// Extract and verify the current user from the request cookie.
// Returns null if not authenticated.
export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(CONFIG.AUTH_COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}

// Require authentication — throws a 401 response if not logged in
export async function requireAuth(req: NextRequest): Promise<JwtPayload> {
  const user = await getAuthUser(req)
  if (!user) {
    throw new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return user
}

// Require admin role — throws 403 if user is not admin
export async function requireAdmin(req: NextRequest): Promise<JwtPayload> {
  const user = await requireAuth(req)
  if (user.role !== 'admin') {
    throw new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return user
}

// Helper to read auth user from server component (uses cookie store directly)
export async function getServerUser(): Promise<JwtPayload | null> {
  const token = cookies().get(CONFIG.AUTH_COOKIE_NAME)?.value
  if (!token) return null
  return verifyJWT(token)
}
