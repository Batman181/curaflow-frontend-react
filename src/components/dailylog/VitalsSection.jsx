import Stepper from "../common/Stepper.jsx";
import SkippableSection from "./SkippableSection.jsx";

export default function VitalsSection({ form, set, bpValid, bpRef, skipped, onToggleSkip }) {
  return (
    <SkippableSection id="vitals-section" icon="❤" title="Vitals" skipped={skipped} onToggle={onToggleSkip}>
      <div className="vital-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <label htmlFor="v-bp" className="log-row-label">
            Blood pressure
          </label>
          <div className="field-hint" style={{ marginTop: 2 }}>
            Format: systolic/diastolic — e.g. 120/80
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <input
            ref={bpRef}
            type="text"
            id="v-bp"
            placeholder="120/80"
            inputMode="numeric"
            value={form.bp}
            onChange={(e) => set("bp", e.target.value)}
            aria-describedby="bp-error"
            aria-invalid={!bpValid}
            style={{ borderColor: bpValid ? undefined : "var(--danger-600)" }}
          />
          <div id="bp-error" className="field-hint" style={{ color: "var(--danger-600)", display: bpValid ? "none" : "block" }}>
            Enter as two numbers separated by a slash, like 120/80.
          </div>
        </div>
      </div>

      <div className="vital-row">
        <label htmlFor="hr-value" className="log-row-label">
          Heart rate (bpm)
        </label>
        <Stepper
          valueId="hr-value"
          value={form.heartRate ?? "—"}
          decrementLabel="Decrease heart rate"
          incrementLabel="Increase heart rate"
          onDecrement={() => set("heartRate", Math.max(0, (form.heartRate ?? 70) - 1))}
          onIncrement={() => set("heartRate", (form.heartRate ?? 69) + 1)}
        />
      </div>

      <div className="vital-row">
        <label htmlFor="spo2-value" className="log-row-label">
          SpO₂ (%)
        </label>
        <Stepper
          valueId="spo2-value"
          value={form.oxygenSaturation ?? "—"}
          decrementLabel="Decrease SpO2"
          incrementLabel="Increase SpO2"
          onDecrement={() => set("oxygenSaturation", Math.max(0, (form.oxygenSaturation ?? 98) - 1))}
          onIncrement={() => set("oxygenSaturation", Math.min(100, (form.oxygenSaturation ?? 97) + 1))}
        />
      </div>

      <div className="vital-row">
        <label htmlFor="v-temp" className="log-row-label">
          Temperature (°C)
        </label>
        <input type="number" step="0.1" id="v-temp" value={form.temperature} onChange={(e) => set("temperature", e.target.value)} />
      </div>
    </SkippableSection>
  );
}
