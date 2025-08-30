// src/api/uploads.ts
import { api } from "./apiConfig";

export async function uploadFoto(documento: string, blob: Blob) {
  const fd = new FormData();
  fd.append("documento", documento);
  fd.append("file", new File([blob], `${documento}.jpg`, { type: "image/jpeg" }));
  const res = await api.post<{ ruta: string }>("/uploads/upload-foto", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.ruta; // "/media/fotos/123.jpg"
}
