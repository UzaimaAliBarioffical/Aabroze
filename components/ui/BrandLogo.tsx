import SafeImage from '@/components/ui/SafeImage'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  light?: boolean
  priority?: boolean
}

export default function BrandLogo({ className, light = false, priority = false }: BrandLogoProps) {
  return (
    <div className={cn('relative inline-block aspect-[7/6] shrink-0 overflow-hidden align-middle', className)}>
      <SafeImage
        src="/brand/aabroze-logo.jpeg"
        alt="AABROZE"
        fill
        sizes="192px"
        priority={priority}
        // Frame the supplied artwork without its large outer margins.
        className={cn('object-cover scale-[1.6]', light ? 'invert mix-blend-screen' : 'mix-blend-multiply')}
        fallback={
          <span className={cn('flex h-full items-center justify-center font-serif text-xs tracking-widest', light ? 'text-cream-100' : 'text-charcoal-300')}>
            AABROZE
          </span>
        }
      />
    </div>
  )
}
