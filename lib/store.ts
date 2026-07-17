'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BUILDINGS } from './data/buildings'
import { STARTING_RESOURCES } from './data/resources'
import { UNITS } from './data/units'
import { generateEnemy } from './systems/enemy-generator'
import {
  addResources,
  canAfford,
  computeProductionPerMinute,
  computeStorageCap,
  keepRequirementMet,
  subtractCost,
} from './systems/economy'
import { findPromo } from './systems/promo'
import { simulateBattle, toBattleResult, type BattleSimulation } from './systems/battle'
import type { Army, BattlePhase, BuildingId, GameState, UnitId } from './types'

export const SCHEMA_VERSION = 1
export const BUILD_QUEUE_LIMIT = 2
export const TRAIN_QUEUE_LIMIT = 3

function createInitialState(): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    player: {
      name: 'Эвервейл',
      crest: {
        shape: 'shield',
        symbol: 'stag',
        primaryColor: 'oklch(0.55 0.13 150)',
        secondaryColor: 'oklch(0.72 0.14 85)',
      },
    },
    resources: { ...STARTING_RESOURCES },
    storageCap: computeStorageCap({ keep: 1 }),
    buildings: { keep: 1 },
    garrison: {},
    buildQueue: [],
    trainQueue: [],
    currentEnemy: generateEnemy(1),
    battlePhase: 'idle',
    lastBattleResult: null,
    research: { completed: [], inProgress: null },
    stats: {
      battlesWon: 0,
      battlesLost: 0,
      unitsTrained: 0,
      unitsLost: 0,
      enemiesDefeated: 0,
      totalResourcesEarned: 0,
    },
    usedPromoCodes: [],
    devMode: false,
    lastTickAt: Date.now(),
  }
}

export type PromoResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

interface GameActions {
  /** Тик экономики + завершение очередей. Также применяет оффлайн-прогресс. */
  tick: (now?: number) => void
  startBuild: (buildingId: BuildingId) => boolean
  cancelBuild: (index: number) => void
  startTrain: (unitId: UnitId, count: number) => boolean
  cancelTrain: (index: number) => void
  redeemPromo: (code: string) => PromoResult
  renameKingdom: (name: string) => void
  resetGame: () => void
  setBattlePhase: (phase: BattlePhase) => void
  /**
   * Запуск боя: валидирует состав, запускает детерминированную симуляцию,
   * списывает армию из гарнизона и возвращает симуляцию для анимации.
   * Итог (награда, потери, следующий враг) применяется сразу —
   * анимация лишь воспроизводит уже свершившееся.
   */
  fightBattle: (selected: Army) => BattleSimulation | null
  /** Флаг гидратации persist-хранилища (не сохраняется) */
  hydrated: boolean
  setHydrated: (v: boolean) => void
}

