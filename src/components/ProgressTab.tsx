import { useEffect, useState } from 'react'
import { getPlansInWeek, getWeeklyStats, getWeekRange } from '../db/database'
import { formatDateJP } from '../utils/helpers'
import type { WeeklyStats } from '../types'

interface DayPlan {
  plan: { date: string }
  records: { exerciseName: string; status: string; skipReason?: string }[]
  completionRate: number
}

export default function ProgressTab() {
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [stats, setStats] = useState<WeeklyStats>({
    activeDays: 0,
    totalExercises: 0,
    completedExercises: 0,
    skippedExercises: 0,
    completionRate: 0,
  })
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([])

  useEffect(() => {
    getWeeklyStats(referenceDate).then(setStats)
    getPlansInWeek(referenceDate).then(setDayPlans)
  }, [referenceDate])

  const { weekStart, weekEnd } = getWeekRange(referenceDate)
  const weekLabel = `${formatDateJP(weekStart, { monthDay: true })} 〜 ${formatDateJP(new Date(weekEnd.getTime() - 86400000), { monthDay: true })}`

  const changeWeek = (delta: number) => {
    setReferenceDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + delta * 7)
      return d
    })
  }

  const skippedRecords = dayPlans.flatMap((dp) =>
    dp.records
      .filter((r) => r.status === 'skipped')
      .map((r) => ({ name: r.exerciseName, reason: r.skipReason })),
  )

  return (
    <div className="p-4 space-y-4">
      {/* Week selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeWeek(-1)} className="p-2 rounded-lg hover:bg-slate-200 text-lg">‹</button>
        <h2 className="font-bold">{weekLabel}</h2>
        <button onClick={() => changeWeek(1)} className="p-2 rounded-lg hover:bg-slate-200 text-lg">›</button>
      </div>

      {/* Completion card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg width={120} height={120} className="-rotate-90">
            <circle cx={60} cy={60} r={52} fill="none" stroke="#e2e8f0" strokeWidth={10} />
            <circle
              cx={60}
              cy={60}
              r={52}
              fill="none"
              stroke={stats.completionRate >= 0.8 ? '#16a34a' : stats.completionRate >= 0.5 ? '#2563eb' : '#ea580c'}
              strokeWidth={10}
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - stats.completionRate)}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-3xl font-bold">{Math.round(stats.completionRate * 100)}%</p>
            <p className="text-xs text-slate-500">完了率</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <StatBox value={stats.activeDays} label="実施日" color="text-blue-600" />
          <StatBox value={stats.completedExercises} label="完了" color="text-green-600" />
          <StatBox value={stats.skippedExercises} label="スキップ" color="text-orange-600" />
          <StatBox value={stats.totalExercises} label="合計" color="text-slate-500" />
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h3 className="font-semibold mb-3">日別の状況</h3>
        {dayPlans.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">この週の記録はありません</p>
        ) : (
          <div className="space-y-3">
            {dayPlans.map((dp) => (
              <div key={dp.plan.date} className="flex items-center gap-3">
                <div className="w-16 text-sm font-medium">
                  {formatDateJP(new Date(dp.plan.date + 'T00:00:00'), { monthDay: true })}
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${dp.completionRate * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold w-10 text-right">
                  {Math.round(dp.completionRate * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skip reasons */}
      {skippedRecords.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-semibold mb-3">スキップ理由</h3>
          <div className="space-y-2">
            {skippedRecords.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-orange-500">✗</span>
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.reason && <p className="text-slate-500 text-xs">{r.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
