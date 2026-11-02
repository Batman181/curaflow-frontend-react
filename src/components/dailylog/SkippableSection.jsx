/**
 * A card with a "Skip today" control. Skipping dims the section AND says, in
 * words, that the other sections still save — testers weren't sure otherwise.
 */
export default function SkippableSection({ id, icon, title, skipped, onToggle, children, footer }) {
  return (
    <div className={`card section-card${skipped ? " is-skipped" : ""}`} id={id}>
      <div className="section-card-header">
        <div className="section-card-title">
          {icon} {title}
        </div>
        <button type="button" className={`skip-link${skipped ? " is-active" : ""}`} aria-pressed={skipped} onClick={onToggle}>
          {skipped ? "Undo skip" : "Skip today"}
        </button>
      </div>
      {skipped && (
        <div className="skip-confirm-banner">
          <span>
            ⚠ {title} skipped for today — your other sections will still save normally.
          </span>
          <button type="button" className="btn-ghost btn-sm" onClick={onToggle}>
            Click to undo
          </button>
        </div>
      )}
      <div className="section-card-body">{children}</div>
      {footer}
    </div>
  );
}
