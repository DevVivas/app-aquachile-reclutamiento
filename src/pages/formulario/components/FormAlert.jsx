const VARIANTS = {
  success: 'bg-green-50 text-green-800 border border-green-200',
  error: 'bg-red-50 text-red-800 border border-red-200',
}

export default function FormAlert({ type, children }) {
  return (
    <div
      role={type === 'success' ? 'status' : 'alert'}
      className={`mb-6 rounded-lg px-3.5 py-2.5 text-sm font-medium ${VARIANTS[type] ?? VARIANTS.error}`}
    >
      {children}
    </div>
  )
}
