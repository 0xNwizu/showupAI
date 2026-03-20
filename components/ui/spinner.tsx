import { cn } from '@/lib/utils'

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <svg
      className={cn('animate-spin text-brand-purple', sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function LoadingPage({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-dark-border animate-spin-slow" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-brand-purple animate-spin" />
      </div>
      <p className="text-gray-400 animate-pulse">{message}</p>
    </div>
  )
}

export function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-end h-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand-purple-light animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-dark-border" />
        <div className="flex-1">
          <div className="h-4 bg-dark-border rounded-lg w-1/2 mb-2" />
          <div className="h-3 bg-dark-border rounded-lg w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('h-3 bg-dark-border rounded-lg mb-2', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
