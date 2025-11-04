import { Badge, Dropdown, Tooltip } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useNotificationsStore } from "../../../store/notificationsStore";
import { memo } from "react";

const Notification = () => {
  const notifications = useNotificationsStore((state) => state.notifications);
  const clearNotifications = useNotificationsStore((state) => state.clearNotifications);
  const hasNew = useNotificationsStore((state) => state.hasNew);
  const clearNewFlag = useNotificationsStore((state) => state.clearNewFlag);

  const count = notifications.length;

  return (
    <div className="relative group/menu">
      <Dropdown
        label=""
        placement="bottom-end"
        className="rounded-md w-[320px] max-w-[90vw] shadow-xl notification bg-white dark:bg-gray-800"
        dismissOnClick={false}
        renderTrigger={() => (
          <Tooltip content="Notificaciones recientes" placement="bottom">
            <span
              onClick={clearNewFlag}
              className={`h-10 w-10 rounded-full flex justify-center items-center cursor-pointer relative transition-all duration-300 ${
                hasNew
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
          </Tooltip>
        )}
      >
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
            Notificaciones
          </p>
          {count > 0 && (
            <button
              onClick={clearNotifications}
              className="text-xs text-primary hover:underline"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Lista */}
        {count === 0 ? (
          <div className="px-3 py-3 text-center text-gray-500 text-sm">
            Sin notificaciones recientes
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.map((item) => {
              const advertencia =
                (item.diasRestantes != null && item.diasRestantes <= 5) ||
                (item.sesionesRestantes != null && item.sesionesRestantes <= 5);

              const style =
                item.permitido === false
                  ? { icon: "solar:forbidden-circle-linear", color: "text-red-600" }
                  : advertencia
                  ? { icon: "solar:warning-triangle-linear", color: "text-amber-500" }
                  : { icon: "solar:check-circle-linear", color: "text-emerald-500" };

              return (
                <Dropdown.Item
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-3 border-b last:border-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      <Icon icon="solar:user-linear" height={22} />
                    </div>
                  )}

                  {/* Texto */}
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      <Icon icon={style.icon} className={`${style.color}`} width={16} />
                      {item.nombre}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {item.mensaje}
                    </p>
                    {item.hora && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {item.hora.slice(0, 5)}
                      </p>
                    )}
                  </div>
                </Dropdown.Item>
              );
            })}
          </div>
        )}
      </Dropdown>
    </div>
  );
};

export default memo(Notification);
