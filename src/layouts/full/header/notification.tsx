import { Badge } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useNotificationsStore } from "../../../store/notificationsStore";
import { memo, useState, useRef, useEffect } from "react";

const Notification = () => {
  const notifications = useNotificationsStore((state) => state.notifications);
  const clearNotifications = useNotificationsStore((state) => state.clearNotifications);
  const hasNew = useNotificationsStore((state) => state.hasNew);
  const clearNewFlag = useNotificationsStore((state) => state.clearNewFlag);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const count = notifications.length;

  const toggleMenu = () => {
    if (!isOpen && hasNew) {
      clearNewFlag();
    }
    setIsOpen(!isOpen);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <span
        onClick={toggleMenu}
        className={`h-10 w-10 rounded-full flex justify-center items-center cursor-pointer relative transition-all duration-300 ${hasNew
          ? "animate-pulse text-primary"
          : "hover:text-primary hover:bg-lightprimary"
          }`}
        aria-label="Notificaciones"
      >
        <Icon icon="solar:bell-linear" height={22} />
        {count > 0 && (
          <Badge className="h-4 min-w-[1.1rem] rounded-full absolute end-1 top-1 bg-primary text-[10px] text-white flex items-center justify-center p-0">
            {count}
          </Badge>
        )}
      </span>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[320px] max-w-[90vw] z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up origin-top-right">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
              Notificaciones
            </p>
            {count > 0 && (
              <button
                onClick={clearNotifications}
                className="text-xs text-primary font-medium hover:underline transition-all"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Lista */}
          {count === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
              <Icon icon="solar:bell-bing-linear" height={32} className="opacity-20" />
              <p>Sin notificaciones nuevas</p>
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
              {notifications.map((item) => {
                const advertencia =
                  (item.diasRestantes != null && item.diasRestantes <= 5) ||
                  (item.sesionesRestantes != null && item.sesionesRestantes <= 5);

                const style =
                  item.permitido === false
                    ? { icon: "solar:forbidden-circle-linear", color: "text-red-500" }
                    : advertencia
                      ? { icon: "solar:warning-triangle-linear", color: "text-amber-500" }
                      : { icon: "solar:check-circle-linear", color: "text-emerald-500" };

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 px-4 py-3 border-b last:border-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-default"
                  >
                    {/* Foto */}
                    {item.foto ? (
                      <img
                        src={
                          item.foto.startsWith("http")
                            ? item.foto
                            : `${window.location.origin}/${item.foto}`
                        }
                        alt="foto"
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 text-gray-500">
                        <Icon icon="solar:user-linear" height={20} />
                      </div>
                    )}

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                          {item.nombre}
                        </p>
                        {item.hora && (
                          <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                            {item.hora.slice(0, 5)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {item.mensaje}
                      </p>

                      <div className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${style.color}`}>
                        <Icon icon={style.icon} width={14} />
                        <span>
                          {item.permitido === false ? "Acceso Denegado" : advertencia ? "Advertencia" : "Acceso Permitido"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(Notification);
