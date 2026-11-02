export const SECTION_HEADERS = [
  "Overall Overview",
  "Vital Trends",
  "Medication Adherence",
  "Physiotherapy Progress",
  "Lifestyle Observations",
  "Suggested Discussion Points",
];

/**
 * The backend returns the AI summary as one free-text string. Split it on the
 * six section headers its prompt asks for; if none are found, fall back to a
 * single "Summary" section rather than dropping any content.
 */
export function parseSections(rawText) {
  const lines = (rawText || "").split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const clean = line.replace(/^[#*\-\s\d.]+|[:*]+$/g, "").trim();
    const matchedHeader = SECTION_HEADERS.find((h) => clean.toLowerCase() === h.toLowerCase());
    if (matchedHeader) {
      current = { title: matchedHeader, body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    } else if (line.trim()) {
      if (!sections.length || sections[0].title !== "Summary") sections.unshift({ title: "Summary", body: [] });
      sections[0].body.push(line);
    }
  }

  if (!sections.length) sections.push({ title: "Summary", body: lines });
  return sections;
}

export const sectionsToText = (sections) => sections.map((s) => `${s.title}\n${s.body.join("\n").trim()}`).join("\n\n");

/** Stat cards for the "Based on" panel, from GET /vitals/analytics → summary. */
export function buildStatCards(stat) {
  return [
    stat?.totalRecords !== undefined ? { label: "Vital readings used", num: stat.totalRecords } : null,
    stat?.averageBloodPressure?.systolic
      ? {
          label: "Avg blood pressure",
          num: `${Math.round(stat.averageBloodPressure.systolic)}/${Math.round(stat.averageBloodPressure.diastolic)}`,
        }
      : null,
    stat?.averageHeartRate ? { label: "Avg heart rate", num: `${Math.round(stat.averageHeartRate)} bpm` } : null,
    stat?.averageOxygenSaturation ? { label: "Avg SpO₂", num: `${Math.round(stat.averageOxygenSaturation)}%` } : null,
    stat?.averageBloodSugar ? { label: "Avg blood sugar", num: `${Math.round(stat.averageBloodSugar)} mg/dL` } : null,
    stat?.averageWeight ? { label: "Avg weight", num: `${stat.averageWeight.toFixed(1)} kg` } : null,
  ].filter(Boolean);
}
