import type {
  Army,
  CrestSymbol,
  EnemyKingdom,
  EnemyTrait,
  UnitId,
} from '../types'
import { UNITS } from '../data/units'

/**
 * Процедурный генератор вражеских королевств.
 * Детерминирован по index (seed), чтобы враг №N всегда был одинаковым
 * при перезагрузке — это важно для честности и для будущей серверной валидации.
 */

// Простой seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

const ADJECTIVES = [
  'Серебряного', 'Красного', 'Изумрудного', 'Золотого', 'Чёрного',
  'Белого', 'Железного', 'Багрового', 'Лазурного', 'Янтарного',
  'Сумеречного', 'Грозового', 'Северного', 'Дикого', 'Вечного',
] as const

const NOUNS: { word: string; symbol: CrestSymbol }[] = [
  { word: 'Волка', symbol: 'wolf' },
  { word: 'Ястреба', symbol: 'hawk' },
  { word: 'Дракона', symbol: 'dragon' },
  { word: 'Оленя', symbol: 'stag' },
  { word: 'Медведя', symbol: 'bear' },
  { word: 'Змея', symbol: 'serpent' },
  { word: 'Льва', symbol: 'lion' },
  { word: 'Ворона', symbol: 'raven' },
  { word: 'Вепря', symbol: 'boar' },
  { word: 'Лиса', symbol: 'fox' },
]

const EMPIRE_NAMES = [
  'Изумрудная Империя', 'Багровый Доминион', 'Сумеречный Предел',
  'Железный Союз', 'Янтарный Альянс', 'Грозовая Марка',
] as const

const RULER_FIRST = [
  'Бальтазар', 'Гримвальд', 'Освальд', 'Тибальт', 'Рагнвальд',
  'Эдмунд', 'Корвус', 'Леопольд', 'Мордред', 'Арчибальд',
  'Изольда', 'Морвенна', 'Гвендолин', 'Ровена',
] as const

const RULER_EPITHET = [
  'Грозный', 'Хитрый', 'Неспящий', 'Золотой', 'Беспощадный',
  'Двуличный', 'Громогласный', 'Скупой', 'Весёлый', 'Угрюмый',
] as const

const FLAVOR = [
  'Говорят, их король не спит с тех пор, как проиграл партию в кости.',
  'Их армия марширует так громко, что птицы улетают за три королевства.',
  'Их казна полна, а чувство юмора — нет.',
  'Поговаривают, их маги превратили посла в жабу. Посол не в обиде.',
  'Их рыцари полируют доспехи чаще, чем побеждают.',
  'Их правитель объявил войну по ошибке, но отступать не привык.',
  'В их землях даже пугала стоят по стойке смирно.',
  'Их знамёна сшиты из шёлка, а намерения — из стали.',
] as const

const CASTLE_STYLES = ['stone', 'dark', 'emerald', 'golden', 'frost'] as const
const TRAITS: EnemyTrait[] = ['aggressive', 'fortified', 'wealthy', 'swift', 'arcane', 'horde']

export const TRAIT_LABELS: Record<EnemyTrait, { name: string; description: string }> = {
  aggressive: { name: 'Агрессивные', description: '+15% к атаке армии' },
  fortified: { name: 'Укреплённые', description: '+20% к здоровью армии' },
  wealthy: { name: 'Богатые', description: '+25% золота в награде' },
  swift: { name: 'Стремительные', description: '+15% к скорости юнитов' },
  arcane: { name: 'Чародейские', description: 'Больше магов в армии' },
  horde: { name: 'Орда', description: '+20% численность, -10% атака' },
}

/** Пул юнитов, доступный врагу на данном уровне прогрессии */
function unitPoolFor(index: number): UnitId[] {
  const pool: UnitId[] = ['spearman']
  if (index >= 1) pool.push('archer')
  if (index >= 2) pool.push('swordsman')
  if (index >= 3) pool.push('cavalry')
  if (index >= 4) pool.push('pikeman', 'crossbowman')
  if (index >= 6) pool.push('heavy_cavalry', 'mage')
  if (index >= 8) pool.push('knight')
  if (index >= 10) pool.push('catapult')
  if (index >= 13) pool.push('trebuchet')
  if (index >= 16) pool.push('royal_guard')
  return pool
}

