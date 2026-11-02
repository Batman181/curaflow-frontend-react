export const APPETITE_OPTIONS = ["Poor", "Normal", "Good"];

export const MOOD_OPTIONS = [
  { value: "Very Bad", emoji: "😣" },
  { value: "Bad", emoji: "🙁" },
  { value: "Neutral", emoji: "😐" },
  { value: "Good", emoji: "🙂" },
  { value: "Very Good", emoji: "😄" },
];

// The pain slider is 0–10 on screen, but the backend only stores a 4-value enum.
export const painLevelFromSlider = (v) => (v <= 0 ? "None" : v <= 3 ? "Mild" : v <= 6 ? "Moderate" : "Severe");
export const sliderFromPainLevel = (level) => ({ None: 0, Mild: 2, Moderate: 5, Severe: 8 })[level] ?? 0;

/** "120/80" → { systolic: 120, diastolic: 80 }, or null if it isn't in that format. */
export function parseBP(str) {
  const m = (str || "").trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  return m ? { systolic: parseInt(m[1], 10), diastolic: parseInt(m[2], 10) } : null;
}

export { numberOrUndefined } from "../../utils/data.js";
