import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'solana'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
}

const variantStyles = {
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  solana: 'bg-solana-purple/20 text-solana-purple border-solana-purple/30',
}

const dotColors = {
  default: 'bg-gray-400',
  success: 'bg-emerald-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
  info: 'bg-cyan-400',
  purple: 'bg-purple-400',
  solana: 'bg-solana-purple',
}

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-xs rounded-md',
  sm: 'px-2 py-0.5 text-xs rounded-lg',
  md: 'px-2.5 py-1 text-xs rounded-xl',
}

export function Badge({ className, variant = 'default', size = 'sm', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}
