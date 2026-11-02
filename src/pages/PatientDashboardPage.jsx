import { useNavigate, useParams } from "react-router-dom";
import { DashboardApi } from "../api";
import { useAsync } from "../hooks/useAsync.js";
import { asArray } from "../utils/data.js";
import { formatDate, patientMeta } from "../utils/format.js";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

const ReportLink = ({ report }) =>
  report.reportFile ? (
    <a className="btn btn-secondary btn-sm" href={report.reportFile} target="_blank" rel="noopener noreferrer">
      View
    </a>
  ) : null;

/** Weekly summary — GET /patients/:id/dashboard (an itemised 7-day view). */
export default function PatientDashboardPage() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useAsync(() => DashboardApi.patient(patientId), [patientId]);

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (loading || !data) return <Skeleton height={180} />;

  const { patient, weeklySummary } = data;
  const weeklyLog = asArray(weeklySummary?.weeklyLog);
  const currentPrescription = asArray(weeklySummary?.currentPrescription);
  const weeklyVitals = asArray(weeklySummary?.weeklyVitals);
  const weeklyPhysiotherapy = asArray(weeklySummary?.weeklyPhysiotherapy);
  const weeklyReports = asArray(weeklySummary?.weeklyReports);

  // weeklyLog rows don't carry a date (the backend only selects the health
  // fields), so these are counts over "the last 7 days", not a day-by-day
  // breakdown — a real constraint of the endpoint, not worth faking.
  const daysLogged = weeklyLog.length;
  const medsDays = weeklyLog.filter((l) => l.medicinesTaken).length;
  const physioDays = weeklyLog.filter((l) => l.physiotherapyDone).length;
  const exerciseDays = weeklyLog.filter((l) => l.exerciseDone).length;
  const sleepValues = weeklyLog.map((l) => l.sleepHours).filter((v) => typeof v === "number");
  const avgSleep = sleepValues.length ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1) : null;

  return (
    <>
      <div className="mt-16" style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: 20 }}>{patient.fullname} — weekly dashboard</h1>
        <div className="muted">{patientMeta(patient)}</div>
      </div>
      <button type="button" className="btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => navigate(`/patients/${patientId}`)}>
        ← Back to workspace
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Last 7 days at a glance</div>
        <div className="based-on-body" style={{ padding: 0 }}>
          <div className="based-on-stat"><div className="num">{daysLogged}/7</div><div className="label">Days logged</div></div>
          <div className="based-on-stat"><div className="num">{medsDays}/{daysLogged || 7}</div><div className="label">Medicines taken</div></div>
          <div className="based-on-stat"><div className="num">{physioDays}/{daysLogged || 7}</div><div className="label">Physiotherapy done</div></div>
          <div className="based-on-stat"><div className="num">{exerciseDays}/{daysLogged || 7}</div><div className="label">Exercise done</div></div>
          <div className="based-on-stat"><div className="num">{avgSleep !== null ? `${avgSleep}h` : "—"}</div><div className="label">Average sleep</div></div>
        </div>
        {daysLogged < 7 && (
          <div className="muted mt-16" style={{ marginBottom: 0 }}>
            Only {daysLogged} of the last 7 days have a log entry — the rest were never recorded, not zero.
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Current prescriptions</div>
        {currentPrescription.length ? (
          currentPrescription.map((p) => (
            <div className="list-row" key={p._id}>
              <div>
                <div className="list-row-main">{p.medicineName} · {p.dosage}</div>
                <div className="list-row-sub">{p.frequency}</div>
              </div>
              <div className="muted">until {formatDate(p.endDate)}</div>
            </div>
          ))
        ) : (
          <div className="muted">No active prescriptions.</div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Vitals this week</div>
        {weeklyVitals.length ? (
          weeklyVitals.map((v) => (
            <div className="list-row" key={v._id}>
              <div className="list-row-main">{formatDate(v.date)}</div>
              <div className="list-row-sub">
                {v.bloodPressureSystolic ? `BP ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : ""}
                {v.heartRate ? ` · HR ${v.heartRate}` : ""}
                {v.oxygenSaturation ? ` · SpO₂ ${v.oxygenSaturation}%` : ""}
              </div>
            </div>
          ))
        ) : (
          <div className="muted">No vitals recorded this week.</div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Physiotherapy this week</div>
        {weeklyPhysiotherapy.length ? (
          weeklyPhysiotherapy.map((s) => {
            const count = asArray(s.exercises).length;
            return (
              <div className="list-row" key={s._id}>
                <div className="list-row-main">{formatDate(s.date)}</div>
                <div className="list-row-sub">{count} exercise{count === 1 ? "" : "s"} logged</div>
              </div>
            );
          })
        ) : (
          <div className="muted">No sessions this week.</div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Reports this week</div>
        {weeklyReports.length ? (
          weeklyReports.map((r) => (
            <div className="list-row" key={r._id}>
              <div>
                <div className="list-row-main">{r.reportName}</div>
                <div className="list-row-sub">{r.category} · {formatDate(r.reportDate)}</div>
              </div>
              <ReportLink report={r} />
            </div>
          ))
        ) : (
          <div className="muted">No reports uploaded this week.</div>
        )}
      </div>
    </>
  );
}
