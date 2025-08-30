import { api } from "./apiConfig";

// Respuesta del backend
export interface UploadFotoResponse {
  path: string;   // p.ej. "/static/fotos/1085296863.jpg"
  url: string;    // p.ej. "http://localhost:8000/static/fotos/1085296863.jpg"
  filename: string;
}

export async function uploadFoto(documento: string, blob: Blob) {
  const form = new FormData();
  form.append("file", blob, `${documento}.jpg`);
  const res = await api.post<UploadFotoResponse>(`/files/fotos/${encodeURIComponent(documento)}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
