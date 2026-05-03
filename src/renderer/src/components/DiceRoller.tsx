import { useEffect, useRef, useState, useCallback } from 'react'
import { Dices, X, RotateCcw, Play, History, Trash2 } from 'lucide-react'
import { audioService } from '../utils/audio'

// ─── Global Dice Event Bus ────────────────────────────────────────────────────
type DiceEventHandler = (notation: string, onResult?: (results: number[]) => void) => void
const diceListeners: Set<DiceEventHandler> = new Set()

export function requestDiceRoll(notation: string, onResult?: (results: number[]) => void): void {
  diceListeners.forEach((fn) => fn(notation, onResult))
}

// ─── Die SVG Icons ────────────────────────────────────────────────────────────
const DieIcon = ({ type, className = "w-5 h-5" }: { type: string, className?: string }) => {
  switch (type) {
    case 'd4': return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L2 20h20L12 3z" /></svg>
    case 'd6': return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>
    case 'd8': return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L4 12l8 10 8-10-8-10z" /><path d="M4 12h16M12 2v20" strokeOpacity="0.3" /></svg>
    case 'd10': return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L4 10l8 12 8-12-8-8z" /><path d="M12 2v20M4 10h16" strokeOpacity="0.3" /></svg>
    case 'd12': return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v12l-8 4-8-4V6l8-4z" /><path d="M12 2v20M4 6l16 12M20 6L4 18" strokeOpacity="0.2" /></svg>
    case 'd20': return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l9 7v6l-9 7-9-7V9l9-7z" /><path d="M12 2v20M3 9h18M3 15h18" strokeOpacity="0.2" /></svg>
    case 'd100': return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L4 10l8 12 8-12-8-8z" />
        <text x="12" y="14" fontSize="6" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="bold">%</text>
      </svg>
    )
    default: return null
  }
}

interface RollResult { id: string; notation: string; pool: string[]; values: { type: string; value: number }[]; total: number; label?: string; timestamp: number }

function RollingOverlay({ pool }: { pool: string[] }) {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 animate-dice-roll">
        <div className="flex flex-wrap justify-center gap-4 max-w-2xl px-10">
          {pool.map((type, i) => (
            <div key={i} className="p-6 bg-dark-900 border-2 border-white/20 shadow-2xl">
              <DieIcon type={type} className="w-16 h-16 text-white" />
            </div>
          ))}
        </div>
        <span className="text-white font-bold tracking-[0.4em] uppercase text-lg animate-pulse">Sorteando...</span>
      </div>
    </div>
  )
}

