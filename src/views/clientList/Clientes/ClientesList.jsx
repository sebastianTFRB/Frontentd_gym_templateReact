// src/components/Clientes/ClientesList.jsx
import React, { useEffect, useState } from "react";
import { getClientes } from "../../api/clientes";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBarsimple";


export default function ClientesList() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // ✅ Carga clientes desde API
  const loadClientes = async () => {
    setLoading(true);
    try {
      const res = await getClientes();
      const lista = Array.isArray(res.data) ? res.data : res.data.data || [];
      setClientes(lista);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  // ✅ Filtrado básico
  const filteredClientes = clientes.filter((c) => {
    const fullName = `${c.nombre || ""} ${c.apellido || ""}`.toLowerCase();
    const email = (c.correo || "").toLowerCase();
    const documento = (c.documento || "").toLowerCase();
    return (
      fullName.includes(query.toLowerCase()) ||
      email.includes(query.toLowerCase()) ||
      documento.includes(query.toLowerCase())
    );
  });

  return (
    <div  >
      {/* 🔍 Barra de búsqueda */}
      <SearchBar query={query} onChange={setQuery} />

      {/* 🚀 Card con scroll */}
      <div >
        {loading ? (
          <p  >Cargando...</p>
        ) : filteredClientes.length === 0 ? (
          <p >No hay clientes registrados.</p>
        ) : (
          <div >
            <table  >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre completo</th>
                  <th>Documento</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>
                      <Link
                        to={`/clientes/edit/${c.id}`}
                         
                      >
                        {c.nombre} {c.apellido}
                      </Link>
                    </td>
                    <td>{c.documento || "—"}</td>
                    <td>{c.correo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
