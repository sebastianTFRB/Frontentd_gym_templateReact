import { RouterProvider } from "react-router";
import { Flowbite, ThemeModeScript } from "flowbite-react";
import customTheme from "./utils/theme/custom-theme";
import router from "./routes/Router";
import { useGymNotifications } from "./hooks/useGymNotifications";

function App() {
  // Activa el sistema global de notificaciones
  useGymNotifications();

  return (
    <>
      <ThemeModeScript />
      <Flowbite theme={{ theme: customTheme }}>
        <RouterProvider router={router} />
      </Flowbite>
    </>
  );
}

export default App;
