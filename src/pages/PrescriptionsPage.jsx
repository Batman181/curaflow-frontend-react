import { useState } from "react";
import { useParams } from "react-router-dom";
import { PrescriptionsApi } from "../api";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { usePatient } from "../hooks/usePatient.js";
import { asArray } from "../utils/data.js";
import { formatDate } from "../utils/format.js";
import AddPrescriptionModal from "../components/prescriptions/AddPrescriptionModal.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

export default function PrescriptionsPage() {
  const { id: patientId } = useParams();
  const patient = usePatient(patientId);
  const showToast = useToast();
  const [adding, setAdding] = useState(false);

  const { data, loading, reload } = useAsync(async () => {
    const [current, expiring] = await Promise.all([
      PrescriptionsApi.current(patientId).catch(() => []),
      PrescriptionsApi.expiring(patientId, 7).catch(() => []),
    ]);
    return { current: asArray(current), expiring: asArray(expiring) };
  }, [patientId]);

  if (loading || !data) return <Skeleton height={120} />;
  const { current, expiring } = data;

  return (
    <>
      <div className="flex-between mt-16" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Prescriptions{patient ? ` — ${patient.fullname}` : ""}</h1>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          + Add prescription
        </button>
      </div>

      {expiring.length > 0 && (
        <div className="banner">
          <div className="banner-text">
            {expiring.length} medicine{expiring.length === 1 ? " is" : "s are"} expiring within 7 days.
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-title">Current medicines</div>
        {current.length ? (
          current.map((p) => (
            <div className="list-row" key={p._id}>
              <div>
                <div className="list-row-main">
                  {p.medicineName} · {p.dosage}
                </div>
                <div className="list-row-sub">
                  {p.frequency} · {p.route || ""}
                  {p.doctorName ? ` · ${p.doctorName}` : ""}
                </div>
              </div>
              <div className="muted">until {formatDate(p.endDate)}</div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No current medicines</h3>
            <p>Add a prescription to start tracking it.</p>
          </div>
        )}
      </div>

      {adding && (
        <AddPrescriptionModal
          patientId={patientId}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            showToast("Prescription added", "success");
            reload();
          }}
        />
      )}
    </>
  );
}
