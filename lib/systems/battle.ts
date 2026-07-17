import { UNITS } from '../data/units'
import type { Army, BattleResult, EnemyKingdom, UnitId } from '../types'

/**
 * Боевая система: пошаговая симуляция раундов.
 * Детерминирована по составу армий и index врага, чтобы результат
 * нельзя было «перекрутить» перезапуском анимации.
 */

export interface BattleRound {
  round: number
  playerRemaining: Army
  enemyRemaining: Army
  /** Урон, нанесённый игроком в этом раунде */
  playerDamage: number
  /** Урон, нанесённый врагом в этом раунде */
  enemyDamage: number
}

export interface BattleSimulation {
  victory: boolean
  rounds: BattleRound[]
  playerLosses: Army
  enemyLosses: Army
  initialPlayer: Army
  initialEnemy: Army
}

// mulberry32 — тот же PRNG, что в генераторе врагов
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function armySeed(army: Army): number {
  let h = 2166136261
  for (const [id, count] of Object.entries(army)) {
    for (const ch of `${id}:${count ?? 0};`) {
      h ^= ch.charCodeAt(0)
      h = Math.imul(h, 16777619)
    }
  }
  return h >>> 0
}

interface SidePool {
  /** hp-пулы по типам юнитов */
  hp: Partial<Record<UnitId, number>>
  counts: Army
  attackMult: number
  hpMult: number
}

function buildPool(army: Army, attackMult: number, hpMult: number): SidePool {
  const hp: Partial<Record<UnitId, number>> = {}
  const counts: Army = {}
  for (const [id, count] of Object.entries(army)) {
    const unitId = id as UnitId
    const c = count ?? 0
    if (c <= 0) continue
    counts[unitId] = c
    hp[unitId] = UNITS[unitId].hp * hpMult * c
  }
  return { hp, counts, attackMult, hpMult }
}

/** Суммарная атака стороны за раунд (стрелки бьют всегда, ближний бой — со 2-го раунда) */
function roundDamage(pool: SidePool, round: number, rng: () => number): number {
  let dmg = 0
  for (const [id, count] of Object.entries(pool.counts)) {
    const def = UNITS[id as UnitId]
    const c = count ?? 0
    if (c <= 0) continue
    // Дальнобойные юниты стреляют с 1-го раунда, ближний бой вступает со 2-го
    if (round === 1 && def.range <= 1) continue
    const variance = 0.85 + rng() * 0.3
    dmg += def.attack * c * pool.attackMult * variance
  }
  return dmg
}

/** Распределение урона по пулам с учётом брони (пропорционально числу юнитов) */
function applyDamage(pool: SidePool, damage: number, rng: () => number): void {
  const ids = Object.keys(pool.counts) as UnitId[]
  const total = ids.reduce((a, id) => a + (pool.counts[id] ?? 0), 0)
  if (total <= 0) return
  for (const id of ids) {
    const def = UNITS[id]
    const c = pool.counts[id] ?? 0
    if (c <= 0) continue
    const share = (c / total) * damage * (0.9 + rng() * 0.2)
    // Броня снижает урон: armor 20 -> ~50% снижения
    const reduction = def.armor / (def.armor + 20)
    const effective = share * (1 - reduction)
    const newHp = Math.max(0, (pool.hp[id] ?? 0) - effective)
    pool.hp[id] = newHp
    const unitHp = def.hp * pool.hpMult
    pool.counts[id] = Math.ceil(newHp / unitHp)
    if ((pool.counts[id] ?? 0) <= 0) {
      delete pool.counts[id]
      delete pool.hp[id]
    }
  }
}

function poolAlive(pool: SidePool): boolean {
  return Object.values(pool.counts).some((c) => (c ?? 0) > 0)
}

function computeLosses(initial: Army, remaining: Army): Army {
  const losses: Army = {}
  for (const [id, count] of Object.entries(initial)) {
    const lost = (count ?? 0) - (remaining[id as UnitId] ?? 0)
    if (lost > 0) losses[id as UnitId] = lost
  }
  return losses
}

export function simulateBattle(playerArmy: Army, enemy: EnemyKingdom): BattleSimulation {
  const rng = mulberry32((armySeed(playerArmy) ^ (enemy.index * 2654435761)) >>> 0)

  const enemyAttackMult =
    (enemy.traits.includes('aggressive') ? 1.15 : 1) *
    (enemy.traits.includes('horde') ? 0.9 : 1)
  const enemyHpMult = enemy.traits.includes('fortified') ? 1.2 : 1

  const player = buildPool(playerArmy, 1, 1)
  const foe = buildPool(enemy.army, enemyAttackMult, enemyHpMult)

  const rounds: BattleRound[] = []
  let round = 0

  while (poolAlive(player) && poolAlive(foe) && round < 30) {
    round++
    const playerDamage = roundDamage(player, round, rng)
    const enemyDamage = roundDamage(foe, round, rng)
    // Урон одновременный: обе стороны бьют по состоянию на начало раунда
    applyDamage(foe, playerDamage, rng)
    applyDamage(player, enemyDamage, rng)
    rounds.push({
      round,
      playerRemaining: { ...player.counts },
      enemyRemaining: { ...foe.counts },
      playerDamage: Math.round(playerDamage),
      enemyDamage: Math.round(enemyDamage),
    })
  }

  const victory = poolAlive(player) && !poolAlive(foe)

  return {
    victory,
    rounds,
    playerLosses: computeLosses(playerArmy, player.counts),
    enemyLosses: computeLosses(enemy.army, foe.counts),
    initialPlayer: { ...playerArmy },
    initialEnemy: { ...enemy.army },
  }
}

export function toBattleResult(
  sim: BattleSimulation,
  enemy: EnemyKingdom,
): BattleResult {
  return {
    victory: sim.victory,
    enemyIndex: enemy.index,
    playerLosses: sim.playerLosses,
    enemyLosses: sim.enemyLosses,
    reward: sim.victory ? enemy.reward : null,
  }
}
