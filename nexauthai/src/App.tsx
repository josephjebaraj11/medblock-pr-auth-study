import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "@/lib/session";
import { AppRoutes } from "@/routes";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  );
}
