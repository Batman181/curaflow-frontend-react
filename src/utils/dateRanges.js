// Mirrors the exact window the backend's GET /vitals/analytics uses for each
// range value (see getVitalAnalytics in the backend), so a log/physiotherapy
// query for the same range covers the same days.
export const RANGES = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "6months", label: "6 Months" },
  { value: "all", label: "All" },
];

export function rangeToDates(range) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  if (range === "week") start.setUTCDate(today.getUTCDate() - 6);
  else if (range === "month") start.setUTCDate(today.getUTCDate() - 29);
  else if (range === "6months") start.setUTCDate(today.getUTCDate() - 180);
  else start.setTime(new Date("2000-01-01T00:00:00Z").getTime()); // "all"
  return { startDate: start.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10) };
}
