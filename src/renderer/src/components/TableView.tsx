import React, { useState } from 'react'
import { Dices, X } from 'lucide-react'
import { audioService } from '../utils/audio'
import { requestDiceRoll } from './DiceRoller'

interface TableViewProps {
  table: any
}

export function TableView({ table }: TableViewProps) {
  const [tableResult, setTableResult] = useState<{ range: string; content: string } | null>(null)
  const [isRolling, setIsRolling] = useState(false)

  const handleRollTable = () => {
    if (!table || !table.content) return
    let rows: any[] = []
    try { rows = JSON.parse(table.content) } catch { return }
    if (rows.length === 0) return

    setIsRolling(true)
    setTableResult(null)
    audioService.playPop()

    // Select the most appropriate die based on number of rows
    const count = rows.length
    let notation = '1d20'
    if (count <= 4) notation = '1d4'
    else if (count <= 6) notation = '1d6'
    else if (count <= 8) notation = '1d8'
    else if (count <= 10) notation = '1d10'
    else if (count <= 12) notation = '1d12'
    else if (count <= 20) notation = '1d20'
    else notation = '1d100'

    requestDiceRoll(notation, (values) => {
      const dieValue = values[0] ?? 1
      
      const foundRow = rows.find(row => {
        const rangeStr = String(row.range)
        if (rangeStr.includes('-')) {
          const parts = rangeStr.split('-')
          const min = parseInt(parts[0]?.trim())
          const max = parseInt(parts[1]?.trim())
          return !isNaN(min) && !isNaN(max) && dieValue >= min && dieValue <= max
        }
        const val = parseInt(rangeStr.trim())
        return !isNaN(val) && dieValue === val
      })

      const picked = foundRow || rows[Math.floor(Math.random() * rows.length)]
      setTableResult(picked)
      setIsRolling(false)
    })
  }

  let rows: any[] = []
  try { rows = table?.content ? JSON.parse(table.content) : [] } catch {}

  return (
    <div className="flex-1 flex flex-col animate-fade-in min-h-0" key={`table-${table?.id}`}>
      <header className="p-8 pb-4 shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold text-white mb-2">{table?.name}</h1>
          <button
            onClick={handleRollTable}
            disabled={isRolling || rows.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-bold hover:bg-dark-200 active:scale-95 transition-all disabled:opacity-50"
          >
            <Dices className="w-4 h-4" />
            {isRolling ? 'Rolando...' : 'Rolar Tabela'}
          </button>
        </div>
        <p className="text-dark-400 text-sm">{table?.description || 'Sem descrição.'}</p>

        {tableResult && (
          <div className="mt-4 flex items-center gap-4 p-4 bg-white/5 border border-white/20 animate-fade-in">
            <Dices className="w-5 h-5 text-white shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-dark-500 uppercase tracking-widest block">Resultado</span>
              <span className="text-white font-semibold">{tableResult.range} — {tableResult.content}</span>
            </div>
            <button onClick={() => setTableResult(null)} className="text-dark-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-2">
          {rows.map((row: any, i: number) => (
            <div key={i} className={`flex gap-4 p-4 border transition-colors ${tableResult && tableResult.range === row.range && tableResult.content === row.content ? 'bg-white/10 border-white/30' : 'bg-dark-950 border-white/5 hover:border-white/10'}`}>
              <div className="w-16 flex-shrink-0 font-mono text-sm text-dark-500 font-bold">{row.range}</div>
              <div className="text-sm text-white">{row.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
