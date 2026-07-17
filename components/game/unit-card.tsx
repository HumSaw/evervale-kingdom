'use client'

import { useState } from 'react'
import { Heart, Lock, Minus, Plus, Shield, Sword, Target, Wind } from 'lucide-react'
import { BUILDINGS } from '@/lib/data/buildings'
import { RESOURCES, formatNumber } from '@/lib/data/resources'
import { formatDuration } from '@/lib/format'
import { GAME_ICONS } from '@/lib/icon-map'
import { TRAIN_QUEUE_LIMIT, useGameStore } from '@/lib/store'
import { canAfford } from '@/lib/systems/economy'
import { cn } from '@/lib/utils'
import type { ResourceId, UnitDef } from '@/lib/types'

interface UnitCardProps {
  def: UnitDef
}

const STATS: { key: 'hp' | 'attack' | 'armor' | 'speed' | 'range'; label: string; icon: typeof Heart }[] = [
  { key: 'hp', label: 'Здоровье', icon: Heart },
  { key: 'attack', label: 'Атака', icon: Sword },
  { key: 'armor', label: 'Броня', icon: Shield },
  { key: 'speed', label: 'Скорость', icon: Wind },
  { key: 'range', label: 'Дальность', icon: Target },
]

export function UnitCard({ def }: UnitCardProps) {
  const buildings = useGameStore((s) => s.buildings)
  const resources = useGameStore((s) => s.resources)
  const trainQueue = useGameStore((s) => s.trainQueue)
  const garrison = useGameStore((s) => s.garrison)
  const devMode = useGameStore((s) => s.devMode)
  const startTrain = useGameStore((s) => s.startTrain)

  const [count, setCount] = useState(1)

  const buildingDef = BUILDINGS[def.requiresBuilding]
  const buildingLevel = buildings[def.requiresBuilding] ?? 0
  const unlocked = buildingLevel >= def.requiresLevel
  const queueFull = trainQueue.length >= TRAIN_QUEUE_LIMIT
  const owned = garrison[def.id] ?? 0

  const totalCost: Partial<Record<ResourceId, number>> = {}
  for (const [k, v] of Object.entries(def.cost)) {
    totalCost[k as ResourceId] = (v ?? 0) * count
  }
  const affordable = devMode || canAfford(resources, totalCost)
  const canTrain = unlocked && !queueFull && affordable && count >= 1

  return (
    <article
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur-md transition-colors',
        !unlocked && 'opacity-60',
      )}
    >
      <header className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/60">
          <Sword aria-hidden="true" className="size-4.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-tight">{def.name}</h3>
          <p className="text-xs text-muted-foreground">
            {owned > 0 ? `В гарнизоне: ${owned}` : 'Нет в гарнизоне'}
          </p>
        </div>
        <span className="rounded-full bg-secondary/60 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
          сила {def.power}
        </span>
      </header>

      <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{def.description}</p>

      <ul className="grid grid-cols-5 gap-1">
        {STATS.map(({ key, label, icon: Icon }) => (
          <li
            key={key}
            title={label}
            className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary/40 py-1.5"
          >
            <Icon aria-hidden="true" className="size-3 text-muted-foreground" />
            <span className="font-mono text-[10px] font-semibold tabular-nums">{def[key]}</span>
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ul>

      {def.abilities.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {def.abilities.map((a) => (
            <li
              key={a.id}
              title={a.description}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
            >
              {a.name}
            </li>
          ))}
        </ul>
      )}

      {!unlocked ? (
        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-2 text-xs text-muted-foreground">
          <Lock aria-hidden="true" className="size-3.5" />
          Требуется {buildingDef.name} ур. {def.requiresLevel}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(totalCost).map(([k, v]) => {
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

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={count <= 1}
                aria-label={`Меньше: ${def.name}`}
                className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-9 text-center font-mono text-sm tabular-nums">{count}</span>
              <button
                type="button"
                onClick={() => setCount((c) => Math.min(99, c + 1))}
                disabled={count >= 99}
                aria-label={`Больше: ${def.name}`}
                className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Plus className="size-3" />
              </button>
            </div>

            <button
              type="button"
              disabled={!canTrain}
              onClick={() => {
                if (startTrain(def.id, count)) setCount(1)
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                canTrain
                  ? 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-secondary/50 text-muted-foreground',
              )}
            >
              Нанять
              <span className="font-normal opacity-80">
                · {devMode ? 'мгновенно' : formatDuration(def.trainTime * count)}
              </span>
            </button>
          </div>

          {queueFull && (
            <p className="text-center text-[10px] text-muted-foreground">Очередь найма заполнена</p>
          )}
        </div>
      )}
    </article>
  )
}
