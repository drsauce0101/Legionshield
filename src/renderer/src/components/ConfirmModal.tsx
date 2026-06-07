import React, { useEffect } from 'react'
import { AlertTriangle, X, ShieldAlert, Trash2 } from 'lucide-react'
import { audioService } from '../utils/audio'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDanger?: boolean
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar', 
  onConfirm, 
  onCancel,
  isDanger = false
}: ConfirmModalProps) {
  
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-dark-950/90 backdrop-blur-xl animate-fade-in" onClick={onCancel}>
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 ${isDanger ? 'bg-red-600' : 'bg-white'}`} />
      </div>

      <div 
        className="w-full max-w-md bg-dark-900 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scale-in flex flex-col overflow-hidden relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar / Border Top Decor */}
        <div className={`h-1 w-full ${isDanger ? 'bg-red-600' : 'bg-white'}`} />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0 border-none">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-none border ${isDanger ? 'bg-red-600/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-white'}`}>
              {isDanger ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white tracking-tight uppercase">
                {title}
              </h3>
              <div className={`h-0.5 w-12 mt-1 ${isDanger ? 'bg-red-600' : 'bg-white'}`} />
            </div>
          </div>
          <button 
            onClick={() => {
              audioService.playClick()
              onCancel()
            }} 
            className="p-2 text-dark-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          <p className="text-dark-200 text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-2">
          <button 
            onClick={() => {
              audioService.playClick()
              onCancel()
            }} 
            className="px-6 py-2.5 text-[10px] font-bold text-dark-400 hover:text-white uppercase tracking-widest transition-colors border border-transparent hover:border-white/10"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              if (isDanger) audioService.playPop()
              onConfirm()
            }} 
            className={`
              group relative flex items-center gap-2 px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95
              ${isDanger 
                ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]' 
                : 'bg-white text-black hover:bg-dark-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
              }
            `}
          >
            {isDanger && <Trash2 className="w-3.5 h-3.5" />}
            {confirmText}
            {/* Hover Glitch Effect Line */}
            <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300 ${isDanger ? 'bg-white' : 'bg-black'}`} />
          </button>
        </div>

        {/* Decorative corner */}
        <div className={`absolute bottom-0 right-0 w-8 h-8 opacity-10 pointer-events-none border-r-2 border-b-2 ${isDanger ? 'border-red-600' : 'border-white'}`} />
      </div>
    </div>
  )
}
