export default function FormField({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
    </div>
  )
}
