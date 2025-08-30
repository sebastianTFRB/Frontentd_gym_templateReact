import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createCliente, Cliente } from "../../api/clientes";
import { getTiposDescuento, TipoDescuento } from "../../api/tipos_descuento";
import { Label, TextInput, Select, Button } from "flowbite-react";

const AddClient: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<Omit<Cliente, "id">>({
    nombre: "",
    apellido: "",
    documento: "",
    correo: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    id_tipo_descuento: undefined,
  });

  const [tiposDescuento, setTiposDescuento] = useState<TipoDescuento[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "id_tipo_descuento") {
      setForm({ ...form, id_tipo_descuento: value ? Number(value) : undefined });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertimos solo los valores que sean strings o numbers
      const dataToSend: Record<string, string | number> = {};
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          dataToSend[key] = value;
        }
      });

      const res = await createCliente(dataToSend); // Asegúrate que createCliente acepte Record<string, any>
      
      const clienteId = res.data.id;
      navigate(`/HuellaController/${clienteId}`);
      
    } catch (err) {
      console.error("Error creando cliente:", err);
      alert("Error al crear cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="rounded-xl shadow-md bg-white p-6 w-full" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-6">Agregar Cliente</h2>
      <div className="grid grid-cols-12 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-6 col-span-12 flex flex-col gap-4">
          <div>
            <Label htmlFor="nombre" value="Nombre" />
            <TextInput
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="apellido" value="Apellido" />
            <TextInput
              id="apellido"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="documento" value="Documento" />
            <TextInput
              id="documento"
              name="documento"
              value={form.documento}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="correo" value="Correo" />
            <TextInput
              id="correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="telefono" value="Teléfono" />
            <TextInput
              id="telefono"
              name="telefono"
              value={form.telefono || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-6 col-span-12 flex flex-col gap-4">
          <div>
            <Label htmlFor="direccion" value="Dirección" />
            <TextInput
              id="direccion"
              name="direccion"
              value={form.direccion || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="fecha_nacimiento" value="Fecha de nacimiento" />
            <TextInput
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento || ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="id_tipo_descuento" value="Tipo de descuento" />
            <Select
              id="id_tipo_descuento"
              name="id_tipo_descuento"
              value={form.id_tipo_descuento || ""}
              onChange={handleChange}
            >
              <option value="">Seleccione...</option>
                {tiposDescuento.map((d) => (
                <option key={d.id} value={d.id}>
                    {d.nombre_descuento}
                </option>
                ))}

            
            </Select>
          </div>
        </div>

        {/* Botones */}
        <div className="col-span-12 flex gap-3 mt-4">
          <Button color="primary" type="submit" isProcessing={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
          <Button color="gray" type="button" onClick={() => navigate("/ClientList")}>
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AddClient;
