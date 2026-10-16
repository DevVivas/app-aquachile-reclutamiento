export default function FormField({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={htmlFor} className="text-center text-sm font-semibold leading-5 text-slate-800">
        {label}
      </label>
      {children}
    </div>
  )
}
