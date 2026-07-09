import { useEffect, useState } from 'react'
import { assignExercisesToDate, formatDate, isRestDay, updateRecordStatus } from '../db/database'
import { useExercises, usePlanWithRecords } from '../hooks/useTraining'
import { categoryBadgeLabel, exerciseSummary, formatDateJP } from '../utils/helpers'
import { isToday } from '../db/database'
import { STATUS_LABELS, type Exercise, type TrainingRecord } from '../types'
import TrainingMetricsEditor from './TrainingMetricsEditor'

interface Props {
  date: Date
}

export default function DailyTrainingTab({ date }: Props) {
  const data = usePlanWithRecords(date)
  const exercises = useExercises()
  const [showPicker, setShowPicker] = useState(false)
  const [skipTarget, setSkipTarget] = useState<TrainingRecord | null>(null)
  const [skipReason, setSkipReason] = useState('')

  const title = isToday(date) ? '今日のトレーニング' : formatDateJP(date, { weekday: true })
  const dateStr = formatDate(date)
  const restDay = data ? isRestDay(data.plan, data.records) : false

  const handleAssign = async (selectedIds: Set<string>) => {
    const selected = exercises.filter((e) => selectedIds.has(e.id))
    await assignExercisesToDate(dateStr, selected)
    setShowPicker(false)
  }

  const handleSkip = async () => {
    if (!skipTarget || !skipReason.trim()) return
    await updateRecordStatus(skipTarget.id, 'skipped', skipReason.trim())
    setSkipTarget(null)
    setSkipReason('')
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <button
          onClick={() => setShowPicker(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium shrink-0"
        >
          種目を編集
        </button>
      </div>

      {!data ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💪</div>
          <p className="text-slate-500 mb-4">トレーニングが未設定です</p>
          <button
            onClick={() => setShowPicker(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            種目を設定する
          </button>
        </div>
      ) : restDay ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">😴</div>
          <p className="text-slate-600 font-medium mb-2">この日はトレーニングなし</p>
          <p className="text-slate-400 text-sm mb-4">休養日として設定されています</p>
          <button
            onClick={() => setShowPicker(true)}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium"
          >
            種目を追加する
          </button>
        </div>
      ) : data.records.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💪</div>
          <p className="text-slate-500 mb-4">トレーニングが未設定です</p>
          <button
            onClick={() => setShowPicker(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            種目を設定する
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500">完了率</p>
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(data.completionRate * 100)}%
              </p>
            </div>
            <CircularProgress rate={data.completionRate} />
          </div>

          <div className="space-y-3">
            {data.records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{record.exerciseName}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          record.category === 'strength'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {categoryBadgeLabel(record.category)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2 ${
                      record.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'skipped'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {STATUS_LABELS[record.status]}
                  </span>
                </div>

                <TrainingMetricsEditor record={record} />

                {record.status === 'skipped' && record.skipReason && (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1 mb-2">
                    理由: {record.skipReason}
                  </p>
                )}

                {record.status === 'pending' ? (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateRecordStatus(record.id, 'completed')}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                    >
                      ✓ 完了
                    </button>
                    <button
                      onClick={() => {
                        setSkipTarget(record)
                        setSkipReason('')
                      }}
                      className="flex-1 py-2 border border-orange-400 text-orange-600 rounded-lg text-sm"
                    >
                      スキップ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => updateRecordStatus(record.id, 'pending')}
                    className="text-xs text-slate-400 mt-1"
                  >
                    リセット
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showPicker && (
        <ExercisePickerModal
          exercises={exercises}
          initialSelected={data?.plan.exerciseIds ?? []}
          onConfirm={handleAssign}
          onClose={() => setShowPicker(false)}
        />
      )}

      {skipTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-lg">スキップ理由</h3>
            <textarea
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="例: 体調不良、時間がない"
              className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSkipTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleSkip}
                disabled={!skipReason.trim()}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium disabled:opacity-40"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CircularProgress({ rate }: { rate: number }) {
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - rate)

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={rate >= 1 ? '#16a34a' : rate > 0.5 ? '#2563eb' : '#ea580c'}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}

function ExercisePickerModal({
  exercises,
  initialSelected,
  onConfirm,
  onClose,
}: {
  exercises: Exercise[]
  initialSelected: string[]
  onConfirm: (ids: Set<string>) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  useEffect(() => {
    setSelected(new Set(initialSelected))
  }, [initialSelected])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const strengthExercises = exercises.filter((e) => e.category === 'strength')
  const cardioExercises = exercises.filter((e) => e.category === 'cardio')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold">種目を選択</h3>
          <button onClick={onClose} className="text-slate-400 text-xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {exercises.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              種目がありません。「種目」タブから追加してください。
            </p>
          ) : (
            <>
              {strengthExercises.length > 0 && (
                <ExerciseGroup title="筋トレ" exercises={strengthExercises} selected={selected} onToggle={toggle} />
              )}
              {cardioExercises.length > 0 && (
                <ExerciseGroup title="有酸素" exercises={cardioExercises} selected={selected} onToggle={toggle} />
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => onConfirm(selected)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
          >
            {selected.size === 0 ? '0件に設定（休養日）' : `設定する（${selected.size}種目）`}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="w-full py-2 text-sm text-slate-500"
          >
            すべて解除
          </button>
        </div>
      </div>
    </div>
  )
}

function ExerciseGroup({
  title,
  exercises,
  selected,
  onToggle,
}: {
  title: string
  exercises: Exercise[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-2">{title}</p>
      <div className="space-y-2">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onToggle(ex.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              selected.has(ex.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-left">
              <p className="font-medium">{ex.name}</p>
              <p className="text-xs text-slate-500">{exerciseSummary(ex)}（プリセット）</p>
            </div>
            {selected.has(ex.id) && <span className="text-blue-600">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
