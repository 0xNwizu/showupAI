import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { MockWalletProvider } from '@/lib/mock-solana/context'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ShowUp AI — Social Hangout App',
    template: '%s | ShowUp AI',
  },
  description: 'Plan hangouts with friends using AI. Lock SOL deposits to commit. Show up, get paid back. Flake, lose it.',
  keywords: ['solana', 'social', 'hangout', 'AI', 'commitment', 'friends'],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    title: 'ShowUp AI',
    description: 'AI-powered social hangouts with SOL commitment deposits',
    siteName: 'ShowUp AI',
  },
}

export const viewport: Viewport = {
  themeColor: '#080812',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <MockWalletProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgb(18, 18, 31)',
                border: '1px solid rgb(42, 42, 74)',
                color: 'white',
              },
              classNames: {
                toast: 'rounded-2xl',
                title: 'text-white font-semibold',
                description: 'text-gray-400',
                actionButton: 'bg-brand-purple text-white',
                success: '!border-emerald-500/30',
                error: '!border-red-500/30',
              },
            }}
            richColors
          />
        </MockWalletProvider>
      </body>
    </html>
  )
}
