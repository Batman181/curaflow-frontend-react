import { useEffect, useState } from "react";
import { Outlet, ScrollRestoration, useLocation, useMatches } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

/** Authenticated shell: sidebar + topbar around the current page. */
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  // The topbar title comes from the `handle.title` declared on each route.
  const matches = useMatches();
  const title = [...matches].reverse().find((m) => m.handle?.title)?.handle.title ?? "";

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setSidebarOpen(false), [pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar title={title} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="content" id="view-root" aria-live="polite">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
