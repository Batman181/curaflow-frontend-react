import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DailyLogApi, DashboardApi, PatientsApi } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { usePatients } from "../context/PatientsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { asArray } from "../utils/data.js";
import { formatDate, formatWeekday, greeting } from "../utils/format.js";
import Avatar from "../components/common/Avatar.jsx";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Modal from "../components/common/Modal.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const { setPatients } = usePatients();
  const navigate = useNavigate();
  const showToast = useToast();
  const [picker, setPicker] = useState(null); // (patientId) => path, while the "Choose a patient" modal is open
  const firstName = (user?.fullname || "there").split(" ")[0];

  const { data, error, loading } = useAsync(async () => {
    const [dashboard, list] = await Promise.all([DashboardApi.global(), PatientsApi.list().catch(() => null)]);
    if (list) setPatients(asArray(list.patients));

    // "On track" / "needs attention" isn't a field the backend gives us directly,
    // so derive it the same honest way the patient list does: who has today's log.
    const recentPatients = asArray(dashboard.recentPatients);
    const statuses = await Promise.all(
      recentPatients.map((p) => DailyLogApi.today(p._id).then((log) => !!log).catch(() => null))
    );
    return { dashboard, recentPatients, statuses, patientList: asArray(list?.patients) };
  }, []);

  const greetingHeader = (
    <div className="greeting-header mt-16">
      <h1>
        {greeting()}, {firstName}
      </h1>
      <div className="muted">{formatWeekday()}</div>
    </div>
  );

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (loading || !data) {
    return (
      <>
        {greetingHeader}
        <Skeleton height={280} />
      </>
    );
  }

  const { dashboard, recentPatients, statuses, patientList } = data;
  const { overview, today } = dashboard;
  const recentReports = asArray(dashboard.recentReports);
  const onTrackCount = statuses.filter((s) => s === true).length;
  const attentionCount = statuses.filter((s) => s === false).length;
  const medicinePct = today.medicineSchedules ? Math.round((today.medicineCompleted / today.medicineSchedules) * 100) : null;

  const pickPatientThen = (destination) => {
    if (!patientList.length) {
      showToast("Add a patient first", "error");
      return;
    }
    if (patientList.length === 1) {
      navigate(destination(patientList[0]._id));
      return;
    }
    setPicker(() => destination);
  };

  const toLog = (id) => `/patients/${id}/log`;
  const toSummary = (id) => `/patients/${id}/summary`;
  const toTrends = (id) => `/patients/${id}/trends`;

  return (
    <>
      <div className="greeting-header mt-16">
        <div className="flex-between" style={{ alignItems: "flex-start" }}>
          <div>
            <h1>
              {greeting()}, {firstName}
            </h1>
            <div className="muted">{formatWeekday()}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => pickPatientThen(toLog)}>
            + Log today's care
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-card-icon">👥</span>
          <div className="num">{overview.totalPatients}</div>
          <div className="label">Total patients</div>
        </div>
        <div className="card stat-card">
          <span className="stat-card-icon">✅</span>
          <div className="num">
            {onTrackCount}/{recentPatients.length}
          </div>
          <div className="label">
            On track (of {recentPatients.length} shown below)
            {attentionCount ? ` · ${attentionCount} need attention` : ""}
          </div>
        </div>
        <div className="card stat-card">
          <span className="stat-card-icon">💊</span>
          <div className="num">{medicinePct !== null ? `${medicinePct}%` : "—"}</div>
          <div className="label">Medicine adherence today</div>
        </div>
        <div className="card stat-card">
          <span className="stat-card-icon">📁</span>
          <div className="num">{overview.reportsUploadedToday}</div>
          <div className="label">Reports uploaded today</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <div className="section-title mb-0">Patient overview</div>
            <button type="button" className="btn-ghost btn-sm" onClick={() => navigate("/patients")}>
              See all
            </button>
          </div>
          {recentPatients.length ? (
            recentPatients.map((p, i) => {
              const logged = statuses[i];
              const badgeClass = logged === null ? "badge--neutral" : logged ? "badge--ok" : "badge--warn";
              const badgeLabel = logged === null ? "Unknown" : logged ? "✓ On-track" : "⚠ Attention";
              const open = () => navigate(toLog(p._id));
              return (
                <div
                  key={p._id}
                  className="patient-overview-row"
                  role="button"
                  tabIndex={0}
                  onClick={open}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open();
                    }
                  }}
                >
                  <Avatar name={p.fullname} />
                  <div className="pr-main">
                    <div className="list-row-main">{p.fullname}</div>
                    <div className="list-row-sub">{p.gender || ""}</div>
                  </div>
                  <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <h3>No patients yet</h3>
              <p>Add your first patient to get started.</p>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="section-title">Quick actions</div>
            <button type="button" className="quick-action-btn" onClick={() => pickPatientThen(toLog)}>
              📋 Log today's care
            </button>
            <button type="button" className="quick-action-btn" onClick={() => navigate("/patients")}>
              ➕ Add new patient
            </button>
            <button type="button" className="quick-action-btn" onClick={() => pickPatientThen(toSummary)}>
              ✨ View recovery summaries
            </button>
            <button type="button" className="quick-action-btn" onClick={() => pickPatientThen(toTrends)}>
              📈 Check trends
            </button>
          </div>
          <div className="teaser-card">
            <div className="label">Recovery summaries</div>
            <p>AI-generated, evidence-backed overviews for any patient — never a diagnosis.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => pickPatientThen(toSummary)}>
              Generate one →
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-16">
        <div className="section-title">Recent reports</div>
        {recentReports.length ? (
          recentReports.map((r) => (
            <div className="list-row" key={r._id}>
              <div>
                <div className="list-row-main">{r.reportName}</div>
                <div className="list-row-sub">
                  {r.category} · {r.patient?.fullname || ""} · {formatDate(r.reportDate)}
                </div>
              </div>
              {r.reportFile && (
                <a className="btn btn-secondary btn-sm" href={r.reportFile} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="muted">No reports uploaded yet.</div>
        )}
      </div>

      {picker && (
        <Modal title="Choose a patient" onClose={() => setPicker(null)}>
          <div>
            {patientList.map((p) => (
              <div
                key={p._id}
                className="list-row"
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setPicker(null);
                  navigate(picker(p._id));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPicker(null);
                    navigate(picker(p._id));
                  }
                }}
              >
                <div className="list-row-main">{p.fullname}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
