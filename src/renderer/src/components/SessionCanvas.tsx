import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import ReactFlow, { 
  addEdge, 
  Background, 
  MiniMap, 
  Connection, 
  Edge, 
  Node, 
  applyNodeChanges, 
  applyEdgeChanges, 
  NodeChange, 
  EdgeChange,
  Handle,
  Position,
  NodeProps,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Trash2, Maximize2, Save, MousePointer2, Image as ImageIcon } from 'lucide-react'
import { audioService } from '../utils/audio'
import { useDebounce } from '../utils/useDebounce'

// ─── Custom Note Node ─────────────────────────────────────────────────────────
const NoteNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`group relative min-w-[200px] max-w-[300px] p-4 bg-dark-950 border-2 transition-all shadow-2xl ${selected ? 'border-white scale-[1.02]' : 'border-white/10 hover:border-white/30'}`}>
      <Handle type="target" position={Position.Top} className="!bg-white !w-2 !h-2 !border-none" />
      
      <div className="flex flex-col gap-2">
        <textarea
          defaultValue={data.label}
          onChange={(e) => data.onChange(e.target.value)}
          placeholder="Digite algo..."
          className="w-full bg-transparent text-white text-sm font-medium focus:outline-none resize-none custom-scrollbar"
          rows={3}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white !w-2 !h-2 !border-none" />
      
      {/* Selection Border Glow */}
      {selected && (
        <div className="absolute -inset-1 border border-white/20 blur-sm pointer-events-none" />
      )}
    </div>
  )
}
// ─── Custom Image Node ────────────────────────────────────────────────────────
const ImageNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`group relative transition-all shadow-2xl ${selected ? 'ring-2 ring-white scale-[1.02]' : 'ring-1 ring-white/10 hover:ring-white/30'}`}>
      <Handle type="target" position={Position.Top} className="!bg-white !w-2 !h-2 !border-none" />
      
      <div className="overflow-hidden bg-dark-950">
        {data.url ? (
          <img 
            src={data.url} 
            alt="Canvas" 
            className="max-w-[400px] max-h-[400px] object-contain block pointer-events-none" 
          />
        ) : (
          <div className="w-[200px] h-[150px] flex items-center justify-center text-dark-500">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-white !w-2 !h-2 !border-none" />
      
      {/* Selection Border Glow */}
      {selected && (
        <div className="absolute -inset-1 border border-white/20 blur-sm pointer-events-none" />
      )}
    </div>
  )
}

const nodeTypes = {
  note: NoteNode,
  image: ImageNode,
}

// ─── Component ────────────────────────────────────────────────────────────────
interface SessionCanvasProps {
  data: { nodes: Node[]; edges: Edge[] }
  onChange: (data: { nodes: Node[]; edges: Edge[] }) => void
}

export function SessionCanvas({ data, onChange }: SessionCanvasProps): JSX.Element {
  const [nodes, setNodes] = useState<Node[]>(data.nodes || [])
  const [edges, setEdges] = useState<Edge[]>(data.edges || [])
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds)
        return updated
      })
    },
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds)
        return updated
      })
    },
    []
  )

  const onConnect = useCallback(
    (params: Connection) => {
      audioService.playClick()
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#fff', strokeWidth: 2 } }, eds))
    },
    []
  )

  const addNote = useCallback(() => {
    audioService.playClick()
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'note',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: '',
        onChange: (newVal: string) => {
          setNodes((nds) => nds.map((n) => {
            if (n.id === newNode.id) return { ...n, data: { ...n.data, label: newVal } }
            return n
          }))
        }
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [])

  const addImage = useCallback(async () => {
    try {
      const url = await window.api.system.selectImage()
      if (url) {
        audioService.playClick()
        const newNode: Node = {
          id: `node_${Date.now()}`,
          type: 'image',
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: { url },
        }
        setNodes((nds) => [...nds, newNode])
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  const deleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected)
    const selectedEdges = edges.filter(e => e.selected)
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      audioService.playPop()
      setNodes((nds) => nds.filter((node) => !node.selected))
      setEdges((eds) => eds.filter((edge) => !edge.selected))
    }
  }, [nodes, edges])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        audioService.playClick()
        const imagePath = (file as any).path ? `file://${(file as any).path}`.replace(/\\/g, '/') : URL.createObjectURL(file)
        
        let position = { x: Math.random() * 400, y: Math.random() * 400 }
        
        if (reactFlowInstance) {
           const reactFlowBounds = event.currentTarget.getBoundingClientRect()
           position = reactFlowInstance.project({
             x: event.clientX - reactFlowBounds.left,
             y: event.clientY - reactFlowBounds.top,
           })
        }

        const newNode: Node = {
          id: `node_${Date.now()}`,
          type: 'image',
          position,
          data: { url: imagePath },
        }
        setNodes((nds) => [...nds, newNode])
      }
    }
  }, [reactFlowInstance, setNodes])

  const isInitialMount = useRef(true)

  // Auto-save logic
  const debouncedNodes = useDebounce(nodes, 1000)
  const debouncedEdges = useDebounce(edges, 1000)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    onChange({ nodes: debouncedNodes, edges: debouncedEdges })
  }, [debouncedNodes, debouncedEdges, onChange])

  // Map initial nodes to include onChange
  useEffect(() => {
    setNodes((nds) => nds.map(n => {
      if (n.type !== 'note') return n
      return {
        ...n,
        data: {
          ...n.data,
          onChange: (newVal: string) => {
            setNodes((currentNodes) => currentNodes.map((node) => {
              if (node.id === n.id) return { ...node, data: { ...node.data, label: newVal } }
              return node
            }))
          }
        }
      }
    }))
  }, [])

  return (
    <div className="flex-1 h-full min-h-[500px] border border-white/5 bg-black/20 relative group">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        style={{ background: 'transparent' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} />

        <MiniMap 
          nodeColor={() => '#fff'} 
          maskColor="rgba(0, 0, 0, 0.6)" 
          className="!bg-dark-950 !border-white/10"
        />
        
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={addNote}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-dark-100 transition-all shadow-xl"
          >
            <Plus className="w-4 h-4" />
            Nova Nota
          </button>
          <button
            onClick={addImage}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-dark-700 transition-all shadow-xl"
          >
            <ImageIcon className="w-4 h-4" />
            Inserir Imagem
          </button>
          <button
            onClick={deleteSelected}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Selecionado
          </button>
        </Panel>

        <Panel position="bottom-left">
           <div className="bg-dark-950/80 backdrop-blur-md border border-white/10 p-3 flex flex-col gap-1">
             <div className="flex items-center gap-2 text-dark-400">
                <MousePointer2 className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Arrastar para mover</span>
             </div>
             <div className="flex items-center gap-2 text-dark-400">
                <Plus className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Conectar pontos para linkar</span>
             </div>
           </div>
        </Panel>
      </ReactFlow>

      {/* Grid Overlay for aesthetic */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-50" />
    </div>
  )
}
