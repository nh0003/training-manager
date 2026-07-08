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

export function exerciseSummary(sets: number, reps: number): string {
  return `${sets}セット × ${reps}回`
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
