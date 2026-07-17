'use client'

import { RESOURCE_LIST, formatNumber } from '@/lib/data/resources'
import { GAME_ICONS } from '@/lib/icon-map'
import { useGameStore } from '@/lib/store'
import { computeProductionPerMinute } from '@/lib/systems/economy'
import { cn } from '@/lib/utils'

export function ResourceBar() {
  const resources = useGameStore((s) => s.resources)
  const storageCap = useGameStore((s) => s.storageCap)
  const buildings = useGameStore((s) => s.buildings)
  const devMode = useGameStore((s) => s.devMode)

  const perMinute = computeProductionPerMinute(buildings)

  return (
    <div
      role="status"
      aria-label="Ресурсы королевства"
      className="grid grid-cols-3 gap-1.5 sm:grid-cols-6"
    >
      {RESOURCE_LIST.map((meta) => {
        const Icon = GAME_ICONS[meta.icon]
        const value = resources[meta.id]
        const cap = storageCap[meta.id]
        const rate = perMinute[meta.id] ?? 0
        const full = value >= cap
        return (
          <div
            key={meta.id}
            title={`${meta.name}: ${Math.floor(value).toLocaleString('ru-RU')} / ${cap.toLocaleString('ru-RU')}${rate > 0 ? ` · +${rate}/мин` : ''}`}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-2 py-1.5 backdrop-blur-md"
          >
            <Icon aria-hidden="true" className={cn('size-3.5 shrink-0', meta.colorVar)} />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate font-mono text-xs font-semibold tabular-nums leading-none',
                  full && !devMode ? 'text-primary' : 'text-foreground',
                )}
              >
                {devMode ? '∞' : formatNumber(value)}
              </p>
              {rate > 0 && (
                <p className="mt-0.5 truncate font-mono text-[9px] tabular-nums leading-none text-muted-foreground">
                  +{rate}/м
                </p>
              )}
            </div>
            <span className="sr-only">{meta.name}</span>
          </div>
        )
      })}
    </div>
  )
}
