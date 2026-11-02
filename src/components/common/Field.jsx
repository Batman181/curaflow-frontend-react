/** A labelled form field: <Field label id hint>{input}</Field> */
export default function Field({ label, id, hint, className = "", children }) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
