'use client'

import { useState } from 'react'
import { RotateCcw, ScrollText, Sparkles, Wand2 } from 'lucide-react'
import { formatNumber } from '@/lib/data/resources'
import { useGameStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function PromoForm() {
  const redeemPromo = useGameStore((s) => s.redeemPromo)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const submit = () => {
    if (!code.trim()) return
    setResult(redeemPromo(code))
    setCode('')
  }

  return (
    <section
      aria-label="Промокоды"
      className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md"
    >
      <header className="mb-3 flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-secondary/60">
          <Sparkles aria-hidden="true" className="size-4.5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold leading-tight">Королевский указ</h2>
          <p className="text-xs text-muted-foreground">Введите код, чтобы получить дары</p>
        </div>
      </header>

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) submit()
          }}
          placeholder="Промокод"
          aria-label="Промокод"
          className="min-w-0 flex-1 rounded-lg border border-input bg-secondary/40 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Применить
        </button>
      </div>

      {result && (
        <p
          role="status"
          className={cn('mt-2 text-xs', result.ok ? 'text-accent' : 'text-destructive')}
        >
          {result.message}
        </p>
      )}
    </section>
  )
}

function StatsSection() {
  const stats = useGameStore((s) => s.stats)
  const enemy = useGameStore((s) => s.currentEnemy)

  const rows = [
    { label: 'Побед', value: stats.battlesWon },
    { label: 'Поражений', value: stats.battlesLost },
    { label: 'Королевств покорено', value: stats.enemiesDefeated },
    { label: 'Воинов нанято', value: stats.unitsTrained },
    { label: 'Воинов потеряно', value: stats.unitsLost },
    { label: 'Ресурсов добыто в боях', value: stats.totalResourcesEarned },
  ]

  return (
    <section
      aria-label="Хроники королевства"
      className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md"
    >
      <header className="mb-3 flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-secondary/60">
          <ScrollText aria-hidden="true" className="size-4.5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold leading-tight">Хроники</h2>
          <p className="text-xs text-muted-foreground">
            Сейчас у ворот: противник №{enemy.index}
          </p>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-secondary/40 p-2.5">
            <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {row.label}
            </dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
              {formatNumber(row.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function SettingsSection() {
  const player = useGameStore((s) => s.player)
  const devMode = useGameStore((s) => s.devMode)
  const renameKingdom = useGameStore((s) => s.renameKingdom)
  const resetGame = useGameStore((s) => s.resetGame)
  const [name, setName] = useState(player.name)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <section
      aria-label="Настройки"
      className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md"
    >
      <header className="mb-3 flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-secondary/60">
          <Wand2 aria-hidden="true" className="size-4.5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold leading-tight">Королевская канцелярия</h2>
          {devMode && (
            <p className="text-xs font-semibold text-primary">Режим Создателя активен</p>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            aria-label="Название королевства"
            className="min-w-0 flex-1 rounded-lg border border-input bg-secondary/40 px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
          />
          <button
            type="button"
            onClick={() => renameKingdom(name)}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Переименовать
          </button>
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5">
            <p className="flex-1 text-xs text-destructive">
              Стереть королевство и начать заново? Это необратимо.
            </p>
            <button
              type="button"
              onClick={() => {
                resetGame()
                setConfirmReset(false)
                setName('Эвервейл')
              }}
              className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:brightness-110"
            >
              Стереть
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            Начать новую игру
          </button>
        )}
      </div>
    </section>
  )
}

export function ChroniclePanel() {
  return (
    <div className="flex flex-col gap-4">
      <StatsSection />
      <PromoForm />
      <SettingsSection />
    </div>
  )
}
