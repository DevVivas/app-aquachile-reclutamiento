export default function StatusTab({ label, count, active, onClick }) {
  return (
    <button type="button" className="status-tab" aria-pressed={active} onClick={onClick}>
      {label}
      <span className="status-tab-count">{count}</span>
    </button>
  )
}
