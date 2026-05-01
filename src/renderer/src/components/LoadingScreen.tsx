import React from 'react'
import loadingSymbol from '../assets/loading-symbol.svg'

interface LoadingScreenProps {
  isVisible: boolean
}

export function LoadingScreen({ isVisible }: LoadingScreenProps): JSX.Element | null {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950 text-white animate-fade-in transition-opacity duration-500">
      <div className="relative flex flex-col items-center">
        {/* Símbolo Giratório */}
        <img 
          src={loadingSymbol} 
          alt="Carregando..." 
          className="w-16 h-16 animate-spin text-white opacity-80"
          style={{ animationDuration: '3s' }} // Gira um pouco mais devagar para manter a estética
        />
        
        {/* Texto opcional */}
        <p className="mt-8 font-display text-sm tracking-[0.3em] uppercase text-dark-400">
          Iniciando
        </p>
      </div>
    </div>
  )
}
