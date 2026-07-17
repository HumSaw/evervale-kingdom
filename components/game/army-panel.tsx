'use client'

import { Users } from 'lucide-react'
import { CATEGORY_LABELS, UNIT_LIST, UNITS } from '@/lib/data/units'
import { useGameStore } from '@/lib/store'
import { armyPower, armySize } from '@/lib/systems/enemy-generator'
import type { UnitCategory, UnitId } from '@/lib/types'
import { UnitCard } from './unit-card'

const CATEGORY_ORDER: UnitCategory[] = ['infantry', 'ranged', 'cavalry', 'magic', 'siege', 'elite']

export function ArmyPanel() {
  const garrison = useGameStore((s) => s.garrison)
  const size = armySize(garrison)
  const power = armyPower(garrison)

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Гарнизон"
        className="rounded-xl border border-border/60 bg-card/70 p-3.5 backdrop-blur-md"
      >
        <header className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-secondary/60">
            <Users aria-hidden="true" className="size-4.5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-lg font-semibold leading-tight">Гарнизон</h2>
            <p className="text-xs text-muted-foreground">
              {size > 0
                ? `${size} воинов · суммарная сила ${power}`
                : 'Казармы пусты. Наймите первых воинов.'}
            </p>
          </div>
        </header>
        {size > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(garrison).map(([id, count]) => {
              if (!count) return null
              const def = UNITS[id as UnitId]
              return (
                <li
                  key={id}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs"
                >
                  <span className="font-medium">{def.name}</span>
                  <span className="font-mono tabular-nums text-primary">×{count}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {CATEGORY_ORDER.map((category) => {
        const defs = UNIT_LIST.filter((u) => u.category === category)
        if (defs.length === 0) return null
        return (
          <section key={category} aria-label={CATEGORY_LABELS[category]}>
            <h2 className="mb-2.5 font-serif text-lg font-semibold text-foreground">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {defs.map((def) => (
                <UnitCard key={def.id} def={def} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
