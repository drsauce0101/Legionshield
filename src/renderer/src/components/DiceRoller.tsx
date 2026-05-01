import React, { useEffect, useRef, useState } from 'react'
import { ThreeDDice, ThreeDDiceAPI } from 'dddice-js'
import { Dices, Settings } from 'lucide-react'

// You might eventually want a user setting for this, but for now we generate a guest token
// We can store it in localStorage so the guest doesn't change every reload
function getLocalGuestToken() {
  return localStorage.getItem('dddice_guest_token')
}
function setLocalGuestToken(token: string) {
  localStorage.setItem('dddice_guest_token', token)
}

function getLocalRoomSlug() {
  return localStorage.getItem('dddice_room_slug')
}
function setLocalRoomSlug(slug: string) {
  localStorage.setItem('dddice_room_slug', slug)
}

export function DiceRoller(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dddiceInstance = useRef<ThreeDDice | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initDddice() {
      try {
        let token = getLocalGuestToken()
        let roomSlug = getLocalRoomSlug()
        
        let api = new ThreeDDiceAPI(token || '')

        if (!token) {
          const guestResponse = await api.user.guest() as any
          token = guestResponse.data.token as string
          setLocalGuestToken(token)
          api = new ThreeDDiceAPI(token)
        }

        if (!roomSlug) {
          const roomResponse = await api.room.create() as any
          roomSlug = roomResponse.data.slug as string
          setLocalRoomSlug(roomSlug)
        }

        if (canvasRef.current && !dddiceInstance.current && token && roomSlug) {
          const dddice = new ThreeDDice(canvasRef.current, token)
          dddice.start()
          dddice.connect(roomSlug)
          dddiceInstance.current = dddice
          setIsReady(true)
        }
      } catch (err) {
        console.error('Failed to initialize dddice:', err)
        setError('Erro ao carregar os dados 3D.')
      }
    }

    initDddice()

    return () => {
      // Dddice doesn't strictly have a stop() method in all versions, we try catch it
      if (dddiceInstance.current) {
        try {
          // Some versions have destroy() or stop()
          ;(dddiceInstance.current as any).destroy?.()
        } catch(e) {}
        dddiceInstance.current = null
      }
    }
  }, [])

  const rollD20 = () => {
    if (dddiceInstance.current && isReady) {
      // standard d20 theme
      dddiceInstance.current.roll([{ theme: 'dddice-standard', type: 'd20' }])
    }
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      {/* The canvas must be visible but we want it to overlay things, pointer-events-none so it doesn't block clicks unless we click a die */}
      <canvas 
        ref={canvasRef} 
        id="dddice" 
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ zIndex: 10 }}
      />
      
      {/* Floating Toolbar for Dice */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-dark-900 border border-white/20 p-2 flex flex-col gap-2">
          {error ? (
            <span className="text-red-400 text-xs">{error}</span>
          ) : (
            <button 
              onClick={rollD20}
              disabled={!isReady}
              className="flex items-center justify-center w-10 h-10 bg-dark-950 border border-white/10 text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              title="Rolar d20"
            >
              <Dices className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
