import { useState } from "react";
import { useParams } from "react-router-dom";
import { ReportsApi } from "../api";
import { useToast } from "../context/ToastContext.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { usePatient } from "../hooks/usePatient.js";
import { asArray } from "../utils/data.js";
import { formatDate } from "../utils/format.js";
import UploadReportModal from "../components/reports/UploadReportModal.jsx";
import ErrorBox from "../components/common/ErrorBox.jsx";
import Skeleton from "../components/common/Skeleton.jsx";

export default function ReportsPage() {
  const { id: patientId } = useParams();
  const patient = usePatient(patientId);
  const showToast = useToast();
  const [uploading, setUploading] = useState(false);

  // Paginated mode returns { reports, pagination }; date-range mode returns a bare array.
  const { data, error, loading, reload } = useAsync(async () => {
    const res = await ReportsApi.list(patientId, { limit: 20 });
    return asArray(Array.isArray(res) ? res : res?.reports);
  }, [patientId]);

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (loading || !data) return <Skeleton height={120} />;

  return (
    <>
      <div className="flex-between mt-16" style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20 }}>Reports{patient ? ` — ${patient.fullname}` : ""}</h1>
        <button type="button" className="btn btn-primary" onClick={() => setUploading(true)}>
          + Upload report
        </button>
      </div>

      <div className="card">
        {data.length ? (
          data.map((r) => (
            <div className="list-row" key={r._id}>
              <div>
                <div className="list-row-main">{r.reportName}</div>
                <div className="list-row-sub">
                  {r.category} · {formatDate(r.reportDate)}
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
          <div className="empty-state">
            <h3>No reports yet</h3>
            <p>Upload a scan, lab result, or discharge summary to keep it with this patient.</p>
          </div>
        )}
      </div>

      {uploading && (
        <UploadReportModal
          patientId={patientId}
          onClose={() => setUploading(false)}
          onUploaded={() => {
            setUploading(false);
            showToast("Report uploaded", "success");
            reload();
          }}
        />
      )}
    </>
  );
}
