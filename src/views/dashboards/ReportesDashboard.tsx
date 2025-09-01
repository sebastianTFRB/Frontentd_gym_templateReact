// /src/views/dashboards/ReportesDashboard.tsx
import React, { lazy } from "react";
import axios from "axios";

// ✅ (opcional, pero recomendado) TanStack Query
import { useQuery } from "@tanstack/react-query";

const ReactApexChart = lazy(() => import("react-apexcharts"));

// -----------------------------
// Config API (autocontenida)
// -----------------------------
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

const api = axios.create({ baseURL: API_BASE_URL });

// -----------------------------
// Tipos y helpers dentro de la página
// -----------------------------
type ResumenAsistenciasOut = {
  diarias_hoy: number;
  mensuales_actual: number;
  anuales_actual: number;
};

type ResumenMembresiasOut = {
  total_clientes: number;
  activos: number;
  proximos_vencer: number;
  vencidos: number;
};

type SerieItem = { x: string; y: number };

function normalizeSerieItems(items: any[]): SerieItem[] {
  return (items ?? []).map((it) => ({
    x:
      it.fecha ??
      it.date ??
      it.label ??
      it.mes ??
      it.mes_nombre ??
      it.anio ??
      it.year ??
      "",
    y: it.total ?? it.count ?? it.value ?? it.cantidad ?? 0,
  }));
}

// -----------------------------
// Llamadas API (in-file)
// -----------------------------
async function getResumenAsistencias() {
  const { data } = await api.get<ResumenAsistenciasOut>(
    "/reportes/asistencias/resumen"
  );
  return data;
}

async function getResumenMembresias(dias_alerta = 5) {
  const { data } = await api.get<ResumenMembresiasOut>(
    "/reportes/membresias/resumen",
    { params: { dias_alerta } }
  );
  return data;
}

async function getSerieDiaria(dias = 30) {
  const { data } = await api.get<{ items: any[] }>(
    "/reportes/asistencias/diarias",
    { params: { dias } }
  );
  return normalizeSerieItems(data.items);
}

async function getSerieMensual(meses = 12) {
  const { data } = await api.get<{ items: any[] }>(
    "/reportes/asistencias/mensuales",
    { params: { meses } }
  );
  return normalizeSerieItems(data.items);
}

async function getSerieAnual(anios = 5) {
  const { data } = await api.get<{ items: any[] }>(
    "/reportes/asistencias/anuales",
    { params: { anios } }
  );
  return normalizeSerieItems(data.items);
}

