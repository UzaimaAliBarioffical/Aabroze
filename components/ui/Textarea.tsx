import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={textareaId} className="form-label">{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn('form-input resize-none', error && 'border-red-400', className)}
          {...props}
        />
        {error && <p className="form-error">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
