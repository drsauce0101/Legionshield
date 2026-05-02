import { useState, useEffect } from 'react'
import { X, CheckCircle, Save, Settings } from 'lucide-react'
import { audioService } from '../utils/audio'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps): JSX.Element {
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')

  const handleSave = () => {
    audioService.playPop()
    setSaveState('saved')
    setTimeout(() => {
      setSaveState('idle')
      onClose()
    }, 1000)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-dark-900 border border-white/15 shadow-2xl flex flex-col animate-slide-up"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="font-display font-semibold text-lg text-white tracking-wide">Configurações</h2>
            <p className="text-xs text-dark-500 mt-0.5">Personalize o seu Legionshield</p>
          </div>
          <button
            onClick={() => {
              audioService.playClick()
              onClose()
            }}
            className="p-2 text-dark-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center mb-2">
            <Settings className="w-8 h-8 text-dark-400" />
          </div>
          <h3 className="text-white font-display font-bold text-xl tracking-tight">Configurações Gerais</h3>
          <p className="text-sm text-dark-400 max-w-[280px]">
            Novas opções de personalização do aplicativo estarão disponíveis em atualizações futuras.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => {
              audioService.playClick()
              onClose()
            }}
            className="h-11 flex items-center justify-center text-xs font-bold text-dark-400 hover:text-white border border-white/10 hover:border-white/30 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            className="h-11 flex items-center justify-center gap-2 bg-white text-black text-xs font-bold hover:bg-dark-200 active:scale-95 transition-all"
          >
            {saveState === 'saved' ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
