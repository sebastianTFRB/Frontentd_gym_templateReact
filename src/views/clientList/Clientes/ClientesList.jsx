// src/components/Clientes/ClientesList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Table, Spinner, Dropdown } from "flowbite-react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { getClientes } from "../../api/clientes";
import { API_BASE_URL } from "../../../api/apiConfig";

// ================== helpers comunes (mismos del listado de membresías) ==================
const API_BASE = API_BASE_URL;
// quita el sufijo /api/v1 o /api/v2... para apuntar al origen del server de archivos
const API_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, "");

function resolveFotoSrc(src) {
  if (!src) return null;
  if (src.startsWith("data:")) return src;                 // ya viene como dataURL
  if (/^https?:\/\//i.test(src)) return src;               // URL absoluta
  if (src.startsWith("/")) return API_ORIGIN + src;        // ruta absoluta en el backend (/media/...)
  if (src.startsWith("media/")) return `${API_ORIGIN}/${src}`; // ruta relativa (media/...)
  // si no coincide con lo anterior, tratamos como base64 crudo
  return `data:image/jpeg;base64,${src}`;
}

function Foto({ src }) {
  const resolved = resolveFotoSrc(src);
  if (!resolved) {
    return (
      <div
        style={{ width: 40, height: 40, borderRadius: 8, background: "#2d333b" }}
        className="ring-2 ring-[var(--color-gold-start,#FFD54A)]/40"
      />
    );
  }
  return (
    <img
      src={resolved}
      alt="foto"
      onError={(e) => {
        const el = e.currentTarget;
        if (!el.__fallback) {
          el.__fallback = true;
          el.src =
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
                 <rect width='100%' height='100%' rx='8' fill='#2d333b'/>
               </svg>`
            );
        }
      }}
      className="w-10 h-10 rounded-lg object-cover border border-[#2d333b] ring-2 ring-[var(--color-gold-start,#FFD54A)]/40"
    />
  );
}

// ================== componente ==================
export default function ClientesList() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await getClientes();
        setRaw(res.data);
      } catch (e) {
        console.error("Error cargando clientes:", e);
        setErr("No se pudieron cargar los clientes.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Normaliza para obtener SIEMPRE un array de clientes
  const clientes = useMemo(() => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  }, [raw]);

  // Filtro local con el mismo input de búsqueda (1/2 ancho)
  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase();
    return clientes.filter((c) => {
      const full = `${c?.nombre || ""} ${c?.apellido || ""}`.toLowerCase();
      const email = (c?.correo || "").toLowerCase();
      const doc = (c?.documento || "").toLowerCase();
      return full.includes(q) || email.includes(q) || doc.includes(q);
    });
  }, [clientes, query]);

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      {/* Header con botón "Nuevo" estilo dorado como el otro listado */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h5 className="card-title">Clientes</h5>

        <Link
          to="/clientes/new-with-membresia"
          role="button"
          className="flex items-center justify-center px-4 py-3 gap-3 text-[15px]
                     leading-[normal] font-medium text-black
                     bg-gradient-to-b from-[var(--color-gold-start,#FFD54A)] to-[var(--color-gold-end,#C89D0B)]
                     rounded-xl shadow-[0_16px_28px_-14px_rgba(247,181,0,.45)]
                     hover:brightness-[1.03] hover:-translate-y-[1px] active:translate-y-0 transition-all
                     focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-start,#FFD54A)]/60 focus:ring-offset-2"
        >
          <Icon icon="solar:add-circle-outline" width="18" height="18" />
          <span>Nuevo</span>
        </Link>
      </header>

      {/* Search 1/2 de ancho (igual al de membresías) */}
      <div className="mt-3 w-full md:w-1/2">
        <div className="flex form-control form-rounded-xl">
          <div className="relative w-full">
            <input
              id="search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, documento o email…"
              aria-label="Buscar"
              className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-gray-50
                         text-gray-900 focus:border-cyan-500 focus:ring-cyan-500
                         dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                         dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        {err ? (
          <p style={{ color: "crimson" }}>{err}</p>
        ) : loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Cargando…</span>
          </div>
        ) : !filtered.length ? (
          <p>No hay clientes registrados.</p>
        ) : (
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell className="p-6">Id</Table.HeadCell>
              <Table.HeadCell>Foto</Table.HeadCell>
              <Table.HeadCell>Nombre</Table.HeadCell>
              <Table.HeadCell>Documento</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell />
            </Table.Head>
            <Table.Body className="divide-y divide-border dark:divide-darkborder">
              {filtered.map((c) => {
                const fullName = `${c?.nombre || ""} ${c?.apellido || ""}`.trim();
                const foto = c?.fotografia || c?.foto || null;

                return (
                  <Table.Row
                    key={c.id}
                    className="hover:bg-[rgba(255,213,74,0.06)] transition-colors"
                  >
                    <Table.Cell>{c.id}</Table.Cell>

                    <Table.Cell>
                      <Link to={`/clientes/edit/${c.id}`} className="hover:underline">
                        <Foto src={foto} />
                      </Link>
                    </Table.Cell>

                    <Table.Cell className="whitespace-nowrap ps-6">
                      <Link to={`/clientes/edit/${c.id}`} className="hover:underline">
                        <h5 className="text-base text-wrap">{fullName || "—"}</h5>
                      </Link>
                    </Table.Cell>

                    <Table.Cell>{c.documento || "—"}</Table.Cell>
                    <Table.Cell>{c.correo || "—"}</Table.Cell>

                    <Table.Cell>
                      <Dropdown
                        label=""
                        dismissOnClick={false}
                        renderTrigger={() => (
                          <span className="h-9 w-9 flex justify-center items-center rounded-full hover:bg-lightprimary hover:text-primary cursor-pointer">
                            <HiOutlineDotsVertical size={22} />
                          </span>
                        )}
                      >
                        <Link to={`/clientes/edit/${c.id}`} className="w-full">
                          <Dropdown.Item className="flex gap-3">
                            <Icon icon="solar:pen-new-square-broken" height={18} />
                            <span>Editar cliente</span>
                          </Dropdown.Item>
                        </Link>

                        <Link to={`/clientes/${c.id}/editar-membresia`} className="w-full">
                          <Dropdown.Item className="flex gap-3">
                            <Icon icon="solar:card-outline" height={18} />
                            <span>Ver/editar membresía</span>
                          </Dropdown.Item>
                        </Link>

                        <Link to="/clientes/new-with-membresia" className="w-full">
                          <Dropdown.Item className="flex gap-3">
                            <Icon icon="solar:add-circle-outline" height={18} />
                            <span>Nueva membresía</span>
                          </Dropdown.Item>
                        </Link>
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </div>
    </div>
  );
}
