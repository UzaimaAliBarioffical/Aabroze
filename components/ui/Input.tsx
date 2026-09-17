import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn('form-input', error && 'border-red-400 focus:border-red-400 focus:ring-red-200', className)}
          {...props}
        />
        {hint && !error && <p className="text-xs text-taupe-200 mt-1">{hint}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
