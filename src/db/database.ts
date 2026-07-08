import Dexie, { type EntityTable } from 'dexie'
import type { DailyPlan, Exercise, TrainingRecord } from '../types'

const db = new Dexie('TrainingManagerDB') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  dailyPlans: EntityTable<DailyPlan, 'id'>
  trainingRecords: EntityTable<TrainingRecord, 'id'>
}

db.version(1).stores({
  exercises: 'id, name, createdAt',
  dailyPlans: 'id, date, createdAt',
  trainingRecords: 'id, planId, exerciseId, status',
})

export { db }

export function generateId(): string {
  return crypto.randomUUID()
}

export async function seedSampleData(): Promise<void> {
  const count = await db.exercises.count()
  if (count > 0) return

  const now = Date.now()
  const samples: Omit<Exercise, 'id'>[] = [
    { name: 'スクワット', reps: 15, sets: 3, notes: '', createdAt: now, updatedAt: now },
    { name: 'プッシュアップ', reps: 10, sets: 3, notes: '', createdAt: now, updatedAt: now },
    { name: 'プランク', reps: 60, sets: 3, notes: '秒数', createdAt: now, updatedAt: now },
    { name: 'ランジ', reps: 12, sets: 3, notes: '', createdAt: now, updatedAt: now },
  ]

  await db.exercises.bulkAdd(samples.map((s) => ({ ...s, id: generateId() })))
}

// --- Exercise CRUD ---

export async function createExercise(
  name: string,
  reps: number,
  sets: number,
  notes = '',
): Promise<Exercise> {
  const now = Date.now()
  const exercise: Exercise = {
    id: generateId(),
    name,
    reps,
    sets,
    notes,
    createdAt: now,
    updatedAt: now,
  }
  await db.exercises.add(exercise)
  return exercise
}

export async function updateExercise(
  id: string,
  data: Pick<Exercise, 'name' | 'reps' | 'sets' | 'notes'>,
): Promise<void> {
  await db.exercises.update(id, { ...data, updatedAt: Date.now() })
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id)
}

// --- Daily Plan ---

export async function getPlanByDate(date: string): Promise<DailyPlan | undefined> {
  return db.dailyPlans.where('date').equals(date).first()
}

export async function getRecordsForPlan(planId: string): Promise<TrainingRecord[]> {
  return db.trainingRecords.where('planId').equals(planId).toArray()
}

export async function assignExercisesToDate(
  date: string,
  exercises: Exercise[],
): Promise<DailyPlan> {
  const existing = await getPlanByDate(date)

  if (existing) {
    await db.trainingRecords.where('planId').equals(existing.id).delete()
    await db.dailyPlans.update(existing.id, {
      exerciseIds: exercises.map((e) => e.id),
    })
    const records: TrainingRecord[] = exercises.map((ex) => ({
      id: generateId(),
      planId: existing.id,
      exerciseId: ex.id,
      exerciseName: ex.name,
      reps: ex.reps,
      sets: ex.sets,
      status: 'pending' as const,
    }))
    await db.trainingRecords.bulkAdd(records)
    return { ...existing, exerciseIds: exercises.map((e) => e.id) }
  }

  const plan: DailyPlan = {
    id: generateId(),
    date,
    exerciseIds: exercises.map((e) => e.id),
    createdAt: Date.now(),
  }
  const records: TrainingRecord[] = exercises.map((ex) => ({
    id: generateId(),
    planId: plan.id,
    exerciseId: ex.id,
    exerciseName: ex.name,
    reps: ex.reps,
    sets: ex.sets,
    status: 'pending' as const,
  }))
  await db.transaction('rw', db.dailyPlans, db.trainingRecords, async () => {
    await db.dailyPlans.add(plan)
    await db.trainingRecords.bulkAdd(records)
  })
  return plan
}

// --- Training Record ---

export async function updateRecordStatus(
  id: string,
  status: TrainingRecord['status'],
  skipReason?: string,
): Promise<void> {
  const updates: Partial<TrainingRecord> = { status }
  if (status === 'completed') {
    updates.completedAt = Date.now()
    updates.skipReason = undefined
  } else if (status === 'skipped') {
    updates.skipReason = skipReason
    updates.completedAt = undefined
  } else {
    updates.completedAt = undefined
    updates.skipReason = undefined
  }
  await db.trainingRecords.update(id, updates)
}

// --- Progress ---

export async function getWeeklyStats(referenceDate: Date) {
  const { weekStart, weekEnd } = getWeekRange(referenceDate)
  const plans = await db.dailyPlans
    .where('date')
    .between(formatDate(weekStart), formatDate(weekEnd), true, false)
    .toArray()

  let totalExercises = 0
  let completedExercises = 0
  let skippedExercises = 0
  let activeDays = 0

  for (const plan of plans) {
    const records = await getRecordsForPlan(plan.id)
    if (records.length > 0) activeDays++
    for (const r of records) {
      totalExercises++
      if (r.status === 'completed') completedExercises++
      if (r.status === 'skipped') skippedExercises++
    }
  }

  return {
    activeDays,
    totalExercises,
    completedExercises,
    skippedExercises,
    completionRate: totalExercises > 0 ? completedExercises / totalExercises : 0,
  }
}

export async function getPlansInWeek(referenceDate: Date) {
  const { weekStart, weekEnd } = getWeekRange(referenceDate)
  const plans = await db.dailyPlans
    .where('date')
    .between(formatDate(weekStart), formatDate(weekEnd), true, false)
    .toArray()

  const result = []
  for (const plan of plans.sort((a, b) => a.date.localeCompare(b.date))) {
    const records = await getRecordsForPlan(plan.id)
    const completed = records.filter((r) => r.status === 'completed').length
    result.push({
      plan,
      records,
      completionRate: records.length > 0 ? completed / records.length : 0,
    })
  }
  return result
}

export function getWeekRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  return { weekStart, weekEnd }
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isSameDay(a: Date, b: Date): boolean {
  return formatDate(a) === formatDate(b)
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}