function ResultOverlay({ result, onDismiss }: { result: RollResult; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[3001] flex items-center justify-center bg-black/70 backdrop-blur-xl animate-fade-in" onClick={onDismiss}>
      <div className="bg-dark-900 border border-white/20 p-12 shadow-2xl flex flex-col items-center gap-4 animate-dice-result min-w-[400px] max-w-4xl">
        {result.label && <span className="text-sm font-bold text-dark-400 uppercase tracking-[0.2em] mb-2">{result.label}</span>}
        
        <div className="flex flex-wrap items-center justify-center gap-6 py-4">
          {result.values.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group">
               <DieIcon type={v.type} className="w-6 h-6 text-dark-500 group-hover:text-white transition-colors" />
               <span className="text-6xl font-display font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">{v.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 w-full flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 text-dark-500 font-mono text-sm tracking-wider">
            <span>{result.notation}</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-2xl text-dark-400 uppercase tracking-[0.3em]">Total</span>
             <span className="text-7xl font-display font-black text-white leading-none">{result.total}</span>
          </div>
        </div>
        
        <span className="text-[10px] text-dark-600 mt-10 uppercase tracking-[0.2em] animate-pulse">clique em qualquer lugar para fechar</span>
      </div>
    </div>
  )
}

export function DiceRoller(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [pool, setPool] = useState<string[]>([])
  const [rollingPool, setRollingPool] = useState<string[] | null>(null)
  const [rollResult, setRollResult] = useState<RollResult | null>(null)
  const [history, setHistory] = useState<RollResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const pendingCallbackRef = useRef<((results: number[]) => void) | null>(null)

  const parseNotation = (notation: string) => {
    // Basic notation parser: 1d20, 2d6, 1d10+1d8, etc.
    const parts = notation.toLowerCase().split('+')
    const dice: string[] = []
    parts.forEach(part => {
      const match = part.trim().match(/(\d+)d(\d+)/)
      if (match) {
        const count = parseInt(match[1])
        const sides = match[2]
        for (let i = 0; i < count; i++) dice.push(`d${sides}`)
      }
    })
    return dice
  }

  const performRoll = useCallback(async (dicePool: string[], label?: string, onResult?: (results: number[]) => void) => {
    if (dicePool.length === 0) return
    
    setRollingPool(dicePool)
    audioService.playPop()

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 1000))

    const rollValues: { type: string; value: number }[] = []
    dicePool.forEach(type => {
      const sides = parseInt(type.replace('d', ''))
      rollValues.push({ type, value: Math.floor(Math.random() * sides) + 1 })
    })

    const total = rollValues.reduce((a, b) => a + b.value, 0)
    
    // Group notation: 2d20 + 1d6
    const counts: Record<string, number> = {}
    dicePool.forEach(d => counts[d] = (counts[d] || 0) + 1)
    const notation = Object.entries(counts).map(([type, count]) => `${count}${type}`).join(' + ')

    const newResult: RollResult = {
      id: Math.random().toString(36).substr(2, 9),
      notation,
      pool: dicePool,
      values: rollValues,
      total,
      label,
      timestamp: Date.now()
    }
    
    setRollResult(newResult)
    setHistory(prev => [newResult, ...prev].slice(0, 50)) // Keep last 50
    setRollingPool(null)
    setPool([])

    const resultValues = rollValues.map(v => v.value)
    if (onResult) onResult(resultValues)
    if (pendingCallbackRef.current) {
      pendingCallbackRef.current(resultValues)
      pendingCallbackRef.current = null
    }
  }, [])

  const handleExternalRoll = useCallback((notation: string, onResult?: (results: number[]) => void) => {
    if (onResult) pendingCallbackRef.current = onResult
    const dicePool = parseNotation(notation)
    performRoll(dicePool)
  }, [performRoll])

  useEffect(() => {
    diceListeners.add(handleExternalRoll)
    return () => { diceListeners.delete(handleExternalRoll) }
  }, [handleExternalRoll])

  const addToPool = (type: string) => {
    audioService.playClick()
    setPool(prev => [...prev, type])
  }

  const clearPool = () => {
    audioService.playClick()
    setPool([])
  }

  const clearHistory = () => {
    audioService.playClick()
    setHistory([])
  }

  return (
    <>
      {rollingPool && <RollingOverlay pool={rollingPool} />}
      {rollResult && <ResultOverlay result={rollResult} onDismiss={() => setRollResult(null)} />}
      
      <div className="fixed bottom-6 right-6 z-[2001] flex flex-col items-end gap-3 no-drag">
        {isOpen && (
          <div className="bg-dark-900/95 backdrop-blur-md border border-white/10 p-4 shadow-2xl flex flex-col gap-4 animate-slide-up w-72">
            
            {/* Pool Display */}
            {pool.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">Sua Mão</span>
                  <button onClick={clearPool} className="text-dark-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="bg-dark-950/50 border border-white/5 p-2 flex flex-wrap gap-1.5 min-h-[40px]">
                  {pool.map((die, i) => (
                    <div key={i} className="animate-scale-in">
                      <DieIcon type={die} className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => performRoll(pool)}
                  className="w-full bg-white text-black py-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-dark-100 transition-colors active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" /> Rolar Agora
                </button>
              </div>
            ) : (
              <div className="text-center py-2 border-b border-white/5">
                <span className="text-[9px] text-dark-600 uppercase tracking-widest">Selecione os dados para combinar</span>
              </div>
            )}

            {/* Dice Grid */}
            <div className="grid grid-cols-4 gap-2">
              {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((die) => (
                <button 
                  key={die} 
                  onClick={() => addToPool(die)} 
                  className="group relative w-full aspect-square flex items-center justify-center bg-dark-950 border border-white/5 hover:border-white/20 transition-all active:scale-90"
                >
                  <DieIcon type={die} className="w-5 h-5 text-dark-300 group-hover:text-white transition-colors" />
                  <span className="absolute bottom-1 right-1 text-[8px] text-dark-600 group-hover:text-dark-400">{die.toUpperCase()}</span>
                </button>
              ))}
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`w-full aspect-square flex items-center justify-center transition-all active:scale-90 ${showHistory ? 'bg-white text-black' : 'bg-dark-950 border border-white/5 text-dark-300 hover:text-white'}`}
              >
                <History className="w-5 h-5" />
              </button>
            </div>

            {/* History Panel */}
            {showHistory && (
              <div className="border-t border-white/10 pt-3 flex flex-col gap-2 max-h-60 overflow-hidden">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-dark-500 uppercase tracking-widest">Histórico</span>
                  <button onClick={clearHistory} className="text-[9px] text-dark-600 hover:text-red-400 uppercase font-bold transition-colors">Limpar</button>
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto pr-1">
                  {history.length > 0 ? history.map((item) => (
                    <div key={item.id} className="bg-white/5 p-2 border-l-2 border-white/10 hover:border-white/40 transition-colors group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-dark-500 font-mono">{item.notation}</span>
                        <span className="text-[8px] text-dark-600">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {item.values.slice(0, 5).map((v, i) => (
                            <span key={i} className="text-[10px] text-dark-300">{v.value}</span>
                          ))}
                          {item.values.length > 5 && <span className="text-[10px] text-dark-500">...</span>}
                        </div>
                        <span className="text-xs font-bold text-white group-hover:scale-110 transition-transform">{item.total}</span>
                      </div>
                    </div>
                  )) : (
                    <span className="text-[10px] text-dark-600 text-center py-4 italic">Nenhuma rolagem ainda</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={() => { audioService.playClick(); setIsOpen(!isOpen); if (!isOpen) setShowHistory(false) }} 
          className={`w-14 h-14 flex items-center justify-center shadow-2xl transition-all active:scale-95 border ${isOpen ? 'bg-white text-black border-white' : 'bg-dark-900 border-white/20 text-white hover:border-white/40'}`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Dices className="w-6 h-6" />}
        </button>
      </div>
    </>
  )
}
