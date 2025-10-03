import { useState, useEffect, useRef } from 'react'

interface CrosshairProps {
  isVisible: boolean
  mousePosition: { x: number; y: number }
  isClicked?: boolean
}

export default function Crosshair({ isVisible, mousePosition, isClicked = false }: CrosshairProps) {
  const [showCoords, setShowCoords] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isClicked) {
      // Update coordinates in real-time while dragging
      setCoords({ x: Math.round(mousePosition.x), y: Math.round(mousePosition.y) })
      setShowCoords(true)
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    } else if (showCoords) {
      // Start fade out after release (200ms display + 150ms decay)
      timeoutRef.current = setTimeout(() => {
        setShowCoords(false)
      }, 200)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isClicked, mousePosition.x, mousePosition.y, showCoords])

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      {/* Horizontal line - follows mouse Y position */}
      <div
        className="absolute bg-alex-accent"
        style={{
          width: '100%',
          height: isClicked ? '1.25px' : '1px',
          left: 0,
          top: mousePosition.y,
          transform: 'translateY(-50%)',
          transition: 'height 100ms ease-out',
        }}
      />
      {/* Vertical line - follows mouse X position */}
      <div
        className="absolute bg-alex-accent"
        style={{
          width: isClicked ? '1.25px' : '1px',
          height: '100%',
          left: mousePosition.x,
          top: 0,
          transform: 'translateX(-50%)',
          transition: 'width 100ms ease-out',
        }}
      />
      
      {/* Coordinates display - above crosshair intersection */}
      <div
        className="absolute text-alex-accent font-mono"
        style={{
          left: mousePosition.x + 6,
          bottom: `calc(100% - ${mousePosition.y}px + 6px)`,
          opacity: showCoords ? 1 : 0,
          transition: 'opacity 150ms ease-out',
          fontSize: '9px',
          lineHeight: '1.2',
        }}
      >
        <div>x: {coords.x}</div>
        <div>y: {coords.y}</div>
      </div>
    </div>
  )
}
