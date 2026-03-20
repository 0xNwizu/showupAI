'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function JoinByCode() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toLowerCase()
    if (!trimmed) return

    setLoading(true)
    const res = await fetch(`/api/join?code=${encodeURIComponent(trimmed)}`)
    setLoading(false)

    if (!res.ok) {
      toast.error('Invalid invite code', { description: 'Double-check the code and try again.' })
      return
    }

    router.push(`/join/${trimmed}`)
  }

  return (
    <form onSubmit={handleJoin} className="flex items-center gap-2">
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-f0-9]/g, ''))}
          placeholder="Enter invite code"
          maxLength={12}
          className="pl-9 pr-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple transition-colors w-44 font-mono"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm" loading={loading} disabled={!code.trim()}>
        Join
      </Button>
    </form>
  )
}
