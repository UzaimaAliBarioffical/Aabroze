import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && <label htmlFor={selectId} className="form-label">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'form-input appearance-none cursor-pointer',
            error && 'border-red-400',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="form-error">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
