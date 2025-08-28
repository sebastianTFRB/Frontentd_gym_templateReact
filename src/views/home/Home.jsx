
import React, { useState } from 'react'; // Importa useState
import { Link } from 'react-router-dom';
import FeatureNavBar from '../components/FeatureNavBar'; // Importa el nuevo componente


export default function Home() {
  const features = [
    {
      title: "Clientes",
      description: "Administra clientes, registra datos, descuentos y huellas.",
      // Eliminamos 'link' ya que no navegaremos a otra página desde aquí
    },
    {
      title: "Productos",
      description: "Gestiona inventario, proveedores y códigos de barras.",
      // Eliminamos 'link'
    },
    {
      title: "Ventas",
      description: "Registra ventas, genera facturas y conéctate con la DIAN.",
      // Eliminamos 'link'
    },
    {
      title: "Compras",
      description: "Carga facturas de compra y actualiza tu inventario.",
      // Eliminamos 'link'
    },
    {
      title: "Reportes",
      description: "Genera reportes financieros y de inventario en gráficos.",
      // Eliminamos 'link'
    },
    {
      title: "Asistencias",
      description: "Acceso con huella o PIN usando ESP32.",
      // Eliminamos 'link'
    },
  ];

  const [selectedFeature, setSelectedFeature] = useState(null); // Estado para la característica seleccionada

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
  };

  return (
    <div >
      <div >
        <h1 >Bienvenido a Golden Inventory</h1>
        <p >Tu solución integral para la gestión de gimnasios.</p>
        <button onClick={() => new Audio("/bell.mp3").play()}>
          Probar sonido
        </button>

      </div>

      {/* Renderiza el nuevo componente FeatureNavBar */}
      <FeatureNavBar features={features} onFeatureSelect={handleFeatureClick} />

      {/* Sección de detalle de característica seleccionada (ahora aquí) */}
      {selectedFeature && (
        <div > {/* Clase para estilos y animación */}
          <h3>{selectedFeature.title}</h3>
          <p>{selectedFeature.description}</p>
        </div>
      )}

      <div >
        <h2>Ventas de Membresías</h2>
        <p>Gestiona y trackea fácilmente las ventas y activaciones de membresías para tus clientes.</p>
        {/* Este Link SÍ queremos que redirija */}
        <Link to="/ventas_membresias">Ir a Ventas de Membresías</Link>
      </div>
    </div>
  );
}
