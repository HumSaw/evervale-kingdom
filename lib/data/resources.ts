import type { ResourceId, ResourceMeta, Resources } from '../types'

export const RESOURCES: Record<ResourceId, ResourceMeta> = {
  gold: { id: 'gold', name: 'Золото', icon: 'Coins', colorVar: 'text-resource-gold' },
  wood: { id: 'wood', name: 'Дерево', icon: 'TreePine', colorVar: 'text-resource-wood' },
  stone: { id: 'stone', name: 'Камень', icon: 'Mountain', colorVar: 'text-resource-stone' },
  iron: { id: 'iron', name: 'Железо', icon: 'Anvil', colorVar: 'text-resource-iron' },
  food: { id: 'food', name: 'Еда', icon: 'Wheat', colorVar: 'text-resource-food' },
  crystals: { id: 'crystals', name: 'Кристаллы', icon: 'Gem', colorVar: 'text-resource-crystal' },
}

export const RESOURCE_LIST = Object.values(RESOURCES)

export const STARTING_RESOURCES: Resources = {
  gold: 500,
  wood: 400,
  stone: 300,
  iron: 100,
  food: 400,
  crystals: 0,
}

export const BASE_STORAGE_CAP: Resources = {
  gold: 5000,
  wood: 4000,
  stone: 4000,
  iron: 3000,
  food: 4000,
  crystals: 500,
}

/** Форматирование чисел: 1520 -> 1.5K, 2400000 -> 2.4M */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return Math.floor(n).toLocaleString('ru-RU')
}
