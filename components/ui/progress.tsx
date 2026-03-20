import { cn } from '@/lib/utils'

export interface ProgressProps {
  value: number          // 0-100
  max?: number
  variant?: 'default' | 'solana' | 'gradient' | 'success' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  animated?: boolean
  className?: string
}

const trackStyles = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const fillStyles = {
  default: 'bg-brand-purple',
  solana: 'bg-gradient-to-r from-solana-purple to-solana-green',
  gradient: 'bg-gradient-brand',
  success: 'bg-emerald-500',
  warning: 'bg-yellow-500',
}

export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  label,
  showValue = false,
  animated = true,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-white">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn(
        'w-full rounded-full overflow-hidden bg-dark-border',
        trackStyles[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            fillStyles[variant],
            animated && 'relative overflow-hidden',
          )}
          style={{ width: `${percentage}%` }}
        >
          {animated && percentage > 10 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  )
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  variant = 'default',
  children,
}: {
  value: number
  size?: number
  strokeWidth?: number
  variant?: 'default' | 'solana' | 'success'
  children?: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const strokeColors = {
    default: '#7c3aed',
    solana: '#9945FF',
    success: '#14F195',
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2a2a4a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
