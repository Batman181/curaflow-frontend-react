import SkippableSection from "./SkippableSection.jsx";

/**
 * The backend stores ONE medicinesTaken boolean per day, not one per medicine.
 * Per-medicine Taken/Skipped is shown because that's how a caregiver thinks about
 * it; the form collapses it to that boolean on save (true only if all are Taken).
 */
export default function MedicationsSection({ meds, status, onStatus, skipped, onToggleSkip }) {
  return (
    <SkippableSection
      id="meds-section"
      icon="💊"
      title="Medications"
      skipped={skipped}
      onToggle={onToggleSkip}
      footer={
        meds.length ? (
          <div className="muted mt-16" style={{ marginBottom: 0 }}>
            Mark every medicine "Taken" for today's log to record medicines as given.
          </div>
        ) : null
      }
    >
      {meds.length ? (
        meds.map((m) => (
          <div className="med-row" key={m._id}>
            <div>
              <div className="list-row-main">
                {m.medicineName} · {m.dosage}
              </div>
              <div className="list-row-sub">{m.frequency}</div>
            </div>
            <div className="med-pair" role="group" aria-label={`${m.medicineName} status`}>
              <button
                type="button"
                className={status[m._id] === "taken" ? "is-taken" : ""}
                aria-pressed={status[m._id] === "taken"}
                onClick={() => onStatus(m._id, "taken")}
              >
                Taken
              </button>
              <button
                type="button"
                className={status[m._id] === "skipped" ? "is-skipped-med" : ""}
                aria-pressed={status[m._id] === "skipped"}
                onClick={() => onStatus(m._id, "skipped")}
              >
                Skipped
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="muted">No active prescriptions for this patient.</div>
      )}
    </SkippableSection>
  );
}
