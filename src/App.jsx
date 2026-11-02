import { RouterProvider, createBrowserRouter } from "react-router-dom";
import AppProviders from "./context/AppProviders.jsx";
import { providerFuture, routerOptions, routes } from "./routes/index.jsx";

const router = createBrowserRouter(routes, routerOptions);

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} future={providerFuture} />
    </AppProviders>
  );
}
