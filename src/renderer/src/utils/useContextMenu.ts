import { useState, useCallback } from 'react'
import { ContextMenuItem } from '../components/ContextMenu'

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
  visible: boolean
}

export function useContextMenu() {
  const [state, setState] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    items: [],
    visible: false
  })

  const showContextMenu = useCallback((e: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault()
    setState({
      x: e.clientX,
      y: e.clientY,
      items,
      visible: true
    })
  }, [])

  const hideContextMenu = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }))
  }, [])

  return {
    contextMenuProps: {
      x: state.x,
      y: state.y,
      items: state.items,
      visible: state.visible,
      onClose: hideContextMenu
    },
    showContextMenu,
    hideContextMenu
  }
}
