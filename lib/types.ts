/**
 * Центральные типы игры «Королевство Эвервейл».
 * Единственный источник правды для данных (lib/data), систем (lib/systems) и стора.
 */

// ===== Ресурсы =====

export type ResourceId = 'gold' | 'wood' | 'stone' | 'iron' | 'food' | 'crystals'

export type Resources = Record<ResourceId, number>

export interface ResourceMeta {
  id: ResourceId
  name: string
  /** Имя иконки из GAME_ICONS (lucide) */
  icon: string
  /** Tailwind-класс функционального цвета ресурса */
  colorVar: string
}

// ===== Здания =====

export type BuildingId =
  | 'keep'
  | 'barracks'
  | 'archery_range'
  | 'stables'
  | 'forge'
  | 'siege_workshop'
  | 'mage_tower'
  | 'academy'
  | 'farm'
  | 'lumber_mill'
  | 'quarry'
  | 'iron_mine'
  | 'crystal_mine'
  | 'market'
  | 'warehouse'
  | 'walls'
  | 'watchtower'

export type BuildingCategory = 'core' | 'military' | 'economy' | 'defense'

export interface BuildingLevelDef {
  cost: Partial<Resources>
  /** Время строительства в секундах */
  buildTime: number
  /** Производство ресурсов в минуту на этом уровне */
  production?: Partial<Resources>
  /** Бонус к лимитам хранения на этом уровне */
  storageBonus?: Partial<Resources>
  /** Что открывает этот уровень (текст для UI) */
  unlocks?: string
}

export interface BuildingDef {
  id: BuildingId
  name: string
  category: BuildingCategory
  description: string
  /** Имя иконки из GAME_ICONS (lucide) */
  icon: string
  maxLevel: number
  /** Требуемый уровень главного замка */
  requiresKeepLevel: number
  levels: BuildingLevelDef[]
}

/** Уровни построенных зданий: id -> уровень (0/отсутствие = не построено) */
export type BuildingsState = Partial<Record<BuildingId, number>>

// ===== Юниты =====

export type UnitId =
  | 'spearman'
  | 'swordsman'
  | 'archer'
  | 'crossbowman'
  | 'pikeman'
  | 'cavalry'
  | 'heavy_cavalry'
  | 'knight'
  | 'mage'
  | 'catapult'
  | 'trebuchet'
  | 'royal_guard'

export type UnitCategory = 'infantry' | 'ranged' | 'cavalry' | 'siege' | 'magic' | 'elite'

export interface UnitAbility {
  id: string
  name: string
  description: string
}

export interface UnitDef {
  id: UnitId
  name: string
  category: UnitCategory
  description: string
  cost: Partial<Resources>
  /** Время найма одного юнита в секундах */
  trainTime: number
  hp: number
  attack: number
  armor: number
  speed: number
  range: number
  requiresBuilding: BuildingId
  requiresLevel: number
  abilities: UnitAbility[]
  /** Базовая метрика силы для генерации врагов и оценки боя */
  power: number
}

/** Состав армии: id юнита -> количество */
export type Army = Partial<Record<UnitId, number>>

// ===== Геральдика =====

export type CrestShape = 'shield' | 'banner' | 'circle' | 'diamond'

export type CrestSymbol =
  | 'wolf'
  | 'hawk'
  | 'dragon'
  | 'stag'
  | 'bear'
  | 'serpent'
  | 'lion'
  | 'raven'
  | 'boar'
  | 'fox'

export interface Crest {
  shape: CrestShape
  symbol: CrestSymbol
  primaryColor: string
  secondaryColor: string
}

// ===== Вражеские королевства =====

export type EnemyTrait = 'aggressive' | 'fortified' | 'wealthy' | 'swift' | 'arcane' | 'horde'

export type CastleStyle = 'stone' | 'dark' | 'emerald' | 'golden' | 'frost'

export interface EnemyKingdom {
  id: string
  /** Порядковый номер врага (seed генерации) */
  index: number
  name: string
  rulerName: string
  crest: Crest
  level: number
  traits: EnemyTrait[]
  army: Army
  totalPower: number
  reward: Resources
  castleStyle: CastleStyle
  flavorText: string
}

// ===== Бой =====

export type BattlePhase = 'idle' | 'preparing' | 'fighting' | 'finished'

export interface BattleResult {
  victory: boolean
  enemyIndex: number
  playerLosses: Army
  enemyLosses: Army
  reward: Partial<Resources> | null
}

// ===== Промокоды =====

export interface PromoCodeDef {
  /** djb2-хэш кода (сам код не хранится в открытом виде) */
  hash: string
  reward: {
    resources?: Partial<Resources>
    devMode?: boolean
  }
  singleUse: boolean
  label: string
}

// ===== Очереди =====

export interface BuildQueueItem {
  buildingId: BuildingId
  targetLevel: number
  startedAt: number
  finishesAt: number
}

export interface TrainQueueItem {
  unitId: UnitId
  count: number
  startedAt: number
  finishesAt: number
}

// ===== Игрок и общее состояние =====

export interface PlayerState {
  name: string
  crest: Crest
}

export interface ResearchState {
  completed: string[]
  inProgress: string | null
}

export interface GameStats {
  battlesWon: number
  battlesLost: number
  unitsTrained: number
  unitsLost: number
  enemiesDefeated: number
  totalResourcesEarned: number
}

export interface GameState {
  schemaVersion: number
  player: PlayerState
  resources: Resources
  storageCap: Resources
  buildings: BuildingsState
  garrison: Army
  buildQueue: BuildQueueItem[]
  trainQueue: TrainQueueItem[]
  currentEnemy: EnemyKingdom
  battlePhase: BattlePhase
  lastBattleResult: BattleResult | null
  research: ResearchState
  stats: GameStats
  usedPromoCodes: string[]
  devMode: boolean
  lastTickAt: number
}
