import React, { useState, useEffect } from "react";
import { createCliente } from "../api/clientes";
import { getTiposDescuento } from "../api/tipos_descuento";  // 👈 importar

import FormClient from "../components/Clientes/FormClientAdd";
import ImagePreview from "../components/Clientes/ImagePreview";


export default function AddClient() {
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
    fotografia: null
  });

  const [loading, setLoading] = useState(false);
  const [tiposDescuento, setTiposDescuento] = useState([]); 

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
    const dataToSend = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) dataToSend.append(key, value);
    });

    const res = await createCliente(dataToSend);


    const clienteId = res.data.id;
    navigate(`/EditClient/${clienteId}`);
    
    } catch (err) {
      console.error("Error creando cliente:", err);
      alert("Error al crear cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div >
      <div >
        <h2> Agregar Cliente</h2>
        <div >
          <FormClient
            form={form}
            setForm={setForm}
            handleSubmit={handleSubmit}
            loading={loading}
            navigate={navigate}
            descuentos={tiposDescuento}  // 👈 se los pasamos
          />
          <ImagePreview imageFile={form.fotografia} />
        </div>
      </div>
    </div>
  );
}
