function roundToStep(value: number, step: number): number {
  const rounded = Math.round(value / step) * step
  return Math.round(rounded * 1000) / 1000
}

export function StepperField({
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
          type="button"
          onClick={() => onChange(Math.max(min, roundToStep(value - step, step)))}
          className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
        >
          −
        </button>
        <span className="flex-1 text-center font-bold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, roundToStep(value + step, step)))}
          className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
        >
          ＋
        </button>
      </div>
    </div>
  )
}

export function WeightStepperField({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="text-xs text-slate-500 font-medium">重さ（kg）</label>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, roundToStep(value - 0.5, 0.5)))}
          className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
        >
          −
        </button>
        <span className="flex-1 text-center font-bold">{value} kg</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(500, roundToStep(value + 0.5, 0.5)))}
          className="w-8 h-8 rounded-lg bg-slate-100 text-lg"
        >
          ＋
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1">0.5kg 刻み（自重のみの場合は 0 kg）</p>
    </div>
  )
}

export function ToggleChip({
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
