'use client'

import { useEffect, useState } from 'react'
import { Hammer, Hourglass, Users, X } from 'lucide-react'
import { BUILDINGS } from '@/lib/data/buildings'
import { UNITS } from '@/lib/data/units'
import { formatDuration, queueProgress } from '@/lib/format'
import { BUILD_QUEUE_LIMIT, TRAIN_QUEUE_LIMIT, useGameStore } from '@/lib/store'

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [active])
  return now
}

interface QueueRowProps {
  title: string
  subtitle: string
  progress: number
  remaining: number
  onCancel: () => void
}

function QueueRow({ title, subtitle, progress, remaining, onCancel }: QueueRowProps) {
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{title}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {formatDuration(remaining / 1000)}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label={`Отменить: ${title}`}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Прогресс: ${title}`}
        className="h-1 w-full overflow-hidden rounded-full bg-border/60"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </li>
  )
}

export function QueuePanel() {
  const buildQueue = useGameStore((s) => s.buildQueue)
  const trainQueue = useGameStore((s) => s.trainQueue)
  const cancelBuild = useGameStore((s) => s.cancelBuild)
  const cancelTrain = useGameStore((s) => s.cancelTrain)

  const hasItems = buildQueue.length > 0 || trainQueue.length > 0
  const now = useNow(hasItems)

  return (
    <section
      aria-label="Очереди строительства и найма"
      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/70 p-3.5 backdrop-blur-md"
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Hammer aria-hidden="true" className="size-3.5" />
            Строительство
          </h2>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {buildQueue.length}/{BUILD_QUEUE_LIMIT}
          </span>
        </div>
        {buildQueue.length === 0 ? (
          <p className="rounded-lg bg-secondary/30 px-2.5 py-2 text-[11px] text-muted-foreground">
            Строители отдыхают
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {buildQueue.map((item, i) => (
              <QueueRow
                key={`${item.buildingId}-${item.finishesAt}`}
                title={BUILDINGS[item.buildingId].name}
                subtitle={`До уровня ${item.targetLevel}`}
                progress={queueProgress(item.startedAt, item.finishesAt, now)}
                remaining={Math.max(0, item.finishesAt - now)}
                onCancel={() => cancelBuild(i)}
              />
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Users aria-hidden="true" className="size-3.5" />
            Найм войск
          </h2>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {trainQueue.length}/{TRAIN_QUEUE_LIMIT}
          </span>
        </div>
        {trainQueue.length === 0 ? (
          <p className="rounded-lg bg-secondary/30 px-2.5 py-2 text-[11px] text-muted-foreground">
            Казармы ждут приказа
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {trainQueue.map((item, i) => (
              <QueueRow
                key={`${item.unitId}-${item.finishesAt}`}
                title={UNITS[item.unitId].name}
                subtitle={`×${item.count}`}
                progress={queueProgress(item.startedAt, item.finishesAt, now)}
                remaining={Math.max(0, item.finishesAt - now)}
                onCancel={() => cancelTrain(i)}
              />
            ))}
          </ul>
        )}
      </div>

      {!hasItems && (
        <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Hourglass aria-hidden="true" className="size-3" />
          Очереди пусты
        </p>
      )}
    </section>
  )
}
