'use client'

import { Hammer, Lock } from 'lucide-react'
import { RESOURCES, formatNumber } from '@/lib/data/resources'
import { formatDuration } from '@/lib/format'
import { GAME_ICONS } from '@/lib/icon-map'
import { BUILD_QUEUE_LIMIT, useGameStore } from '@/lib/store'
import { canAfford, keepRequirementMet } from '@/lib/systems/economy'
import { cn } from '@/lib/utils'
import type { BuildingDef, ResourceId } from '@/lib/types'

interface BuildingCardProps {
  def: BuildingDef
}

export function BuildingCard({ def }: BuildingCardProps) {
  const buildings = useGameStore((s) => s.buildings)
  const resources = useGameStore((s) => s.resources)
  const buildQueue = useGameStore((s) => s.buildQueue)
  const devMode = useGameStore((s) => s.devMode)
  const startBuild = useGameStore((s) => s.startBuild)

  const Icon = GAME_ICONS[def.icon]
  const level = buildings[def.id] ?? 0
  const queued = buildQueue.filter((q) => q.buildingId === def.id).length
  const targetLevel = level + queued + 1

  const maxed = targetLevel > def.maxLevel
  const keepOk = keepRequirementMet(buildings, def.id)
  const queueFull = buildQueue.length >= BUILD_QUEUE_LIMIT
  const levelDef = maxed ? null : def.levels[targetLevel - 1]
  const affordable = levelDef ? devMode || canAfford(resources, levelDef.cost) : false
  const canBuild = !maxed && keepOk && !queueFull && affordable

  return (
    <article
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur-md transition-colors',
        !keepOk && 'opacity-60',
      )}
    >
      <header className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/60">
          <Icon aria-hidden="true" className="size-4.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-tight">{def.name}</h3>
          <p className="text-xs text-muted-foreground">
            {level > 0 ? `Уровень ${level}` : 'Не построено'}
            {queued > 0 && ` · строится +${queued}`}
          </p>
        </div>
        {level >= def.maxLevel && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            МАКС
          </span>
        )}
      </header>

      <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{def.description}</p>

      {levelDef?.unlocks && (
        <p className="text-xs font-medium text-accent">Откроет: {levelDef.unlocks}</p>
      )}

      {!keepOk ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-2 text-xs text-muted-foreground">
          <Lock aria-hidden="true" className="size-3.5" />
          Требуется замок ур. {def.requiresKeepLevel}
        </div>
      ) : maxed ? (
        <div className="rounded-lg bg-secondary/50 px-2.5 py-2 text-center text-xs text-muted-foreground">
          Максимальный уровень
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(levelDef!.cost).map(([k, v]) => {
              const meta = RESOURCES[k as ResourceId]
              const CostIcon = GAME_ICONS[meta.icon]
              const enough = devMode || resources[k as ResourceId] >= (v ?? 0)
              return (
                <li key={k} className="flex items-center gap-1 text-xs">
                  <CostIcon aria-hidden="true" className={cn('size-3.5', meta.colorVar)} />
                  <span
                    className={cn(
                      'font-mono tabular-nums',
                      enough ? 'text-foreground' : 'text-destructive',
                    )}
                  >
                    {formatNumber(v ?? 0)}
                  </span>
                  <span className="sr-only">{meta.name}</span>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            disabled={!canBuild}
            onClick={() => startBuild(def.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
              canBuild
                ? 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]'
                : 'cursor-not-allowed bg-secondary/50 text-muted-foreground',
            )}
          >
            <Hammer aria-hidden="true" className="size-3.5" />
            {level > 0 ? `Улучшить до ур. ${targetLevel}` : 'Построить'}
            <span className="font-normal opacity-80">
              · {devMode ? 'мгновенно' : formatDuration(levelDef!.buildTime)}
            </span>
          </button>

          {queueFull && !canBuild && affordable && (
            <p className="text-center text-[10px] text-muted-foreground">Очередь строительства заполнена</p>
          )}
        </div>
      )}
    </article>
  )
}
