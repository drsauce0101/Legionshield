import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Strikethrough } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  readOnly?: boolean
}

export function RichTextEditor({ content, onChange, placeholder = 'Escreva aqui...', readOnly = false }: RichTextEditorProps): JSX.Element {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder })
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  if (!editor) return <div className="min-h-[200px]" />

  return (
    <div className={`flex flex-col w-full border ${readOnly ? 'border-transparent' : 'border-white/20 bg-dark-900'} rounded-none`}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-dark-950 flex-wrap">
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
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-none text-dark-300 hover:text-white transition-colors ${editor.isActive('strike') ? 'bg-white/10 text-white' : ''}`}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
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
        </div>
      )}

      {/* Editor Content */}
      <div className={`p-4 prose prose-invert prose-p:leading-relaxed max-w-none ${readOnly ? 'p-0' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
