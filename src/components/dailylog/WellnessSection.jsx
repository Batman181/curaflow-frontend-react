import Segmented from "../common/Segmented.jsx";
import Stepper from "../common/Stepper.jsx";
import Toggle from "../common/Toggle.jsx";
import { APPETITE_OPTIONS, MOOD_OPTIONS } from "./helpers.js";

const APPETITE = APPETITE_OPTIONS.map((o) => ({ value: o, label: o }));
const stacked = { flexDirection: "column", alignItems: "stretch", gap: 10 };

export default function WellnessSection({ form, set }) {
  return (
    <div className="card section-card">
      <div className="section-card-header">
        <div className="section-card-title">☀ Wellness</div>
      </div>

      <div className="log-row">
        <div className="log-row-label">Exercise done</div>
        <Toggle id="t-exercise" ariaLabel="Exercise done" on={form.exerciseDone} onChange={(v) => set("exerciseDone", v)} />
      </div>

      <div className="log-row">
        <div className="log-row-label">Bowel movement</div>
        <Toggle id="t-bowel" ariaLabel="Bowel movement" on={form.bowelMovement} onChange={(v) => set("bowelMovement", v)} />
      </div>

      <div className="log-row">
        <div>
          <div className="log-row-label">Water intake</div>
          <div className="log-row-sub">Glasses today</div>
        </div>
        <Stepper
          valueId="water-value"
          value={form.waterIntake}
          decrementLabel="Decrease water intake"
          incrementLabel="Increase water intake"
          onDecrement={() => set("waterIntake", Math.max(0, form.waterIntake - 1))}
          onIncrement={() => set("waterIntake", form.waterIntake + 1)}
        />
      </div>

      <div className="log-row">
        <div className="log-row-label">Sleep hours</div>
        <div className="slider-wrap">
          <div className="slider-value">{form.sleepHours}h</div>
          <input
            type="range"
            id="sleep-slider"
            min="0"
            max="24"
            step="0.5"
            aria-label="Sleep hours"
            value={form.sleepHours}
            onChange={(e) => set("sleepHours", parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="log-row" style={stacked}>
        <div className="log-row-label">Appetite</div>
        <Segmented id="appetite-segmented" options={APPETITE} value={form.appetite} onChange={(v) => set("appetite", v)} />
      </div>

      <div className="log-row" style={stacked}>
        <div className="log-row-label">Mood</div>
        <div className="mood-picker" id="mood-picker">
          {MOOD_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`mood-btn${form.mood === o.value ? " is-active" : ""}`}
              aria-pressed={form.mood === o.value}
              onClick={() => set("mood", o.value)}
            >
              <span className="mood-emoji">{o.emoji}</span>
              {o.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
