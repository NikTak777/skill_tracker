export default function CollapsibleSection({
  buttonLabel,
  children,
  expand = "down",
  isOpen,
  onToggle,
}) {
  const sectionClassName = expand === "right"
    ? "collapsible-section collapsible-section--right"
    : "collapsible-section";

  return (
    <section className={sectionClassName}>
      <button
        className={`collapsible-toggle${isOpen ? " is-open" : ""}`}
        type="button"
        onClick={onToggle}
      >
        {isOpen ? `Скрыть: ${buttonLabel}` : buttonLabel}
      </button>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </section>
  );
}
