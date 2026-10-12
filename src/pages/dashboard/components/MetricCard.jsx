export default function MetricCard({ label, value, detail, tone, active, onClick }) {
  return (
    <button
      type="button"
      className="metric-card"
      aria-pressed={active}
      onClick={onClick}
    >
      <div className={`metric-mark ${tone}`} aria-hidden="true" />
      <p className="metric-label">{label}</p>
      <div className="metric-bottom">
        <strong className="metric-value">{value}</strong>
        <span className="metric-detail">{detail}</span>
      </div>
    </button>
  )
}
