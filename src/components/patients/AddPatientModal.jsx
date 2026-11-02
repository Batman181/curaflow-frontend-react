import { useId, useState } from "react";
import { PatientsApi } from "../../api";
import Field from "../common/Field.jsx";
import ErrorBox from "../common/ErrorBox.jsx";
import Modal from "../common/Modal.jsx";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AddPatientModal({ onClose, onAdded }) {
  const uid = useId();
  const [v, setV] = useState({ fullname: "", dateOfBirth: "", gender: "", bloodGroup: "", contactNumber: "", allergies: "", notes: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bind = (key) => ({ id: `${uid}-${key}`, value: v[key], onChange: (e) => setV((s) => ({ ...s, [key]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await PatientsApi.create({
        fullname: v.fullname.trim(),
        dateOfBirth: v.dateOfBirth,
        gender: v.gender,
        bloodGroup: v.bloodGroup || undefined,
        contactNumber: v.contactNumber.trim() || undefined,
        allergies: v.allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        notes: v.notes.trim(),
      });
      onAdded();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add patient" onClose={onClose}>
      <div>{error && <ErrorBox>{error}</ErrorBox>}</div>
      <form onSubmit={handleSubmit}>
        <Field label="Full name" id={`${uid}-fullname`}>
          <input type="text" required {...bind("fullname")} />
        </Field>
        <div className="form-row">
          <Field label="Date of birth" id={`${uid}-dateOfBirth`}>
            <input type="date" required {...bind("dateOfBirth")} />
          </Field>
          <Field label="Gender" id={`${uid}-gender`}>
            <select required {...bind("gender")}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Blood group" id={`${uid}-bloodGroup`}>
            <select {...bind("bloodGroup")}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Contact number" id={`${uid}-contactNumber`}>
            <input type="tel" {...bind("contactNumber")} />
          </Field>
        </div>
        <Field label="Allergies (comma separated)" id={`${uid}-allergies`}>
          <input type="text" placeholder="Dust, Penicillin" {...bind("allergies")} />
        </Field>
        <Field label="Notes" id={`${uid}-notes`} className="mb-0">
          <textarea {...bind("notes")} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Adding…" : "Add patient"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
