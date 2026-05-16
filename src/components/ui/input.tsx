import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Optional prefix element rendered inside the input (e.g. "@" for username fields) */
  prefix?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, ...props }, ref) => {
    const base =
      'bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors w-full'

    if (prefix) {
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
            {prefix}
          </span>
          <input
            ref={ref}
            className={cn(base, 'pl-7', className)}
            {...props}
          />
        </div>
      )
    }

    return (
      <input
        ref={ref}
        className={cn(base, className)}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
