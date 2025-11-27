import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  METRICS,
  filterData,
  weeklyAverage,
  mean,
  type MetricKey,
  type DataPoint,
  type MetricsMeta,
} from "./data";
import KPI from "./components/KPI";
import MultiMetricLine from "./components/MultiMetricLine";
import WeeklyBar from "./components/WeeklyBar";

export default function App() {
  const [metric, setMetric] = useState<MetricKey>("speed");
  const [rangeMode, setRangeMode] = useState<"preset" | "custom">("preset");
  const [presetDays, setPresetDays] = useState<number>(30);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [serverData, setServerData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Carica i dati dal backend (senza filtro train_id per test)
  useEffect(() => {
    let stop = false;

    async function load() {
      try {
        setLoading(true);

        const params =
          rangeMode === "custom"
            ? { from: startDate || undefined, to: endDate || undefined }
            : undefined;

        const rows = await api.listDataPoints(params);
        if (!stop) {
          setServerData(rows);
          setError(null);
        }
      } catch (e: any) {
        if (!stop) setError(e.message || "Errore di rete");
      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 10000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [rangeMode, startDate, endDate]);

  // 📊 Elaborazione dati
  const all: DataPoint[] = serverData;

  const filtered: DataPoint[] = useMemo(
    () =>
      filterData(
        all,
        rangeMode === "custom" ? "custom" : "preset",
        presetDays,
        startDate,
        endDate
      ),
    [all, rangeMode, presetDays, startDate, endDate]
  );

  // ✅ fallback anti-vuoto
  const effective: DataPoint[] = filtered.length ? filtered : all;

  const hasData = effective.length > 0;
  const last = hasData ? effective[effective.length - 1][metric] : 0;
  const avg = hasData ? mean(effective.map((d) => d[metric])) : 0;
  const first = hasData ? effective[0][metric] : 0;
  const variation = hasData && first ? ((last - first) / first) * 100 : 0;

  const weekly = useMemo(
    () => weeklyAverage(effective, metric),
    [effective, metric]
  );
  const m = METRICS[metric];

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="h-title">Dashboard</div>
          <div className="small">Visualizzazione storica delle prestazioni</div>
        </div>

        <div className="row">
          <select
            className="select"
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
          >
            {(Object.entries(METRICS) as [MetricKey, MetricsMeta][])
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} ({v.unit})
                </option>
              ))}
          </select>

          <select
            className="select"
            value={rangeMode === "custom" ? "custom" : String(presetDays)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") setRangeMode("custom");
              else {
                setRangeMode("preset");
                setPresetDays(Number(val));
              }
            }}
          >
            <option value={7}>Ultimi 7 giorni</option>
            <option value={30}>Ultimi 30 giorni</option>
            <option value={90}>Ultimi 90 giorni</option>
            <option value="custom">Intervallo personalizzato</option>
          </select>
        </div>
      </div>

      {rangeMode === "custom" && (
        <div className="card row" style={{ alignItems: "center" }}>
          <div className="small" style={{ minWidth: 120 }}>
            Intervallo di date
          </div>
          <input
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      )}

      {/* Stato connessione */}
      <div className="small" style={{ marginTop: 8 }}>
        Stato dati:{" "}
        {loading
          ? "⏳ caricamento…"
          : error
          ? `⚠️ ${error}`
          : `server: ${serverData.length} — visibili: ${filtered.length}`}
      </div>

      {loading && <div className="small">Caricamento dati…</div>}
      {error && (
        <div className="small" style={{ color: "#f87171" }}>
          Errore API: {error}
        </div>
      )}
      {!loading && !error && !hasData && (
        <div className="small" style={{ color: "#fbbf24" }}>
          Nessun dato disponibile per l’intervallo selezionato.
        </div>
      )}

      <div className="kpis">
        <KPI
          label="Valore attuale"
          value={last.toFixed(1)}
          unit={m.unit}
          rightIcon={"↗"}
        />
        <KPI
          label="Media"
          value={avg.toFixed(1)}
          unit={m.unit}
          rightIcon={"≈"}
        />
        <KPI
          label="Variazione"
          value={`${variation >= 0 ? "+" : ""}${variation.toFixed(1)}`}
          unit={"%"}
          rightIcon={"%"}
        />
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card" style={{ minHeight: 420 }}>
          <h3>Andamento storico delle metriche</h3>
          <MultiMetricLine data={effective} />
          <div className="legend">
            <span className="dot energy" /> {METRICS.energy.label} (
            {METRICS.energy.unit}){" "}
            <span className="dot mass" /> {METRICS.mass.label} (
            {METRICS.mass.unit}){" "}
            <span className="dot speed" /> {METRICS.speed.label} (
            {METRICS.speed.unit})
          </div>
        </div>

        <div className="card" style={{ minHeight: 380 }}>
          <h3>Medie settimanali</h3>
          <WeeklyBar data={weekly} color={m.color} />
        </div>
      </div>
    </div>
  );
}
