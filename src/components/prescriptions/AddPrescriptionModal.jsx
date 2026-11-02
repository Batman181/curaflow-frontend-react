import { useId, useState } from "react";
import { PrescriptionsApi } from "../../api";
import ErrorBox from "../common/ErrorBox.jsx";
import Field from "../common/Field.jsx";
import Modal from "../common/Modal.jsx";

export default function AddPrescriptionModal({ patientId, onClose, onAdded }) {
  const uid = useId();
  const [v, setV] = useState({ medicineName: "", dosage: "", frequency: "", route: "", startDate: "", endDate: "", doctorName: "", instructions: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bind = (key) => ({ id: `${uid}-${key}`, value: v[key], onChange: (e) => setV((s) => ({ ...s, [key]: e.target.value })) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await PrescriptionsApi.create(patientId, {
        medicineName: v.medicineName.trim(),
        dosage: v.dosage.trim(),
        frequency: v.frequency.trim(),
        route: v.route.trim() || undefined,
        startDate: v.startDate,
        endDate: v.endDate || undefined,
        doctorName: v.doctorName.trim() || undefined,
        instructions: v.instructions.trim() || undefined,
      });
      onAdded();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add prescription" onClose={onClose}>
      <div>{error && <ErrorBox>{error}</ErrorBox>}</div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <Field label="Medicine name" id={`${uid}-medicineName`}>
            <input type="text" required {...bind("medicineName")} />
          </Field>
          <Field label="Dosage" id={`${uid}-dosage`}>
            <input type="text" placeholder="10mg" required {...bind("dosage")} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Frequency" id={`${uid}-frequency`}>
            <input type="text" placeholder="Once daily" required {...bind("frequency")} />
          </Field>
          <Field label="Route" id={`${uid}-route`}>
            <input type="text" placeholder="Oral" {...bind("route")} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Start date" id={`${uid}-startDate`}>
            <input type="date" required {...bind("startDate")} />
          </Field>
          <Field label="End date" id={`${uid}-endDate`}>
            <input type="date" {...bind("endDate")} />
          </Field>
        </div>
        <Field label="Doctor" id={`${uid}-doctorName`}>
          <input type="text" {...bind("doctorName")} />
        </Field>
        <Field label="Instructions" id={`${uid}-instructions`} className="mb-0">
          <textarea {...bind("instructions")} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}
