'use client'

import { useState } from 'react'
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Zap } from 'lucide-react'
import { useMockWallet } from '@/lib/mock-solana/context'
import { truncateAddress, formatSOL, copyToClipboard } from '@/lib/utils'
import { getMockAddressExplorerUrl } from '@/lib/mock-solana/wallet'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface WalletButtonProps {
  balance?: number
  size?: 'sm' | 'md' | 'lg'
}

export function WalletButton({ balance = 0, size = 'md' }: WalletButtonProps) {
  const { connected, address, isConnecting, connect, disconnect } = useMockWallet()
  const [isOpen, setIsOpen] = useState(false)

  const handleCopy = async () => {
    if (!address) return
    const ok = await copyToClipboard(address)
    if (ok) toast.success('Address copied!')
    setIsOpen(false)
  }

  if (!connected) {
    return (
      <Button
        variant="solana"
        size={size}
        loading={isConnecting}
        onClick={connect}
        leftIcon={<Wallet className="w-4 h-4" />}
        className="relative overflow-hidden group"
      >
        <span className="relative z-10">
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-solana-purple to-solana-green opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-card border border-dark-border hover:border-solana-purple/50 transition-all duration-200 group"
      >
        {/* Network indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-solana-green animate-pulse" />
          <span className="text-xs text-gray-400 font-mono hidden sm:block">MOCK</span>
        </div>

        <div className="h-4 w-px bg-dark-border" />

        {/* Balance */}
        <span className="text-sm font-semibold text-solana-green">
          {formatSOL(balance, 3)}
        </span>

        <div className="h-4 w-px bg-dark-border" />

        {/* Address */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-solana flex items-center justify-center text-xs font-bold text-dark-bg">
            {address?.slice(0, 1)}
          </div>
          <span className="text-sm font-mono text-gray-300 hidden sm:block">
            {truncateAddress(address || '', 4)}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-dark-card border border-dark-border rounded-2xl shadow-card overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-dark-border bg-gradient-to-r from-solana-purple/10 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-solana flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-dark-bg" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Connected Wallet</p>
                  <p className="text-xs font-mono text-gray-300">{truncateAddress(address || '', 6)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Mock Balance</p>
                  <p className="text-lg font-bold text-solana-green">{formatSOL(balance, 4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Network</p>
                  <div className="flex items-center gap-1 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-solana-green animate-pulse" />
                    <p className="text-xs text-solana-green font-medium">ShowUp Mock</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="px-4 py-2 bg-yellow-500/5 border-b border-dark-border">
              <div className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-400/80">
                  Mock wallet — real Solana integration coming soon
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-dark-border transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy address
              </button>
              <a
                href={getMockAddressExplorerUrl(address || '')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-dark-border transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </a>
              <button
                onClick={() => { disconnect(); setIsOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
