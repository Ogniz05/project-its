import './KPI.css'

type Props = { label: string; value: string | number; unit?: string; rightIcon?: React.ReactNode }

export default function KPI({ label, value, unit, rightIcon }: Props) {
  return (
    <div className="kpi">
      <div>
        <div className="label">{label}</div>
        <div className="value">{value} {unit}</div>
      </div>
      {rightIcon && <div className="chip">{rightIcon}</div>}
    </div>
  )
}
