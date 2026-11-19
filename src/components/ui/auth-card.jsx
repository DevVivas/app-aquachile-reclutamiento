import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils.js'

// Pantalla fija (sin scroll): centra la tarjeta y la deja siempre dentro del viewport.
export function AuthScreen({ children }) {
  return (
    <main className="flex h-svh items-center justify-center overflow-y-auto bg-canvas px-4 py-4">{children}</main>
  )
}

// Tarjeta blanca con banner de paisaje y entrada escalonada (fade-up + stagger).
export function AuthCard({ className, children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.06 } } }}
      className={cn(
        'w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(17_28_54/6%),0_12px_32px_-12px_rgb(17_28_54/14%)]',
        className,
      )}
    >
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }}
        className="relative h-[clamp(5rem,16svh,10rem)]"
      >
        <img src="/paisaje.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 -bottom-px top-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
      </motion.div>
      <div className="relative -mt-14 space-y-3 px-7 pb-6 sm:px-8">{children}</div>
    </motion.div>
  )
}

export function Stagger({ className, children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
      }}
    >
      {children}
    </motion.div>
  )
}

export function AuthLogo() {
  return <img src="/aquachile-logo.webp" alt="AquaChile" className="mx-auto h-24 w-auto" />
}
