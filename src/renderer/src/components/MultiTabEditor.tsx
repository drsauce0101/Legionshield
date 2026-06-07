import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { ConfirmModal } from './ConfirmModal'
import type { MentionItem } from '../../../types'

export interface TabData {
  id: string
  title: string
  content: string
}

interface MultiTabEditorProps {
  content: string // JSON array of TabData, or raw HTML for backwards compatibility
  onChange?: (content: string) => void
  placeholder?: string
  readOnly?: boolean
  mentionItems?: MentionItem[]
  onMentionClick?: (id: string) => void
}

export function MultiTabEditor({ content, onChange, placeholder, readOnly, mentionItems, onMentionClick }: MultiTabEditorProps): JSX.Element {
  const [tabs, setTabs] = useState<TabData[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null)
  const [tabToDelete, setTabToDelete] = useState<TabData | null>(null)
  const prevContentRef = useRef<string>('')

  // Parse content safely
  useEffect(() => {
    if (content === prevContentRef.current && tabs.length > 0) return
    prevContentRef.current = content

    let parsedTabs: TabData[] = []
    try {
      if (content && content.trim().startsWith('[')) {
        parsedTabs = JSON.parse(content)
      } else {
        throw new Error('Not JSON')
      }
    } catch {
      parsedTabs = [{
        id: 'default',
        title: 'Principal',
        content: content || ''
      }]
    }

    if (!Array.isArray(parsedTabs) || parsedTabs.length === 0) {
      parsedTabs = [{
        id: 'default',
        title: 'Principal',
        content: ''
      }]
    }

    setTabs(parsedTabs)
    
    // Set active tab if the current one is invalid
    if (!parsedTabs.find(t => t.id === activeTabId)) {
      setActiveTabId(parsedTabs[0].id)
    }
  }, [content, activeTabId, tabs.length])

  const saveTabs = useCallback((newTabs: TabData[]) => {
    const newStringified = JSON.stringify(newTabs)
    prevContentRef.current = newStringified
    onChange?.(newStringified)
  }, [onChange])

  const handleEditorChange = (newContent: string) => {
    setTabs(prev => {
      const newTabs = prev.map(t => t.id === activeTabId ? { ...t, content: newContent } : t)
      saveTabs(newTabs)
      return newTabs
    })
  }

  const handleTabTitleChange = (id: string, newTitle: string) => {
    setTabs(prev => {
      const newTabs = prev.map(t => t.id === id ? { ...t, title: newTitle } : t)
      saveTabs(newTabs)
      return newTabs
    })
  }

  const handleAddTab = () => {
    const newId = `tab_${Date.now()}`
    setTabs(prev => {
      const newTabs = [...prev, { id: newId, title: 'Nova Aba', content: '' }]
      saveTabs(newTabs)
      return newTabs
    })
    setActiveTabId(newId)
  }

  const handleRemoveTabClick = (tab: TabData, e: React.MouseEvent) => {
    e.stopPropagation()
    // If tab is empty, just remove it without confirmation
    if (!tab.content || tab.content === '<p></p>' || tab.content === '[]') {
      confirmRemoveTab(tab.id)
      return
    }
    setTabToDelete(tab)
  }

  const confirmRemoveTab = (id: string) => {
    setTabs(prev => {
      if (prev.length <= 1) return prev 
      const newTabs = prev.filter(t => t.id !== id)
      if (activeTabId === id) {
        setActiveTabId(newTabs[0].id)
      }
      saveTabs(newTabs)
      return newTabs
    })
    setTabToDelete(null)
  }

  // ─── Drag and Drop Handlers ──────────────────────────────────────────────────
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (readOnly) return
    setDraggedTabId(id)
    e.dataTransfer.effectAllowed = 'move'
    // Set an empty image to avoid default ghosting if we want custom, 
    // but here we'll use default ghosting for simplicity.
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (readOnly) return
    e.preventDefault()
    if (draggedTabId === id) return
    setDragOverTabId(id)
  }

  const handleDragEnd = () => {
    setDraggedTabId(null)
    setDragOverTabId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (readOnly || !draggedTabId || draggedTabId === targetId) return
    e.preventDefault()

    setTabs(prev => {
      const dragIndex = prev.findIndex(t => t.id === draggedTabId)
      const hoverIndex = prev.findIndex(t => t.id === targetId)
      
      const newTabs = [...prev]
      const [draggedItem] = newTabs.splice(dragIndex, 1)
      newTabs.splice(hoverIndex, 0, draggedItem)
      
      saveTabs(newTabs)
      return newTabs
    })
    
    setDraggedTabId(null)
    setDragOverTabId(null)
  }

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  if (tabs.length === 0) return <div />

  return (
    <>
      <div className="flex flex-col w-full h-full flex-1 min-h-0 bg-dark-900/10 backdrop-blur-[1px] relative">
      {/* Tab Bar */}
      <div className="flex items-end bg-dark-950/20 border-b border-white/10 shrink-0 h-11 overflow-x-auto overflow-y-hidden no-scrollbar px-2 gap-1 relative z-10">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const isBeingDragged = tab.id === draggedTabId
          const isDragOver = tab.id === dragOverTabId

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, tab.id)}
              className={`group flex items-center gap-2 px-3 py-2 border border-b-0 rounded-t-sm cursor-pointer transition-all whitespace-nowrap min-w-[120px] max-w-[200px] select-none ${
                isActive 
                  ? 'bg-dark-900 border-white/20 text-white z-20 relative' 
                  : 'bg-dark-950 border-transparent text-dark-400 hover:bg-white/5 hover:text-white z-10'
              } ${isBeingDragged ? 'opacity-30' : 'opacity-100'} ${isDragOver ? 'border-r-white/40 translate-x-1' : ''}`}
              style={isActive ? { marginBottom: '-1px' } : {}}
            >
              {!readOnly && (
                <GripVertical className="w-3 h-3 text-dark-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing" />
              )}
              
              {readOnly ? (
                <span className="text-sm font-semibold truncate flex-1 pointer-events-none">
                  {tab.title}
                </span>
              ) : (
                <input
                  type="text"
                  value={tab.title}
                  onChange={(e) => handleTabTitleChange(tab.id, e.target.value)}
                  className="bg-transparent border-none text-sm font-semibold outline-none w-full truncate flex-1 cursor-text"
                  placeholder="Nome da Aba"
                  onClick={(e) => {
                    if (isActive) e.stopPropagation()
                  }}
                />
              )}
              
              {!readOnly && tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveTabClick(tab, e)}
                  className={`p-0.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0 ${isActive ? 'text-dark-300 hover:text-white' : 'opacity-0 group-hover:opacity-100'}`}
                  title="Fechar aba"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}
        
        {!readOnly && (
          <button
            type="button"
            onClick={handleAddTab}
            className="p-2 mb-1 ml-1 text-dark-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Nova Aba"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex flex-col min-h-0 relative z-0">
        {activeTab && (
          <RichTextEditor
            key={activeTab.id}
            content={activeTab.content}
            onChange={handleEditorChange}
            placeholder={placeholder}
            readOnly={readOnly}
            mentionItems={mentionItems}
            onMentionClick={onMentionClick}
          />
        )}
      </div>

    </div>

    <ConfirmModal 
        isOpen={!!tabToDelete}
        title="Excluir Aba"
        message={`Tem certeza que deseja excluir a aba "${tabToDelete?.title}"? Todo o conteúdo desta aba será perdido.`}
        confirmText="Excluir"
        onConfirm={() => tabToDelete && confirmRemoveTab(tabToDelete.id)}
        onCancel={() => setTabToDelete(null)}
        isDanger={true}
      />
    </>
  )
}
