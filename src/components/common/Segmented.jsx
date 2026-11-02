/** Pill-style single-choice control. options: [{ value, label }] */
export default function Segmented({ options, value, onChange, style, id, ariaLabel }) {
  return (
    <div className="segmented" style={style} id={id} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? "is-active" : ""}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
