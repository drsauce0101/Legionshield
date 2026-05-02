import React, { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
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
  const [isFullscreen, setIsFullscreen] = useState(false)
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

  const handleEditorChange = (newContent: string) => {
    setTabs(prev => {
      const newTabs = prev.map(t => t.id === activeTabId ? { ...t, content: newContent } : t)
      const newStringified = JSON.stringify(newTabs)
      prevContentRef.current = newStringified
      onChange?.(newStringified)
      return newTabs
    })
  }

  const handleTabTitleChange = (id: string, newTitle: string) => {
    setTabs(prev => {
      const newTabs = prev.map(t => t.id === id ? { ...t, title: newTitle } : t)
      const newStringified = JSON.stringify(newTabs)
      prevContentRef.current = newStringified
      onChange?.(newStringified)
      return newTabs
    })
  }

  const handleAddTab = () => {
    const newId = `tab_${Date.now()}`
    setTabs(prev => {
      const newTabs = [...prev, { id: newId, title: 'Nova Aba', content: '' }]
      const newStringified = JSON.stringify(newTabs)
      prevContentRef.current = newStringified
      onChange?.(newStringified)
      return newTabs
    })
    setActiveTabId(newId)
  }

  const handleRemoveTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTabs(prev => {
      if (prev.length <= 1) return prev // Ensure at least one tab exists
      const newTabs = prev.filter(t => t.id !== id)
      
      // If we removed the active tab, switch to the first available one
      if (activeTabId === id) {
        setActiveTabId(newTabs[0].id)
      }
      
      const newStringified = JSON.stringify(newTabs)
      prevContentRef.current = newStringified
      onChange?.(newStringified)
      return newTabs
    })
  }

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  if (tabs.length === 0) return <div />

  return (
    <div className={`flex flex-col w-full h-full flex-1 min-h-0 bg-dark-900 relative ${isFullscreen ? 'fixed inset-0 w-screen h-screen z-[9999] bg-dark-900' : ''}`}>
      {/* Tab Bar */}
      <div className="flex items-end bg-dark-950 border-b border-white/10 shrink-0 h-11 overflow-x-auto overflow-y-hidden no-scrollbar px-2 gap-1 relative z-10">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 border border-b-0 rounded-t-sm cursor-pointer transition-colors whitespace-nowrap min-w-[120px] max-w-[200px] ${
                isActive 
                  ? 'bg-dark-900 border-white/20 text-white z-20 relative' 
                  : 'bg-dark-950 border-transparent text-dark-400 hover:bg-white/5 hover:text-white z-10'
              }`}
              style={isActive ? { marginBottom: '-1px' } : {}}
            >
              {readOnly ? (
                <span className="text-sm font-semibold truncate flex-1 pointer-events-none select-none">
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
                  onClick={(e) => handleRemoveTab(tab.id, e)}
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
            isFullscreen={isFullscreen}
            onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
          />
        )}
      </div>
    </div>
  )
}
