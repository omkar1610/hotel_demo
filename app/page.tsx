import Link from 'next/link'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import type { RoomType } from '@/types'

// Fetch room types for the preview section
async function getRoomTypes(): Promise<RoomType[]> {
  const { data } = await supabaseAdmin
    .from('room_types')
    .select('id, name, description, capacity, base_price, images')
    .order('base_price', { ascending: true })
    .limit(3)
  return data ?? []
}

const AMENITIES = [
  { icon: '🏊', label: 'Rooftop Pool' },
  { icon: '🍽️', label: 'Fine Dining' },
  { icon: '💆', label: 'Spa & Wellness' },
  { icon: '🏋️', label: 'Fitness Centre' },
  { icon: '🅿️', label: 'Valet Parking' },
  { icon: '📶', label: 'Free Wi-Fi' },
  { icon: '🛎️', label: '24/7 Concierge' },
  { icon: '🚗', label: 'Airport Transfer' },
]

export default async function LandingPage() {
  const roomTypes = await getRoomTypes()

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-brand-900">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 opacity-90" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <div className="inline-block bg-white/10 text-white text-sm px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            Luxury Stays · Best Rate Guaranteed
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Experience Exceptional<br />
            <span className="text-brand-100">Comfort & Style</span>
          </h1>
          <p className="text-brand-100 text-lg mb-10 leading-relaxed">
            Book your perfect stay at {CONFIG.SITE_NAME}. Modern rooms, world-class amenities,
            and seamless service — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="bg-white text-brand-700 px-8 py-4 rounded-xl font-semibold text-base hover:bg-brand-50 transition-colors shadow-lg"
            >
              Book Your Stay
            </Link>
            <a
              href="#rooms"
              className="border border-white/40 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              View Rooms
            </a>
          </div>
        </div>
      </section>

      {/* ── Room Previews ──────────────────────────────────────────────── */}
      <section id="rooms" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Rooms</h2>
            <p className="text-gray-500 text-lg">Thoughtfully designed for your comfort</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roomTypes.map((room) => (
              <div key={room.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                {/* Room image */}
                <div className="relative h-48 bg-gray-100">
                  {room.images?.[0] ? (
                    <Image
                      src={room.images[0]}
                      alt={room.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🛏️</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{room.name}</h3>
                    <span className="text-brand-600 font-bold">${room.base_price}<span className="text-gray-400 font-normal text-sm">/night</span></span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{room.description}</p>
                  <Link
                    href={`/booking?type=${room.id}`}
                    className="block text-center bg-brand-50 text-brand-700 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
                  >
                    Book This Room
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/booking"
              className="inline-block bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              See All Availability
            </Link>
          </div>
        </div>
      </section>

      {/* ── Amenities ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">World-Class Amenities</h2>
            <p className="text-gray-500 text-lg">Everything you need for a perfect stay</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {AMENITIES.map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gray-50 hover:bg-brand-50 transition-colors">
                <span className="text-3xl">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-brand-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready for Your Stay?</h2>
          <p className="text-brand-100 text-lg mb-8">
            Check availability and book in minutes. Secure payment via Stripe.
          </p>
          <Link
            href="/booking"
            className="inline-block bg-white text-brand-700 px-10 py-4 rounded-xl font-bold text-base hover:bg-brand-50 transition-colors shadow-lg"
          >
            Book Now — It's Easy
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} {CONFIG.SITE_NAME}. All rights reserved. · Demo project.
      </footer>
    </>
  )
}
