import type { BuildingDef, BuildingId, BuildingLevelDef, Resources } from '../types'

/**
 * Генератор уровней с экспоненциальным ростом стоимости.
 * base — стоимость 1-го уровня, growth — множитель за уровень.
 */
function levels(
  count: number,
  base: Partial<Resources>,
  baseTime: number,
  opts?: {
    growth?: number
    production?: (lvl: number) => Partial<Resources> | undefined
    storageBonus?: (lvl: number) => Partial<Resources> | undefined
    unlocks?: (lvl: number) => string | undefined
  },
): BuildingLevelDef[] {
  const growth = opts?.growth ?? 1.6
  return Array.from({ length: count }, (_, i) => {
    const lvl = i + 1
    const mult = Math.pow(growth, i)
    const cost: Partial<Resources> = {}
    for (const [k, v] of Object.entries(base)) {
      cost[k as keyof Resources] = Math.round((v as number) * mult)
    }
    return {
      cost,
      buildTime: Math.round(baseTime * mult),
      production: opts?.production?.(lvl),
      storageBonus: opts?.storageBonus?.(lvl),
      unlocks: opts?.unlocks?.(lvl),
    }
  })
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  keep: {
    id: 'keep',
    name: 'Главный замок',
    category: 'core',
    description: 'Сердце королевства. Уровень замка открывает новые здания.',
    icon: 'Castle',
    maxLevel: 10,
    requiresKeepLevel: 0,
    levels: levels(10, { gold: 200, wood: 150, stone: 150 }, 30, {
      growth: 1.8,
      unlocks: (lvl) => `Открывает здания ${lvl + 1}-го круга`,
    }),
  },
  barracks: {
    id: 'barracks',
    name: 'Казармы',
    category: 'military',
    description: 'Здесь ополченцы становятся солдатами. Иногда даже неплохими.',
    icon: 'Swords',
    maxLevel: 8,
    requiresKeepLevel: 1,
    levels: levels(8, { gold: 100, wood: 80 }, 20, {
      unlocks: (lvl) =>
        lvl === 1 ? 'Копейщики' : lvl === 2 ? 'Мечники' : lvl === 4 ? 'Пикинёры' : undefined,
    }),
  },
  archery_range: {
    id: 'archery_range',
    name: 'Стрельбище',
    category: 'military',
    description: 'Мишени, солома и много очень сосредоточенных людей.',
    icon: 'Target',
    maxLevel: 8,
    requiresKeepLevel: 1,
    levels: levels(8, { gold: 120, wood: 100 }, 22, {
      unlocks: (lvl) => (lvl === 1 ? 'Лучники' : lvl === 3 ? 'Арбалетчики' : undefined),
    }),
  },
  stables: {
    id: 'stables',
    name: 'Конюшни',
    category: 'military',
    description: 'Пахнет специфически, зато кавалерия — загляденье.',
    icon: 'Rabbit',
    maxLevel: 8,
    requiresKeepLevel: 2,
    levels: levels(8, { gold: 180, wood: 120, food: 60 }, 28, {
      unlocks: (lvl) =>
        lvl === 1 ? 'Кавалерия' : lvl === 3 ? 'Тяжёлая кавалерия' : undefined,
    }),
  },
  forge: {
    id: 'forge',
    name: 'Кузница',
    category: 'military',
    description: 'Стучит день и ночь. Соседи привыкли.',
    icon: 'Hammer',
    maxLevel: 8,
    requiresKeepLevel: 3,
    levels: levels(8, { gold: 220, stone: 100, iron: 60 }, 32, {
      unlocks: (lvl) => (lvl === 3 ? 'Рыцари' : undefined),
    }),
  },
  siege_workshop: {
    id: 'siege_workshop',
    name: 'Осадная мастерская',
    category: 'military',
    description: 'Инженеры спорят, чертят и строят машины разрушения.',
    icon: 'Cog',
    maxLevel: 6,
    requiresKeepLevel: 5,
    levels: levels(6, { gold: 400, wood: 250, iron: 120 }, 45, {
      unlocks: (lvl) => (lvl === 1 ? 'Катапульты' : lvl === 3 ? 'Требушеты' : undefined),
    }),
  },
  mage_tower: {
    id: 'mage_tower',
    name: 'Магическая башня',
    category: 'military',
    description: 'Светится по ночам. Внутри пахнет озоном и амбициями.',
    icon: 'Sparkles',
    maxLevel: 6,
    requiresKeepLevel: 4,
    levels: levels(6, { gold: 350, stone: 150, crystals: 30 }, 40, {
      unlocks: (lvl) => (lvl === 1 ? 'Маги' : undefined),
    }),
  },
  academy: {
    id: 'academy',
    name: 'Академия',
    category: 'core',
    description: 'Исследования, наука и элитная гвардия. Библиотека прилагается.',
    icon: 'GraduationCap',
    maxLevel: 6,
    requiresKeepLevel: 6,
    levels: levels(6, { gold: 500, stone: 250, crystals: 50 }, 50, {
      unlocks: (lvl) =>
        lvl === 1 ? 'Исследования (Часть 6)' : lvl === 3 ? 'Королевская гвардия' : undefined,
    }),
  },
  farm: {
    id: 'farm',
    name: 'Ферма',
    category: 'economy',
    description: 'Зелёные поля до горизонта. Урожай собирается сам собой.',
    icon: 'Wheat',
    maxLevel: 10,
    requiresKeepLevel: 1,
    levels: levels(10, { gold: 60, wood: 40 }, 15, {
      growth: 1.5,
      production: (lvl) => ({ food: 12 * lvl }),
    }),
  },
  lumber_mill: {
    id: 'lumber_mill',
    name: 'Лесопилка',
    category: 'economy',
    description: 'Лес большой — на наш век хватит. Наверное.',
    icon: 'TreePine',
    maxLevel: 10,
    requiresKeepLevel: 1,
    levels: levels(10, { gold: 60, stone: 30 }, 15, {
      growth: 1.5,
      production: (lvl) => ({ wood: 10 * lvl }),
    }),
  },
  quarry: {
    id: 'quarry',
    name: 'Каменоломня',
    category: 'economy',
    description: 'Добываем камень. Медленно, зато основательно.',
    icon: 'Mountain',
    maxLevel: 10,
    requiresKeepLevel: 1,
    levels: levels(10, { gold: 80, wood: 50 }, 18, {
      growth: 1.5,
      production: (lvl) => ({ stone: 8 * lvl }),
    }),
  },
  iron_mine: {
    id: 'iron_mine',
    name: 'Железный рудник',
    category: 'economy',
    description: 'Глубоко, темно и очень прибыльно.',
    icon: 'Pickaxe',
    maxLevel: 10,
    requiresKeepLevel: 2,
    levels: levels(10, { gold: 120, wood: 80 }, 22, {
      growth: 1.5,
      production: (lvl) => ({ iron: 6 * lvl }),
    }),
  },
  crystal_mine: {
    id: 'crystal_mine',
    name: 'Кристальная шахта',
    category: 'economy',
    description: 'Кристаллы поют, если прислушаться. Шахтёры привыкли.',
    icon: 'Gem',
    maxLevel: 8,
    requiresKeepLevel: 4,
    levels: levels(8, { gold: 300, stone: 150, iron: 80 }, 35, {
      growth: 1.55,
      production: (lvl) => ({ crystals: 2 * lvl }),
    }),
  },
  market: {
    id: 'market',
    name: 'Рынок',
    category: 'economy',
    description: 'Торговцы, слухи и лучшие пироги в королевстве.',
    icon: 'Store',
    maxLevel: 8,
    requiresKeepLevel: 2,
    levels: levels(8, { gold: 150, wood: 100 }, 25, {
      production: (lvl) => ({ gold: 15 * lvl }),
      unlocks: (lvl) => (lvl === 1 ? 'Обмен ресурсов (Часть 6)' : undefined),
    }),
  },
  warehouse: {
    id: 'warehouse',
    name: 'Склад',
    category: 'economy',
    description: 'Место, где ресурсы чувствуют себя в безопасности.',
    icon: 'Warehouse',
    maxLevel: 10,
    requiresKeepLevel: 1,
    levels: levels(10, { gold: 100, wood: 80, stone: 40 }, 20, {
      growth: 1.5,
      storageBonus: (lvl) => ({
        gold: 2000 * lvl,
        wood: 1500 * lvl,
        stone: 1500 * lvl,
        iron: 1000 * lvl,
        food: 1500 * lvl,
        crystals: 300 * lvl,
      }),
    }),
  },
  walls: {
    id: 'walls',
    name: 'Стены',
    category: 'defense',
    description: 'Высокие, каменные, с зубцами. Всё как положено.',
    icon: 'BrickWall',
    maxLevel: 8,
    requiresKeepLevel: 2,
    levels: levels(8, { gold: 200, stone: 200 }, 30, {
      unlocks: (lvl) => `+${lvl * 5}% защита гарнизона (Часть 7)`,
    }),
  },
  watchtower: {
    id: 'watchtower',
    name: 'Дозорная башня',
    category: 'defense',
    description: 'Отсюда видно всё. Даже то, что видеть не хотелось бы.',
    icon: 'TowerControl',
    maxLevel: 6,
    requiresKeepLevel: 3,
    levels: levels(6, { gold: 180, wood: 120, stone: 100 }, 28, {
      unlocks: () => 'Разведка армии противника точнее',
    }),
  },
}

export const BUILDING_LIST = Object.values(BUILDINGS)

export const BUILDING_CATEGORY_LABELS: Record<BuildingDef['category'], string> = {
  core: 'Основные',
  military: 'Военные',
  economy: 'Экономика',
  defense: 'Оборона',
}
