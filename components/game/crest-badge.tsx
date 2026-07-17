import { CREST_SYMBOL_ICONS } from '@/lib/icon-map'
import { cn } from '@/lib/utils'
import type { Crest } from '@/lib/types'

const SHAPE_CLASSES: Record<Crest['shape'], string> = {
  shield: 'rounded-b-[45%] rounded-t-md',
  banner: 'rounded-t-md [clip-path:polygon(0_0,100%_0,100%_78%,50%_100%,0_78%)]',
  circle: 'rounded-full',
  diamond: 'rotate-45 rounded-md',
}

interface CrestBadgeProps {
  crest: Crest
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CrestBadge({ crest, size = 'md', className }: CrestBadgeProps) {
  const Icon = CREST_SYMBOL_ICONS[crest.symbol]
  const sizeClass = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-16' : 'size-11'
  const iconClass = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-8' : 'size-5'

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center border shadow-md',
        SHAPE_CLASSES[crest.shape],
        sizeClass,
        className,
      )}
      style={{
        backgroundColor: crest.primaryColor,
        borderColor: crest.secondaryColor,
      }}
    >
      <Icon
        className={cn(iconClass, crest.shape === 'diamond' && '-rotate-45')}
        style={{ color: 'oklch(0.97 0.01 90)' }}
      />
    </div>
  )
}
