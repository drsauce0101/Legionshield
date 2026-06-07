import { useState, useEffect } from 'react'
import { X, CheckCircle, Save, Volume2, VolumeX, Image as ImageIcon, Trash2, Palette } from 'lucide-react'
import { audioService } from '../utils/audio'
import { useSettingsStore } from '../stores/useSettingsStore'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps): JSX.Element {
  const { soundEnabled, setSoundEnabled, backgroundImage, setBackgroundImage } = useSettingsStore()
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')
  const [localSound, setLocalSound] = useState(soundEnabled)
  const [localBg, setLocalBg] = useState(backgroundImage)

  const handleSave = () => {
    setSoundEnabled(localSound)
    setBackgroundImage(localBg)
    
    // Play sound if it's being enabled or already enabled
    if (localSound) {
      audioService.playPop()
    }
    
    setSaveState('saved')
    setTimeout(() => {
      setSaveState('idle')
      onClose()
    }, 1000)
  }

  const handleSelectImage = async () => {
    try {
      const url = await window.api.system.selectImage()
      if (url) {
        setLocalBg(url)
      }
    } catch (err) {
      console.error(err)
    }
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
        className="w-full max-w-md bg-dark-900 border border-white/15 shadow-2xl flex flex-col animate-slide-up overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-dark-300">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-white tracking-wide">Configurações</h2>
              <p className="text-[10px] text-dark-500 uppercase tracking-widest font-bold mt-0.5">Personalize o Legionshield</p>
            </div>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Som Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-dark-500 uppercase tracking-widest ml-1">Áudio</h3>
            <button 
              onClick={() => {
                setLocalSound(!localSound)
                if (!localSound) audioService.playClick()
              }}
              className={`
                w-full flex items-center justify-between p-4 border transition-all
                ${localSound 
                  ? 'bg-white/5 border-white/20 text-white' 
                  : 'bg-dark-950 border-white/5 text-dark-400 opacity-60'}
              `}
            >
              <div className="flex items-center gap-3">
                {localSound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <div className="text-left">
                  <p className="text-sm font-bold">Efeitos Sonoros</p>
                  <p className="text-[10px] text-dark-500 uppercase tracking-widest font-bold">Feedback sonoro minimalista</p>
                </div>
              </div>
              <div className={`w-10 h-5 relative flex items-center px-1 transition-colors ${localSound ? 'bg-white' : 'bg-dark-800'}`}>
                <div className={`w-3 h-3 transition-all ${localSound ? 'translate-x-5 bg-black' : 'translate-x-0 bg-dark-600'}`} />
              </div>
            </button>
          </div>

          {/* Tema Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-dark-500 uppercase tracking-widest ml-1">Tema Visual</h3>
            
            <div className="space-y-4">
              <p className="text-xs text-dark-400 px-1 leading-relaxed">
                Adicione uma imagem de fundo para personalizar o seu espaço de jogo. Ela será suavizada e integrada ao design minimalista.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleSelectImage}
                  className="flex-1 flex flex-col items-center justify-center p-6 border border-white/10 bg-dark-950 hover:bg-white/5 hover:border-white/30 transition-all gap-3 group"
                >
                  <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                    <ImageIcon className="w-6 h-6 text-dark-400 group-hover:text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-dark-500 uppercase tracking-widest group-hover:text-white">Selecionar Imagem</p>
                </button>
                
                {localBg && (
                  <button 
                    onClick={() => setLocalBg(null)}
                    className="flex flex-col items-center justify-center p-6 border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 transition-all gap-3 group"
                    title="Remover Imagem"
                  >
                    <div className="p-3 bg-red-500/10 rounded-full group-hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-6 h-6 text-red-500/60 group-hover:text-red-500" />
                    </div>
                    <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest group-hover:text-red-500">Limpar</p>
                  </button>
                )}
              </div>

              {localBg && (
                <div className="relative aspect-video w-full border border-white/10 bg-dark-950 overflow-hidden">
                  <img src={localBg} className="w-full h-full object-cover blur-[2px] opacity-40 scale-105" alt="Preview Tema" />
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-950/40">
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/60 px-3 py-1.5 backdrop-blur-md">Preview do Tema</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-t border-white/10 shrink-0 bg-dark-950/50">
          <button
            onClick={() => {
              audioService.playClick()
              onClose()
            }}
            className="h-11 flex items-center justify-center text-[10px] font-bold text-dark-400 hover:text-white border border-white/10 hover:border-white/30 transition-colors uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="h-11 flex items-center justify-center gap-2 bg-white text-black text-[10px] font-bold hover:bg-dark-200 active:scale-95 transition-all uppercase tracking-widest"
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
