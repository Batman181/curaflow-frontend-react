export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Short axis label, e.g. "Oct 6". */
export function shortDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatWeekday(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function ageFromDOB(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** "42 yrs · female · O+" — skips whatever is missing. */
export function patientMeta(patient) {
  const age = ageFromDOB(patient?.dateOfBirth);
  return `${age !== null ? `${age} yrs · ` : ""}${patient?.gender || ""}${patient?.bloodGroup ? ` · ${patient.bloodGroup}` : ""}`;
}
