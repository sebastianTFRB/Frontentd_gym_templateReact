import { lazy } from 'react';
import { Navigate, createBrowserRouter } from "react-router";
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

// Dashboard
const Dashboard = Loadable(lazy(() => import('../views/dashboards/Dashboard')));

// utilities
const Typography = Loadable(lazy(() => import("../views/typography/Typography")));
const Table = Loadable(lazy(() => import("../views/tables/Table")));
const Form = Loadable(lazy(() => import("../views/forms/Form")));
const Shadow = Loadable(lazy(() => import("../views/shadows/Shadow")));
const Alert = Loadable(lazy(() => import("../views/alerts/Alerts")));

// icons
const Solar = Loadable(lazy(() => import("../views/icons/Solar")));

// authentication
const Login = Loadable(lazy(() => import('../views/auth/login/Login')));
const Register = Loadable(lazy(() => import('../views/auth/register/Register')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page/SamplePage')));
const Error = Loadable(lazy(() => import('../views/auth/error/Error')));

//views
const ClientesList = Loadable(lazy(() => import('../views/clientList/Clientes/Client')))
const EditClient = Loadable(lazy(() => import('../views/editClient/EditClient')));
const Membresias = Loadable(lazy(() => import('../views/Membresia/Membresia')))
const EditMembresia = Loadable(lazy(() => import('../views/Membresia/MembresiaEdit')));
const TipoDescuentoPage = Loadable(lazy(() => import('../views/tipoDescuento/TipoDescuentoPage')))
const VentaMembresiasPage = Loadable(lazy(() => import('../views/ventaMembresias/ventaMembresia')))
const ResumenMembresias = Loadable(lazy(() => import('../views/clientList/Clientes/ResumenMembresias')));
const NuevoClienteConMembresia = Loadable(lazy(() => import('../views/clientList/Clientes/NuevoClienteConMembresia')));
const EditarClienteConMembresia = Loadable(lazy(() => import('../views/clientList/Clientes/EditarClienteConMembresia')));
const AddClient = Loadable(lazy(() => import('../views/addClient/AddClient')));
const HuellaController = Loadable(lazy(() => import('../views/huellaController/HuellaController')));
const MembresiaAdd = Loadable(lazy(() => import('../views/Membresia/MembresiaAdd')));
const ReportesDashboard = Loadable(lazy(() => import("../views/dashboards/ReportesDashboard")));
const AsistenciaView = Loadable(lazy(() => import('../views/Asistencias/ResumenAsistencias')));
const ConfigLuces = Loadable(lazy(() => import('../views/config/ConfigLuces'))); // <-- Nuevo Módulo
import RequireAuth from './RequireAuth';

const MyProfile = Loadable(lazy(() => import('../views/profile/MyProfile')));
const UsersList = Loadable(lazy(() => import('../views/users/UsersList')));
const AccessCheck = Loadable(lazy(() => import('../views/access/AccessCheck')));


const Router = [
  {
    path: '/',
    element: (
      <RequireAuth>
        <FullLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/', exact: true, element: <ReportesDashboard /> },
      // ... existing routes ...
      { path: '/profile', element: <MyProfile /> },
      { path: '/users', element: <UsersList /> },
      { path: '/config/luces', element: <ConfigLuces /> }, // <-- Nueva Ruta

      { path: '/ui/typography', exact: true, element: <Typography /> },
      { path: '/ui/table', exact: true, element: <Table /> },
      { path: '/ui/form', exact: true, element: <Form /> },
      { path: '/ui/alert', exact: true, element: <Alert /> },
      { path: '/ui/shadow', exact: true, element: <Shadow /> },
      { path: '/icons/solar', exact: true, element: <Solar /> },
      { path: '/sample-page', exact: true, element: <SamplePage /> },
      { path: '/ClientList', exact: true, element: <ClientesList /> },
      { path: '/edit-client/:id', exact: true, element: <EditClient /> },
      { path: '/membresia', exact: true, element: <Membresias /> },
      { path: '/edit-membresia/:id', exact: true, element: <EditMembresia /> },
      { path: '/TipoDescuento', exact: true, element: <TipoDescuentoPage /> },
      { path: '/VentaMembresia', exact: true, element: <VentaMembresiasPage /> },
      { path: '/clientes/membresias', element: <ResumenMembresias /> },
      { path: '/clientes/new-with-membresia', element: <NuevoClienteConMembresia /> },
      { path: '/clientes/:id/editar-membresia', element: <EditarClienteConMembresia /> },
      { path: '/add-client', exact: true, element: <AddClient /> },
      { path: '/HuellaController/:id', exact: true, element: <HuellaController /> },
      { path: '/add-membresia', exact: true, element: <MembresiaAdd /> },
      { path: "/dashboard", element: <ReportesDashboard /> },
      { path: "/asistencias", element: <AsistenciaView /> },

      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/register', element: <Register /> },
      { path: '/access', element: <AccessCheck /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  }
];

const router = createBrowserRouter(Router)

export default router;
