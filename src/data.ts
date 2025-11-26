export type MetricKey = 'speed' | 'energy' | 'mass'

export interface MetricsMeta { label: string; unit: string; color: string }
export const METRICS: Record<MetricKey, MetricsMeta> = {
  speed:  { label: 'Velocità',       unit: 'rpm', color: '#06b6d4' },
  energy: { label: 'Energia',        unit: 'kWh', color: '#a78bfa' },
  mass:   { label: 'Massa sollevata', unit: 'kg',  color: '#22c55e' },
}


export interface DataPoint { date: string; speed: number; energy: number; mass: number }
export interface WeeklyPoint { week: string; value: number }

let seed = 42
function rnd(): number { seed = (seed*1664525 + 1013904223) % 4294967296; return seed/4294967296 }

export function generateData(days=420): DataPoint[] {
  const out: DataPoint[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i)
    const base = i / 10
    const speed  = 240 + Math.sin(i/6)*12   + base*0.03   + (rnd()-0.5)*8
    const energy = 1800 + Math.cos(i/7)*120 + base*0.8    + (rnd()-0.5)*70
    const mass   = 3200 + Math.sin(i/9)*160 + base*(-0.5) + (rnd()-0.5)*120
    out.push({ date: d.toISOString().slice(0,10), speed, energy, mass })
  }
  return out
}

export function filterData(
  data: DataPoint[], mode: 'preset'|'custom', days?: number, start?: string, end?: string
): DataPoint[] {
  if (mode !== 'custom') {
    const n = days ?? 30
    const s = new Date(); s.setDate(s.getDate() - (n - 1))
    return data.filter(r => new Date(r.date) >= s)
  }
  const S = start ? new Date(start) : new Date(data[0].date)
  const E = end   ? new Date(end)   : new Date(data[data.length-1].date)
  return data.filter(r => { const d = new Date(r.date); return d >= S && d <= E })
}

export function mean(arr: number[]): number {
  return arr.length ? arr.reduce((s,x)=>s+x,0)/arr.length : 0
}
export function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const v = arr.reduce((s,x)=> s + Math.pow(x-m,2), 0) / (arr.length-1)
  return Math.sqrt(v)
}

export function weeklyAverage(data: DataPoint[], key: MetricKey): WeeklyPoint[] {
  const map = new Map<string, number[]>()
  for (const r of data) {
    const d = new Date(r.date)
    const monday = new Date(d); const day = (d.getDay()+6)%7; monday.setDate(d.getDate()-day)
    const k = monday.toISOString().slice(0,10)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(r[key])
  }
  return [...map.entries()]
    .sort((a,b)=> a[0]<b[0] ? -1 : 1)
    .map(([k, arr]) => ({ week: k, value: mean(arr) }))
}
