import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'icon'
  size?: 'sm' | 'md'
  active?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  active = false,
  className = '',
  style,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded transition-colors focus:outline-none disabled:opacity-50'
  const variants = {
    default: 'border border-[var(--border-primary)] hover:bg-[var(--bg-hover)]',
    ghost: 'hover:bg-[var(--bg-hover)]',
    icon: 'hover:bg-[var(--bg-hover)] rounded-md'
  }
  const sizes = {
    sm: variant === 'icon' ? '' : 'h-6 px-2 text-xs',
    md: variant === 'icon' ? '' : 'h-8 px-3 text-sm'
  }
  const activeStyle = active ? 'bg-[var(--bg-active)]' : ''

  // Use inline styles for icon buttons to guarantee sizing
  const iconStyle: React.CSSProperties | undefined =
    variant === 'icon'
      ? {
          height: size === 'sm' ? 26 : 32,
          width: size === 'sm' ? 26 : 32,
          minWidth: size === 'sm' ? 26 : 32,
          ...style
        }
      : style

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${activeStyle} ${className}`}
      style={iconStyle}
      {...props}
    >
      {children}
    </button>
  )
}
