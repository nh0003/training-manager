import { useMemo, useState } from 'react'
import { createExercise, deleteExercise, updateExercise } from '../db/database'
import { useExercises } from '../hooks/useTraining'
import { categoryBadgeLabel, exerciseSummary } from '../utils/helpers'
import type { Exercise, ExerciseCategory, ExerciseInput } from '../types'
import {
  CATEGORY_LABELS,
  createDefaultCardioFields,
  createDefaultStrengthFields,
} from '../types'

export default function ExerciseListTab() {
  const exercises = useExercises()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [filter, setFilter] = useState<ExerciseCategory | 'all'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return exercises
    return exercises.filter((e) => e.category === filter)
  }, [exercises, filter])

  const handleDelete = async (id: string) => {
    if (confirm('この種目を削除しますか？')) {
      await deleteExercise(id)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">種目管理</h2>
        <button
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          ＋ 追加
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'strength', 'cardio'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              filter === key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {key === 'all' ? 'すべて' : CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500">種目がありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between"
            >
              <button
                onClick={() => {
                  setEditing(ex)
                  setShowForm(true)
                }}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{ex.name}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      ex.category === 'strength'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {categoryBadgeLabel(ex.category)}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{exerciseSummary(ex)}</p>
                {ex.notes && <p className="text-xs text-slate-400 mt-0.5">{ex.notes}</p>}
              </button>
              <button
                onClick={() => handleDelete(ex.id)}
                className="text-red-400 text-sm px-2 py-1"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ExerciseFormModal
          exercise={editing}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ExerciseFormModal({
  exercise,
  onClose,
}: {
  exercise: Exercise | null
  onClose: () => void
}) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [category, setCategory] = useState<ExerciseCategory>(exercise?.category ?? 'strength')
  const [notes, setNotes] = useState(exercise?.notes ?? '')
  const [reps, setReps] = useState(exercise?.reps ?? 10)
  const [sets, setSets] = useState(exercise?.sets ?? 3)
  const [weightKg, setWeightKg] = useState(exercise?.weightKg ?? 0)
  const [trackDuration, setTrackDuration] = useState(exercise?.trackDuration ?? true)
  const [trackDistance, setTrackDistance] = useState(exercise?.trackDistance ?? true)
  const [durationMinutes, setDurationMinutes] = useState(exercise?.durationMinutes ?? 30)
  const [distanceMeters, setDistanceMeters] = useState(exercise?.distanceMeters ?? 3000)

  const handleCategoryChange = (next: ExerciseCategory) => {
    setCategory(next)
    if (next === 'strength') {
      const d = createDefaultStrengthFields()
      setReps(d.reps)
      setSets(d.sets)
      setWeightKg(d.weightKg)
    } else {
      const d = createDefaultCardioFields()
      setTrackDuration(d.trackDuration)
      setTrackDistance(d.trackDistance)
      setDurationMinutes(d.durationMinutes)
      setDistanceMeters(d.distanceMeters)
    }
  }

  const buildInput = (): ExerciseInput | null => {
    const trimmed = name.trim()
    if (!trimmed) return null

    if (category === 'strength') {
      return {
        name: trimmed,
        category,
        notes,
        ...createDefaultStrengthFields(),
        reps,
        sets,
        weightKg,
      }
    }

    if (!trackDuration && !trackDistance) return null

    return {
      name: trimmed,
      category,
      notes,
      ...createDefaultCardioFields(),
      trackDuration,
      trackDistance,
      durationMinutes: trackDuration ? durationMinutes : 0,
      distanceMeters: trackDistance ? distanceMeters : 0,
    }
  }

  const preview = buildInput()

  const handleSave = async () => {
    const input = buildInput()
    if (!input) return

    if (exercise) {
      await updateExercise(exercise.id, input)
    } else {
      await createExercise(input)
    }
    onClose()
  }

  const canSave = !!preview

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg">{exercise ? '種目を編集' : '種目を追加'}</h3>

        <div>
          <label className="text-xs text-slate-500 font-medium">カテゴリ</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(['strength', 'cardio'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                className={`py-2.5 rounded-lg text-sm font-medium border ${
                  category === key
                    ? key === 'strength'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {CATEGORY_LABELS[key]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-medium">種目名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={category === 'strength' ? '例: スクワット' : '例: ジョギング'}
            className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {category === 'strength' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StepperField label="セット数" value={sets} onChange={setSets} min={1} max={20} />
              <StepperField label="回数" value={reps} onChange={setReps} min={1} max={100} />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">重さ（kg）</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setWeightKg(Math.max(0, weightKg - 2.5))}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
                >
                  −
                </button>
                <span className="flex-1 text-center font-bold">{weightKg} kg</span>
                <button
                  onClick={() => setWeightKg(Math.min(500, weightKg + 2.5))}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
                >
                  ＋
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">自重のみの場合は 0 kg</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-500 font-medium">記録する指標（複数選択可）</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <ToggleChip
                  label="時間（分）"
                  checked={trackDuration}
                  onChange={setTrackDuration}
                />
                <ToggleChip
                  label="距離（m）"
                  checked={trackDistance}
                  onChange={setTrackDistance}
                />
              </div>
            </div>
            {trackDuration && (
              <StepperField
                label="時間（分）"
                value={durationMinutes}
                onChange={setDurationMinutes}
                min={1}
                max={300}
              />
            )}
            {trackDistance && (
              <StepperField
                label="距離（m）"
                value={distanceMeters}
                onChange={setDistanceMeters}
                min={100}
                max={100000}
                step={100}
              />
            )}
            {!trackDuration && !trackDistance && (
              <p className="text-xs text-orange-600">時間または距離のいずれかを選択してください</p>
            )}
          </>
        )}

        <div>
          <label className="text-xs text-slate-500 font-medium">メモ（任意）</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="フォームの注意点など"
            className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {preview && (
          <div className="bg-slate-50 rounded-lg p-3 text-center text-sm">
            プレビュー: <strong>{exerciseSummary(preview)}</strong>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function StepperField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <div>
      <label className="text-xs text-slate-500 font-medium">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
        >
          −
        </button>
        <span className="flex-1 text-center font-bold">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
        >
          ＋
        </button>
      </div>
    </div>
  )
}

function ToggleChip({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`py-2.5 rounded-lg text-sm font-medium border ${
        checked ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
      }`}
    >
      {checked ? '✓ ' : ''}
      {label}
    </button>
  )
}
