import { useEffect, useMemo, useState } from "react";
import { Table, Spinner, Dropdown, Badge } from "flowbite-react";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { getAsistencias, deleteAsistencia, Asistencia } from "../../api/asistenciasApi";
import { API_BASE_URL } from "../../api/apiConfig";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeHHmm(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

/* ===== Foto helpers (Consistent with Client.tsx) */
const API_BASE = API_BASE_URL;
const API_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, "");

function resolveFotoSrc(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return API_ORIGIN + src;
  if (src.startsWith("media/")) return `${API_ORIGIN}/${src}`;
  return `data:image/jpeg;base64,${src}`;
}

function Foto({ src }: { src?: string | null }) {
  const resolved = resolveFotoSrc(src);
  if (!resolved) {
    return (
      <div
        className="w-10 h-10 rounded-lg bg-[#2d333b] ring-2 ring-[var(--color-gold-start,#FFD54A)]/40"
        aria-hidden
      />
    );
  }
  return (
    <img
      src={resolved}
      alt="foto"
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement & { __fallback?: boolean };
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

/* ================= Componente ================= */
export default function ResumenAsistencias() {
  const MySwal = withReactContent(Swal);

  // States
  const [rows, setRows] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  // Logic
  const loadData = async () => {
    setLoading(true);

    try {
      const res = await getAsistencias({ date: todayStr() });
      let data = Array.isArray(res.data) ? res.data : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      data = data.filter((a) => {
        const fh = new Date(a.fecha_hora_entrada);
        return fh >= today && fh < tomorrow;
      });

      data.sort(
        (a, b) =>
          new Date(b.fecha_hora_entrada).getTime() - new Date(a.fecha_hora_entrada).getTime()
      );

      setRows(data);
    } catch (e) {
      console.error(e);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const sNombre = `${r.cliente?.nombre ?? ""} ${r.cliente?.apellido ?? ""}`.trim().toLowerCase();
      const sDoc = (r.cliente?.documento ?? "").toLowerCase();
      const sTipo = (r.tipo_acceso ?? "").toLowerCase();
      const sHora = timeHHmm(r.fecha_hora_entrada).toLowerCase();
      return sNombre.includes(q) || sDoc.includes(q) || sTipo.includes(q) || sHora.includes(q);
    });
  }, [rows, query]);

  const onDelete = async (id: number, nombre: string) => {
    const result = await MySwal.fire({
      icon: "warning",
      title: "¿Eliminar registro?",
      text: `Entrada de: ${nombre}`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAsistencia(id);
      loadData();
      MySwal.fire({ icon: "success", title: "Eliminado", showConfirmButton: false, timer: 1000 });
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar." });
    }
  };

  return (
    <div className="p-6 transition-all duration-300 ease-in-out">
      {/* Main Glass Card */}
      <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 relative overflow-hidden">

        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

        {/* Header Section */}
        <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h5 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Icon icon="solar:clipboard-list-bold-duotone" className="text-primary" />
              Asistencias de Hoy
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitorea en tiempo real los ingresos al gimnasio.
            </p>
          </div>

          <button
            onClick={loadData}
            className="group flex items-center justify-center gap-2 px-5 py-2.5 
                       bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600
                       rounded-xl shadow-sm hover:shadow-md hover:border-primary hover:text-primary 
                       transition-all duration-200"
          >
            <Icon icon="solar:refresh-circle-linear" width="20" height="20" className={`transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 flex flex-col lg:flex-row items-center justify-end gap-4 border-b border-gray-100 dark:border-gray-700 relative z-10">
          <div className="w-full lg:w-80 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="solar:magnifer-linear" className="text-gray-400 group-focus-within:text-primary transition-colors" width="20" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, documento o hora..."
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 
                         focus:border-primary transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="relative z-10 overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center">
              <Spinner size="xl" color="warning" aria-label="Cargando..." />
              <p className="mt-3 text-gray-500 animate-pulse text-sm">Cargando asistencias...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Icon icon="solar:clipboard-remove-broken" width={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">No hay registros</h3>
              <p className="text-sm mt-1">No se han registrado entradas para hoy.</p>
            </div>
          ) : (
            <Table hoverable className="w-full text-left bg-transparent">
              <Table.Head className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <Table.HeadCell className="py-4 pl-6 text-gray-500 font-semibold tracking-wider text-xs uppercase">CLIENTE</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">HORA</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">TIPO</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">ESTADO</Table.HeadCell>
                <Table.HeadCell className="py-4 text-gray-500 font-semibold tracking-wider text-xs uppercase">SESIONES</Table.HeadCell>
                <Table.HeadCell className="py-4 pr-6 text-right"><span className="sr-only">Acciones</span></Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((r) => {
                  const nombre = `${r.cliente?.nombre ?? ""} ${r.cliente?.apellido ?? ""}`.trim() || "Cliente";
                  const doc = r.cliente?.documento ?? "";
                  const sesiones = r.venta?.sesiones_restantes ?? "—";
                  const isError = !!r.motivo_error;

                  return (
                    <Table.Row key={r.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">

                      {/* Cliente */}
                      <Table.Cell className="py-4 pl-6 border-none">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <Foto src={r.cliente?.fotografia} />
                          </div>
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white line-clamp-1 text-base">
                              {nombre}
                            </h6>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Icon icon="solar:card-linear" width={14} />
                              {doc}
                            </div>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Hora */}
                      <Table.Cell className="py-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Icon icon="solar:clock-circle-linear" width={16} />
                          <span className="font-medium">{timeHHmm(r.fecha_hora_entrada)}</span>
                        </div>
                      </Table.Cell>

                      {/* Tipo */}
                      <Table.Cell className="py-4">
                        <Badge color="gray" className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 w-fit rounded-lg">
                          {(r.tipo_acceso || "N/A")}
                        </Badge>
                      </Table.Cell>

                      {/* Estado */}
                      <Table.Cell className="py-4">
                        {isError ? (
                          <div className="flex flex-col gap-1 items-start">
                            <Badge color="failure" className="px-2 py-0.5 rounded-md" icon={() => <Icon icon="solar:forbidden-circle-bold" className="mr-1" />}>
                              Denegado
                            </Badge>
                            {r.motivo_error && (
                              <span className="text-[10px] text-red-500 font-medium max-w-[150px] truncate leading-tight" title={r.motivo_error}>
                                {r.motivo_error}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge color="success" className="px-2 py-0.5 rounded-md" icon={() => <Icon icon="solar:check-circle-bold" className="mr-1" />}>
                            Permitido
                          </Badge>
                        )}
                      </Table.Cell>

                      {/* Sesiones */}
                      <Table.Cell className="py-4">
                        <span className={`font-bold px-3 py-1 rounded-lg text-sm border ${Number(sesiones) <= 2 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          {sesiones}
                        </span>
                      </Table.Cell>

                      {/* Acciones */}
                      <Table.Cell className="py-4 pr-6 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity justify-end flex">
                          <Dropdown inline label="" dismissOnClick={false} renderTrigger={() => (
                            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 transition-colors">
                              <HiOutlineDotsVertical className="w-5 h-5" />
                            </button>
                          )}>
                            <Dropdown.Item onClick={() => onDelete(r.id, nombre)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700">
                              <Icon icon="solar:trash-bin-trash-bold" width={18} />
                              Eliminar registro
                            </Dropdown.Item>
                          </Dropdown>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
