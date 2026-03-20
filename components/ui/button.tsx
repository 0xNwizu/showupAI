import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'solana' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles = {
  primary: 'bg-brand-purple hover:bg-brand-purple-dark text-white shadow-glow-purple/30 hover:shadow-glow-purple',
  secondary: 'bg-dark-card hover:bg-dark-card-hover text-white border border-dark-border hover:border-dark-border-light',
  outline: 'border border-brand-purple text-brand-purple-light hover:bg-brand-purple/10',
  ghost: 'text-gray-400 hover:text-white hover:bg-dark-card',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  solana: 'bg-solana-purple hover:bg-solana-purple/80 text-white shadow-lg hover:shadow-solana-purple/40',
  gradient: 'bg-gradient-brand text-white hover:opacity-90 shadow-glow-purple/30 hover:shadow-glow-purple',
}

const sizeStyles = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1',
  sm: 'px-3 py-1.5 text-sm rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2',
  xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:ring-offset-2 focus:ring-offset-dark-bg',
          'active:scale-95',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'
