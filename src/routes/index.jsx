import { Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import PatientsPage from "../pages/PatientsPage.jsx";
import WorkspacePage from "../pages/WorkspacePage.jsx";
import PatientDashboardPage from "../pages/PatientDashboardPage.jsx";
import DailyLogPage from "../pages/DailyLogPage.jsx";
import TrendsPage from "../pages/TrendsPage.jsx";
import SummaryPage from "../pages/SummaryPage.jsx";
import VitalsPage from "../pages/VitalsPage.jsx";
import PhysiotherapyPage from "../pages/PhysiotherapyPage.jsx";
import PrescriptionsPage from "../pages/PrescriptionsPage.jsx";
import ReportsPage from "../pages/ReportsPage.jsx";

// `handle.title` is what the topbar shows for each page.
export const routes = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage />, handle: { title: "Dashboard" } },
      { path: "patients", element: <PatientsPage />, handle: { title: "My patients" } },
      { path: "patients/:id", element: <WorkspacePage />, handle: { title: "Workspace" } },
      { path: "patients/:id/dashboard", element: <PatientDashboardPage />, handle: { title: "Patient dashboard" } },
      { path: "patients/:id/log", element: <DailyLogPage />, handle: { title: "Daily log" } },
      { path: "patients/:id/trends", element: <TrendsPage />, handle: { title: "Trends" } },
      { path: "patients/:id/summary", element: <SummaryPage />, handle: { title: "Recovery summary" } },
      { path: "patients/:id/vitals", element: <VitalsPage />, handle: { title: "Vitals history" } },
      { path: "patients/:id/physiotherapy", element: <PhysiotherapyPage />, handle: { title: "Physiotherapy log" } },
      { path: "patients/:id/prescriptions", element: <PrescriptionsPage />, handle: { title: "Prescriptions" } },
      { path: "patients/:id/reports", element: <ReportsPage />, handle: { title: "Reports" } },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
];

// Opt in to React Router v7 behaviour now (also silences the console warnings).
export const routerOptions = {
  future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true },
};
export const providerFuture = { v7_startTransition: true };
