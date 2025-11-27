export type MetricKey = 'speed' | 'energy' | 'mass'

export interface MetricsMeta { label: string; unit: string; color: string }
export const METRICS: Record<MetricKey, MetricsMeta> = {
  speed:  { label: 'Velocità',        unit: 'rpm', color: '#06b6d4' },
  energy: { label: 'Energia',         unit: 'kWh', color: '#a78bfa' },
  mass:   { label: 'Massa sollevata', unit: 'kg',  color: '#22c55e' },
}

export interface DataPoint { date: string; speed: number; energy: number; mass: number }
export interface WeeklyPoint { week: string; value: number }

export function filterData(
  data: DataPoint[], mode: 'preset'|'custom', days?: number, start?: string, end?: string
): DataPoint[] {
  if (mode !== 'custom') {
    const n = days ?? 30
    const s = new Date(); s.setDate(s.getDate() - (n - 1))
    return data.filter(r => new Date(r.date) >= s)
  }
  const S = start ? new Date(start) : new Date(data[0]?.date ?? new Date().toISOString())
  const E = end   ? new Date(end)   : new Date(data[data.length-1]?.date ?? new Date().toISOString())
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
  const pairs: Array<[string, number[]]> = []
  map.forEach((v, k) => { pairs.push([k, v]) })
  return pairs.sort((a,b)=> a[0]<b[0] ? -1 : 1).map(([k, arr]) => ({ week: k, value: mean(arr) }))
}
