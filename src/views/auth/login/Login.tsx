import AuthLogin from "../authforms/AuthLogin";
import { Link } from "react-router";
import Logo from "/src/assets/images/logos/goldens.svg";

const Login = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-yellow-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-yellow-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
            <img src={Logo} alt="Golden Gym" className="h-24 w-auto object-contain drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Inicia sesión en tu panel de administración</p>
        </div>

        <AuthLogin />

        <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium mt-8 items-center justify-center">
          <p>¿Nuevo en Golden?</p>
          <Link to="/auth/register" className="text-yellow-600 hover:text-yellow-700 font-semibold transition-colors">
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
