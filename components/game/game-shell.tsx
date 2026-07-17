'use client'

import { useEffect, useState } from 'react'
import { Castle, ScrollText, Swords, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useGameStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ArmyPanel } from './army-panel'
import { BattlePanel } from './battle-panel'
import { BuildingsPanel } from './buildings-panel'
import { ChroniclePanel } from './chronicle-panel'
import { CrestBadge } from './crest-badge'
import { QueuePanel } from './queue-panel'
import { ResourceBar } from './resource-bar'

type Tab = 'castle' | 'army' | 'battle' | 'chronicle'

const TABS: { id: Tab; label: string; icon: typeof Castle }[] = [
  { id: 'castle', label: 'Замок', icon: Castle },
  { id: 'army', label: 'Армия', icon: Users },
  { id: 'battle', label: 'Битва', icon: Swords },
  { id: 'chronicle', label: 'Хроники', icon: ScrollText },
]

export function GameShell() {
  const hydrated = useGameStore((s) => s.hydrated)
  const player = useGameStore((s) => s.player)
  const keepLevel = useGameStore((s) => s.buildings.keep ?? 1)
  const devMode = useGameStore((s) => s.devMode)
  const tick = useGameStore((s) => s.tick)
  const [tab, setTab] = useState<Tab>('castle')

  // Игровой тик: экономика, очереди, оффлайн-прогресс
  useEffect(() => {
    if (!hydrated) return
    tick()
    const id = setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [hydrated, tick])

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-serif text-lg text-muted-foreground">
          Королевство пробуждается…
        </p>
      </main>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-3 pb-24 pt-4 sm:px-6 md:pb-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <CrestBadge crest={player.crest} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-xl font-bold leading-tight sm:text-2xl">
              {player.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Замок ур. {keepLevel}
              {devMode && <span className="ml-2 font-semibold text-primary">Режим Создателя</span>}
            </p>
          </div>
          {/* Навигация на десктопе */}
          <nav aria-label="Разделы игры" className="hidden md:block">
            <ul className="flex gap-1 rounded-xl border border-border/60 bg-card/70 p-1 backdrop-blur-md">
              {TABS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setTab(id)}
                    aria-current={tab === id ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors',
                      tab === id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <ResourceBar />
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'castle' && <BuildingsPanel />}
              {tab === 'army' && <ArmyPanel />}
              {tab === 'battle' && <BattlePanel />}
              {tab === 'chronicle' && <ChroniclePanel />}
            </motion.div>
          </AnimatePresence>
        </main>

        <aside className="order-first lg:order-none">
          <div className="lg:sticky lg:top-4">
            <QueuePanel />
          </div>
        </aside>
      </div>

      {/* Навигация на мобильных */}
      <nav
        aria-label="Разделы игры"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/85 backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-md justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-[10px] font-semibold transition-colors',
                  tab === id ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
