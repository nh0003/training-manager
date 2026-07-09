import { useState } from 'react'
import { updateRecordMetrics } from '../db/database'
import { categoryBadgeLabel, exerciseSummary } from '../utils/helpers'
import type { TrainingRecord } from '../types'
import { StepperField, ToggleChip, WeightStepperField } from './MetricFormFields'

interface Props {
  record: TrainingRecord
}

export default function TrainingMetricsEditor({ record }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mt-3 w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 active:bg-blue-50 transition-colors"
      >
        <p className="text-xs text-slate-500 mb-1">トレーニング内容</p>
        <p className="text-sm font-semibold text-slate-800">{exerciseSummary(record)}</p>
        {record.memo.trim() && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">📝 {record.memo}</p>
        )}
        <p className="text-xs text-blue-600 mt-1.5">タップして編集</p>
      </button>

      {showModal && (
        <RecordMetricsModal record={record} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

function RecordMetricsModal({
  record,
  onClose,
}: {
  record: TrainingRecord
  onClose: () => void
}) {
  const [sets, setSets] = useState(record.sets)
  const [reps, setReps] = useState(record.reps)
  const [weightKg, setWeightKg] = useState(record.weightKg)
  const [trackDuration, setTrackDuration] = useState(record.trackDuration)
  const [trackDistance, setTrackDistance] = useState(record.trackDistance)
  const [durationMinutes, setDurationMinutes] = useState(record.durationMinutes)
  const [distanceMeters, setDistanceMeters] = useState(record.distanceMeters)
  const [memo, setMemo] = useState(record.memo ?? '')

  const cardioValid = trackDuration || trackDistance

  const preview: Pick<
    TrainingRecord,
    'category' | 'reps' | 'sets' | 'weightKg' | 'trackDuration' | 'trackDistance' | 'durationMinutes' | 'distanceMeters'
  > =
    record.category === 'strength'
      ? { category: 'strength', reps, sets, weightKg, trackDuration: false, trackDistance: false, durationMinutes: 0, distanceMeters: 0 }
      : {
          category: 'cardio',
          reps: 0,
          sets: 0,
          weightKg: 0,
          trackDuration,
          trackDistance,
          durationMinutes: trackDuration ? durationMinutes : 0,
          distanceMeters: trackDistance ? distanceMeters : 0,
        }

  const handleSave = async () => {
    const memoValue = memo.trim()
    if (record.category === 'strength') {
      await updateRecordMetrics(record.id, { sets, reps, weightKg, memo: memoValue })
    } else {
      if (!cardioValid) return
      await updateRecordMetrics(record.id, {
        trackDuration,
        trackDistance,
        durationMinutes: trackDuration ? durationMinutes : 0,
        distanceMeters: trackDistance ? distanceMeters : 0,
        memo: memoValue,
      })
    }
    onClose()
  }

  const canSave = record.category === 'strength' || cardioValid

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="font-bold text-lg">トレーニング内容を編集</h3>
          <p className="text-xs text-slate-400 mt-0.5">この日の内容のみ変更されます（プリセットは変わりません）</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{record.exerciseName}</p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                record.category === 'strength'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {categoryBadgeLabel(record.category)}
            </span>
          </div>
        </div>

        {record.category === 'strength' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StepperField label="セット数" value={sets} onChange={setSets} min={1} max={20} />
              <StepperField label="回数" value={reps} onChange={setReps} min={1} max={100} />
            </div>
            <WeightStepperField value={weightKg} onChange={setWeightKg} />
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-slate-500 font-medium">記録する指標（複数選択可）</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <ToggleChip label="時間（分）" checked={trackDuration} onChange={setTrackDuration} />
                <ToggleChip label="距離（m）" checked={trackDistance} onChange={setTrackDistance} />
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
            {!cardioValid && (
              <p className="text-xs text-orange-600">時間または距離のいずれかを選択してください</p>
            )}
          </>
        )}

        <div>
          <label className="text-xs text-slate-500 font-medium">メモ（任意）</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例: 次回は少し重さを上げる"
            className="w-full mt-1 border border-slate-200 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {canSave && (
          <div className="bg-slate-50 rounded-lg p-3 text-center text-sm">
            プレビュー: <strong>{exerciseSummary(preview)}</strong>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm"
          >
            キャンセル
          </button>
          <button
            type="button"
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
