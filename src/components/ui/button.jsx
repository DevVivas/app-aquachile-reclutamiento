import { cn } from '@/lib/utils.js'

const VARIANTS = {
  default: 'bg-brand text-white hover:bg-brand/90',
  outline: 'border border-line bg-white text-ink hover:bg-canvas',
}

export function Button({ className, variant = 'default', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium',
        'transition-[transform,background-color] duration-150 ease-out-strong active:scale-[0.97]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
