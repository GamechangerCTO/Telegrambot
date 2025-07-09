/**
 * 🎨 Root Layout - Modern Multilingual App
 * Complete rebuild with I18n provider and modern styling
 */

import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/useI18n'
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
  keywords: ['telegram', 'bot', 'sports', 'content', 'management', 'multilingual', 'ai'],
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
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased h-full font-sans`}>
        <I18nProvider>
          <AuthProvider>
            <div id="root" className="h-full">
              {children}
            </div>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}