/** Целевая сила армии врага: экспоненциальная прогрессия */
export function enemyPowerBudget(index: number): number {
  return Math.round(400 * Math.pow(1.28, index - 1))
}

export function generateEnemy(index: number): EnemyKingdom {
  const rng = mulberry32(index * 7919 + 13)

  // --- Название ---
  const useEmpire = index > 3 && rng() < 0.25
  let name: string
  let symbol: CrestSymbol
  if (useEmpire) {
    name = pick(rng, EMPIRE_NAMES)
    symbol = pick(rng, NOUNS).symbol
  } else {
    const noun = pick(rng, NOUNS)
    name = `Королевство ${pick(rng, ADJECTIVES)} ${noun.word}`
    symbol = noun.symbol
  }

  // --- Герб ---
  const hue = Math.floor(rng() * 360)
  const crest = {
    shape: pick(rng, ['shield', 'banner', 'circle', 'diamond'] as const),
    symbol,
    primaryColor: `oklch(0.55 0.16 ${hue})`,
    secondaryColor: `oklch(0.35 0.1 ${hue})`,
  }

  // --- Черты ---
  const traitCount = index < 3 ? 0 : index < 8 ? 1 : 2
  const traits: EnemyTrait[] = []
  while (traits.length < traitCount) {
    const t = pick(rng, TRAITS)
    if (!traits.includes(t)) traits.push(t)
  }

  // --- Армия по бюджету силы ---
  let budget = enemyPowerBudget(index)
  if (traits.includes('horde')) budget = Math.round(budget * 1.2)
  const pool = unitPoolFor(index)
  const army: Army = {}
  let totalPower = 0
  // Раскидываем бюджет: сильные юниты — реже, слабые — массово
  let guard = 0
  while (budget > 0 && guard < 200) {
    guard++
    const unit = UNITS[pick(rng, pool)]
    const batch = Math.max(1, Math.round((budget / unit.power) * (0.15 + rng() * 0.2)))
    const spend = batch * unit.power
    if (spend > budget * 1.3 && guard < 190) continue
    army[unit.id] = (army[unit.id] ?? 0) + batch
    totalPower += spend
    budget -= spend
  }
  if (traits.includes('arcane') && index >= 6) {
    army.mage = (army.mage ?? 0) + Math.max(2, Math.round(index / 3))
    totalPower += UNITS.mage.power * (army.mage ?? 0)
  }

  // --- Награда ---
  const rewardScale = Math.pow(1.25, index - 1)
  const goldMult = traits.includes('wealthy') ? 1.25 : 1
  const reward = {
    gold: Math.round(300 * rewardScale * goldMult),
    wood: Math.round(150 * rewardScale),
    stone: Math.round(120 * rewardScale),
    iron: Math.round(60 * rewardScale),
    food: Math.round(150 * rewardScale),
    crystals: index >= 4 ? Math.round(10 * Math.pow(1.2, index - 4)) : 0,
  }

  return {
    id: `enemy-${index}`,
    index,
    name,
    rulerName: `${pick(rng, RULER_FIRST)} ${pick(rng, RULER_EPITHET)}`,
    crest,
    level: index,
    traits,
    army,
    totalPower: Math.round(totalPower),
    reward,
    castleStyle: pick(rng, CASTLE_STYLES),
    flavorText: pick(rng, FLAVOR),
  }
}

/** Суммарная сила произвольной армии (для сравнения в UI подготовки к бою) */
export function armyPower(army: Army): number {
  let total = 0
  for (const [id, count] of Object.entries(army)) {
    const def = UNITS[id as UnitId]
    if (def && count) total += def.power * count
  }
  return Math.round(total)
}

export function armySize(army: Army): number {
  return Object.values(army).reduce((a, b) => a + (b ?? 0), 0)
}
