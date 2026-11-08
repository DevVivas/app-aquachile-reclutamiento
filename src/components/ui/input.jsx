import { cn } from '@/lib/utils.js'

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/10 disabled:opacity-60 sm:text-sm'

export function Input({ className, ...props }) {
  return <input className={cn(INPUT_CLASS, className)} {...props} />
}

export function Select({ className, ...props }) {
  return <select className={cn(INPUT_CLASS, 'pr-8', className)} {...props} />
}
