import { useState, useEffect } from 'react'
import SupabaseTest from './SupabaseTest'
import CacheStats from './CacheStats'

// Espone la funzione per aprire il debug panel globalmente
declare global {
  interface Window {
    openDebugPanel: () => void
  }
}

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Espone la funzione globalmente per la console
    window.openDebugPanel = () => setIsVisible(true)
    
    // Messaggio di benvenuto nella console
    console.log('%c🐛 Debug Panel Ready!', 'color: #00ff00; font-weight: bold; font-size: 16px;')
    console.log('%cType: openDebugPanel()', 'color: #00ff00; font-family: monospace;')
    console.log('%cTo open the debug panel', 'color: #888; font-style: italic;')
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay semi-trasparente */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
      
      {/* Debug Panel Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto">
        <div className="bg-black/90 border border-alex-accent/50 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-alex-accent rounded-full animate-pulse" />
              <h2 className="text-alex-accent font-mono text-lg">DEBUG PANEL</h2>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-alex-subtitle font-mono text-xs hover:text-alex-accent transition-colors"
            >
              ✕ CLOSE
            </button>
          </div>

          {/* Testers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supabase Tester */}
            <div className="bg-black/50 border border-alex-accent/30 rounded-lg p-4">
              <h3 className="text-alex-accent font-mono text-sm mb-3">SUPABASE CONNECTION</h3>
              <SupabaseTest />
            </div>

            {/* Cache Stats */}
            <div className="bg-black/50 border border-alex-accent/30 rounded-lg p-4">
              <h3 className="text-alex-accent font-mono text-sm mb-3">CACHE STATISTICS</h3>
              <CacheStats />
            </div>
          </div>

          {/* Future Testers Placeholder */}
          <div className="mt-6 pt-6 border-t border-alex-accent/20">
            <div className="text-center text-alex-subtitle font-mono text-sm">
              <div className="mb-2">🚧 FUTURE TESTERS</div>
              <div className="text-xs opacity-70">
                Additional debugging tools will be added here
              </div>
              <div className="text-xs opacity-50 mt-2">
                Activated from console: openDebugPanel()
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
