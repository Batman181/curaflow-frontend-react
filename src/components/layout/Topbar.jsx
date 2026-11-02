import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../common/Avatar.jsx";

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();
  return (
    <header className="topbar" id="topbar">
      <button type="button" className="icon-btn menu-toggle" aria-label="Toggle navigation menu" onClick={onMenuClick}>
        ☰
      </button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <Avatar name={user?.fullname || "C"} />
      </div>
    </header>
  );
}
