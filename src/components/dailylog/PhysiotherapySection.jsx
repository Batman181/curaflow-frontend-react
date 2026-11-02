import Segmented from "../common/Segmented.jsx";
import Stepper from "../common/Stepper.jsx";
import SkippableSection from "./SkippableSection.jsx";
import { painLevelFromSlider } from "./helpers.js";

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function PhysiotherapySection({ form, set, skipped, onToggleSkip }) {
  const level = painLevelFromSlider(form.painSlider);
  return (
    <SkippableSection id="physio-section" icon="🤸" title="Physiotherapy" skipped={skipped} onToggle={onToggleSkip}>
      <div className="log-row">
        <div>
          <div className="log-row-label">Exercises completed</div>
          <div className="log-row-sub">Prescribed exercises for today</div>
        </div>
        <Segmented
          id="physio-completed-seg"
          options={YES_NO}
          value={form.physioCompleted ? "yes" : "no"}
          onChange={(v) => set("physioCompleted", v === "yes")}
        />
      </div>

      <div className="log-row">
        <div className="log-row-label">Duration (minutes)</div>
        <Stepper
          valueId="dur-value"
          value={form.physioDuration}
          decrementLabel="Decrease duration"
          incrementLabel="Increase duration"
          onDecrement={() => set("physioDuration", Math.max(0, form.physioDuration - 5))}
          onIncrement={() => set("physioDuration", form.physioDuration + 5)}
        />
      </div>

      <div className="log-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
        <div className="flex-between mb-0">
          <span className="log-row-label" id="pain-slider-label">
            Pain level
          </span>
          <span id="pain-label" className="muted">
            {level}
          </span>
        </div>
        {/* 11 tick marks (datalist) make the 10 discrete steps visible, which testers found easier to control. */}
        <input
          type="range"
          id="pain-slider"
          min="0"
          max="10"
          step="1"
          value={form.painSlider}
          list="pain-ticks"
          aria-labelledby="pain-slider-label"
          aria-valuetext={level}
          onChange={(e) => set("painSlider", parseInt(e.target.value, 10))}
        />
        <datalist id="pain-ticks">
          {Array.from({ length: 11 }, (_, i) => (
            <option key={i} value={i} />
          ))}
        </datalist>
        <div className="flex-between mb-0">
          <span className="muted" style={{ fontSize: 11 }}>
            No pain
          </span>
          <span className="muted" style={{ fontSize: 11 }}>
            Severe pain
          </span>
        </div>
      </div>
    </SkippableSection>
  );
}
