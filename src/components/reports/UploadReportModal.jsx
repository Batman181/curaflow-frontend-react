import { useId, useState } from "react";
import { ReportsApi } from "../../api";
import ErrorBox from "../common/ErrorBox.jsx";
import Field from "../common/Field.jsx";
import Modal from "../common/Modal.jsx";

export const REPORT_CATEGORIES = ["MRI", "CT", "XRay", "ECG", "CBC", "LFT", "KFT", "RBS", "Prescription", "Discharge Summary", "Other"];

export default function UploadReportModal({ patientId, onClose, onUploaded }) {
  const uid = useId();
  const [file, setFile] = useState(null);
  const [v, setV] = useState({ category: REPORT_CATEGORIES[0], reportDate: "", reportName: "", remarks: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bind = (key) => ({ id: `${uid}-${key}`, value: v[key], onChange: (e) => setV((s) => ({ ...s, [key]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("reportFile", file);
    formData.append("category", v.category);
    formData.append("reportDate", v.reportDate);
    formData.append("reportName", v.reportName.trim());
    formData.append("remarks", v.remarks.trim());

    setSubmitting(true);
    try {
      await ReportsApi.create(patientId, formData);
      onUploaded();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Upload report" onClose={onClose}>
      <div>{error && <ErrorBox>{error}</ErrorBox>}</div>
      <form onSubmit={handleSubmit}>
        <Field label="Report file" id={`${uid}-file`}>
          <input id={`${uid}-file`} type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </Field>
        <div className="form-row">
          <Field label="Category" id={`${uid}-category`}>
            <select required {...bind("category")}>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Report date" id={`${uid}-reportDate`}>
            <input type="date" required {...bind("reportDate")} />
          </Field>
        </div>
        <Field label="Report name" id={`${uid}-reportName`}>
          <input type="text" required {...bind("reportName")} />
        </Field>
        <Field label="Remarks" id={`${uid}-remarks`} className="mb-0">
          <textarea {...bind("remarks")} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
