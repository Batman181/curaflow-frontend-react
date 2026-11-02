import { useState } from "react";
import { useParams } from "react-router-dom";
import { SummaryApi, VitalsApi } from "../api";
import { useToast } from "../context/ToastContext.jsx";
import { usePatient } from "../hooks/usePatient.js";
import { RANGES } from "../utils/dateRanges.js";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Segmented from "../components/common/Segmented.jsx";
import SummaryResult from "../components/summary/SummaryResult.jsx";

export default function SummaryPage() {
  const { id } = useParams();
  return <SummaryView key={id} patientId={id} />;
}

function SummaryView({ patientId }) {
  const patient = usePatient(patientId);
  const showToast = useToast();
  const [range, setRange] = useState("week");
  const [state, setState] = useState({ status: "idle" }); // idle | loading | done | error
  const generating = state.status === "loading";

  const generate = async () => {
    setState({ status: "loading" });
    try {
      // The summary endpoint returns only the narrative; the evidence for the
      // "Based on" panel comes from the vitals analytics for the same range.
      const [summaryData, analytics] = await Promise.all([
        SummaryApi.generate(patientId, range),
        VitalsApi.analytics(patientId, range).catch(() => null),
      ]);
      setState({ status: "done", result: { summaryData, analytics, range } });
      showToast("Summary ready — a copy was also emailed to you", "success");
    } catch (err) {
      setState({ status: "error", error: err });
    }
  };

  return (
    <>
      <div className="mt-16" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>AI recovery summary{patient ? ` — ${patient.fullname}` : ""}</h1>
        <div className="muted">Generated from this patient's logged vitals, medications and physiotherapy — never a diagnosis.</div>
      </div>

      <div className="flex-between" style={{ marginBottom: 18 }}>
        <Segmented id="range-segmented" options={RANGES} value={range} onChange={setRange} />
        <button type="button" className="btn btn-primary" disabled={generating} onClick={generate}>
          Generate summary
        </button>
      </div>

      <div id="summary-output">
        {generating && (
          <div className="card">
            <div className="flex-between mb-0">
              <strong>Generating your summary…</strong>
              <div className="spinner" />
            </div>
            <div className="loading-steps">
              <div className="loading-step">Reading logged vitals for this range</div>
              <div className="loading-step">Checking medication adherence</div>
              <div className="loading-step">Reviewing physiotherapy sessions</div>
              <div className="loading-step">Writing a plain-language overview</div>
            </div>
          </div>
        )}
        {state.status === "error" && <ErrorBox>{state.error.message}</ErrorBox>}
        {state.status === "done" && <SummaryResult {...state.result} patientId={patientId} />}
      </div>
    </>
  );
}
