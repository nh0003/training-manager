import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, formatDate, getRecordsForPlan } from '../db/database'
import { formatDateJP, formatMonthYear, getDaysInMonth } from '../utils/helpers'
import { isSameDay, isToday } from '../db/database'

interface Props {
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function CalendarTab({ selectedDate, onSelectDate }: Props) {
  const [displayMonth, setDisplayMonth] = useState(new Date())

  const plans = useLiveQuery(() => db.dailyPlans.toArray(), []) ?? []

  const days = getDaysInMonth(displayMonth.getFullYear(), displayMonth.getMonth())

  const selectedPlanData = useLiveQuery(async () => {
    const dateStr = formatDate(selectedDate)
    const plan = await db.dailyPlans.where('date').equals(dateStr).first()
    if (!plan) return null
    const records = await getRecordsForPlan(plan.id)
    const completed = records.filter((r) => r.status === 'completed').length
    return { plan, records, rate: records.length > 0 ? completed / records.length : 0 }
  }, [formatDate(selectedDate)])

  const planInfoCache = useLiveQuery(async () => {
    const cache: Record<string, { hasTraining: boolean; rate: number }> = {}
    for (const plan of plans) {
      const records = await getRecordsForPlan(plan.id)
      const completed = records.filter((r) => r.status === 'completed').length
      cache[plan.date] = {
        hasTraining: records.length > 0,
        rate: records.length > 0 ? completed / records.length : 0,
      }
    }
    return cache
  }, [plans]) ?? {}

  const changeMonth = (delta: number) => {
    setDisplayMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const dotColor = (rate: number, hasTraining: boolean) => {
    if (!hasTraining) return 'bg-transparent'
    if (rate >= 1) return 'bg-green-500'
    if (rate > 0) return 'bg-orange-400'
    return 'bg-slate-300'
  }

  return (
    <div className="p-4 space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-200 text-lg">
          ‹
        </button>
        <h2 className="text-xl font-bold">{formatMonthYear(displayMonth)}</h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-slate-200 text-lg">
          ›
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-11" />

          const dateStr = formatDate(day)
          const info = planInfoCache[dateStr]
          const selected = isSameDay(day, selectedDate)
          const today = isToday(day)

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={`h-11 flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                selected
                  ? 'bg-blue-600 text-white'
                  : today
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'hover:bg-slate-100'
              }`}
            >
              <span>{day.getDate()}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor(info?.rate ?? 0, info?.hasTraining ?? false)}`}
              />
            </button>
          )
        })}
      </div>

      {/* Selected day preview */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h3 className="font-semibold mb-3">{formatDateJP(selectedDate, { weekday: true })}</h3>

        {selectedPlanData && selectedPlanData.records.length > 0 ? (
          <div className="space-y-2">
            {selectedPlanData.records.map((record) => (
              <div key={record.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <StatusIcon status={record.status} />
                  <span>{record.exerciseName}</span>
                </div>
                <span className="text-slate-400 text-xs">
                  {record.sets}×{record.reps}
                </span>
              </div>
            ))}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>完了率</span>
                <span>{Math.round(selectedPlanData.rate * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${selectedPlanData.rate * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onSelectDate(selectedDate)}
              className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              詳細を見る
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm mb-3">この日のトレーニングは未設定です</p>
            <button
              onClick={() => onSelectDate(selectedDate)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm"
            >
              トレーニングを設定する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <span className="text-green-500">✓</span>
  if (status === 'skipped') return <span className="text-orange-500">✗</span>
  return <span className="text-slate-300">○</span>
}
