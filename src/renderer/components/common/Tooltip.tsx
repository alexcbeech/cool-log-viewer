import React, { useState, useRef, useCallback, useLayoutEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [adjustedX, setAdjustedX] = useState<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const show = useCallback((): void => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 4,
        })
        setAdjustedX(null)
      }
      setVisible(true)
    }, 500)
  }, [])

  const hide = useCallback((): void => {
    clearTimeout(timeoutRef.current)
    setVisible(false)
  }, [])

  // After rendering, check if tooltip overflows the viewport and adjust
  useLayoutEffect(() => {
    if (visible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      const padding = 8
      let newX = position.x

      if (rect.left < padding) {
        // Overflowing left edge — shift right
        newX = position.x + (padding - rect.left)
      } else if (rect.right > window.innerWidth - padding) {
        // Overflowing right edge — shift left
        newX = position.x - (rect.right - window.innerWidth + padding)
      }

      if (newX !== position.x) {
        setAdjustedX(newX)
      }
    }
  }, [visible, position])

  return (
    <div ref={triggerRef} style={{ display: 'inline-flex' }} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              left: adjustedX ?? position.x,
              top: position.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999,
              whiteSpace: 'nowrap',
              borderRadius: 4,
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              padding: '4px 8px',
              fontSize: 12,
              color: 'var(--text-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  )
}
