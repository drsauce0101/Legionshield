import { useEffect, useRef, useState } from 'react'
import DiceBox from '@3d-dice/dice-box'
import { Dices, X, RotateCcw } from 'lucide-react'
import { audioService } from '../utils/audio'

// Custom minimalist SVG icons for each die type
const DieIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'd4':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3L2 20h20L12 3z" />
        </svg>
      )
    case 'd6':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      )
    case 'd8':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L4 12l8 10 8-10-8-10z" />
          <path d="M4 12h16M12 2v20" strokeOpacity="0.3" />
        </svg>
      )
    case 'd10':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L4 10l8 12 8-12-8-8z" />
          <path d="M12 2v20M4 10h16" strokeOpacity="0.3" />
        </svg>
      )
    case 'd12':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l8 4v12l-8 4-8-4V6l8-4z" />
          <path d="M12 2v20M4 6l16 12M20 6L4 18" strokeOpacity="0.2" />
        </svg>
      )
    case 'd20':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l9 7v6l-9 7-9-7V9l9-7z" />
          <path d="M12 2v20M3 9h18M3 15h18" strokeOpacity="0.2" />
        </svg>
      )
    default:
      return null
  }
}

export function DiceRoller(): JSX.Element {
  const diceBoxRef = useRef<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // We initialize once on mount
    if (!diceBoxRef.current) {
      diceBoxRef.current = new DiceBox({
        container: '#dice-box-canvas',
        assetPath: window.location.origin + '/assets/dice-box/',
        theme: 'default',
        themeColor: '#ffffff',
        offscreen: false,
        scale: 6,
        settleTimeout: 5000
      })

      diceBoxRef.current.init()
        .then(() => {
          setIsInitialized(true)
          console.log('DiceBox: Ready')
        })
        .catch((err: any) => {
          console.error('DiceBox: Init Error', err)
        })
    }
  }, [])

  const rollDice = async (type: string) => {
    if (!diceBoxRef.current || !isInitialized) return
    
    audioService.playPop()
    try {
      await diceBoxRef.current.roll(`1${type}`)
    } catch (err) {
      console.error('Roll Error:', err)
    }
  }

  const clearDice = () => {
    if (diceBoxRef.current) {
      diceBoxRef.current.clear()
    }
  }

  return (
    <>
      {/* 3D Dice Layer - MUST be above everything else but allow clicks through */}
      <div 
        id="dice-box-canvas" 
        className="fixed inset-0 z-[2000] pointer-events-none [&>canvas]:pointer-events-none"
      />

      {/* Dice Roller UI */}
      <div className="fixed bottom-6 right-6 z-[2001] flex flex-col items-end gap-3 no-drag">
        {isOpen && (
          <div className="bg-dark-900/95 backdrop-blur-md border border-white/10 p-3 shadow-2xl flex flex-col gap-2 animate-slide-up">
            <div className={`grid grid-cols-3 gap-2 transition-opacity duration-500 ${isInitialized ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((die) => (
                <button
                  key={die}
                  onClick={() => rollDice(die)}
                  title={die.toUpperCase()}
                  className="w-12 h-12 flex items-center justify-center bg-dark-950 border border-white/5 hover:border-white/20 text-dark-300 hover:text-white transition-all active:scale-90"
                >
                  <DieIcon type={die} />
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 pt-2 mt-1">
              <button
                onClick={clearDice}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] text-dark-500 hover:text-white transition-colors uppercase font-bold tracking-widest"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            audioService.playClick()
            setIsOpen(!isOpen)
          }}
          className={`w-14 h-14 flex items-center justify-center shadow-2xl transition-all active:scale-95 border ${
            isOpen 
              ? 'bg-white text-black border-white' 
              : 'bg-dark-900 border-white/20 text-white hover:border-white/40'
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Dices className="w-6 h-6" />}
        </button>
      </div>
    </>
  )
}
