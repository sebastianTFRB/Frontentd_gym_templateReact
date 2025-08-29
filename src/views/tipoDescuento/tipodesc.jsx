// src/pages/TipoDescuentoPage.jsx
import React, { useEffect, useState } from "react";
import { getTiposDescuento, deleteTipoDescuento } from "../api/tipos_descuento";
import TipoDescuentoForm from "../components/TipoDescuento/TipoDescuentoForm";
import TipoDescuentoList from "../components/TipoDescuento/TipoDescuentoList";
import "../styles/tipodescuento.css";


export default function TipoDescuentoPage() {
  const [tipos, setTipos] = useState([]);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(null);

  const fetchData = async () => {
    const res = await getTiposDescuento();
    setTipos(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSuccess = () => {
    fetchData();
    setEditing(false);
    setCurrent(null);
  };

  const handleEdit = (tipo) => {
    setEditing(true);
    setCurrent(tipo);
  };

  const handleDelete = async (id) => {
    await deleteTipoDescuento(id);
    fetchData();
  };

  const handleCancel = () => {
    setEditing(false);
    setCurrent(null);
  };

  return (
    <div  >
      <div >
        <h2> Gestión de Tipos de Descuento</h2>

        <div  >
         

          <div  >
            <h3>Lista de Descuentos</h3>
            <TipoDescuentoList
              tipos={tipos}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