// -----------------------------
// UI
// -----------------------------
function Kpi({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl shadow-sm p-4 bg-white dark:bg-neutral-900">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default function ReportesDashboard() {
  // Parámetros (modifica si quieres hacerlos controlables por UI)
  const DIAS = 30;
  const MESES = 12;
  const ANIOS = 5;
  const DIAS_ALERTA = 5;

  // Queries (sin hooks externos)
  const qAsist = useQuery({
    queryKey: ["resumen-asistencias"],
    queryFn: getResumenAsistencias,
    staleTime: 60_000,
  });

  const qMemb = useQuery({
    queryKey: ["resumen-membresias", DIAS_ALERTA],
    queryFn: () => getResumenMembresias(DIAS_ALERTA),
    staleTime: 60_000,
  });

  const qDiaria = useQuery({
    queryKey: ["serie-diaria", DIAS],
    queryFn: () => getSerieDiaria(DIAS),
    staleTime: 60_000,
  });

  const qMensual = useQuery({
    queryKey: ["serie-mensual", MESES],
    queryFn: () => getSerieMensual(MESES),
    staleTime: 60_000,
  });

  const qAnual = useQuery({
    queryKey: ["serie-anual", ANIOS],
    queryFn: () => getSerieAnual(ANIOS),
    staleTime: 60_000,
  });

  const loading =
    qAsist.isLoading ||
    qMemb.isLoading ||
    qDiaria.isLoading ||
    qMensual.isLoading ||
    qAnual.isLoading;

  const lineOptions = (title: string): ApexCharts.ApexOptions => ({
    chart: { id: title, toolbar: { show: false } },
    title: { text: title },
    xaxis: { type: "category" },
    stroke: { width: 3, curve: "smooth" },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 4 },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Reportes</h1>

      {/* KPIs de Asistencias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi
          title="Asistencias hoy"
          value={qAsist.data?.diarias_hoy ?? (loading ? "…" : 0)}
        />
        <Kpi
          title="Asistencias mes (actual)"
          value={qAsist.data?.mensuales_actual ?? (loading ? "…" : 0)}
        />
        <Kpi
          title="Asistencias año (actual)"
          value={qAsist.data?.anuales_actual ?? (loading ? "…" : 0)}
        />
      </div>

      {/* KPIs de Membresías */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Kpi
          title="Clientes"
          value={qMemb.data?.total_clientes ?? (loading ? "…" : 0)}
        />
        <Kpi title="Activos" value={qMemb.data?.activos ?? (loading ? "…" : 0)} />
        <Kpi
          title="Próx. a vencer"
          value={qMemb.data?.proximos_vencer ?? (loading ? "…" : 0)}
        />
        <Kpi
          title="Vencidos"
          value={qMemb.data?.vencidos ?? (loading ? "…" : 0)}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl shadow-sm p-4 bg-white dark:bg-neutral-900">
          <React.Suspense fallback={<div className="p-6 text-center">Cargando gráfico…</div>}>
            <ReactApexChart
              type="line"
              height={280}
              options={lineOptions(`Asistencias diarias (${DIAS} días)`)}
              series={[
                {
                  name: "Asistencias",
                  data: (qDiaria.data ?? []).map((d) => ({ x: d.x, y: d.y })),
                },
              ]}
            />
          </React.Suspense>
        </div>

        <div className="rounded-2xl shadow-sm p-4 bg-white dark:bg-neutral-900">
          <React.Suspense fallback={<div className="p-6 text-center">Cargando gráfico…</div>}>
            <ReactApexChart
              type="bar"
              height={280}
              options={lineOptions(`Asistencias mensuales (${MESES} meses)`)}
              series={[
                {
                  name: "Asistencias",
                  data: (qMensual.data ?? []).map((d) => ({ x: d.x, y: d.y })),
                },
              ]}
            />
          </React.Suspense>
        </div>

        <div className="rounded-2xl shadow-sm p-4 bg-white dark:bg-neutral-900">
          <React.Suspense fallback={<div className="p-6 text-center">Cargando gráfico…</div>}>
            <ReactApexChart
              type="bar"
              height={280}
              options={lineOptions(`Asistencias anuales (${ANIOS} años)`)}
              series={[
                {
                  name: "Asistencias",
                  data: (qAnual.data ?? []).map((d) => ({ x: d.x, y: d.y })),
                },
              ]}
            />
          </React.Suspense>
        </div>
      </div>

      {(qAsist.error || qMemb.error || qDiaria.error || qMensual.error || qAnual.error) && (
        <div className="rounded-lg border border-red-300 bg-red-50 text-red-800 p-4">
          No fue posible cargar todos los datos. Verifica la API /reportes.
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
 * Si NO usas React Query aún, cambia el bloque de queries por:
 *
 * const [asist, setAsist] = React.useState<ResumenAsistenciasOut>();
 * const [memb, setMemb] = React.useState<ResumenMembresiasOut>();
 * const [diaria, setDiaria] = React.useState<SerieItem[]>([]);
 * const [mensual, setMensual] = React.useState<SerieItem[]>([]);
 * const [anual, setAnual] = React.useState<SerieItem[]>([]);
 * const [loading, setLoading] = React.useState(true);
 * const [error, setError] = React.useState<string | null>(null);
 *
 * React.useEffect(() => {
 *   (async () => {
 *     try {
 *       setLoading(true);
 *       const [a, m, d, me, an] = await Promise.all([
 *         getResumenAsistencias(),
 *         getResumenMembresias(5),
 *         getSerieDiaria(30),
 *         getSerieMensual(12),
 *         getSerieAnual(5),
 *       ]);
 *       setAsist(a); setMemb(m); setDiaria(d); setMensual(me); setAnual(an);
 *     } catch (e) {
 *       setError("No fue posible cargar los datos.");
 *     } finally {
 *       setLoading(false);
 *     }
 *   })();
 * }, []);
 *
 * …y reemplaza qAsist.data por asist, qMensual.data por mensual, etc.
 * ------------------------------------------------------------- */
