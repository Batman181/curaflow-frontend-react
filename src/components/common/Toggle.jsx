export default function Toggle({ on, onChange, ariaLabel, id }) {
  return (
    <button
      type="button"
      id={id}
      className={`toggle${on ? " is-on" : ""}`}
      aria-pressed={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
    />
  );
}
