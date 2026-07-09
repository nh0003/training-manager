export type TrainingStatus = 'pending' | 'completed' | 'skipped'

export type ExerciseCategory = 'strength' | 'cardio'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  notes: string
  createdAt: number
  updatedAt: number
  // 筋トレ系
  reps: number
  sets: number
  weightKg: number
  // 有酸素運動系
  trackDuration: boolean
  trackDistance: boolean
  durationMinutes: number
  distanceMeters: number
}

export interface DailyPlan {
  id: string
  date: string // YYYY-MM-DD
  exerciseIds: string[]
  createdAt: number
}

export interface TrainingRecord {
  id: string
  planId: string
  exerciseId: string
  exerciseName: string
  category: ExerciseCategory
  status: TrainingStatus
  skipReason?: string
  completedAt?: number
  // 筋トレ系
  reps: number
  sets: number
  weightKg: number
  // 有酸素運動系
  trackDuration: boolean
  trackDistance: boolean
  durationMinutes: number
  distanceMeters: number
  memo: string
}

export type TabId = 'calendar' | 'today' | 'exercises' | 'progress'

export interface WeeklyStats {
  activeDays: number
  totalExercises: number
  completedExercises: number
  skippedExercises: number
  completionRate: number
}

export const STATUS_LABELS: Record<TrainingStatus, string> = {
  pending: '未実施',
  completed: '完了',
  skipped: 'スキップ',
}

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: '筋トレ',
  cardio: '有酸素',
}

export type ExerciseInput = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>

export function createDefaultStrengthFields(): Pick<
  Exercise,
  'reps' | 'sets' | 'weightKg' | 'trackDuration' | 'trackDistance' | 'durationMinutes' | 'distanceMeters'
> {
  return {
    reps: 10,
    sets: 3,
    weightKg: 0,
    trackDuration: false,
    trackDistance: false,
    durationMinutes: 30,
    distanceMeters: 3000,
  }
}

export function createDefaultCardioFields(): Pick<
  Exercise,
  'reps' | 'sets' | 'weightKg' | 'trackDuration' | 'trackDistance' | 'durationMinutes' | 'distanceMeters'
> {
  return {
    reps: 0,
    sets: 0,
    weightKg: 0,
    trackDuration: true,
    trackDistance: true,
    durationMinutes: 30,
    distanceMeters: 3000,
  }
}

export function exerciseToRecordFields(
  ex: Exercise,
): Omit<TrainingRecord, 'id' | 'planId' | 'exerciseId' | 'exerciseName' | 'status' | 'skipReason' | 'completedAt'> {
  return {
    category: ex.category,
    reps: ex.reps,
    sets: ex.sets,
    weightKg: ex.weightKg,
    trackDuration: ex.trackDuration,
    trackDistance: ex.trackDistance,
    durationMinutes: ex.durationMinutes,
    distanceMeters: ex.distanceMeters,
    memo: '',
  }
}
