import { useEffect, useRef, useState } from "react";
import { initials, patientMeta } from "../../utils/format.js";

/**
 * One patient on the My patients screen. Clicking it opens today's care log.
 * The 🗑 button is a two-step delete: tap once to arm (turns into a red ✕ for
 * a few seconds), tap again to confirm.
 */
export default function PatientTile({ patient, logged, onOpen, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const statusClass = logged === null ? "tile--neutral" : logged ? "tile--ok" : "tile--warn";
  const statusLabel = logged === null ? "Status unknown" : logged ? "Logged today" : "Not logged yet";
  const badgeClass = logged === null ? "badge--neutral" : logged ? "badge--ok" : "badge--warn";

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirming) {
      clearTimeout(timer.current);
      setConfirming(false);
      onDelete(patient);
      return;
    }
    setConfirming(true);
    timer.current = setTimeout(() => setConfirming(false), 3000);
  };

  // A plain div (not a <button>) because it contains its own delete button —
  // real <button> elements can't nest inside each other.
  return (
    <div
      className={`tile ${statusClass}`}
      role="button"
      tabIndex={0}
      aria-label={`Open ${patient.fullname}'s daily log`}
      onClick={() => onOpen(patient)}
      onKeyDown={(e) => {
        // Only when the tile itself has focus — not when Enter is pressed on the delete button.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(patient);
        }
      }}
    >
      <div className="tile-top">
        <span className="avatar-circle">{initials(patient.fullname)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={`badge ${badgeClass}`}>{statusLabel}</span>
          <button
            type="button"
            className={`tile-delete-btn${confirming ? " is-confirming" : ""}`}
            aria-label={`${confirming ? "Confirm delete" : "Delete"} ${patient.fullname}`}
            onClick={handleDelete}
          >
            {confirming ? "✕" : "🗑"}
          </button>
        </div>
      </div>
      <span className="tile-name">{patient.fullname}</span>
      <div className="tile-meta">{patientMeta(patient)}</div>
    </div>
  );
}
