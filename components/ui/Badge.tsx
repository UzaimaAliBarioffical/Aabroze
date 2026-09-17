import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'sale' | 'new' | 'oos' | 'status'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'new', children, className }: BadgeProps) {
  const variants = {
    sale: 'badge-sale',
    new: 'badge-new',
    oos: 'badge-oos',
    status: 'bg-beige-200 text-charcoal-300 text-[10px] tracking-widest uppercase font-sans font-medium px-2 py-0.5',
  }
  return (
    <span className={cn(variants[variant], className)}>{children}</span>
  )
}
