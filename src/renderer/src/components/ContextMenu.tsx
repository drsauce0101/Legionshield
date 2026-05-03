import React, { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleScroll = () => onClose()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Adjust position if menu goes off screen
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - (items.length * 40))

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] min-w-[180px] bg-dark-900 border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
      style={{ top: adjustedY, left: adjustedX }}
    >
      <div className="py-1">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.onClick()
              onClose()
            }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
              item.variant === 'danger'
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : 'text-dark-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
