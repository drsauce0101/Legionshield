import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, ListOrdered, Strikethrough, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Heading1, Heading2, Heading3, Maximize2, Minimize2 } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  readOnly?: boolean
}

export function RichTextEditor({ content, onChange, placeholder = 'Escreva aqui...', readOnly = false }: RichTextEditorProps): JSX.Element {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false })
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

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

  return (
    <div className={`flex flex-col w-full border rounded-none transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-dark-900 border-none' 
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

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-none text-dark-400 hover:text-white transition-colors ml-auto"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className={`p-4 flex-1 overflow-y-auto min-h-[300px] ${isFullscreen ? 'max-w-4xl mx-auto w-full' : ''} ${readOnly ? 'p-0 min-h-0' : ''}`}>
        <div className="prose prose-invert prose-p:leading-relaxed max-w-none w-full">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
