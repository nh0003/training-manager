export type TrainingStatus = 'pending' | 'completed' | 'skipped'

export interface Exercise {
  id: string
  name: string
  reps: number
  sets: number
  notes: string
  createdAt: number
  updatedAt: number
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
  reps: number
  sets: number
  status: TrainingStatus
  skipReason?: string
  completedAt?: number
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
