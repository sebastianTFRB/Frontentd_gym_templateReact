import { Link } from "react-router-dom";


export default function Admin() {
  const features = [
    {
      title: "Membresías",
      description: "Administra y configura los diferentes planes de membresía.",
      link: "/membresias",
    },
    {
      title: "Tipos de Descuento",
      description: "Gestiona y crea tipos de descuento aplicables en ventas.",
      link: "/descuento",
    },
  ];

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1 className="section-title">Panel de Administración</h1>
        <p>Gestiona las configuraciones principales</p>
      </div>
      <div className="card-grid">
        {features.map((f, index) => (
          <div key={index} className="card">
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <Link to={f.link} className="card-btn">Explorar</Link>
</div>
        ))}
      </div>
    </div>
  );
}
