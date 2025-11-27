import './MultiMetricLine.css'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { METRICS, mean, DataPoint } from '../data'

type Props = { data: DataPoint[] }

export default function MultiMetricLine({ data }: Props) {
  const avgs = {
    speed:  mean(data.map(d=>d.speed)),
    energy: mean(data.map(d=>d.energy)),
    mass:   mean(data.map(d=>d.mass)),
  }

  return (
    <div className="multi-metric-container">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" stroke="#93a4b8" tick={{ fontSize: 12 }} tickMargin={8} />
          <YAxis stroke="#93a4b8" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #1f2937', color:'#e5e7eb' }} />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ marginTop: 20, color:'#93a4b8', fontSize: 12 }}
            formatter={(v) => {
              const key = v as keyof typeof avgs
              const meta = METRICS[key]
              const avg = avgs[key]
              return `${meta.label}: media ${avg.toFixed(1)} ${meta.unit}`
            }}
          />
          <Line type="monotone" dataKey="energy" stroke={METRICS.energy.color} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="mass"   stroke={METRICS.mass.color}   dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="speed"  stroke={METRICS.speed.color}  dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
