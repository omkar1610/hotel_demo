'use client'

import { useState } from 'react'

interface DateSelectorProps {
  onSearch: (checkIn: string, checkOut: string, nights: number) => void
  loading?: boolean
}

export default function DateSelector({ onSearch, loading }: DateSelectorProps) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState(tomorrow)
  const [error, setError] = useState('')

  function getNights(from: string, to: string) {
    return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const nights = getNights(checkIn, checkOut)
    if (nights < 1) {
      setError('Check-out must be after check-in')
      return
    }
    if (nights > 30) {
      setError('Maximum stay is 30 nights')
      return
    }

    onSearch(checkIn, checkOut, nights)
  }

  // When check-in changes, push check-out forward if needed
  function handleCheckInChange(val: string) {
    setCheckIn(val)
    if (val >= checkOut) {
      const next = new Date(new Date(val).getTime() + 86400000).toISOString().split('T')[0]
      setCheckOut(next)
    }
  }

  const nights = getNights(checkIn, checkOut)

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => handleCheckInChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          required
        />
      </div>

      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
        <input
          type="date"
          value={checkOut}
          min={checkIn || today}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          required
        />
      </div>

      <div className="text-center px-4">
        <div className="text-2xl font-bold text-brand-600">{nights > 0 ? nights : '--'}</div>
        <div className="text-xs text-gray-400">night{nights !== 1 ? 's' : ''}</div>
      </div>

      <button
        type="submit"
        disabled={loading || nights < 1}
        className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? 'Searching…' : 'Check Availability'}
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-1 w-full">{error}</p>
      )}
    </form>
  )
}
