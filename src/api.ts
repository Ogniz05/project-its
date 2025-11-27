const API_URL = "http://13.50.101.252/api";

export type Measurement = {
  id?: number;
  date: string;   // ISO string
  speed: number;
  energy: number;
  mass: number;
  train_id?: string;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>'');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  latest: (trainId?: string) =>
    http<Measurement>(`/measurements/latest${trainId ? `?train_id=${encodeURIComponent(trainId)}` : ''}`),

  list: (params?: { train_id?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.train_id) qs.set('train_id', params.train_id);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return http<Measurement[]>(`/measurements${suffix}`);
  },
};
