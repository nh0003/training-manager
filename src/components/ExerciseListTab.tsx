import { useState } from 'react'
import { createExercise, deleteExercise, updateExercise } from '../db/database'
import { useExercises } from '../hooks/useTraining'
import { exerciseSummary } from '../utils/helpers'
import type { Exercise } from '../types'

export default function ExerciseListTab() {
  const exercises = useExercises()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)

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

      {exercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500">種目がありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => (
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
                <p className="font-semibold">{ex.name}</p>
                <p className="text-sm text-slate-500">{exerciseSummary(ex.sets, ex.reps)}</p>
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
  const [reps, setReps] = useState(exercise?.reps ?? 10)
  const [sets, setSets] = useState(exercise?.sets ?? 3)
  const [notes, setNotes] = useState(exercise?.notes ?? '')

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return

    if (exercise) {
      await updateExercise(exercise.id, { name: trimmed, reps, sets, notes })
    } else {
      await createExercise(trimmed, reps, sets, notes)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4">
        <h3 className="font-bold text-lg">{exercise ? '種目を編集' : '種目を追加'}</h3>

        <div>
          <label className="text-xs text-slate-500 font-medium">種目名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: スクワット"
            className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">セット数</label>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setSets(Math.max(1, sets - 1))} className="w-8 h-8 rounded-lg bg-slate-100 text-lg">−</button>
              <span className="flex-1 text-center font-bold">{sets}</span>
              <button onClick={() => setSets(Math.min(20, sets + 1))} className="w-8 h-8 rounded-lg bg-slate-100 text-lg">＋</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">回数</label>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setReps(Math.max(1, reps - 1))} className="w-8 h-8 rounded-lg bg-slate-100 text-lg">−</button>
              <span className="flex-1 text-center font-bold">{reps}</span>
              <button onClick={() => setReps(Math.min(100, reps + 1))} className="w-8 h-8 rounded-lg bg-slate-100 text-lg">＋</button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-medium">メモ（任意）</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="フォームの注意点など"
            className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-center text-sm">
          プレビュー: <strong>{exerciseSummary(sets, reps)}</strong>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
