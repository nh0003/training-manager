export type TrainingStatus = 'pending' | 'completed' | 'skipped'

export type ExerciseCategory = 'strength' | 'cardio' | 'stretch' | 'foam' | 'core'

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'strength',
  'cardio',
  'stretch',
  'foam',
  'core',
]

/** 秒数・回数をセットで行うカテゴリ */
export const TIMED_SET_CATEGORIES: ExerciseCategory[] = ['stretch', 'foam', 'core']

export function isTimedSetCategory(category: ExerciseCategory): boolean {
  return TIMED_SET_CATEGORIES.includes(category)
}

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  notes: string
  createdAt: number
  updatedAt: number
  // セット共通
  reps: number
  sets: number
  weightKg: number
  // 有酸素運動系
  trackDuration: boolean
  trackDistance: boolean
  durationMinutes: number
  distanceMeters: number
  // ストレッチ / フォームローラー / 体幹
  trackSeconds: boolean
  trackReps: boolean
  durationSeconds: number
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
  reps: number
  sets: number
  weightKg: number
  trackDuration: boolean
  trackDistance: boolean
  durationMinutes: number
  distanceMeters: number
  trackSeconds: boolean
  trackReps: boolean
  durationSeconds: number
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
  stretch: 'ストレッチ',
  foam: 'フォームローラー',
  core: '体幹',
}

export const CATEGORY_PLACEHOLDERS: Record<ExerciseCategory, string> = {
  strength: '例: スクワット',
  cardio: '例: ジョギング',
  stretch: '例: ハムストリングス',
  foam: '例: 太もも外側',
  core: '例: プランク',
}

export const CATEGORY_BADGE_CLASS: Record<ExerciseCategory, string> = {
  strength: 'bg-blue-100 text-blue-700',
  cardio: 'bg-emerald-100 text-emerald-700',
  stretch: 'bg-violet-100 text-violet-700',
  foam: 'bg-amber-100 text-amber-700',
  core: 'bg-rose-100 text-rose-700',
}

export const CATEGORY_BUTTON_ACTIVE_CLASS: Record<ExerciseCategory, string> = {
  strength: 'border-blue-500 bg-blue-50 text-blue-700',
  cardio: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  stretch: 'border-violet-500 bg-violet-50 text-violet-700',
  foam: 'border-amber-500 bg-amber-50 text-amber-700',
  core: 'border-rose-500 bg-rose-50 text-rose-700',
}

export type ExerciseInput = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>

type MetricDefaults = Pick<
  Exercise,
  | 'reps'
  | 'sets'
  | 'weightKg'
  | 'trackDuration'
  | 'trackDistance'
  | 'durationMinutes'
  | 'distanceMeters'
  | 'trackSeconds'
  | 'trackReps'
  | 'durationSeconds'
>

export function createDefaultStrengthFields(): MetricDefaults {
  return {
    reps: 10,
    sets: 3,
    weightKg: 0,
    trackDuration: false,
    trackDistance: false,
    durationMinutes: 30,
    distanceMeters: 3000,
    trackSeconds: false,
    trackReps: true,
    durationSeconds: 30,
  }
}

export function createDefaultCardioFields(): MetricDefaults {
  return {
    reps: 0,
    sets: 0,
    weightKg: 0,
    trackDuration: true,
    trackDistance: true,
    durationMinutes: 30,
    distanceMeters: 3000,
    trackSeconds: false,
    trackReps: false,
    durationSeconds: 30,
  }
}

export function createDefaultTimedSetFields(): MetricDefaults {
  return {
    reps: 10,
    sets: 3,
    weightKg: 0,
    trackDuration: false,
    trackDistance: false,
    durationMinutes: 0,
    distanceMeters: 0,
    trackSeconds: true,
    trackReps: true,
    durationSeconds: 30,
  }
}

export function createDefaultFieldsForCategory(category: ExerciseCategory): MetricDefaults {
  if (category === 'strength') return createDefaultStrengthFields()
  if (category === 'cardio') return createDefaultCardioFields()
  return createDefaultTimedSetFields()
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
    trackSeconds: ex.trackSeconds,
    trackReps: ex.trackReps,
    durationSeconds: ex.durationSeconds,
    memo: '',
  }
}
