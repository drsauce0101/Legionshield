import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Maximize2, ChevronLeft, ChevronRight, Play, Pause, Image as ImageIcon, Grid } from 'lucide-react'
import { audioService } from '../utils/audio'

interface SessionMoodboardProps {
  images: string[]
  onChange: (images: string[]) => void
}

export function SessionMoodboard({ images, onChange }: SessionMoodboardProps): JSX.Element {
  const [viewMode, setViewMode] = useState<'gallery' | 'slideshow'>('slideshow')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Slideshow interval
  useEffect(() => {
    if (viewMode !== 'slideshow' || !isPlaying || images.length <= 1 || isFullscreen) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [viewMode, isPlaying, images.length, isFullscreen])

  const handleAddImage = async () => {
    try {
      const url = await window.api.system.selectImage()
      if (url) {
        audioService.playClick()
        onChange([...images, url])
        if (viewMode === 'slideshow') setCurrentIndex(images.length)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    audioService.playPop()
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
    if (currentIndex >= newImages.length) {
      setCurrentIndex(Math.max(0, newImages.length - 1))
    }
  }

  const nextSlide = () => {
    audioService.playClick()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    audioService.playClick()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (images.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/5 bg-white/[0.02] text-center animate-fade-in">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-dark-500" />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-tight">Vibe da Sessão</h3>
        <p className="text-sm text-dark-400 max-w-sm mb-6 leading-relaxed">
          O Moodboard é o lugar para colecionar imagens que definem a atmosfera desta sessão. Monstros, cenários, NPCs ou qualquer inspiração visual.
        </p>
        <button
          onClick={handleAddImage}
          className="flex items-center gap-2 px-8 py-3 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-dark-100 transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          <Plus className="w-4 h-4" />
          Adicionar Primeira Imagem
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-2 bg-dark-950 p-1 border border-white/10">
          <button
            onClick={() => { audioService.playClick(); setViewMode('slideshow'); }}
            className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'slideshow' ? 'bg-white text-black' : 'text-dark-400 hover:text-white'}`}
          >
            <Play className="w-3.5 h-3.5" />
            Slideshow
          </button>
          <button
            onClick={() => { audioService.playClick(); setViewMode('gallery'); }}
            className={`flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'gallery' ? 'bg-white text-black' : 'text-dark-400 hover:text-white'}`}
          >
            <Grid className="w-3.5 h-3.5" />
            Galeria
          </button>
        </div>

        <button
          onClick={handleAddImage}
          className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/30 text-white transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Imagem
        </button>
      </div>

      {viewMode === 'slideshow' ? (
        <div className="flex-1 relative group bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden min-h-[400px]">
          {/* Main Image */}
          <div className="absolute inset-0 flex items-center justify-center">
             <img
              key={images[currentIndex]}
              src={images[currentIndex]}
              alt="Moodboard"
              className="w-full h-full object-contain animate-fade-in"
            />
          </div>

          {/* Controls Overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-black/60 pointer-events-none">
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-auto">
              <button onClick={prevSlide} className="p-3 text-white hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-4 bg-white text-black rounded-full hover:scale-110 transition-all active:scale-95 shadow-2xl">
                {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
              </button>
              <button onClick={nextSlide} className="p-3 text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-3">
               <button 
                  onClick={() => handleRemoveImage(currentIndex, {} as any)}
                  className="p-2.5 bg-red-600/20 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                  title="Excluir imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="p-2.5 bg-white/10 border border-white/10 text-white hover:bg-white hover:text-black transition-all"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
            </div>

            {/* Indicator */}
            <div className="absolute bottom-6 left-6 text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar content-start">
          {images.map((img, i) => (
            <div 
              key={i}
              className="group relative aspect-video bg-dark-950 border border-white/10 overflow-hidden cursor-pointer hover:border-white/40 transition-all"
              onClick={() => { audioService.playClick(); setCurrentIndex(i); setViewMode('slideshow'); }}
            >
              <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={(e) => handleRemoveImage(i, e)}
                  className="p-2 bg-red-600 text-white translate-y-4 group-hover:translate-y-0 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <img src={images[currentIndex]} className="max-w-full max-h-full object-contain" alt="" />
          <div className="absolute top-8 right-8">
            <button className="text-white hover:scale-110 transition-transform">
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  )
}
