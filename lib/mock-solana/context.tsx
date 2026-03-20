'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  generateMockSolanaAddress,
  generateMockTxHash,
  generateMockSlot,
  simulateMockTransaction,
  getStoredMockWallet,
  storeMockWallet,
  clearMockWallet,
  getMockExplorerUrl,
  type MockTransactionResult,
} from './wallet'

// ─── Context Types ────────────────────────────────────────────────────────────

export interface MockWalletContextType {
  // State
  connected: boolean
  address: string | null
  balance: number
  network: 'mock'
  isConnecting: boolean
  isSendingTransaction: boolean
  pendingTxHash: string | null

  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  sendMockTransaction: (options: SendTransactionOptions) => Promise<MockTransactionResult>
  refreshBalance: (newBalance: number) => void
}

export interface SendTransactionOptions {
  to: string
  amount: number  // in SOL
  memo?: string
  description?: string
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MockWalletContext = createContext<MockWalletContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MockWalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSendingTransaction, setIsSendingTransaction] = useState(false)
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null)

  // Restore wallet connection on mount
  useEffect(() => {
    const stored = getStoredMockWallet()
    if (stored?.connected && stored?.address) {
      setConnected(true)
      setAddress(stored.address)
    }
  }, [])

  const connect = useCallback(async () => {
    if (connected) return
    setIsConnecting(true)

    // Simulate wallet approval delay
    await new Promise(resolve => setTimeout(resolve, 1200))

    const newAddress = generateMockSolanaAddress()
    const wallet = {
      address: newAddress,
      connected: true,
      connectedAt: new Date().toISOString(),
      network: 'mock' as const,
    }

    storeMockWallet(wallet)
    setAddress(newAddress)
    setConnected(true)
    setIsConnecting(false)

    toast.success('Wallet connected!', {
      description: `${newAddress.slice(0, 4)}...${newAddress.slice(-4)} on ShowUp Network`,
    })
  }, [connected])

  const disconnect = useCallback(() => {
    clearMockWallet()
    setConnected(false)
    setAddress(null)
    setBalance(0)
    toast('Wallet disconnected', { icon: '👋' })
  }, [])

  const sendMockTransaction = useCallback(
    async (options: SendTransactionOptions): Promise<MockTransactionResult> => {
      if (!connected || !address) {
        return {
          success: false,
          txHash: '',
          slot: 0,
          fee: 0,
          confirmations: 0,
          timestamp: Date.now(),
          error: 'Wallet not connected',
        }
      }

      setIsSendingTransaction(true)
      const tempHash = generateMockTxHash()
      setPendingTxHash(tempHash)

      // Show pending toast
      const toastId = toast.loading('Processing transaction...', {
        description: `Sending ◎ ${options.amount.toFixed(4)} SOL`,
      })

      try {
        const result = await simulateMockTransaction({
          from: address,
          to: options.to,
          amount: options.amount,
          memo: options.memo,
        })

        if (result.success) {
          toast.success('Transaction confirmed!', {
            id: toastId,
            description: (
              <span>
                ◎ {options.amount.toFixed(4)} SOL sent •{' '}
                <a
                  href={getMockExplorerUrl(result.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on Explorer
                </a>
              </span>
            ) as unknown as string,
          })
        } else {
          toast.error('Transaction failed', {
            id: toastId,
            description: result.error,
          })
        }

        return result
      } finally {
        setIsSendingTransaction(false)
        setPendingTxHash(null)
      }
    },
    [connected, address]
  )

  const refreshBalance = useCallback((newBalance: number) => {
    setBalance(newBalance)
  }, [])

  return (
    <MockWalletContext.Provider
      value={{
        connected,
        address,
        balance,
        network: 'mock',
        isConnecting,
        isSendingTransaction,
        pendingTxHash,
        connect,
        disconnect,
        sendMockTransaction,
        refreshBalance,
      }}
    >
      {children}
    </MockWalletContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMockWallet() {
  const context = useContext(MockWalletContext)
  if (!context) {
    throw new Error('useMockWallet must be used within MockWalletProvider')
  }
  return context
}
