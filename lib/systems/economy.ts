import { BUILDINGS, BUILDING_LIST } from '../data/buildings'
import { BASE_STORAGE_CAP } from '../data/resources'
import type { BuildingsState, ResourceId, Resources } from '../types'

/** Суммарное производство ресурсов в минуту по всем зданиям */
export function computeProductionPerMinute(buildings: BuildingsState): Partial<Resources> {
  const total: Partial<Resources> = {}
  for (const def of BUILDING_LIST) {
    const level = buildings[def.id] ?? 0
    if (level <= 0) continue
    const production = def.levels[level - 1]?.production
    if (!production) continue
    for (const [k, v] of Object.entries(production)) {
      const key = k as ResourceId
      total[key] = (total[key] ?? 0) + (v ?? 0)
    }
  }
  return total
}

/** Лимиты хранения: база + бонусы построенных зданий */
export function computeStorageCap(buildings: BuildingsState): Resources {
  const cap: Resources = { ...BASE_STORAGE_CAP }
  for (const def of BUILDING_LIST) {
    const level = buildings[def.id] ?? 0
    if (level <= 0) continue
    const bonus = def.levels[level - 1]?.storageBonus
    if (!bonus) continue
    for (const [k, v] of Object.entries(bonus)) {
      const key = k as ResourceId
      cap[key] += v ?? 0
    }
  }
  return cap
}

export function canAfford(resources: Resources, cost: Partial<Resources>): boolean {
  return Object.entries(cost).every(
    ([k, v]) => resources[k as ResourceId] >= (v ?? 0),
  )
}

export function subtractCost(resources: Resources, cost: Partial<Resources>): Resources {
  const next = { ...resources }
  for (const [k, v] of Object.entries(cost)) {
    next[k as ResourceId] -= v ?? 0
  }
  return next
}

export function addResources(
  resources: Resources,
  gain: Partial<Resources>,
  cap: Resources,
): Resources {
  const next = { ...resources }
  for (const [k, v] of Object.entries(gain)) {
    const key = k as ResourceId
    next[key] = Math.min(cap[key], next[key] + (v ?? 0))
  }
  return next
}

/** Уровень keep, требуемый для следующего уровня здания */
export function keepRequirementMet(
  buildings: BuildingsState,
  buildingId: keyof typeof BUILDINGS,
): boolean {
  if (buildingId === 'keep') return true
  return (buildings.keep ?? 0) >= BUILDINGS[buildingId].requiresKeepLevel
}
