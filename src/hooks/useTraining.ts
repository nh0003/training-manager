import { useLiveQuery } from 'dexie-react-hooks'
import { db, getPlanByDate, getRecordsForPlan } from '../db/database'
import { formatDate } from '../db/database'

export function useExercises() {
  return useLiveQuery(() => db.exercises.orderBy('name').toArray(), []) ?? []
}

export function useDailyPlans() {
  return useLiveQuery(() => db.dailyPlans.toArray(), []) ?? []
}

export function usePlanWithRecords(date: Date) {
  const dateStr = formatDate(date)
  return useLiveQuery(async () => {
    const plan = await getPlanByDate(dateStr)
    if (!plan) return null
    const records = await getRecordsForPlan(plan.id)
    const completed = records.filter((r) => r.status === 'completed').length
    return {
      plan,
      records,
      completionRate: records.length > 0 ? completed / records.length : 0,
    }
  }, [dateStr])
}

export function useAllRecords() {
  return useLiveQuery(() => db.trainingRecords.toArray(), []) ?? []
}
