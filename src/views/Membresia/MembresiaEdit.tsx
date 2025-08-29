// src/pages/MembresiaEdit.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Label, TextInput, Select, Button } from "flowbite-react";
import { getMembresia, updateMembresia } from "../../api/membresias";

interface FormMembresia {
  nombre_membresia: string;
  duracion_dias: number;
  cantidad_sesiones: number;
  precio_base: number;
  max_accesos_diarios: number;
  estado: "ACTIVO" | "INACTIVO";
}

const MembresiaEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const membresiaId = Number(id);

  const [form, setForm] = useState<FormMembresia>({
    nombre_membresia: "",
    duracion_dias: 0,
    cantidad_sesiones: 0,
    precio_base: 0,
    max_accesos_diarios: 0,
    estado: "ACTIVO",
  });

  // Cargar datos de la membresía
  useEffect(() => {
    if (!membresiaId) return;

    const fetchData = async () => {
      try {
        const res = await getMembresia(membresiaId);
        const data = res.data;

        setForm({
          nombre_membresia: data.nombre_membresia || "",
          duracion_dias: data.duracion_dias || 0,
          cantidad_sesiones: data.cantidad_sesiones || 0,
          precio_base: data.precio_base || 0,
          max_accesos_diarios: data.max_accesos_diarios || 0,
          estado: "ACTIVO", // si tu API no trae estado
        });
      } catch (error) {
        console.error("Error cargando membresía", error);
      }
    };

    fetchData();
  }, [membresiaId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value)
          : (value as "ACTIVO" | "INACTIVO" | string),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membresiaId) return;

    try {
      await updateMembresia(membresiaId, form);
      navigate("/Membresia");
    } catch (error) {
      console.error("Error actualizando membresía", error);
    }
  };

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Editar Membresía</h5>
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-6 col-span-12 flex flex-col gap-4">
            <div>
              <Label htmlFor="nombre_membresia" value="Nombre de la Membresía" />
              <TextInput
                id="nombre_membresia"
                name="nombre_membresia"
                type="text"
                placeholder="Ej. Premium"
                value={form.nombre_membresia}
                onChange={handleChange}
                required
                className="form-control form-rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="precio_base" value="Precio" />
              <TextInput
                id="precio_base"
                name="precio_base"
                type="number"
                placeholder="100000"
                value={form.precio_base}
                onChange={handleChange}
                required
                className="form-control form-rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="cantidad_sesiones" value="Cantidad de sesiones" />
              <TextInput
                id="cantidad_sesiones"
                name="cantidad_sesiones"
                type="number"
                value={form.cantidad_sesiones}
                onChange={handleChange}
                required
                className="form-control form-rounded-xl"
              />
            </div>
          </div>

          {/* Columna derecha */}
          <div className="lg:col-span-6 col-span-12 flex flex-col gap-4">
            <div>
              <Label htmlFor="duracion_dias" value="Duración (días)" />
              <TextInput
                id="duracion_dias"
                name="duracion_dias"
                type="number"
                value={form.duracion_dias}
                onChange={handleChange}
                required
                className="form-control form-rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="max_accesos_diarios" value="Accesos diarios" />
              <TextInput
                id="max_accesos_diarios"
                name="max_accesos_diarios"
                type="number"
                value={form.max_accesos_diarios}
                onChange={handleChange}
                required
                className="form-control form-rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="estado" value="Estado" />
              <Select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                required
                className="select-md"
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </Select>
            </div>
          </div>

          {/* Botones */}
          <div className="col-span-12 flex gap-3 mt-4">
            <Button color="primary" type="submit">
              Guardar
            </Button>
            <Button color="failure" onClick={() => navigate("/Membresia")}>
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MembresiaEdit;
