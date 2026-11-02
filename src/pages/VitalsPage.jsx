import { useState } from "react";
import { useParams } from "react-router-dom";
import { VitalsApi } from "../api";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { usePatient } from "../hooks/usePatient.js";
import { asArray, numberOrUndefined } from "../utils/data.js";
import { formatDate, todayISO } from "../utils/format.js";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

const FIELDS = [
  { key: "bloodPressureSystolic", label: "BP systolic" },
  { key: "bloodPressureDiastolic", label: "BP diastolic" },
  { key: "heartRate", label: "Heart rate (bpm)" },
  { key: "temperature", label: "Temperature (°C)", step: "0.1" },
  { key: "oxygenSaturation", label: "SpO₂ (%)" },
  { key: "bloodSugar", label: "Blood sugar (mg/dL)" },
  { key: "weight", label: "Weight (kg)", step: "0.1" },
];

export default function VitalsPage() {
  const { id: patientId } = useParams();
  const patient = usePatient(patientId);

  const { data, loading, reload } = useAsync(async () => {
    const [today, weekly] = await Promise.all([
      VitalsApi.today(patientId).catch(() => null),
      VitalsApi.weekly(patientId).catch(() => []),
    ]);
    return { today, weekly: asArray(weekly) };
  }, [patientId]);

  if (loading || !data) return <Skeleton height={120} />;
  const { today, weekly } = data;

  return (
    <>
      <div className="mt-16" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Vitals{patient ? ` — ${patient.fullname}` : ""}</h1>
      </div>

      <VitalsForm patientId={patientId} today={today} onSaved={reload} />

      <div className="card mt-16">
        <div className="section-title">Last 7 days</div>
        {weekly.length ? (
          weekly.map((v) => (
            <div className="list-row" key={v._id}>
              <div>
                <div className="list-row-main">{formatDate(v.date)}</div>
                <div className="list-row-sub">
                  {v.bloodPressureSystolic ? `BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : ""}
                  {v.heartRate ? ` · HR ${v.heartRate}` : ""}
                  {v.oxygenSaturation ? ` · SpO₂ ${v.oxygenSaturation}%` : ""}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No vitals this week</h3>
            <p>Readings you record will show up here.</p>
          </div>
        )}
      </div>
    </>
  );
}

function VitalsForm({ patientId, today, onSaved }) {
  const showToast = useToast();
  const [values, setValues] = useState(() => ({
    ...Object.fromEntries(FIELDS.map((f) => [f.key, today?.[f.key] ?? ""])),
    notes: today?.notes || "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const setValue = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const save = async () => {
    setError("");
    const payload = { date: today?.date ? today.date.slice(0, 10) : todayISO(), notes: values.notes.trim() };
    FIELDS.forEach((f) => (payload[f.key] = numberOrUndefined(values[f.key])));

    setSaving(true);
    try {
      if (today) await VitalsApi.update(today._id, payload);
      else await VitalsApi.create(patientId, payload);
      showToast("Vitals saved", "success");
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="section-title">{today ? "Update today's reading" : "Record today's reading"}</div>
      <div id="vitals-error">{error && <ErrorBox>{error}</ErrorBox>}</div>
      <div className="form-row">
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`v-${f.key}`}>{f.label}</label>
            <input type="number" step={f.step || "1"} id={`v-${f.key}`} value={values[f.key]} onChange={setValue(f.key)} />
          </div>
        ))}
      </div>
      <div className="field mb-0">
        <label htmlFor="v-notes">Notes</label>
        <textarea id="v-notes" value={values.notes} onChange={setValue("notes")} />
      </div>
      <button type="button" className="btn btn-primary mt-16" disabled={saving} onClick={save}>
        {today ? "Update" : "Save"} reading
      </button>
    </div>
  );
}
