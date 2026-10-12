const VARIANTS = {
  success: 'bg-green-50 text-green-800 border border-green-200',
  error: 'bg-red-50 text-red-800 border border-red-200',
}

export default function FormAlert({ type, children }) {
  return (
    <div className={`p-3 rounded-lg mb-5 text-sm font-medium ${VARIANTS[type] ?? VARIANTS.error}`}>
      {children}
    </div>
  )
}
