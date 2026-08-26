import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`h-7 rounded border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none ${className}`}
      {...props}
    />
  )
)

Input.displayName = 'Input'
