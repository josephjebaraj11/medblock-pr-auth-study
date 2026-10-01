import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "@/lib/session";
import { AppRoutes } from "@/routes";

export default function App() {
  return (
    // BASE_URL is "/" in dev and the Pages subpath in a deployed build, so
    // route paths stay written as "/login" either way.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}
