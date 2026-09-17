import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export default function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <div className="bg-white p-5 rounded border border-beige-200 shadow-soft flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[11px] font-sans uppercase tracking-widest text-taupe-200">{title}</p>
        <p className="text-2xl font-serif text-charcoal-300 font-medium">{value}</p>
        {description && <p className="text-xs text-charcoal-100">{description}</p>}
      </div>
      <div className="p-3 bg-beige-100 rounded text-charcoal-300">
        <Icon size={22} />
      </div>
    </div>
  )
}
