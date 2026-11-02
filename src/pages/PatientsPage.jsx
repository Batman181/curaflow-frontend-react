import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DailyLogApi, PatientsApi } from "../api";
import { usePatients } from "../context/PatientsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { asArray } from "../utils/data.js";
import AddPatientModal from "../components/patients/AddPatientModal.jsx";
import PatientTile from "../components/patients/PatientTile.jsx";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

export default function PatientsPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { setPatients } = usePatients();
  const [adding, setAdding] = useState(false);

  const { data, error, loading, reload } = useAsync(async () => {
    const list = await PatientsApi.list();
    const patients = asArray(list?.patients);
    setPatients(patients);
    // A quick, best-effort "logged today?" check per patient, so the list
    // reflects the glanceable, color-coded status the design calls for.
    const statuses = await Promise.all(
      patients.map((p) => DailyLogApi.today(p._id).then((log) => !!log).catch(() => null))
    );
    return { patients, statuses };
  }, []);

  const handleDelete = async (patient) => {
    try {
      await PatientsApi.remove(patient._id);
      showToast("Patient removed", "success");
      reload();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  let body;
  if (error) body = <ErrorBox>{error.message}</ErrorBox>;
  else if (loading || !data)
    body = (
      <>
        <Skeleton width="100%" height={64} />
        <Skeleton width="100%" height={64} />
      </>
    );
  else if (!data.patients.length)
    body = (
      <div className="empty-state card">
        <h3>No patients yet</h3>
        <p>Add the first patient you're caring for to start logging their care.</p>
      </div>
    );
  else
    body = (
      <div className="tile-grid">
        {data.patients.map((p, i) => (
          <PatientTile
            key={p._id}
            patient={p}
            logged={data.statuses[i]}
            // Clicking a patient goes straight to today's care log — the single most
            // time-pressured caregiver task — rather than a neutral overview screen.
            onOpen={() => navigate(`/patients/${p._id}/log`)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );

  return (
    <>
      <div className="flex-between mt-16" style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20 }}>My patients</h1>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          + Add patient
        </button>
      </div>
      <div id="patients-list">{body}</div>

      {adding && (
        <AddPatientModal
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            showToast("Patient added", "success");
            reload();
          }}
        />
      )}
    </>
  );
}
