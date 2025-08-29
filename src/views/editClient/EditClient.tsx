// src/views/clientes/FormClientEdit.tsx
import { Label, TextInput, Select, Button } from "flowbite-react";
import React, { useEffect, useState } from "react";
import { Cliente, getCliente, updateCliente } from "../../api/clientes"; 
import { useNavigate, useParams } from "react-router-dom";

export default function FormClientEdit() {
  const { id } = useParams<{ id: string }>(); // Obtener id desde la URL
  const navigate = useNavigate();

  const [form, setForm] = useState<Cliente>({
    id: 0,
    nombre: "",
    apellido: "",
    documento: "",
    correo: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    id_tipo_descuento: undefined,
  });

  const [descuentos, setDescuentos] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar cliente al montar
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getCliente(Number(id));
        setForm(res.data);
        // 🔹 Simulación de descuentos (puedes reemplazarlo con un API real)
        setDescuentos([
          { id: 1, nombre: "10% Descuento" },
          { id: 2, nombre: "20% Descuento" },
          { id: 3, nombre: "VIP" },
        ]);
      } catch (error) {
        console.error("Error cargando cliente:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateCliente(form.id, form); // Llamada API para actualizar cliente
      navigate("/ClientList");
    } catch (error) {
      console.error("Error actualizando cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words"
    >
      <h5 className="card-title">Editar Cliente</h5>
      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-6 col-span-12 flex flex-col gap-4">
          <div>
            <Label htmlFor="nombre" value="Nombre" className="mb-2 block" />
            <TextInput
              id="nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="apellido" value="Apellido" className="mb-2 block" />
            <TextInput
              id="apellido"
              type="text"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="documento" value="Documento" className="mb-2 block" />
            <TextInput
              id="documento"
              type="text"
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="correo" value="Correo" className="mb-2 block" />
            <TextInput
              id="correo"
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="telefono" value="Teléfono" className="mb-2 block" />
            <TextInput
              id="telefono"
              type="text"
              value={form.telefono || ""}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-6 col-span-12 flex flex-col gap-4">
          <div>
            <Label htmlFor="direccion" value="Dirección" className="mb-2 block" />
            <TextInput
              id="direccion"
              type="text"
              value={form.direccion || ""}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="fecha_nacimiento" value="Fecha de Nacimiento" className="mb-2 block" />
            <TextInput
              id="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento || ""}
              onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="id_tipo_descuento" value="Tipo de Descuento" className="mb-2 block" />
            <Select
              id="id_tipo_descuento"
              value={form.id_tipo_descuento || ""}
              onChange={(e) =>
                setForm({ ...form, id_tipo_descuento: Number(e.target.value) })
              }
            >
              <option value="">Seleccione...</option>
              {descuentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Botones */}
        <div className="col-span-12 flex gap-3">
          <Button color="primary" type="submit" isProcessing={loading}>
            Guardar cambios
          </Button>
          <Button color="gray" type="button" onClick={() => navigate("/ClientList")}>
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  );
}
