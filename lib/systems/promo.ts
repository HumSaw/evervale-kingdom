import type { PromoCodeDef } from '../types'

/**
 * Система промокодов.
 * Коды не хранятся в открытом виде — только их djb2-хэши.
 * (Для мультиплеера проверка обязана переехать на сервер — см. HANDOFF.)
 */

export function hashCode(code: string): string {
  let h = 5381
  const normalized = code.trim().toUpperCase()
  for (let i = 0; i < normalized.length; i++) {
    h = ((h << 5) + h + normalized.charCodeAt(i)) >>> 0
  }
  return h.toString(16)
}

/**
 * Реестр промокодов (по хэшам):
 * - публичный приветственный код с ресурсами
 * - скрытый код разработчика, включающий devMode
 */
export const PROMO_CODES: PromoCodeDef[] = [
  {
    // WELCOME2026
    hash: '38c3929b',
    reward: { resources: { gold: 1000, wood: 600, stone: 500, food: 600 } },
    singleUse: true,
    label: 'Приветственный дар королевства',
  },
  {
    // Скрытый код разработчика
    hash: 'c94a1d23',
    reward: { devMode: true },
    singleUse: false,
    label: 'Режим Создателя',
  },
]

export function findPromo(code: string): PromoCodeDef | undefined {
  const h = hashCode(code)
  return PROMO_CODES.find((p) => p.hash === h)
}
