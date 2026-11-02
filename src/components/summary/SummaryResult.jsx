import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDate } from "../../utils/format.js";
import { buildStatCards, parseSections, sectionsToText } from "../../utils/summary.js";

/** The AI narrative, its "based on" evidence panel, and copy / download / read-aloud actions. */
export default function SummaryResult({ summaryData, analytics, range, patientId }) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [basedOnOpen, setBasedOnOpen] = useState(false);
  const [reading, setReading] = useState(false);

  const sections = useMemo(() => parseSections(summaryData.summary), [summaryData.summary]);
  const fullText = useMemo(() => sectionsToText(sections), [sections]);
  const statCards = buildStatCards(analytics?.summary);

  // Stop reading aloud if the caregiver leaves the page.
  useEffect(
    () => () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    []
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      showToast("Summary copied to clipboard", "success");
    } catch {
      showToast("Couldn't copy — your browser may be blocking clipboard access", "error");
    }
  };

  const download = () => {
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recovery-summary-${range}-${summaryData.generatedAt?.slice(0, 10) || "today"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleReadAloud = () => {
    if (!("speechSynthesis" in window)) {
      showToast("Read-aloud isn't supported in this browser", "error");
      return;
    }
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.onend = () => setReading(false);
    utterance.onerror = () => setReading(false);
    window.speechSynthesis.speak(utterance);
    setReading(true);
  };

  return (
    <>
      <div className="disclaimer-chip">⚠ AI-generated summary — not a diagnosis. Always confirm with a clinician.</div>

      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
            📋 Copy summary
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={download}>
            ⬇ Download as text
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={toggleReadAloud}>
            {reading ? "⏹ Stop reading" : "🔊 Read aloud"}
          </button>
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={() => navigate(`/patients/${patientId}/trends`)}>
          📈 View trends for this period →
        </button>
      </div>

      <div className="based-on-panel">
        <button
          type="button"
          className="based-on-header"
          style={{ width: "100%", cursor: "pointer" }}
          aria-expanded={basedOnOpen}
          onClick={() => setBasedOnOpen((o) => !o)}
        >
          <span>
            Based on: {range} · generated {formatDate(summaryData.generatedAt)}
          </span>
          <span>{basedOnOpen ? "▴" : "▾"}</span>
        </button>
        <div className="based-on-body" hidden={!basedOnOpen}>
          {statCards.length ? (
            statCards.map((c) => (
              <div className="based-on-stat" key={c.label}>
                <div className="num">{c.num}</div>
                <div className="label">{c.label}</div>
              </div>
            ))
          ) : (
            <div className="muted">No vitals were recorded in this range yet.</div>
          )}
        </div>
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: "var(--muted)" }}>
          This panel currently reflects vitals data (the backend's <code>/vitals/analytics</code> endpoint). The AI
          narrative itself also draws on daily logs and physiotherapy sessions for this same range.
        </div>
      </div>

      {sections.map((s, i) => (
        <div className="summary-section" key={`${s.title}-${i}`}>
          <h3>{s.title}</h3>
          <p>{s.body.join("\n").trim()}</p>
        </div>
      ))}
    </>
  );
}
