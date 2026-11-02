import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import AppProviders from "../context/AppProviders.jsx";
import { providerFuture, routerOptions, routes } from "../routes/index.jsx";

export function signIn() {
  localStorage.setItem("curaflow_access_token", "acc");
  localStorage.setItem("curaflow_refresh_token", "ref");
  localStorage.setItem("curaflow_user", JSON.stringify({ fullname: "Karelle Klocko", email: "k@example.com" }));
}

/** Mounts the real app (real routes + providers) at `path`. */
export function renderApp(path = "/dashboard", { authed = true } = {}) {
  if (authed) signIn();
  const router = createMemoryRouter(routes, { initialEntries: [path], ...routerOptions });
  render(
    <AppProviders>
      <RouterProvider router={router} future={providerFuture} />
    </AppProviders>
  );
  return router;
}
