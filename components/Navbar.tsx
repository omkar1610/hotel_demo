'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CONFIG } from '@/lib/config'

interface NavbarProps {
  user?: { name: string; role: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth?action=logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-brand-600 tracking-tight">
          {CONFIG.SITE_NAME}
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm">
          <Link href="/booking" className="text-gray-600 hover:text-brand-600 transition-colors">
            Book a Room
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-brand-600 transition-colors"
              >
                My Bookings
              </Link>

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-brand-600 transition-colors"
                >
                  Admin
                </Link>
              )}

              <span className="text-gray-400 text-xs hidden sm:block">{user.name}</span>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="text-gray-500 hover:text-red-500 transition-colors text-sm"
              >
                {loading ? 'Logging out…' : 'Log out'}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-brand-600 transition-colors">
                Log In
              </Link>
              <Link
                href="/booking"
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Book Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
