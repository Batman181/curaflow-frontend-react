import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { usePatient } from "../../hooks/usePatient.js";
import Avatar from "../common/Avatar.jsx";

function NavItem({ to, icon, label, onNavigate }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = pathname === to;
  return (
    <button
      type="button"
      className={`nav-item${active ? " is-active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        navigate(to);
        onNavigate?.();
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  // The patient section appears whenever the URL is inside /patients/:id/...
  const match = useMatch("/patients/:id/*");
  const patient = usePatient(match?.params.id);
  const item = (to, icon, label) => <NavItem to={to} icon={icon} label={label} onNavigate={onNavigate} />;

  return (
    <aside className={`sidebar${open ? " is-open" : ""}`} id="sidebar">
      <div className="nav-brand">🩺 CuraFlow</div>
      <div className="nav-user-top">
        <Avatar name={user?.fullname || "C"} light />
        <div>
          <strong>{user?.fullname || "Caregiver"}</strong>
          <span>Caregiver</span>
        </div>
      </div>

      <div className="nav-section-label" style={{ paddingTop: 0 }}>
        Overview
      </div>
      {item("/dashboard", "📊", "Dashboard")}
      {item("/patients", "👥", "My patients")}

      {patient && (
        <>
          <div className="nav-patient-label">{patient.fullname}</div>
          <div className="nav-section-label">Care</div>
          {item(`/patients/${patient._id}/log`, "📋", "Daily log")}
          {item(`/patients/${patient._id}/summary`, "✨", "Recovery summary")}
          {item(`/patients/${patient._id}/trends`, "📈", "Trends")}
          <div className="nav-section-label">Records</div>
          {item(`/patients/${patient._id}/prescriptions`, "💊", "Prescriptions")}
          {item(`/patients/${patient._id}/reports`, "📁", "Reports")}
          {item(`/patients/${patient._id}/vitals`, "❤", "Vitals history")}
          {item(`/patients/${patient._id}/physiotherapy`, "🤸", "Physiotherapy log")}
          {item(`/patients/${patient._id}/dashboard`, "🗒", "Weekly summary")}
        </>
      )}

      <div className="nav-spacer" />
      <button type="button" className="nav-signout" onClick={logout}>
        ↩ Sign out
      </button>
    </aside>
  );
}
