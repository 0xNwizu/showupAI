import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, inputSize = 'md', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const sizeStyles = {
      sm: 'py-1.5 text-sm',
      md: 'py-2.5 text-sm',
      lg: 'py-3.5 text-base',
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border transition-all duration-200',
              'bg-dark-card text-white placeholder:text-gray-500',
              'border-dark-border focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              leftIcon ? 'pl-10' : 'pl-4',
              rightElement ? 'pr-10' : 'pr-4',
              sizeStyles[inputSize],
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-xl border transition-all duration-200',
            'bg-dark-card text-white placeholder:text-gray-500',
            'border-dark-border focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20',
            'focus:outline-none resize-none',
            'px-4 py-2.5 text-sm',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
