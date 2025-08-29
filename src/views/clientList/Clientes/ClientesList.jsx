// src/components/Clientes/ClientesList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Table, Spinner } from "flowbite-react";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBarsimple";
import { getClientes } from "../../api/clientes";

export default function ClientesList() {
  const [raw, setRaw] = useState(null);       // respuesta “cruda” de API
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState("");

  const loadClientes = async () => {
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
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // Normaliza para obtener SIEMPRE un array de clientes
  const clientes = useMemo(() => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  }, [raw]);

  // Filtro local
  const filteredClientes = useMemo(() => {
    const q = (query || "").toLowerCase();
    return (Array.isArray(clientes) ? clientes : []).filter((c) => {
      const full = `${c?.nombre || ""} ${c?.apellido || ""}`.toLowerCase();
      const email = (c?.correo || "").toLowerCase();
      const doc = (c?.documento || "").toLowerCase();
      return full.includes(q) || email.includes(q) || doc.includes(q);
    });
  }, [clientes, query]);

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <header className="flex items-center justify-between">
        <h5 className="card-title">Clientes</h5>
      </header>

      {/* 🔍 Búsqueda */}
      <SearchBar query={query} onChange={(val) => setQuery(val)} />

      <div className="mt-3">
        {err ? (
          <p style={{ color: "crimson" }}>{err}</p>
        ) : loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Cargando…</span>
          </div>
        ) : !filteredClientes.length ? (
          <p>No hay clientes registrados.</p>
        ) : (
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell className="p-6">Id</Table.HeadCell>
              <Table.HeadCell>Nombre completo</Table.HeadCell>
              <Table.HeadCell>Documento</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y divide-border dark:divide-darkborder">
              {filteredClientes.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell>{c.id}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap ps-6">
                    <Link to={`/clientes/edit/${c.id}`} className="hover:underline">
                      {c.nombre} {c.apellido}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{c.documento || "—"}</Table.Cell>
                  <Table.Cell>{c.correo || "—"}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </div>
  );
}
