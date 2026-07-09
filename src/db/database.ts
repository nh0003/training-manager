import Dexie, { type EntityTable } from 'dexie'
import type { DailyPlan, Exercise, ExerciseInput, TrainingRecord } from '../types'
import {
  createDefaultCardioFields,
  createDefaultStrengthFields,
  exerciseToRecordFields,
} from '../types'

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

db.version(2)
  .stores({
    exercises: 'id, name, category, createdAt',
    dailyPlans: 'id, date, createdAt',
    trainingRecords: 'id, planId, exerciseId, status, category',
  })
  .upgrade(async (tx) => {
    await tx
      .table('exercises')
      .toCollection()
      .modify((ex: Partial<Exercise> & { reps?: number; sets?: number }) => {
        ex.category = 'strength'
        ex.weightKg = ex.weightKg ?? 0
        ex.trackDuration = false
        ex.trackDistance = false
        ex.durationMinutes = 30
        ex.distanceMeters = 3000
        ex.reps = ex.reps ?? 10
        ex.sets = ex.sets ?? 3
      })

    await tx.table('trainingRecords').toCollection().modify((record: Partial<TrainingRecord>) => {
      record.category = 'strength'
      record.weightKg = record.weightKg ?? 0
      record.trackDuration = false
      record.trackDistance = false
      record.durationMinutes = 30
      record.distanceMeters = 3000
      record.reps = record.reps ?? 10
      record.sets = record.sets ?? 3
    })
  })

db.version(3)
  .stores({
    exercises: 'id, name, category, createdAt',
    dailyPlans: 'id, date, createdAt',
    trainingRecords: 'id, planId, exerciseId, status, category',
  })
  .upgrade(async (tx) => {
    await tx.table('trainingRecords').toCollection().modify((record: Partial<TrainingRecord>) => {
      record.memo = record.memo ?? ''
    })
  })

export { db }

export function generateId(): string {
  return crypto.randomUUID()
}

export async function seedSampleData(): Promise<void> {
  const count = await db.exercises.count()
  if (count > 0) return

  const now = Date.now()
  const strengthDefaults = createDefaultStrengthFields()
  const cardioDefaults = createDefaultCardioFields()

  const samples: ExerciseInput[] = [
    {
      name: 'スクワット',
      category: 'strength',
      notes: '',
      ...strengthDefaults,
      reps: 15,
      sets: 3,
      weightKg: 20,
    },
    {
      name: 'プッシュアップ',
      category: 'strength',
      notes: '',
      ...strengthDefaults,
      reps: 10,
      sets: 3,
      weightKg: 0,
    },
    {
      name: 'ジョギング',
      category: 'cardio',
      notes: '',
      ...cardioDefaults,
      trackDuration: true,
      trackDistance: true,
      durationMinutes: 30,
      distanceMeters: 5000,
    },
    {
      name: 'バイク',
      category: 'cardio',
      notes: '',
      ...cardioDefaults,
      trackDuration: true,
      trackDistance: false,
      durationMinutes: 20,
      distanceMeters: 0,
    },
  ]

  await db.exercises.bulkAdd(
    samples.map((s) => ({
      ...s,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    })),
  )
}

// --- Exercise CRUD ---

export async function createExercise(data: ExerciseInput): Promise<Exercise> {
  const now = Date.now()
  const exercise: Exercise = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  }
  await db.exercises.add(exercise)
  return exercise
}

export async function updateExercise(id: string, data: ExerciseInput): Promise<void> {
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
  const existingRecords = existing ? await getRecordsForPlan(existing.id) : []
  const existingByExerciseId = new Map(existingRecords.map((r) => [r.exerciseId, r]))

  if (existing) {
    const newExerciseIds = exercises.map((e) => e.id)
    await db.dailyPlans.update(existing.id, { exerciseIds: newExerciseIds })

    const toRemove = existingRecords.filter((r) => !newExerciseIds.includes(r.exerciseId))
    if (toRemove.length > 0) {
      await db.trainingRecords.bulkDelete(toRemove.map((r) => r.id))
    }

    for (const ex of exercises) {
      const prev = existingByExerciseId.get(ex.id)
      if (prev) {
        await db.trainingRecords.update(prev.id, {
          exerciseName: ex.name,
          category: ex.category,
        })
      } else {
        await db.trainingRecords.add({
          id: generateId(),
          planId: existing.id,
          exerciseId: ex.id,
          exerciseName: ex.name,
          status: 'pending',
          ...exerciseToRecordFields(ex),
        })
      }
    }

    return { ...existing, exerciseIds: newExerciseIds }
  }

  const plan: DailyPlan = {
    id: generateId(),
    date,
    exerciseIds: exercises.map((e) => e.id),
    createdAt: Date.now(),
  }

  if (exercises.length === 0) {
    await db.dailyPlans.add(plan)
    return plan
  }

  const records: TrainingRecord[] = exercises.map((ex) => ({
    id: generateId(),
    planId: plan.id,
    exerciseId: ex.id,
    exerciseName: ex.name,
    status: 'pending' as const,
    ...exerciseToRecordFields(ex),
  }))

  await db.transaction('rw', db.dailyPlans, db.trainingRecords, async () => {
    await db.dailyPlans.add(plan)
    await db.trainingRecords.bulkAdd(records)
  })
  return plan
}

// --- Training Record ---

export type RecordMetricsUpdate = Pick<
  TrainingRecord,
  'reps' | 'sets' | 'weightKg' | 'trackDuration' | 'trackDistance' | 'durationMinutes' | 'distanceMeters' | 'memo'
>

export async function updateRecordMetrics(
  id: string,
  metrics: Partial<RecordMetricsUpdate>,
): Promise<void> {
  await db.trainingRecords.update(id, metrics)
}

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

export function isRestDay(plan: DailyPlan | undefined, records: TrainingRecord[]): boolean {
  return !!plan && plan.exerciseIds.length === 0 && records.length === 0
}
