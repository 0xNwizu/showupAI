import { cn } from '@/lib/utils'
import { type HTMLAttributes, forwardRef } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'bordered' | 'hover' | 'glow'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantStyles = {
  default: 'bg-dark-card border border-dark-border',
  glass: 'bg-glass backdrop-blur-md border border-white/10',
  gradient: 'bg-card-gradient border border-brand-purple/20',
  bordered: 'bg-dark-card border-2 border-brand-purple/30',
  hover: 'bg-dark-card border border-dark-border hover:border-brand-purple/40 hover:shadow-card-hover cursor-pointer',
  glow: 'bg-dark-card border border-brand-purple/30 shadow-glow-purple/20',
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200 shadow-card',
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-gray-400', className)} {...props}>
      {children}
    </p>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mt-4 pt-4 border-t border-dark-border', className)} {...props}>
      {children}
    </div>
  )
}

export function CardSection({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('py-3 border-b border-dark-border last:border-0', className)} {...props}>
      {children}
    </div>
  )
}
