import { useState } from "react";
import { useParams } from "react-router-dom";
import { PhysiotherapyApi } from "../api";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { usePatient } from "../hooks/usePatient.js";
import { asArray, numberOrUndefined } from "../utils/data.js";
import { formatDate, todayISO } from "../utils/format.js";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import Toggle from "../components/common/Toggle.jsx";

const PAIN_LEVELS = ["None", "Mild", "Moderate", "Severe"];
const DIFFICULTIES = ["Easy", "Moderate", "Difficult"];
const blankExercise = () => ({ exerciseName: "", duration: 15, completed: true, painLevel: "None", difficulty: "Easy" });

/** The detailed, multi-exercise session editor (the Daily Log writes a single summary exercise). */
export default function PhysiotherapyPage() {
  const { id: patientId } = useParams();
  const patient = usePatient(patientId);

  const { data, loading, reload } = useAsync(async () => {
    const [today, weekly] = await Promise.all([
      PhysiotherapyApi.today(patientId).catch(() => null),
      PhysiotherapyApi.weekly(patientId).catch(() => []),
    ]);
    return { today, weekly: asArray(weekly) };
  }, [patientId]);

  if (loading || !data) return <Skeleton height={120} />;
  const { today, weekly } = data;

  return (
    <>
      <div className="mt-16" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Physiotherapy{patient ? ` — ${patient.fullname}` : ""}</h1>
      </div>

      <SessionForm patientId={patientId} today={today} onSaved={reload} />

      <div className="card mt-16">
        <div className="section-title">Last 7 days</div>
        {weekly.length ? (
          weekly.map((s) => {
            const count = asArray(s.exercises).length;
            return (
              <div className="list-row" key={s._id}>
                <div>
                  <div className="list-row-main">{formatDate(s.date)}</div>
                  <div className="list-row-sub">
                    {count} exercise{count === 1 ? "" : "s"} logged
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <h3>No sessions this week</h3>
            <p>Sessions you log will show up here.</p>
          </div>
        )}
      </div>
    </>
  );
}

function SessionForm({ patientId, today, onSaved }) {
  const showToast = useToast();
  const [exercises, setExercises] = useState(() =>
    today?.exercises?.length ? today.exercises.map((e) => ({ ...e })) : [blankExercise()]
  );
  const [notes, setNotes] = useState(today?.notes || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (i, patch) => setExercises((list) => list.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)));

  const save = async () => {
    setError("");
    const named = exercises.filter((e) => e.exerciseName.trim());
    if (!named.length) {
      setError("Add at least one exercise with a name.");
      return;
    }
    const payload = {
      date: today?.date ? today.date.slice(0, 10) : todayISO(),
      exercises: named.map((e) => ({ ...e, duration: numberOrUndefined(e.duration) })),
      notes: notes.trim(),
    };

    setSaving(true);
    try {
      if (today) await PhysiotherapyApi.update(today._id, payload);
      else await PhysiotherapyApi.create(patientId, payload);
      showToast("Physiotherapy session saved", "success");
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="section-title">{today ? "Update today's session" : "Log today's session"}</div>
      <div id="exercise-rows">
        {exercises.map((ex, i) => (
          <div className="card" style={{ marginBottom: 10, padding: 14 }} key={i}>
            <div className="form-row">
              <div className="field mb-0">
                <label htmlFor={`ex-name-${i}`}>Exercise name</label>
                <input id={`ex-name-${i}`} type="text" value={ex.exerciseName} onChange={(e) => update(i, { exerciseName: e.target.value })} />
              </div>
              <div className="field mb-0">
                <label htmlFor={`ex-dur-${i}`}>Duration (minutes)</label>
                <input id={`ex-dur-${i}`} type="number" value={ex.duration ?? ""} onChange={(e) => update(i, { duration: e.target.value })} />
              </div>
            </div>
            <div className="form-row mt-16">
              <div className="field mb-0">
                <label htmlFor={`ex-pain-${i}`}>Pain level</label>
                <select id={`ex-pain-${i}`} value={ex.painLevel} onChange={(e) => update(i, { painLevel: e.target.value })}>
                  {PAIN_LEVELS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="field mb-0">
                <label htmlFor={`ex-diff-${i}`}>Difficulty</label>
                <select id={`ex-diff-${i}`} value={ex.difficulty} onChange={(e) => update(i, { difficulty: e.target.value })}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-between mt-16 mb-0">
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
                <Toggle on={ex.completed} onChange={(v) => update(i, { completed: v })} ariaLabel="Completed" />
                Completed
              </label>
              {exercises.length > 1 && (
                <button type="button" className="btn-ghost btn-sm" onClick={() => setExercises((list) => list.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm mt-16" onClick={() => setExercises((list) => [...list, blankExercise()])}>
        + Add exercise
      </button>

      <div className="field mt-16">
        <label htmlFor="pt-notes">Session notes</label>
        <textarea id="pt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div id="pt-error">{error && <ErrorBox>{error}</ErrorBox>}</div>
      <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
        {today ? "Update" : "Save"} session
      </button>
    </div>
  );
}
