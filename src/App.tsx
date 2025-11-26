import { useMemo, useState } from 'react'
import { METRICS, generateData, filterData, weeklyAverage, mean, MetricKey, DataPoint, MetricsMeta } from './data'
import KPI from './components/KPI'
import MultiMetricLine from './components/MultiMetricLine'
import WeeklyBar from './components/WeeklyBar'

export default function App() {
  const [metric, setMetric] = useState<MetricKey>('speed')
  const [rangeMode, setRangeMode] = useState<'preset'|'custom'>('preset')
  const [presetDays, setPresetDays] = useState<number>(30)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const all: DataPoint[] = useMemo(()=> generateData(420), [])
  const filtered: DataPoint[] = useMemo(
    () => filterData(all, rangeMode==='custom' ? 'custom' : 'preset', presetDays, startDate, endDate),
    [all, rangeMode, presetDays, startDate, endDate]
  )

  const last = filtered[filtered.length-1]?.[metric] ?? 0
  const avg = mean(filtered.map(d => d[metric]))
  const first = filtered[0]?.[metric] ?? last
  const variation = first ? ((last-first)/first)*100 : 0

  const weekly = useMemo(()=> weeklyAverage(filtered, metric), [filtered, metric])
  const m = METRICS[metric]

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="h-title">Dashboard</div>
          <div className="small">Visualizzazione storica delle prestazioni</div>
        </div>

        <div className="row">
          <select className="select" value={metric} onChange={(e)=> setMetric(e.target.value as MetricKey)}>
            {(Object.entries(METRICS) as [MetricKey, MetricsMeta][])
              .map(([k, v]) => (
                <option key={k} value={k}>{v.label} ({v.unit})</option>
            ))}
          </select>

          <select
            className="select"
            value={rangeMode==='custom' ? 'custom' : String(presetDays)}
            onChange={(e)=>{
              const val = e.target.value
              if (val === 'custom') setRangeMode('custom')
              else { setRangeMode('preset'); setPresetDays(Number(val)) }
            }}
          >
            <option value={7}>Ultimi 7 giorni</option>
            <option value={30}>Ultimi 30 giorni</option>
            <option value={90}>Ultimi 90 giorni</option>
            <option value="custom">Intervallo personalizzato</option>
          </select>
        </div>
      </div>

      {rangeMode==='custom' && (
        <div className="card row" style={{alignItems:'center'}}>
          <div className="small" style={{minWidth:120}}>Intervallo di date</div>
          <input className="input" type="date" value={startDate} onChange={(e)=> setStartDate(e.target.value)} />
          <input className="input" type="date" value={endDate} onChange={(e)=> setEndDate(e.target.value)} />
        </div>
      )}

      <div className="kpis">
        <KPI label="Valore attuale" value={last.toFixed(1)} unit={m.unit} rightIcon={'↗'} />
        <KPI label="Media" value={avg.toFixed(1)} unit={m.unit} rightIcon={'≈'} />
        <KPI label="Variazione" value={`${variation>=0?'+':''}${variation.toFixed(1)}`} unit={'%'} rightIcon={'%'} />
      </div>

      <div className="grid" style={{marginTop:12}}>
        <div className="card">
          <h3>Andamento storico delle metriche</h3>
          <MultiMetricLine data={filtered} />
          <div className="legend">
            <span className="dot energy"/> Energia (kWh)
            <span className="dot mass"/> Massa sollevata (kg)
            <span className="dot speed"/> Velocità (rpm)
          </div>
        </div>

        <div className="card">
          <h3>Medie settimanali</h3>
          <WeeklyBar data={weekly} color={m.color} />
        </div>
      </div>
    </div>
  )
}
