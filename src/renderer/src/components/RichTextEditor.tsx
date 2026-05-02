import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import ImageResize from 'tiptap-extension-resize-image'
import Mention from '@tiptap/extension-mention'
import tippy, { delegate } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { getMentionSuggestion } from './mentionSuggestion'
import type { MentionItem } from '../../../types'
import { Bold, Italic, List, ListOrdered, Strikethrough, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Image as ImageIcon, Heading1, Heading2, Heading3, Maximize2, Minimize2 } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  readOnly?: boolean
  mentionItems?: MentionItem[]
  onMentionClick?: (id: string) => void
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Escreva aqui...', 
  readOnly = false, 
  mentionItems = [], 
  onMentionClick,
  isFullscreen: externalIsFullscreen,
  onFullscreenToggle: externalOnFullscreenToggle
}: RichTextEditorProps): JSX.Element {
  const [internalIsFullscreen, setInternalIsFullscreen] = React.useState(false)
  
  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen
  const onToggleFullscreen = externalOnFullscreenToggle || (() => setInternalIsFullscreen(!internalIsFullscreen))
  const containerRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      ImageResize.configure({
        inline: true
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-blue-500/20 text-blue-400 font-semibold px-1 py-0.5 rounded cursor-pointer hover:bg-blue-500/30 transition-colors',
        },
        suggestion: getMentionSuggestion(mentionItems)
      })
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  // Handle tippy hover previews
  React.useEffect(() => {
    if (!containerRef.current || !mentionItems.length) return

    const tippyInstance = delegate(containerRef.current, {
      target: '[data-type="mention"]',
      allowHTML: true,
      interactive: true,
      placement: 'top',
      animation: 'shift-away',
      appendTo: () => document.body,
      onShow(instance) {
        const id = instance.reference.getAttribute('data-id')
        const item = mentionItems.find(i => String(i.id) === String(id))
        if (item) {
          const typeLabels = { player: 'Jogador', session: 'Sessão', campaign: 'Campanha' }
          const avatarHtml = item.type === 'player' && item.avatar_url 
            ? `<div class="w-10 h-10 flex-shrink-0 bg-dark-950 border border-white/20"><img src="${item.avatar_url}" class="w-full h-full object-cover" /></div>`
            : item.type === 'player'
              ? `<div class="w-10 h-10 flex-shrink-0 bg-dark-950 border border-white/20 flex items-center justify-center font-bold text-dark-500 uppercase">${item.label.charAt(0)}</div>`
              : ''
              
          let attributesHtml = ''
          if (item.type === 'player' && item.attributes) {
            try {
              const attrs = JSON.parse(item.attributes)
              if (Array.isArray(attrs) && attrs.length > 0) {
                attributesHtml = `
                  <div class="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                    ${attrs.map(attr => `
                      <div class="bg-dark-950 border border-white/5 p-1.5 rounded flex flex-col items-center justify-center text-center">
                        <span class="text-[9px] text-dark-400 font-bold uppercase tracking-widest leading-tight">${attr.name || '-'}</span>
                        <span class="text-sm font-semibold text-white mt-0.5 leading-none">${attr.value || '0'}${attr.max_value ? ` <span class="text-dark-500 text-xs">/ ${attr.max_value}</span>` : ''}</span>
                      </div>
                    `).join('')}
                  </div>
                `
              }
            } catch {
              // ignore parse errors
            }
          }
              
          instance.setContent(`
            <div class="flex flex-col p-3 bg-dark-900 border border-white/20 shadow-2xl animate-fade-in" style="min-width: 200px; max-width: 320px;">
               <div class="flex items-center gap-3">
                 ${avatarHtml}
                 <div class="flex-1 min-w-0">
                   <div class="text-white font-bold text-sm mb-0.5 truncate">${item.label}</div>
                   <div class="text-dark-400 text-[10px] font-semibold uppercase tracking-wider">${typeLabels[item.type]}</div>
                 </div>
               </div>
               ${attributesHtml}
            </div>
          `)
        } else {
          return false
        }
      }
    })

    return () => tippyInstance.destroy()
  }, [mentionItems])

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const mentionEl = target.closest('[data-type="mention"]')
    if (mentionEl) {
      const id = mentionEl.getAttribute('data-id')
      if (id && onMentionClick) {
        onMentionClick(id)
      }
    }
  }

  if (!editor) return <div className="min-h-[200px]" />

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL do link', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = async () => {
    try {
      const url = await window.api.system.selectImage()
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div 
      ref={containerRef}
      onClick={handleEditorClick}
      className={`flex flex-col w-full h-full flex-1 min-h-0 border rounded-none transition-all duration-300 ${
      isFullscreen
        ? (externalIsFullscreen === undefined ? 'fixed inset-0 z-50 bg-dark-900 border-none' : 'relative z-0') 
        : `relative ${readOnly ? 'border-transparent' : 'border-white/20 bg-dark-900'}`
    }`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-dark-950 flex-wrap shrink-0 sticky top-0 z-10">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-white/10 text-white' : ''}`}
            title="Título 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-white' : ''}`}
            title="Título 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-white/10 text-white' : ''}`}
            title="Título 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('bold') ? 'bg-white/10 text-white' : ''}`}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('italic') ? 'bg-white/10 text-white' : ''}`}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('underline') ? 'bg-white/10 text-white' : ''}`}
            title="Sublinhado"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('strike') ? 'bg-white/10 text-white' : ''}`}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-white/10 text-white' : ''}`}
            title="Alinhar à Esquerda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-white/10 text-white' : ''}`}
            title="Centralizar"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-white/10 text-white' : ''}`}
            title="Alinhar à Direita"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('bulletList') ? 'bg-white/10 text-white' : ''}`}
            title="Lista com Marcadores"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('orderedList') ? 'bg-white/10 text-white' : ''}`}
            title="Lista Numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={toggleLink}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('link') ? 'bg-white/10 text-white' : ''}`}
            title="Inserir Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertImage}
            className="p-1.5 rounded-none text-dark-300 hover:text-white transition-colors"
            title="Inserir Imagem do Computador"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-none text-dark-400 hover:text-white transition-colors ml-auto"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className={`p-4 flex-1 overflow-y-auto min-h-[150px] ${isFullscreen ? 'max-w-7xl mx-auto w-full' : ''} ${readOnly ? 'p-0 min-h-0' : ''}`}>
        <div className="prose prose-invert prose-p:leading-relaxed max-w-none w-full">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
