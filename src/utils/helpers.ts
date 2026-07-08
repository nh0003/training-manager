import type { Exercise, ExerciseCategory, TrainingRecord } from '../types'
import { CATEGORY_LABELS } from '../types'

export function formatDateJP(date: Date, options?: { weekday?: boolean; monthDay?: boolean }): string {
  if (options?.weekday) {
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
  }
  if (options?.monthDay) {
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
}

export function getDaysInMonth(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const days: (Date | null)[] = Array(startWeekday).fill(null)

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

type SummarySource = Pick<
  Exercise | TrainingRecord,
  | 'category'
  | 'reps'
  | 'sets'
  | 'weightKg'
  | 'trackDuration'
  | 'trackDistance'
  | 'durationMinutes'
  | 'distanceMeters'
>

export function exerciseSummary(item: SummarySource): string {
  if (item.category === 'strength') {
    const base = `${item.sets}セット × ${item.reps}回`
    return item.weightKg > 0 ? `${base}（${item.weightKg}kg）` : base
  }

  const parts: string[] = []
  if (item.trackDuration) parts.push(`${item.durationMinutes}分`)
  if (item.trackDistance) parts.push(`${item.distanceMeters}m`)
  return parts.length > 0 ? parts.join(' / ') : '指標未設定'
}

export function categoryBadgeLabel(category: ExerciseCategory): string {
  return CATEGORY_LABELS[category]
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
