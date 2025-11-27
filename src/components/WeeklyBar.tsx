import './WeeklyBar.css'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { stdDev, WeeklyPoint } from '../data'

type Props = { data: WeeklyPoint[]; color: string }

export default function WeeklyBar({ data, color }: Props) {
  const values = data.map(d=>d.value)
  const range: [number, number] = values.length ? [Math.min(...values), Math.max(...values)] : [0,0]
  const std = stdDev(values)

  return (
    <div>
      <div className="weekly-bar-meta">
        Intervallo: {range[0].toFixed(1)} – {range[1].toFixed(1)} | Dev. standard: {std.toFixed(1)}
      </div>
      <div className="weekly-bar-container">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top:10, right:20, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="week" stroke="#93a4b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#93a4b8" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1f2937', color:'#e5e7eb' }} />
            <Bar dataKey="value" fill={color} radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
