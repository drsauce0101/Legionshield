import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { MentionItem } from '../../../types'
import { Users, BookOpen, Shield } from 'lucide-react'

export interface MentionListProps {
  items: MentionItem[]
  command: (props: { id: string; label: string; [key: string]: any }) => void
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => setSelectedIndex(0), [props.items])

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({ id: String(item.id), label: item.label, type: item.type })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }
      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }
      if (event.key === 'Enter') {
        enterHandler()
        return true
      }
      return false
    }
  }))

  if (!props.items.length) {
    return null
  }

  return (
    <div className="bg-dark-900 border border-white/20 shadow-xl overflow-hidden min-w-[200px] flex flex-col py-1">
      {props.items.map((item, index) => {
        const isSelected = index === selectedIndex
        return (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors w-full ${
              isSelected ? 'bg-white/10 text-white' : 'text-dark-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.type === 'player' && (
              <div className="w-5 h-5 flex-shrink-0 bg-dark-950 border border-white/10 flex items-center justify-center overflow-hidden">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
              </div>
            )}
            {item.type === 'session' && <BookOpen className="w-4 h-4 shrink-0 opacity-70" />}
            {item.type === 'campaign' && <Shield className="w-4 h-4 shrink-0 opacity-70" />}
            
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
})

MentionList.displayName = 'MentionList'
