const VARIANTS = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
}

export default function FormAlert({ type, children }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3.5 py-2.5 text-sm ${VARIANTS[type] ?? VARIANTS.error}`}
    >
      {children}
    </div>
  )
}
