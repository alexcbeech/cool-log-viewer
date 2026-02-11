import React from 'react'
import { Button } from './Button'

interface ToggleProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md'
}

export const Toggle: React.FC<ToggleProps> = ({
  pressed,
  onPressedChange,
  title,
  children,
  size = 'sm'
}) => {
  return (
    <Button
      variant="icon"
      size={size}
      active={pressed}
      title={title}
      onClick={() => onPressedChange(!pressed)}
    >
      {children}
    </Button>
  )
}
