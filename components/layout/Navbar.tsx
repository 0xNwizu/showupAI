'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { WalletButton } from '@/components/wallet/WalletButton'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface NavbarProps {
  user: User | null
  unreadNudges?: number
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/groups', label: 'My Squads' },
]

export function Navbar({ user, unreadNudges = 0 }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-dark-border bg-dark-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-purple/30 group-hover:shadow-glow-purple transition-shadow">
              <span className="text-sm font-bold text-white">SU</span>
            </div>
            <span className="font-bold text-white text-lg hidden sm:block">
              ShowUp <span className="text-brand-purple-light">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname.startsWith(link.href)
                    ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                    : 'text-gray-400 hover:text-white hover:bg-dark-card'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Link
              href="/nudges"
              className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-card transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNudges > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-pink text-white text-xs flex items-center justify-center font-bold">
                  {unreadNudges > 9 ? '9+' : unreadNudges}
                </span>
              )}
            </Link>

            {/* Wallet */}
            {user && <WalletButton balance={user.mock_sol_balance} size="sm" />}

            {/* Avatar */}
            {user && (
              <Link href="/profile" className="hidden md:block">
                <Avatar
                  src={user.avatar_url}
                  name={user.display_name}
                  size="sm"
                  className="hover:ring-2 hover:ring-brand-purple/50 transition-all"
                />
              </Link>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-card transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dark-border bg-dark-card animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  pathname.startsWith(link.href)
                    ? 'bg-brand-purple/20 text-brand-purple-light'
                    : 'text-gray-400 hover:text-white hover:bg-dark-border'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-dark-border"
              >
                <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
                <span>{user.display_name}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
