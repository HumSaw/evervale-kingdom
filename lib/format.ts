/** Форматирование длительности: 45 -> "45с", 185 -> "3м 05с", 4500 -> "1ч 15м" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds))
  if (s < 60) return `${s}с`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}м ${String(s % 60).padStart(2, '0')}с`
  const h = Math.floor(m / 60)
  return `${h}ч ${String(m % 60).padStart(2, '0')}м`
}

/** Прогресс 0..1 для элемента очереди */
export function queueProgress(startedAt: number, finishesAt: number, now: number): number {
  const total = finishesAt - startedAt
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, (now - startedAt) / total))
}
