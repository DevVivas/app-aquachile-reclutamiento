export default function FormField({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={htmlFor} className="text-[15px] font-medium leading-5 text-white">
        {label}
      </label>
      {children}
    </div>
  )
}
