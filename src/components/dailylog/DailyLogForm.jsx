import { Fragment, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DailyLogApi, PhysiotherapyApi, VitalsApi } from "../../api";
import { useToast } from "../../context/ToastContext.jsx";
import { todayISO } from "../../utils/format.js";
import MedicationsSection from "./MedicationsSection.jsx";
import PhysiotherapySection from "./PhysiotherapySection.jsx";
import VitalsSection from "./VitalsSection.jsx";
import WellnessSection from "./WellnessSection.jsx";
import { numberOrUndefined, painLevelFromSlider, parseBP, sliderFromPainLevel } from "./helpers.js";

/**
 * Today's care in one screen. One submit saves up to THREE backend records —
 * the daily log (always), vitals, and a physiotherapy session — each skippable
 * (except the log). The three are saved independently, so one failing never
 * loses the others, and a retry updates what already saved instead of creating
 * it a second time (the backend allows one record per patient per day).
 */
export default function DailyLogForm({ patientId, patient, existingLog, existingVital, existingPhysio, currentMeds }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const existingExercise = existingPhysio?.exercises?.[0];

  const [form, setForm] = useState(() => ({
    medsSkipped: false,
    vitalsSkipped: false,
    physioSkipped: false,
    exerciseDone: existingLog?.exerciseDone ?? false,
    bowelMovement: existingLog?.bowelMovement ?? false,
    waterIntake: existingLog?.waterIntake ?? 0,
    sleepHours: existingLog?.sleepHours ?? 7,
    appetite: existingLog?.appetite ?? "Normal",
    mood: existingLog?.mood ?? "Neutral",
    notes: existingLog?.notes ?? "",
    bp: existingVital?.bloodPressureSystolic ? `${existingVital.bloodPressureSystolic}/${existingVital.bloodPressureDiastolic}` : "",
    heartRate: existingVital?.heartRate ?? null,
    oxygenSaturation: existingVital?.oxygenSaturation ?? null,
    temperature: existingVital?.temperature ?? "",
    physioCompleted: existingExercise?.completed ?? true,
    physioDuration: existingExercise?.duration ?? 15,
    painSlider: sliderFromPainLevel(existingExercise?.painLevel),
  }));
  // If today was already logged as fully taken, start every medicine as "taken";
  // otherwise there's no record of which were skipped, so they start unanswered.
  const [medStatus, setMedStatus] = useState(() =>
    Object.fromEntries(currentMeds.map((m) => [m._id, existingLog?.medicinesTaken ? "taken" : null]))
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const saved = useRef({ log: existingLog, vital: existingVital, physio: existingPhysio });
  const bpRef = useRef(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const bpValid = form.bp.trim() === "" || parseBP(form.bp) !== null;

  const aggregateMedicines = () => {
    if (form.medsSkipped) return false;
    if (!currentMeds.length) return existingLog?.medicinesTaken ?? false;
    return currentMeds.every((m) => medStatus[m._id] === "taken");
  };

  // Create the record the first time, update it afterwards (also on retries).
  const upsert = async (slot, api, payload) => {
    const current = saved.current[slot];
    saved.current[slot] = current ? await api.update(current._id, payload) : await api.create(patientId, payload);
  };

  const handleSave = async () => {
    setErrors([]);

    if (!form.vitalsSkipped && !bpValid) {
      setErrors(['Fix the blood pressure format before saving (e.g. 120/80) — or use "Skip today" on Vitals.']);
      bpRef.current?.focus();
      return;
    }

    setSaving(true);
    const date = todayISO();
    const problems = [];

    try {
      await upsert("log", DailyLogApi, {
        date,
        medicinesTaken: aggregateMedicines(),
        exerciseDone: form.exerciseDone,
        physiotherapyDone: form.physioSkipped ? false : form.physioCompleted,
        waterIntake: form.waterIntake,
        sleepHours: form.sleepHours,
        bowelMovement: form.bowelMovement,
        appetite: form.appetite,
        mood: form.mood,
        notes: form.notes,
      });
    } catch (err) {
      problems.push(`Daily log: ${err.message}`);
    }

    if (!form.vitalsSkipped) {
      const bp = parseBP(form.bp);
      const vitals = {
        bloodPressureSystolic: bp?.systolic,
        bloodPressureDiastolic: bp?.diastolic,
        heartRate: form.heartRate ?? undefined,
        oxygenSaturation: form.oxygenSaturation ?? undefined,
        temperature: numberOrUndefined(form.temperature),
      };
      // Only save a vitals record if at least one reading was actually entered.
      if (Object.values(vitals).some((v) => v !== undefined)) {
        try {
          await upsert("vital", VitalsApi, { date, ...vitals });
        } catch (err) {
          problems.push(`Vitals: ${err.message}`);
        }
      }
    }

    if (!form.physioSkipped) {
      try {
        await upsert("physio", PhysiotherapyApi, {
          date,
          exercises: [
            {
              exerciseName: existingExercise?.exerciseName || "Prescribed exercises",
              duration: form.physioDuration,
              completed: form.physioCompleted,
              painLevel: painLevelFromSlider(form.painSlider),
              difficulty: existingExercise?.difficulty || "Moderate",
            },
          ],
          notes: existingPhysio?.notes || "",
        });
      } catch (err) {
        problems.push(`Physiotherapy: ${err.message}`);
      }
    }

    if (problems.length) {
      setErrors(problems);
      setSaving(false);
      return;
    }
    showToast("Today's care logged", "success");
    navigate(`/patients/${patientId}/dashboard`);
  };

  return (
    <>
      <div className="flex-between mt-16" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Daily log{patient ? ` — ${patient.fullname}` : ""}</h1>
        <span className="badge badge--neutral">{todayISO()}</span>
      </div>
      {existingLog && (
        <div className="banner banner--ok">
          <div className="banner-text">Today is already logged — saving will update it.</div>
        </div>
      )}

      <MedicationsSection
        meds={currentMeds}
        status={medStatus}
        onStatus={(id, value) => setMedStatus((s) => ({ ...s, [id]: value }))}
        skipped={form.medsSkipped}
        onToggleSkip={() => set("medsSkipped", !form.medsSkipped)}
      />
      <VitalsSection
        form={form}
        set={set}
        bpValid={bpValid}
        bpRef={bpRef}
        skipped={form.vitalsSkipped}
        onToggleSkip={() => set("vitalsSkipped", !form.vitalsSkipped)}
      />
      <PhysiotherapySection form={form} set={set} skipped={form.physioSkipped} onToggleSkip={() => set("physioSkipped", !form.physioSkipped)} />
      <WellnessSection form={form} set={set} />

      <div className="card section-card">
        <div className="section-card-header">
          <div className="section-card-title">📝 Notes (optional)</div>
        </div>
        <textarea
          id="notes-input"
          maxLength={1000}
          aria-label="Notes"
          placeholder="Add any observations, changes, or notes..."
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <div id="save-error">
        {errors.length > 0 && (
          <div className="field-error">
            {errors.map((message, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {message}
              </Fragment>
            ))}
          </div>
        )}
      </div>
      <div className="sticky-action-bar mt-16">
        <button type="button" className="btn btn-secondary" onClick={() => navigate(`/patients/${patientId}/dashboard`)}>
          Discard
        </button>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save log"}
        </button>
      </div>
    </>
  );
}
