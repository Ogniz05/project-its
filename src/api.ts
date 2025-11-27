// ✅ URL del tuo backend Laravel
const API_URL = "http://13.50.101.252/api";

/** Struttura dati base per i grafici */
export type DataPoint = {
  date: string;   // YYYY-MM-DD
  speed: number;  // km/h
  energy: number; // kW (potenza istantanea)
  mass: number;   // kg (se presente, altrimenti 0)
};

type AnyRow = Record<string, unknown>;
type ApiResponse<T> = T | { data: T };

/** Funzione helper per richieste HTTP */
async function httpJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (json && typeof json === "object" && "data" in json) {
    // @ts-ignore – accetta anche { data: [...] }
    return (json as any).data as T;
  }
  return json as T;
}

/** Converte una riga generica del backend in DataPoint */
function toDataPoint(row: AnyRow): DataPoint | null {
  // data -> timestamp
  const rawDate =
    (row.date as string) ||
    (row.created_at as string) ||
    (row.timestamp as string);
  if (!rawDate) return null;

  const d = new Date(rawDate);
  const date = isNaN(d.getTime())
    ? String(rawDate).slice(0, 10)
    : d.toISOString().slice(0, 10);

  // ⚠️ mappatura esatta dei tuoi campi
  const speed =
    Number(row.speed_kmh) ??
    Number(row.speed) ??
    Number(row.velocity);

  // Energia consumata (kWh) — dal tuo campo energy_kwh
  const energy =
    Number(row.energy_kwh) ??
    Number(row.energy) ??
    Number(row.kwh) ??
    Number(row.power_kw); // fallback se vuoi vedere la potenza come “energy”

  // Massa: tons → kg
  const massTons =
    Number(row.mass_tons) ??
    Number(row.total_mass) ??
    Number(row.mass);
  const mass = Number.isFinite(massTons) ? (massTons as number) * 1000 : 0;

  const anyValid =
    Number.isFinite(speed) ||
    Number.isFinite(energy) ||
    Number.isFinite(mass);

  if (!anyValid) return null;

  return {
    date,
    speed: Number.isFinite(speed) ? (speed as number) : 0,
    energy: Number.isFinite(energy) ? (energy as number) : 0,
    mass,
  };
}


/** Normalizza un array qualsiasi in un array di DataPoint */
function normalizeArray(input: unknown): DataPoint[] {
  const arr = Array.isArray(input) ? input : [];
  const out: DataPoint[] = [];
  for (const r of arr) {
    const dp = toDataPoint(r as AnyRow);
    if (dp) out.push(dp);
  }
  // Ordina per data crescente
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** Esporta funzioni API */
export const api = {
  /** Lista misurazioni (con filtri opzionali) */
  listDataPoints: async (params?: {
    train_id?: string;
    from?: string;
    to?: string;
  }): Promise<DataPoint[]> => {
    const qs = new URLSearchParams();
    if (params?.train_id) qs.set("train_id", params.train_id);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const raw = await httpJson<unknown>(`/measurements${suffix}`);
    return normalizeArray(raw);
  },

  /** Ultima misurazione */
  latestDataPoint: async (train_id?: string): Promise<DataPoint | null> => {
    const suffix = train_id ? `?train_id=${encodeURIComponent(train_id)}` : "";
    const raw = await httpJson<AnyRow>(`/measurements/latest${suffix}`);
    return toDataPoint(raw);
  },
};
