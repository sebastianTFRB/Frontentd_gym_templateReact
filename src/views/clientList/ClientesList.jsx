import React, { useEffect, useMemo, useState } from "react";
import { getClientes } from "../api/clientes";              // debe aceptar params { page, size, q }
import { getMembresias } from "../api/membresias";
import { getTiposDescuento } from "../api/tipos_descuento";
import { getVentasMembresia } from "../api/venta_membresia";
import { Link } from "react-router-dom";
import SearchBar from "../components/Clientes/SearchBarsimple";

export default function ClientesList() {
  // catálogos (una sola vez)
  const [membresias, setMembresias] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [descuentos, setDescuentos] = useState([]);

  // estado de página del backend
  const [pageData, setPageData] = useState(null); // { items, page, size, total, pages, has_next, ... }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // filtros/paginación (SERVIDOR)
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // cargar catálogos
  useEffect(() => {
    const boot = async () => {
      try {
        const [mRes, vRes, dRes] = await Promise.all([
          getMembresias(),
          getVentasMembresia(),
          getTiposDescuento(),
        ]);

        const membresiasData = Array.isArray(mRes.data) ? mRes.data : mRes.data.data || [];
        const ventasData = Array.isArray(vRes.data) ? vRes.data : vRes.data.data || [];
        const descuentosData = Array.isArray(dRes.data) ? dRes.data : dRes.data.data || [];

        setMembresias(membresiasData);
        setVentas(ventasData);
        setDescuentos(descuentosData);
      } catch (e) {
        console.error("Error cargando catálogos:", e);
      }
    };
    boot();
  }, []);

  // pedir clientes paginados al backend
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    getClientes({
      page,
      size: pageSize,
      q: query.trim() || undefined,
      // sort: "nombre", order: "asc", // si los usas
    })
      .then((res) => {
        if (!mounted) return;
        setPageData(res.data);
        if (res.data?.page && res.data.page !== page) setPage(res.data.page);
      })
      .catch((e) => {
        console.error("Error cargando clientes:", e);
        if (mounted) setErr("No se pudieron cargar los clientes.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [page, pageSize, query]);

  // decora items (membresía, descuento, sesiones)
  const clientesDecorados = useMemo(() => {
    const items = pageData?.items || [];
    return items.map((cliente) => {
      const descuento = descuentos.find((d) => d.id === cliente.id_tipo_descuento);
      const ventaCliente = ventas
        .filter((v) => v.id_cliente === cliente.id)
        .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))[0];

      const membresiaNombre = ventaCliente
        ? membresias.find((m) => m.id === ventaCliente.id_membresia)?.nombre_membresia
        : null;

      return {
        ...cliente,
        descuento: descuento
          ? `${descuento.nombre_descuento} (${descuento.porcentaje_descuento}%)`
          : "Ninguno",
        membresia: membresiaNombre || "Sin membresía",
        sesiones_restantes: ventaCliente ? ventaCliente.sesiones_restantes : "-",
      };
    });
  }, [pageData, descuentos, ventas, membresias]);

  const totalPages = pageData?.pages ?? 1;
  const totalItems = pageData?.total ?? 0;

  return (
    <div>
      <header>
        <h1>GOLDEN Clientes</h1>
        <Link to="/clientes/new">Nuevo Cliente</Link>
      </header>

      <div>
        <SearchBar
          query={query}
          onChange={(val) => {
            setQuery(val);
            setPage(1); // reset al buscar
          }}
        />

        <div>
          <div>
            {err ? (
              <p style={{ color: "crimson" }}>{err}</p>
            ) : loading ? (
              <p>Cargando...</p>
            ) : !clientesDecorados.length ? (
              <p>No hay clientes registrados.</p>
            ) : (
              <div>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre completo</th>
                      <th>Documento</th>
                      <th>Email</th>
                      <th>Membresía</th>
                      <th>Sesiones restantes</th>
                      <th>Descuento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesDecorados.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>
                          <Link to={`/clientes/edit/${c.id}`}>
                            {c.nombre} {c.apellido}
                          </Link>
                        </td>
                        <td>{c.documento}</td>
                        <td>{c.correo || "—"}</td>
                        <td>{c.membresia}</td>
                        <td>{c.sesiones_restantes}</td>
                        <td>{c.descuento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* paginación del backend */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                    <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      ⬅ Anterior
                    </button>
                    <span>
                      Página {page} de {totalPages} &nbsp; <span>(Total: {totalItems})</span>
                    </span>
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Siguiente ➡
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