export type GameStore = GameState & GameActions

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      tick: (now = Date.now()) => {
        const s = get()
        const elapsed = Math.max(0, now - s.lastTickAt)
        if (elapsed < 250) return

        let buildings = s.buildings
        let garrison = s.garrison
        let stats = s.stats
        let buildingsChanged = false

        // --- Завершение строительства ---
        const buildQueue = s.buildQueue.filter((item) => {
          if (item.finishesAt <= now) {
            buildings = { ...buildings, [item.buildingId]: item.targetLevel }
            buildingsChanged = true
            return false
          }
          return true
        })

        // --- Завершение найма ---
        const trainQueue = s.trainQueue.filter((item) => {
          if (item.finishesAt <= now) {
            garrison = {
              ...garrison,
              [item.unitId]: (garrison[item.unitId] ?? 0) + item.count,
            }
            stats = { ...stats, unitsTrained: stats.unitsTrained + item.count }
            return false
          }
          return true
        })

        const storageCap = buildingsChanged ? computeStorageCap(buildings) : s.storageCap

        // --- Производство ресурсов ---
        const perMinute = computeProductionPerMinute(buildings)
        const minutes = elapsed / 60_000
        const gain: typeof perMinute = {}
        for (const [k, v] of Object.entries(perMinute)) {
          gain[k as keyof typeof perMinute] = (v ?? 0) * minutes
        }
        let resources = addResources(s.resources, gain, storageCap)
        if (s.devMode) resources = { ...storageCap }

        set({
          resources,
          storageCap,
          buildings,
          garrison,
          stats,
          buildQueue,
          trainQueue,
          lastTickAt: now,
        })
      },

      startBuild: (buildingId) => {
        const s = get()
        const def = BUILDINGS[buildingId]
        const currentLevel = s.buildings[buildingId] ?? 0
        const queuedLevels = s.buildQueue.filter((q) => q.buildingId === buildingId).length
        const targetLevel = currentLevel + queuedLevels + 1

        if (targetLevel > def.maxLevel) return false
        if (!keepRequirementMet(s.buildings, buildingId)) return false
        if (s.buildQueue.length >= BUILD_QUEUE_LIMIT) return false

        const levelDef = def.levels[targetLevel - 1]
        if (!s.devMode && !canAfford(s.resources, levelDef.cost)) return false

        const now = Date.now()
        const duration = s.devMode ? 0 : levelDef.buildTime * 1000

        set({
          resources: s.devMode ? s.resources : subtractCost(s.resources, levelDef.cost),
          buildQueue: [
            ...s.buildQueue,
            { buildingId, targetLevel, startedAt: now, finishesAt: now + duration },
          ],
        })
        if (s.devMode) get().tick(now + 1)
        return true
      },

      cancelBuild: (index) => {
        const s = get()
        const item = s.buildQueue[index]
        if (!item) return
        const levelDef = BUILDINGS[item.buildingId].levels[item.targetLevel - 1]
        set({
          resources: addResources(s.resources, levelDef.cost, s.storageCap),
          buildQueue: s.buildQueue.filter((_, i) => i !== index),
        })
      },

      startTrain: (unitId, count) => {
        const s = get()
        if (count < 1) return false
        const def = UNITS[unitId]
        const buildingLevel = s.buildings[def.requiresBuilding] ?? 0
        if (buildingLevel < def.requiresLevel) return false
        if (s.trainQueue.length >= TRAIN_QUEUE_LIMIT) return false

        const totalCost: Partial<typeof s.resources> = {}
        for (const [k, v] of Object.entries(def.cost)) {
          totalCost[k as keyof typeof s.resources] = (v ?? 0) * count
        }
        if (!s.devMode && !canAfford(s.resources, totalCost)) return false

        const now = Date.now()
        const duration = s.devMode ? 0 : def.trainTime * count * 1000

        set({
          resources: s.devMode ? s.resources : subtractCost(s.resources, totalCost),
          trainQueue: [
            ...s.trainQueue,
            { unitId, count, startedAt: now, finishesAt: now + duration },
          ],
        })
        if (s.devMode) get().tick(now + 1)
        return true
      },

      cancelTrain: (index) => {
        const s = get()
        const item = s.trainQueue[index]
        if (!item) return
        const def = UNITS[item.unitId]
        const refund: Partial<typeof s.resources> = {}
        for (const [k, v] of Object.entries(def.cost)) {
          refund[k as keyof typeof s.resources] = (v ?? 0) * item.count
        }
        set({
          resources: addResources(s.resources, refund, s.storageCap),
          trainQueue: s.trainQueue.filter((_, i) => i !== index),
        })
      },

      redeemPromo: (code) => {
        const s = get()
        const promo = findPromo(code)
        if (!promo) return { ok: false, message: 'Неизвестный код. Гонец пожимает плечами.' }
        if (promo.singleUse && s.usedPromoCodes.includes(promo.hash)) {
          return { ok: false, message: 'Этот код уже использован.' }
        }

        let resources = s.resources
        if (promo.reward.resources) {
          resources = addResources(resources, promo.reward.resources, s.storageCap)
        }
        set({
          resources,
          devMode: promo.reward.devMode ? true : s.devMode,
          usedPromoCodes: s.usedPromoCodes.includes(promo.hash)
            ? s.usedPromoCodes
            : [...s.usedPromoCodes, promo.hash],
        })
        return { ok: true, message: `Активировано: ${promo.label}` }
      },

      renameKingdom: (name) => {
        const trimmed = name.trim().slice(0, 24)
        if (!trimmed) return
        set((s) => ({ player: { ...s.player, name: trimmed } }))
      },

      resetGame: () => set({ ...createInitialState() }),

      setBattlePhase: (phase) => set({ battlePhase: phase }),

      fightBattle: (selected) => {
        const s = get()
        if (s.battlePhase === 'fighting') return null

        // Валидация состава: только доступные юниты из гарнизона
        const army: Army = {}
        let total = 0
        for (const [id, count] of Object.entries(selected)) {
          const unitId = id as UnitId
          const c = Math.min(Math.max(0, Math.floor(count ?? 0)), s.garrison[unitId] ?? 0)
          if (c > 0) {
            army[unitId] = c
            total += c
          }
        }
        if (total <= 0) return null

        const enemy = s.currentEnemy
        const sim = simulateBattle(army, enemy)
        const result = toBattleResult(sim, enemy)

        // Потери: погибшие исчезают, выжившие возвращаются в гарнизон
        const garrison: Army = { ...s.garrison }
        let unitsLost = 0
        for (const [id, lost] of Object.entries(sim.playerLosses)) {
          const unitId = id as UnitId
          const l = lost ?? 0
          unitsLost += l
          const next = (garrison[unitId] ?? 0) - l
          if (next > 0) garrison[unitId] = next
          else delete garrison[unitId]
        }

        // Награда и следующий враг — только при победе
        let resources = s.resources
        let totalEarned = 0
        if (sim.victory && result.reward) {
          resources = addResources(resources, result.reward, s.storageCap)
          totalEarned = Object.values(result.reward).reduce((a, b) => a + (b ?? 0), 0)
        }

        set({
          garrison,
          resources,
          battlePhase: 'fighting',
          lastBattleResult: result,
          currentEnemy: sim.victory ? generateEnemy(enemy.index + 1) : enemy,
          stats: {
            ...s.stats,
            battlesWon: s.stats.battlesWon + (sim.victory ? 1 : 0),
            battlesLost: s.stats.battlesLost + (sim.victory ? 0 : 1),
            unitsLost: s.stats.unitsLost + unitsLost,
            enemiesDefeated: s.stats.enemiesDefeated + (sim.victory ? 1 : 0),
            totalResourcesEarned: s.stats.totalResourcesEarned + totalEarned,
          },
        })
        return sim
      },
    }),
    {
      name: 'evervale-save',
      version: SCHEMA_VERSION,
      partialize: (state) => {
        const { hydrated: _h, setHydrated: _sh, ...rest } = state as GameStore & {
          [key: string]: unknown
        }
        return rest
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)
