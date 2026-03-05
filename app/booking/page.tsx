'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import DateSelector from '@/components/DateSelector'
import RoomCard from '@/components/RoomCard'
import BookingSummary from '@/components/BookingSummary'
import type { RoomType } from '@/types'

// Razorpay checkout is loaded as a script and exposed on window
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void
  prefill: { name: string; email: string }
  theme: { color: string }
  modal: { ondismiss: () => void }
}

// Multi-step booking flow: dates → room selection → auth → confirm → payment
type Step = 'dates' | 'rooms' | 'auth' | 'confirm'

function BookingPageInner() {
  const router = useRouter()
  const params = useSearchParams()

  const [step, setStep] = useState<Step>('dates')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [nights, setNights] = useState(0)
  const [availableRooms, setAvailableRooms] = useState<RoomType[]>([])
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auth form
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })

  // Pre-select a room type if passed via query param
  useEffect(() => {
    const typeId = params.get('type')
    if (typeId && availableRooms.length > 0) {
      const match = availableRooms.find((r) => r.id === typeId)
      if (match) setSelectedRoom(match)
    }
  }, [params, availableRooms])

  // ── Step 1: Search availability ──────────────────────────────────────────
  async function handleSearch(ci: string, co: string, n: number) {
    setLoading(true)
    setError('')
    setCheckIn(ci)
    setCheckOut(co)
    setNights(n)

    try {
      const res = await fetch(`/api/rooms?check_in=${ci}&check_out=${co}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setAvailableRooms(json.data)
      setStep('rooms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Select room → go to auth ─────────────────────────────────────
  function handleRoomSelect(room: RoomType) {
    setSelectedRoom(room)
    setStep('auth')
  }

  // ── Step 3: Login or signup ───────────────────────────────────────────────
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/auth?action=${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setStep('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 4: Confirm → create booking → open Razorpay popup ───────────────
  async function handleConfirmAndPay() {
    if (!selectedRoom) return
    setLoading(true)
    setError('')

    try {
      // 1. Create the booking record (status: pending, payment: unpaid)
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_type_id: selectedRoom.id,
          check_in: checkIn,
          check_out: checkOut,
        }),
      })
      const bookingJson = await bookingRes.json()
      if (!bookingJson.success) throw new Error(bookingJson.error)
      const bookingId = bookingJson.data.id

      // 2. Create a Razorpay order on the backend
      const orderRes = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      })
      const orderJson = await orderRes.json()
      if (!orderJson.success) throw new Error(orderJson.error)
      const { order_id, amount, currency, key_id, description } = orderJson.data

      setLoading(false)

      // 3. Open the Razorpay checkout popup
      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency,
        name: 'Hotel Demo',
        description,
        order_id,
        prefill: {
          name: authForm.name,
          email: authForm.email,
        },
        theme: { color: '#4361ee' },
        modal: {
          ondismiss: () => setError('Payment cancelled. You can try again.'),
        },
        handler: async (response) => {
          // 4. Send payment details to backend for HMAC verification
          setLoading(true)
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: bookingId,
              }),
            })
            const verifyJson = await verifyRes.json()
            if (!verifyJson.success) throw new Error(verifyJson.error)

            // 5. Success — redirect to dashboard
            router.push(`/dashboard?booking=${verifyJson.data.booking_code}&status=success`)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed')
            setLoading(false)
          }
        },
      })

      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // ── Step indicators ───────────────────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: 'dates', label: 'Dates' },
    { key: 'rooms', label: 'Room' },
    { key: 'auth', label: 'Account' },
    { key: 'confirm', label: 'Confirm' },
  ]

  const stepIndex = steps.findIndex((s) => s.key === step)

  return (
    <>
      {/* Load Razorpay checkout script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Stay</h1>
        <p className="text-gray-500 mb-8">Follow the steps below to complete your booking.</p>

        {/* Step bar */}
        <div className="flex gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i < stepIndex ? 'bg-green-500 text-white' : i === stepIndex ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === stepIndex ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* ── Step: Dates ─────────────────────────────────────────────── */}
        {step === 'dates' && (
          <DateSelector onSearch={handleSearch} loading={loading} />
        )}

        {/* ── Step: Rooms ─────────────────────────────────────────────── */}
        {step === 'rooms' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available
              </h2>
              <button onClick={() => setStep('dates')} className="text-sm text-gray-500 hover:text-gray-700">
                ← Change dates
              </button>
            </div>

            {availableRooms.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">😔</div>
                <p className="text-lg font-medium text-gray-600">No rooms available for these dates</p>
                <p className="text-sm mt-2">Try different dates or a longer stay.</p>
                <button
                  onClick={() => setStep('dates')}
                  className="mt-6 bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700"
                >
                  Change Dates
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    roomType={room}
                    nights={nights}
                    onSelect={handleRoomSelect}
                    selected={selectedRoom?.id === room.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step: Auth ──────────────────────────────────────────────── */}
        {step === 'auth' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {selectedRoom && (
              <BookingSummary
                roomType={selectedRoom}
                checkIn={checkIn}
                checkOut={checkOut}
                nights={nights}
              />
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {authMode === 'login' ? 'Log In' : 'Create Account'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {authMode === 'login' ? 'Log in to complete your booking.' : 'Create a free account to book.'}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Jane Smith"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Please wait…' : authMode === 'login' ? 'Log In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-500">
                {authMode === 'login' ? (
                  <>Don't have an account?{' '}
                    <button onClick={() => setAuthMode('signup')} className="text-brand-600 font-medium hover:underline">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => setAuthMode('login')} className="text-brand-600 font-medium hover:underline">
                      Log in
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setStep('rooms')}
                className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600"
              >
                ← Back to rooms
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Confirm ───────────────────────────────────────────── */}
        {step === 'confirm' && selectedRoom && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BookingSummary
              roomType={selectedRoom}
              checkIn={checkIn}
              checkOut={checkOut}
              nights={nights}
            />

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Confirm & Pay</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Review your booking and pay securely via Razorpay. UPI, cards, net banking, and wallets accepted.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-6">
                  The 2% processing fee is <strong>non-refundable</strong> even if you cancel.
                </div>
              </div>

              <button
                onClick={handleConfirmAndPay}
                disabled={loading}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Please wait…' : 'Pay with Razorpay →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading…</div>}>
      <BookingPageInner />
    </Suspense>
  )
}
