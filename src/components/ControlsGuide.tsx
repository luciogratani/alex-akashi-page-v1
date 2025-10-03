import { useState, useEffect } from 'react'

export default function ControlsGuide() {
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setPressedKey('space')
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        setPressedKey('arrows-lr')
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        setPressedKey('arrows-ud')
      }
    }

    const handleKeyUp = () => {
      setPressedKey(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex flex-col items-center gap-1">
        {/* Title */}
        <div 
          className="text-alex-accent font-mono opacity-30"
          style={{ fontSize: '9px' }}
        >
          CONTROLS
        </div>
        
        {/* Keys */}
        <div 
          className="flex items-center gap-3 text-alex-accent font-mono"
          style={{ fontSize: '9px' }}
        >
          <span 
            className={`transition-opacity duration-100 ${pressedKey === 'space' ? 'opacity-100' : 'opacity-50'}`}
          >
            SPACE
          </span>
          <span className="opacity-30">|</span>
          <span 
            className={`transition-opacity duration-100 ${pressedKey === 'arrows-lr' ? 'opacity-100' : 'opacity-50'}`}
          >
            ← →
          </span>
          <span className="opacity-30">|</span>
          <span 
            className={`transition-opacity duration-100 ${pressedKey === 'arrows-ud' ? 'opacity-100' : 'opacity-50'}`}
          >
            ↑ ↓
          </span>
        </div>
      </div>
    </div>
  )
}

