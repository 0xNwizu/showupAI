import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6 animate-float">🫥</div>
        <h1 className="text-4xl font-black text-white mb-3">
          404 — You ghosted us
        </h1>
        <p className="text-gray-400 mb-8">
          This page doesn't exist. Kind of like how some people ghost their hangout plans.
          Don't be that person.
        </p>
        <Link href="/dashboard">
          <Button variant="gradient" size="lg">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
