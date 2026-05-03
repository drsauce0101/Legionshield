import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

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
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onCancel}>
      <div 
        className="w-full max-w-md bg-dark-900 border border-white/20 shadow-2xl animate-scale-in flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {isDanger && <AlertTriangle className="w-5 h-5 text-red-500" />}
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <button onClick={onCancel} className="p-1 text-dark-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          <p className="text-dark-200 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 bg-dark-950/50 border-t border-white/5">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-xs font-bold text-dark-400 hover:text-white uppercase tracking-widest transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 border-b-4 ${
              isDanger 
                ? 'bg-red-600 text-white hover:bg-red-500 border-red-800 active:border-b-0 active:translate-y-1' 
                : 'bg-white text-black hover:bg-dark-100 border-dark-300 active:border-b-0 active:translate-y-1'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
