import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import { getServerUser } from '@/lib/auth'
import { CONFIG } from '@/lib/config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: CONFIG.SITE_NAME,
  description: 'Luxury hotel booking — simple, fast, secure.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <Navbar user={user ? { name: user.email.split('@')[0], role: user.role } : null} />
        <main>{children}</main>
      </body>
    </html>
  )
}
