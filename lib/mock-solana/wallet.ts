// ============================================
// ShowUp AI - Mock Solana Wallet
// Simulates Solana wallet behavior without real blockchain interaction
// Real Solana integration will replace this module later
// ============================================

import { v4 as uuidv4 } from 'uuid'

// ─── Mock Address Generation ──────────────────────────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export function generateMockSolanaAddress(): string {
  // Generate a realistic-looking Solana public key (44 chars, base58)
  let address = ''
  for (let i = 0; i < 44; i++) {
    address += BASE58_ALPHABET[Math.floor(Math.random() * BASE58_ALPHABET.length)]
  }
  return address
}

// ─── Mock Transaction Hash Generation ────────────────────────────────────────

export function generateMockTxHash(): string {
  // Real Solana tx hashes are 88 base58 chars
  let hash = ''
  for (let i = 0; i < 88; i++) {
    hash += BASE58_ALPHABET[Math.floor(Math.random() * BASE58_ALPHABET.length)]
  }
  return hash
}

// ─── Mock Slot Generation ─────────────────────────────────────────────────────

export function generateMockSlot(): number {
  // Solana is at ~280M+ slots currently
  return 280_000_000 + Math.floor(Math.random() * 1_000_000)
}

// ─── Mock Transaction Simulation ─────────────────────────────────────────────

export interface MockTransactionOptions {
  from: string
  to: string
  amount: number  // in SOL
  memo?: string
}

export interface MockTransactionResult {
  success: boolean
  txHash: string
  slot: number
  fee: number         // in SOL (approx 0.000005)
  confirmations: number
  timestamp: number
  error?: string
}

export async function simulateMockTransaction(
  options: MockTransactionOptions,
  delayMs = 2000
): Promise<MockTransactionResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, delayMs))

  // Simulate ~99% success rate
  const success = Math.random() > 0.01

  if (!success) {
    return {
      success: false,
      txHash: '',
      slot: 0,
      fee: 0,
      confirmations: 0,
      timestamp: Date.now(),
      error: 'Transaction simulation failed: insufficient funds or network error',
    }
  }

  return {
    success: true,
    txHash: generateMockTxHash(),
    slot: generateMockSlot(),
    fee: 0.000005,  // Solana's typical fee
    confirmations: 32,  // Finalized
    timestamp: Date.now(),
  }
}

// ─── Mock Wallet Storage ──────────────────────────────────────────────────────

const WALLET_STORAGE_KEY = 'showup_mock_wallet'

export interface StoredMockWallet {
  address: string
  connected: boolean
  connectedAt: string
  network: 'mock'
}

export function getStoredMockWallet(): StoredMockWallet | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function storeMockWallet(wallet: StoredMockWallet): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet))
}

export function clearMockWallet(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(WALLET_STORAGE_KEY)
}

// ─── SOL Utilities ────────────────────────────────────────────────────────────

export const LAMPORTS_PER_SOL = 1_000_000_000

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL)
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}

// ─── Explorer URL (pointing to devnet for visual purposes) ────────────────────

export function getMockExplorerUrl(txHash: string): string {
  return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
}

export function getMockAddressExplorerUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`
}

// ─── Mock Network Stats ───────────────────────────────────────────────────────

export interface MockNetworkStats {
  tps: number
  slot: number
  blockTime: number
  epochProgress: number
}

export function getMockNetworkStats(): MockNetworkStats {
  return {
    tps: 2847 + Math.floor(Math.random() * 500),
    slot: generateMockSlot(),
    blockTime: 400 + Math.floor(Math.random() * 100),
    epochProgress: Math.random() * 100,
  }
}
