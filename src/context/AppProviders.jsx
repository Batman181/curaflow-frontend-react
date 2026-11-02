import { ToastProvider } from "./ToastContext.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import { PatientsProvider } from "./PatientsContext.jsx";

export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <PatientsProvider>{children}</PatientsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
