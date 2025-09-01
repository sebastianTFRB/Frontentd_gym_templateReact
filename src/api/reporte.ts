import { api } from "./apiConfig";

// --- Tipados mínimos basados en tu backend ---
export type ResumenAsistenciasOut = {
  diarias_hoy: number;
  mensuales_actual: number;
  anuales_actual: number;
};

export type ResumenMembresiasOut = {
  total_clientes: number;
  activos: number;
  proximos_vencer: number;
  vencidos: number;
};

// Las series pueden venir con distintos nombres de campos; normalizamos.
export type SerieItem = {
  x: string;  // etiqueta/fecha
  y: number;  // valor
};

// --- Endpoints ---
export async function getResumenAsistencias() {
  const { data } = await api.get<ResumenAsistenciasOut>("/reportes/asistencias/resumen");
  return data;
}

export async function getResumenMembresias(dias_alerta = 5) {
  const { data } = await api.get<ResumenMembresiasOut>("/reportes/membresias/resumen", {
    params: { dias_alerta },
  });
  return data;
}

function normalizeSerieItems(items: any[]): SerieItem[] {
  return (items ?? []).map((it) => ({
    x: it.fecha ?? it.date ?? it.label ?? it.mes ?? it.anio ?? "",
    y: it.total ?? it.count ?? it.value ?? it.cantidad ?? 0,
  }));
}

export async function getSerieDiaria(dias = 30) {
  const { data } = await api.get<{ items: any[] }>("/reportes/asistencias/diarias", {
    params: { dias },
  });
  return normalizeSerieItems(data.items);
}

export async function getSerieMensual(meses = 12) {
  const { data } = await api.get<{ items: any[] }>("/reportes/asistencias/mensuales", {
    params: { meses },
  });
  return normalizeSerieItems(data.items);
}

export async function getSerieAnual(anios = 5) {
  const { data } = await api.get<{ items: any[] }>("/reportes/asistencias/anuales", {
    params: { anios },
  });
  return normalizeSerieItems(data.items);
}
