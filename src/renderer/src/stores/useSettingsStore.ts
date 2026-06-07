import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  soundEnabled: boolean
  backgroundImage: string | null
  setSoundEnabled: (enabled: boolean) => void
  setBackgroundImage: (image: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      backgroundImage: null,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBackgroundImage: (image) => set({ backgroundImage: image })
    }),
    {
      name: 'legionshield-settings'
    }
  )
)
