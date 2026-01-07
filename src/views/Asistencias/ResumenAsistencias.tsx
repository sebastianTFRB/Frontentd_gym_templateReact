import { useEffect, useMemo, useState } from "react";
import { Table, Spinner, Dropdown, Badge, Avatar, Button, TextInput } from "flowbite-react";
import { HiOutlineDotsVertical, HiSearch, HiRefresh } from "react-icons/hi";
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

/* ===== Foto helpers */
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

function FotoAvatar({ src, alt }: { src?: string | null; alt: string }) {
  const resolved = resolveFotoSrc(src);
  return (
    <Avatar
      img={resolved || undefined}
      alt={alt}
      rounded
      size="sm"
      placeholderInitials={!resolved ? alt.charAt(0).toUpperCase() : ""}
      color={!resolved ? "gray" : undefined}
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
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <h5 className="card-title">Asistencias de Hoy</h5>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <TextInput
            icon={HiSearch}
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-64"
          />
          <Button color="primary" onClick={loadData} size="md" className="flex items-center">
            <HiRefresh className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-dark opacity-70">
            <Icon icon="solar:clipboard-list-broken" width="48" className="mx-auto mb-2 opacity-50" />
            <p>No hay registros para mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell className="p-6">Cliente</Table.HeadCell>
                <Table.HeadCell>Hora</Table.HeadCell>
                <Table.HeadCell>Tipo</Table.HeadCell>
                <Table.HeadCell>Estado</Table.HeadCell>
                <Table.HeadCell>Sesiones</Table.HeadCell>
                <Table.HeadCell>
                  <span className="sr-only">Acciones</span>
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-border dark:divide-darkborder">
                {filtered.map((r) => {
                  const nombre = `${r.cliente?.nombre ?? ""} ${r.cliente?.apellido ?? ""}`.trim() || "Cliente";
                  const doc = r.cliente?.documento ?? "";
                  const sesiones = r.venta?.sesiones_restantes ?? "—";
                  const isError = !!r.motivo_error;

                  return (
                    <Table.Row key={r.id}>
                      <Table.Cell className="whitespace-nowrap ps-6">
                        <div className="flex items-center gap-3">
                          <FotoAvatar src={r.cliente?.fotografia} alt={nombre} />
                          <div className="flex flex-col">
                            <h6 className="text-sm font-medium">{nombre}</h6>
                            <p className="text-xs text-dark opacity-70">{doc}</p>
                          </div>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <h5 className="text-base text-dark font-medium">
                          {timeHHmm(r.fecha_hora_entrada)}
                        </h5>
                      </Table.Cell>

                      <Table.Cell>
                        <Badge color="lightsecondary" className="text-secondary w-fit">
                          {(r.tipo_acceso || "N/A").toUpperCase()}
                        </Badge>
                      </Table.Cell>

                      <Table.Cell>
                        {isError ? (
                          <div className="flex flex-col gap-1">
                            <Badge color="failure" icon={() => <Icon icon="solar:danger-circle-bold" className="mr-1" />}>
                              Denegado
                            </Badge>
                            {r.motivo_error && (
                              <span className="text-xs text-red-500 max-w-[150px] truncate" title={r.motivo_error}>
                                {r.motivo_error}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge color="success" icon={() => <Icon icon="solar:check-circle-bold" className="mr-1" />}>
                            Permitido
                          </Badge>
                        )}
                      </Table.Cell>

                      <Table.Cell>
                        <Badge color="lightprimary" className="text-primary w-fit">
                          {sesiones}
                        </Badge>
                      </Table.Cell>

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
                          <Dropdown.Item onClick={() => onDelete(r.id, nombre)} className="flex gap-3 text-red-600">
                            <Icon icon="solar:trash-bin-minimalistic-outline" height={18} />
                            Eliminar
                          </Dropdown.Item>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
