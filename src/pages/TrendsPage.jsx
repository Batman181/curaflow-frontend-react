import { useState } from "react";
import { useParams } from "react-router-dom";
import { DailyLogApi, PhysiotherapyApi, VitalsApi } from "../api";
import { useAsync } from "../hooks/useAsync.js";
import { usePatient } from "../hooks/usePatient.js";
import { asArray } from "../utils/data.js";
import { RANGES, rangeToDates } from "../utils/dateRanges.js";
import { shortDate } from "../utils/format.js";
import BarChart from "../components/charts/BarChart.jsx";
import LineChart from "../components/charts/LineChart.jsx";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Segmented from "../components/common/Segmented.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

const PAIN_TO_NUM = { None: 0, Mild: 1, Moderate: 2, Severe: 3 };

export default function TrendsPage() {
  const { id } = useParams();
  return <TrendsView key={id} patientId={id} />;
}

function TrendsView({ patientId }) {
  const patient = usePatient(patientId);
  const [range, setRange] = useState("week");

  const { data, error, loading } = useAsync(async () => {
    const { startDate, endDate } = rangeToDates(range);
    const [analytics, logs, physio] = await Promise.all([
      VitalsApi.analytics(patientId, range),
      DailyLogApi.list(patientId, { startDate, endDate }),
      PhysiotherapyApi.list(patientId, { startDate, endDate }),
    ]);
    return { analytics, logs: asArray(logs), physio: asArray(physio) };
  }, [patientId, range]);

  return (
    <>
      <div className="mt-16" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Trends{patient ? ` — ${patient.fullname}` : ""}</h1>
        <div className="muted">Charted from this patient's logged vitals, medications and physiotherapy.</div>
      </div>
      <Segmented id="range-segmented" style={{ marginBottom: 18 }} options={RANGES} value={range} onChange={setRange} />
      <div id="trends-output">
        {error ? <ErrorBox>{error.message}</ErrorBox> : loading || !data ? <Skeleton height={400} /> : <TrendCharts data={data} />}
      </div>
    </>
  );
}

function TrendCharts({ data: { analytics, logs, physio } }) {
  // history comes back most-recent-first; charts read left-to-right chronologically.
  const history = asArray(analytics?.history).slice().reverse();
  const stat = analytics?.summary;
  const latest = history[history.length - 1];
  const pointsOf = (key) => history.map((h) => ({ x: shortDate(h.date), y: h[key] ?? null }));

  // One representative pain value per physiotherapy session: the worst
  // (highest) pain level logged across that session's exercises.
  const painSeries = physio.map((s) => ({
    label: shortDate(s.date),
    value: asArray(s.exercises).reduce((max, e) => Math.max(max, PAIN_TO_NUM[e.painLevel] ?? 0), 0),
  }));

  const daysLogged = logs.length;
  const medsTakenDays = logs.filter((l) => l.medicinesTaken).length;
  const adherencePct = daysLogged ? Math.round((medsTakenDays / daysLogged) * 100) : null;

  return (
    <>
      <div className="card chart-card">
        <div className="chart-card-header">
          <div className="chart-card-title">Blood pressure</div>
          <div className="chart-card-meta">
            Latest:{" "}
            {stat?.averageBloodPressure?.systolic
              ? `${Math.round(latest?.bloodPressureSystolic ?? stat.averageBloodPressure.systolic)}/${Math.round(
                  latest?.bloodPressureDiastolic ?? stat.averageBloodPressure.diastolic
                )} mmHg`
              : "—"}
          </div>
        </div>
        {/* Shaded bands are general resting-adult reference ranges, not a personalised target. */}
        <LineChart
          series={[
            { name: "Systolic", color: "#1F7A6C", points: pointsOf("bloodPressureSystolic") },
            { name: "Diastolic", color: "#C1652B", points: pointsOf("bloodPressureDiastolic") },
          ]}
          bands={[
            { from: 90, to: 120, color: "#1F7A6C", label: "Typical systolic range" },
            { from: 60, to: 80, color: "#C1652B", label: "Typical diastolic range" },
          ]}
        />
        <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          Shaded bands are general resting-adult reference ranges, not a personalized target — discuss this patient's
          specific goals with their clinician.
        </div>
      </div>

      <div className="tile-grid">
        <div className="card chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Heart rate</div>
            <div className="chart-card-meta">{stat?.averageHeartRate ? `Avg ${Math.round(stat.averageHeartRate)} bpm` : ""}</div>
          </div>
          <LineChart
            series={[{ name: "Heart rate", color: "#1F7A6C", points: pointsOf("heartRate") }]}
            bands={[{ from: 60, to: 100, color: "#1F7A6C", label: "Typical resting range" }]}
          />
        </div>
        <div className="card chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">SpO₂</div>
            <div className="chart-card-meta">{stat?.averageOxygenSaturation ? `Avg ${Math.round(stat.averageOxygenSaturation)}%` : ""}</div>
          </div>
          <LineChart
            series={[{ name: "SpO₂", color: "#2F8F5B", points: pointsOf("oxygenSaturation") }]}
            bands={[{ from: 95, to: 100, color: "#2F8F5B", label: "Typical healthy range" }]}
          />
        </div>
      </div>

      <div className="card chart-card mt-16">
        <div className="chart-card-header">
          <div className="chart-card-title">Pain level (physiotherapy sessions)</div>
          <div className="chart-card-meta">0=None · 1=Mild · 2=Moderate · 3=Severe</div>
        </div>
        <BarChart labels={painSeries.map((p) => p.label)} values={painSeries.map((p) => p.value)} color="#B8801E" />
      </div>

      <div className="card mt-16">
        <div className="flex-between mb-0" style={{ marginBottom: 10 }}>
          <strong>Medication adherence</strong>
          <strong>{adherencePct !== null ? `${adherencePct}%` : "—"}</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${adherencePct ?? 0}%` }} />
        </div>
        <div className="muted mt-16" style={{ marginBottom: 0 }}>
          {daysLogged ? `Based on ${daysLogged} logged day${daysLogged === 1 ? "" : "s"} in this range` : "No daily logs in this range"}
          {" "}· Vitals logged: {stat?.totalRecords ?? 0} readings · PT sessions: {physio.length}
        </div>
      </div>
    </>
  );
}
