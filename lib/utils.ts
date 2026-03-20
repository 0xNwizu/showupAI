import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore, addHours } from 'date-fns'

// ─── Class Name Utility ───────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a')
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isEventSoon(eventDate: string, hoursThreshold = 24): boolean {
  const now = new Date()
  const event = new Date(eventDate)
  const threshold = addHours(now, hoursThreshold)
  return isAfter(event, now) && isBefore(event, threshold)
}

export function isEventPast(eventDate: string): boolean {
  return isBefore(new Date(eventDate), new Date())
}

export function getCountdown(eventDate: string): string {
  const now = new Date()
  const event = new Date(eventDate)
  if (isBefore(event, now)) return 'Event has passed'
  return `in ${formatDistanceToNow(event)}`
}

// ─── SOL Formatting ───────────────────────────────────────────────────────────

export function formatSOL(amount: number, decimals = 4): string {
  return `◎ ${amount.toFixed(decimals)}`
}

export function formatSOLShort(amount: number): string {
  if (amount >= 1000) return `◎ ${(amount / 1000).toFixed(1)}K`
  return `◎ ${amount.toFixed(2)}`
}

export function solToUSD(sol: number, solPrice = 150): number {
  return sol * solPrice
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── String Utilities ─────────────────────────────────────────────────────────

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function getCommitmentPercentage(committed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((committed / total) * 100)
}

export function getReliabilityGrade(score: number): { grade: string; color: string } {
  if (score >= 95) return { grade: 'S', color: 'text-emerald-400' }
  if (score >= 85) return { grade: 'A', color: 'text-green-400' }
  if (score >= 70) return { grade: 'B', color: 'text-yellow-400' }
  if (score >= 55) return { grade: 'C', color: 'text-orange-400' }
  return { grade: 'F', color: 'text-red-400' }
}

// ─── Array Utilities ──────────────────────────────────────────────────────────

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const k = String(item[key])
    acc[k] = acc[k] ? [...acc[k], item] : [item]
    return acc
  }, {} as Record<string, T[]>)
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username)
}

// ─── Random Data Generation (for mock purposes) ───────────────────────────────

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// ─── Copy to Clipboard ────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ─── Event Type Helpers ───────────────────────────────────────────────────────

export function getEventEmoji(eventType: string | null): string {
  const map: Record<string, string> = {
    dinner: '🍽️',
    drinks: '🍹',
    outdoor: '🌳',
    movie: '🎬',
    gaming: '🎮',
    sports: '⚽',
    travel: '✈️',
    party: '🎉',
    cafe: '☕',
    concert: '🎵',
    other: '🌟',
  }
  return eventType ? (map[eventType] ?? '🌟') : '🌟'
}

export function getBudgetEmoji(budget: string | null): string {
  const map: Record<string, string> = {
    budget: '💚',
    moderate: '💛',
    splurge: '🧡',
    no_limit: '💜',
  }
  return budget ? (map[budget] ?? '💛') : '💛'
}
