'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Crown, Minus, Plus, Skull, Swords, Trophy } from 'lucide-react'
import { RESOURCES, formatNumber } from '@/lib/data/resources'
import { UNITS } from '@/lib/data/units'
import { GAME_ICONS } from '@/lib/icon-map'
import { useGameStore } from '@/lib/store'
import { armyPower, armySize, TRAIT_LABELS } from '@/lib/systems/enemy-generator'
import type { BattleSimulation } from '@/lib/systems/battle'
import { cn } from '@/lib/utils'
import type { Army, ResourceId, UnitId } from '@/lib/types'
import { CrestBadge } from './crest-badge'

const ROUND_MS = 900

// ===== Подготовка: выбор состава армии =====

function ArmyPicker({
  selected,
  onChange,
}: {
  selected: Army
  onChange: (next: Army) => void
}) {
  const garrison = useGameStore((s) => s.garrison)
  const entries = Object.entries(garrison).filter(([, c]) => (c ?? 0) > 0)

  if (entries.length === 0) {
    return (
      <p className="rounded-lg bg-secondary/50 px-3 py-4 text-center text-xs text-muted-foreground">
        Гарнизон пуст. Наймите войска во вкладке «Армия».
      </p>
    )
  }

  const setCount = (id: UnitId, value: number) => {
    const max = garrison[id] ?? 0
    const clamped = Math.min(max, Math.max(0, value))
    const next = { ...selected }
    if (clamped > 0) next[id] = clamped
    else delete next[id]
    onChange(next)
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map(([id, available]) => {
        const unitId = id as UnitId
        const def = UNITS[unitId]
        const count = selected[unitId] ?? 0
        return (
          <li
            key={id}
            className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{def.name}</p>
              <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                доступно: {available}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCount(unitId, count - 1)}
                disabled={count <= 0}
                aria-label={`Меньше: ${def.name}`}
                className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-9 text-center font-mono text-sm tabular-nums">{count}</span>
              <button
                type="button"
                onClick={() => setCount(unitId, count + 1)}
                disabled={count >= (available ?? 0)}
                aria-label={`Больше: ${def.name}`}
                className="flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                <Plus className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setCount(unitId, count > 0 ? 0 : (available ?? 0))}
                className="ml-1 rounded-md px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                {count > 0 ? 'Сброс' : 'Все'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ===== Анимация боя =====

function armyHpShare(initial: Army, remaining: Army): number {
  let initHp = 0
  let remHp = 0
  for (const [id, c] of Object.entries(initial)) {
    initHp += UNITS[id as UnitId].hp * (c ?? 0)
  }
  for (const [id, c] of Object.entries(remaining)) {
    remHp += UNITS[id as UnitId].hp * (c ?? 0)
  }
  return initHp > 0 ? remHp / initHp : 0
}

function BattleScene({
  sim,
  enemyName,
  onDone,
}: {
  sim: BattleSimulation
  enemyName: string
  onDone: () => void
}) {
  const player = useGameStore((s) => s.player)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= sim.rounds.length) {
      const t = setTimeout(onDone, 700)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep((v) => v + 1), ROUND_MS)
    return () => clearTimeout(t)
  }, [step, sim.rounds.length, onDone])

  const round = step > 0 ? sim.rounds[step - 1] : null
  const playerRemaining = round ? round.playerRemaining : sim.initialPlayer
  const enemyRemaining = round ? round.enemyRemaining : sim.initialEnemy
  const playerShare = armyHpShare(sim.initialPlayer, playerRemaining)
  const enemyShare = armyHpShare(sim.initialEnemy, enemyRemaining)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md">
      <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {step === 0 ? 'Армии сходятся…' : `Раунд ${round?.round} из ${sim.rounds.length}`}
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        {/* Игрок */}
        <div className="flex flex-col items-center gap-2">
          <p className="truncate text-xs font-semibold text-primary">{player.name}</p>
          <div
            role="progressbar"
            aria-valuenow={Math.round(playerShare * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Здоровье вашей армии"
            className="h-1.5 w-full overflow-hidden rounded-full bg-border/60"
          >
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${playerShare * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {armySize(playerRemaining)} воинов
          </p>
          <AnimatePresence>
            {round && round.enemyDamage > 0 && (
              <motion.p
                key={`pd-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="font-mono text-xs font-semibold tabular-nums text-destructive"
              >
                −{formatNumber(round.enemyDamage)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Центр */}
        <motion.div
          animate={step > 0 && step <= sim.rounds.length ? { rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5 }}
          key={`clash-${step}`}
          className="mt-5 flex size-10 items-center justify-center rounded-full border border-border/60 bg-secondary/60"
        >
          <Swords aria-hidden="true" className="size-5 text-primary" />
        </motion.div>

        {/* Враг */}
        <div className="flex flex-col items-center gap-2">
          <p className="truncate text-xs font-semibold text-destructive">{enemyName}</p>
          <div
            role="progressbar"
            aria-valuenow={Math.round(enemyShare * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Здоровье армии противника"
            className="h-1.5 w-full overflow-hidden rounded-full bg-border/60"
          >
            <motion.div
              className="h-full rounded-full bg-destructive"
              animate={{ width: `${enemyShare * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {armySize(enemyRemaining)} воинов
          </p>
          <AnimatePresence>
            {round && round.playerDamage > 0 && (
              <motion.p
                key={`ed-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="font-mono text-xs font-semibold tabular-nums text-primary"
              >
                −{formatNumber(round.playerDamage)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ===== Экран результата =====

function BattleResultView({ onContinue }: { onContinue: () => void }) {
  const result = useGameStore((s) => s.lastBattleResult)
  if (!result) return null

  const losses = Object.entries(result.playerLosses)
  const kills = Object.entries(result.enemyLosses)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card/70 p-6 text-center backdrop-blur-md"
    >
      {result.victory ? (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/15">
            <Trophy aria-hidden="true" className="size-7 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary">Победа!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Вражеское королевство пало. Ваше знамя реет над его стенами.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/15">
            <Skull aria-hidden="true" className="size-7 text-destructive" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-destructive">Поражение</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Армия отступила. Соберите силы и попробуйте снова.
            </p>
          </div>
        </>
      )}

      {result.victory && result.reward && (
        <div className="w-full">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Трофеи
          </h3>
          <ul className="flex flex-wrap justify-center gap-2">
            {Object.entries(result.reward).map(([k, v]) => {
              if (!v) return null
              const meta = RESOURCES[k as ResourceId]
              const Icon = GAME_ICONS[meta.icon]
              return (
                <li
                  key={k}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs"
                >
                  <Icon aria-hidden="true" className={cn('size-3.5', meta.colorVar)} />
                  <span className="font-mono tabular-nums">+{formatNumber(v)}</span>
                  <span className="sr-only">{meta.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="grid w-full grid-cols-2 gap-3 text-left">
        <div className="rounded-lg bg-secondary/40 p-2.5">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Ваши потери
          </h3>
          {losses.length === 0 ? (
            <p className="mt-1 text-xs text-accent">Без потерь!</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-0.5 text-xs">
              {losses.map(([id, c]) => (
                <li key={id} className="flex justify-between gap-2">
                  <span className="truncate text-muted-foreground">{UNITS[id as UnitId].name}</span>
                  <span className="font-mono tabular-nums text-destructive">−{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg bg-secondary/40 p-2.5">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Враг потерял
          </h3>
          {kills.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">—</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-0.5 text-xs">
              {kills.map(([id, c]) => (
                <li key={id} className="flex justify-between gap-2">
                  <span className="truncate text-muted-foreground">{UNITS[id as UnitId].name}</span>
                  <span className="font-mono tabular-nums text-primary">−{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
      >
        {result.victory ? 'К следующему королевству' : 'Вернуться в замок'}
      </button>
    </motion.div>
  )
}

// ===== Главная панель =====

export function BattlePanel() {
  const enemy = useGameStore((s) => s.currentEnemy)
  const garrison = useGameStore((s) => s.garrison)
  const battlePhase = useGameStore((s) => s.battlePhase)
  const fightBattle = useGameStore((s) => s.fightBattle)
  const setBattlePhase = useGameStore((s) => s.setBattlePhase)

  const [selected, setSelected] = useState<Army>({})
  const simRef = useRef<BattleSimulation | null>(null)
  const enemyNameRef = useRef('')

  const selectedPower = armyPower(selected)
  const selectedSize = armySize(selected)
  const chance =
    selectedPower + enemy.totalPower > 0
      ? selectedPower / (selectedPower + enemy.totalPower)
      : 0

  const handleFight = () => {
    enemyNameRef.current = enemy.name
    const sim = fightBattle(selected)
    if (sim) {
      simRef.current = sim
      setSelected({})
    }
  }

  if (battlePhase === 'fighting' && simRef.current) {
    return (
      <BattleScene
        sim={simRef.current}
        enemyName={enemyNameRef.current}
        onDone={() => setBattlePhase('finished')}
      />
    )
  }

  // Перезагрузка посреди боя: итог уже применён, показываем результат
  if (battlePhase === 'finished' || battlePhase === 'fighting') {
    return (
      <BattleResultView
        onContinue={() => {
          simRef.current = null
          setBattlePhase('idle')
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Карточка врага */}
      <section
        aria-label="Вражеское королевство"
        className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md"
      >
        <header className="flex items-start gap-3">
          <CrestBadge crest={enemy.crest} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Противник №{enemy.index} · уровень {enemy.level}
            </p>
            <h2 className="text-balance font-serif text-xl font-bold leading-tight">{enemy.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Crown aria-hidden="true" className="size-3.5 text-primary" />
              Правитель: {enemy.rulerName}
            </p>
          </div>
        </header>

        <p className="mt-3 text-pretty text-xs italic leading-relaxed text-muted-foreground">
          «{enemy.flavorText}»
        </p>

        {enemy.traits.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {enemy.traits.map((t) => (
              <li
                key={t}
                title={TRAIT_LABELS[t].description}
                className="rounded-full bg-destructive/15 px-2.5 py-1 text-[10px] font-semibold text-destructive"
              >
                {TRAIT_LABELS[t].name}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Армия врага · сила {formatNumber(enemy.totalPower)}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {Object.entries(enemy.army).map(([id, count]) => {
              if (!count) return null
              const def = UNITS[id as UnitId]
              return (
                <li
                  key={id}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs"
                >
                  <span>{def.name}</span>
                  <span className="font-mono tabular-nums text-destructive">×{count}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="mt-3">
          <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Награда за победу
          </h3>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(enemy.reward).map(([k, v]) => {
              if (!v) return null
              const meta = RESOURCES[k as ResourceId]
              const Icon = GAME_ICONS[meta.icon]
              return (
                <li key={k} className="flex items-center gap-1 text-xs">
                  <Icon aria-hidden="true" className={cn('size-3.5', meta.colorVar)} />
                  <span className="font-mono tabular-nums">{formatNumber(v)}</span>
                  <span className="sr-only">{meta.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Подготовка армии */}
      <section
        aria-label="Подготовка к битве"
        className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur-md"
      >
        <h2 className="mb-3 font-serif text-lg font-semibold">Ваш боевой отряд</h2>
        <ArmyPicker selected={selected} onChange={setSelected} />

        {armySize(garrison) > 0 && (
          <>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Отряд: {selectedSize} воинов · сила {formatNumber(selectedPower)}
              </span>
              <span
                className={cn(
                  'font-semibold',
                  chance >= 0.55 ? 'text-accent' : chance >= 0.45 ? 'text-primary' : 'text-destructive',
                )}
              >
                {chance >= 0.55 ? 'Перевес за вами' : chance >= 0.45 ? 'Силы равны' : 'Враг сильнее'}
              </span>
            </div>
            <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.round(chance * 100)}%` }}
              />
              <div className="h-full flex-1 bg-destructive/70" />
            </div>

            <button
              type="button"
              disabled={selectedSize === 0}
              onClick={handleFight}
              className={cn(
                'mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
                selectedSize > 0
                  ? 'bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-secondary/50 text-muted-foreground',
              )}
            >
              <Swords aria-hidden="true" className="size-4" />
              В бой!
            </button>
          </>
        )}
      </section>
    </div>
  )
}
