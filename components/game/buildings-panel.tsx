'use client'

import { BUILDING_CATEGORY_LABELS, BUILDING_LIST } from '@/lib/data/buildings'
import type { BuildingCategory } from '@/lib/types'
import { BuildingCard } from './building-card'

const CATEGORY_ORDER: BuildingCategory[] = ['core', 'economy', 'military', 'defense']

export function BuildingsPanel() {
  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.map((category) => {
        const defs = BUILDING_LIST.filter((d) => d.category === category)
        if (defs.length === 0) return null
        return (
          <section key={category} aria-label={BUILDING_CATEGORY_LABELS[category]}>
            <h2 className="mb-2.5 font-serif text-lg font-semibold text-foreground">
              {BUILDING_CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {defs.map((def) => (
                <BuildingCard key={def.id} def={def} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
