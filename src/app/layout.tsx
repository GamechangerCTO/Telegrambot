/**
 * 🎨 Root Layout - Professional English-Only App
 * Clean professional interface for international development teams
 */

import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'TeleBots Pro - Sports Content Manager',
  description: 'AI-powered Telegram bot management platform for sports content',
  keywords: ['telegram', 'bot', 'sports', 'content', 'management', 'ai', 'international'],
  authors: [{ name: 'TeleBots Pro Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}