import { useNavigate, useParams } from "react-router-dom";
import { DailyLogApi, PhysiotherapyApi, PrescriptionsApi, ReportsApi, VitalsApi } from "../api";
import { usePatients } from "../context/PatientsContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { asArray } from "../utils/data.js";
import { patientMeta } from "../utils/format.js";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

function Tile({ href, icon, name, status, meta }) {
  const navigate = useNavigate();
  return (
    <button type="button" className={`tile tile--${status}`} onClick={() => navigate(href)}>
      <div className="tile-top">
        <span className="tile-icon">{icon}</span>
        <span className={`status-dot status-dot--${status}`} />
      </div>
      <span className="tile-name">{name}</span>
      <span className="tile-meta">{meta}</span>
    </button>
  );
}

/**
 * Patient hub (six module tiles). It isn't linked from the sidebar any more —
 * the weekly summary's "Back to workspace" button still leads here.
 */
export default function WorkspacePage() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { getOrFetchPatient } = usePatients();

  const { data, error, loading } = useAsync(async () => {
    const patient = await getOrFetchPatient(patientId);
    const [todayLog, todayVital, todayPhysio, currentMeds, expiringMeds, reports] = await Promise.all([
      DailyLogApi.today(patientId).catch(() => null),
      VitalsApi.today(patientId).catch(() => null),
      PhysiotherapyApi.today(patientId).catch(() => null),
      PrescriptionsApi.current(patientId).catch(() => []),
      PrescriptionsApi.expiring(patientId, 7).catch(() => []),
      ReportsApi.list(patientId, { limit: 1 }).catch(() => null),
    ]);
    return { patient, todayLog, todayVital, todayPhysio, currentMeds: asArray(currentMeds), expiringMeds: asArray(expiringMeds), reports };
  }, [patientId]);

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (loading || !data) return <Skeleton height={100} />;

  const { patient, todayLog, todayVital, todayPhysio, currentMeds, expiringMeds, reports } = data;
  const logDone = !!todayLog;

  return (
    <>
      <div className="flex-between mt-16" style={{ marginBottom: 18, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 20 }}>{patient.fullname}</h1>
          <div className="muted">{patientMeta(patient)}</div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/patients/${patientId}/dashboard`)}>
          This week's dashboard →
        </button>
      </div>

      {!logDone && (
        <div className="banner">
          <div className="banner-text">Today's care hasn't been logged yet for {patient.fullname}.</div>
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/patients/${patientId}/log`)}>
            Log today's care
          </button>
        </div>
      )}

      <div className="tile-grid">
        <Tile href={`/patients/${patientId}/log`} icon="📋" name="Daily log" status={logDone ? "ok" : "warn"} meta={logDone ? "Logged today" : "Not logged yet"} />
        <Tile href={`/patients/${patientId}/vitals`} icon="❤" name="Vitals" status={todayVital ? "ok" : "warn"} meta={todayVital ? "Recorded today" : "No reading today"} />
        <Tile
          href={`/patients/${patientId}/physiotherapy`}
          icon="🤸"
          name="Physiotherapy"
          status={todayPhysio ? "ok" : "warn"}
          meta={todayPhysio ? "Session logged today" : "No session today"}
        />
        <Tile
          href={`/patients/${patientId}/prescriptions`}
          icon="💊"
          name="Prescriptions"
          status={expiringMeds.length ? "warn" : "neutral"}
          meta={
            expiringMeds.length
              ? `${expiringMeds.length} expiring within 7 days`
              : `${currentMeds.length} current medicine${currentMeds.length === 1 ? "" : "s"}`
          }
        />
        <Tile href={`/patients/${patientId}/reports`} icon="📁" name="Reports" status="neutral" meta={`${reports?.pagination?.total ?? 0} on file`} />
        <Tile href={`/patients/${patientId}/summary`} icon="✨" name="AI recovery summary" status="neutral" meta="Explainable, evidence-backed overview" />
      </div>
    </>
  );
}
