import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label, TextInput, Select, Button } from "flowbite-react";
import { createMembresia } from "../../api/membresias";

interface FormMembresia {
  nombre_membresia: string;
  duracion_dias: string; // guardamos como string
  cantidad_sesiones: string;
  precio_base: string;
  max_accesos_diarios: string;
  estado: "ACTIVO" | "INACTIVO";
}

const MembresiaAdd = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormMembresia>({
    nombre_membresia: "",
    duracion_dias: "",
    cantidad_sesiones: "",
    precio_base: "",
    max_accesos_diarios: "",
    estado: "ACTIVO",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convertimos strings a números al enviar
      const dataToSend = {
        ...form,
        duracion_dias: Number(form.duracion_dias),
        cantidad_sesiones: Number(form.cantidad_sesiones),
        precio_base: Number(form.precio_base),
        max_accesos_diarios: Number(form.max_accesos_diarios),
      };

      await createMembresia(dataToSend);
      navigate("/Membresia");
    } catch (error) {
      console.error("Error creando membresía", error);
    }
  };

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      <h5 className="card-title">Agregar Membresía</h5>
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

export default MembresiaAdd;
