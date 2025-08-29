// src/pages/EditClient.jsx
import React, { useState, useEffect } from "react";
import { getCliente, updateCliente, deleteCliente } from "../api/clientes";
import { getTiposDescuento } from "../api/tipos_descuento"; // 👈 importar descuentos
import { useNavigate, useParams } from "react-router-dom";
import FormClient from "../components/Clientes/FormClientEdit";
import ImagePreview from "../components/Clientes/ImagePreview";

import ClientMembershipInfo from "../components/Clientes/ClientMembershipInfo";

export default function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    fecha_nacimiento: "",
    telefono: "",
    correo: "",
    direccion: "",
    id_tipo_descuento: "",
    huella_template: null,
    fotografia: null,
  });

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [tiposDescuento, setTiposDescuento] = useState([]); // 👈 lista de descuentos

  // Cargar datos del cliente
  useEffect(() => {
    async function fetchCliente() {
      try {
        const { data } = await getCliente(id);
        setForm({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          documento: data.documento || "",
          fecha_nacimiento: data.fecha_nacimiento || "",
          telefono: data.telefono || "",
          correo: data.correo || "",
          direccion: data.direccion || "",
          id_tipo_descuento: data.id_tipo_descuento || "",
          huella_template: null,
          fotografia: null,
        });
        // setImagePreview(`data:image/jpeg;base64,${data.fotografia}`);
      } catch (err) {
        console.error("Error cargando cliente:", err);
        alert("Error al cargar datos del cliente");
        navigate("/");
      }
    }
    fetchCliente();
  }, [id, navigate]);

  // Cargar descuentos
  useEffect(() => {
    const fetchDescuentos = async () => {
      try {
        const res = await getTiposDescuento();
        setTiposDescuento(res.data);
      } catch (err) {
        console.error("Error cargando tipos de descuento:", err);
      }
    };
    fetchDescuentos();
  }, []);

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) dataToSend.append(key, value);
      });
      await updateCliente(id, dataToSend);
      alert("Cliente actualizado correctamente");
      navigate("/");
    } catch (err) {
      console.error("Error actualizando cliente:", err);
      alert("Error al actualizar cliente");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cliente
  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar este cliente?")) return;
    setLoading(true);
    try {
      await deleteCliente(id);
      alert("Cliente eliminado correctamente");
      navigate("/");
    } catch (err) {
      console.error("Error eliminando cliente:", err);
      alert("No se pudo eliminar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div >
      <div >
        <h2>Editar Cliente</h2>

        <div >
          {/* Columna izquierda (formulario) */}
          <FormClient
            form={form}
            setForm={(newForm) => {
              setForm(newForm);
              if (newForm.fotografia instanceof File) {
                setImagePreview(URL.createObjectURL(newForm.fotografia));
              }
            }}
            handleSubmit={handleSubmit}
            loading={loading}
            navigate={navigate}
            descuentos={tiposDescuento}
            clientId={id} 
          />

          {/* Columna derecha */}
          <div >
            <ImagePreview imageFile={imagePreview} />
            <div >
              <button
                type="button"
                
                onClick={handleDelete}
                disabled={loading}
              >
                Eliminar Cliente
              </button>
            </div>
            <ClientMembershipInfo clientId={id} />
            
          </div>
        </div>
      </div>
    </div>
  );
}
