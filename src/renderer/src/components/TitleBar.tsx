import { Minus, Maximize2, X, Shield } from 'lucide-react'

export function TitleBar(): JSX.Element {
  return (
    <header className="draggable flex items-center justify-between h-11 px-4 border-b border-white/8 bg-dark-950/90 backdrop-blur-sm flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 no-drag select-none">
        <div className="flex items-center justify-center w-6 h-6 rounded-none bg-white">
          <Shield className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
        </div>
        <span className="font-display text-sm font-semibold tracking-widest text-white/90 uppercase">
          Legionshield
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          id="btn-minimize"
          onClick={() => window.api.window.minimize()}
          className="flex items-center justify-center w-8 h-8 rounded-none text-dark-400 hover:text-white hover:bg-white/10 transition-all duration-150"
          title="Minimizar"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          id="btn-maximize"
          onClick={() => window.api.window.maximize()}
          className="flex items-center justify-center w-8 h-8 rounded-none text-dark-400 hover:text-white hover:bg-white/10 transition-all duration-150"
          title="Maximizar"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-close"
          onClick={() => window.api.window.close()}
          className="flex items-center justify-center w-8 h-8 rounded-none text-dark-400 hover:text-white hover:bg-red-600 transition-all duration-150"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
