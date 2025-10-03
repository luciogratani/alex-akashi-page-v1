import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  onComplete: () => void
}

const loadingMessages = [
  'INITIALIZING 303 SEQUENCER',
  'LOADING 909 DRUM PATTERNS',
  'SYNCING BPM TO 148',
  'PEACE LOVE UNITY RESPECT',
  'CONNECTING TO THE RAVE',
  'TUNING MODULAR OSCILLATORS',
  'CHARGING KICK DRUM ARRAY',
  'CALIBRATING FILTER CUTOFF',
  'ESTABLISHING TECHNO PROTOCOL',
  'WARMING UP ANALOG CIRCUITS',
  'PARSING WAVEFORM DATA',
  'ACTIVATING PLUR MODE'
]

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [fadeOut, setFadeOut] = useState(false)
  const loadingDuration = 3500

  // Update loading messages
  useEffect(() => {
    if (isComplete) return

    const messageInterval = setInterval(() => {
      const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
      setCurrentMessage(randomMessage)
    }, 400) // Change message every 400ms

    return () => clearInterval(messageInterval)
  }, [isComplete])

  // Progress animation
  useEffect(() => {
    const startTime = Date.now()
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / loadingDuration) * 100, 100)
      
      setProgress(newProgress)
      
      if (newProgress < 100) {
        requestAnimationFrame(updateProgress)
      } else {
        // Loading complete - show "Press SPACE"
        setIsComplete(true)
      }
    }
    
    requestAnimationFrame(updateProgress)
  }, [loadingDuration])

  // Handle exit (SPACE key or click anywhere)
  const handleExit = () => {
    if (!isComplete) return
    
    // Fade out
    setFadeOut(true)
    // Wait for fade animation then call onComplete
    setTimeout(onComplete, 500)
  }

  // Listen for SPACE key when loading is complete
  useEffect(() => {
    if (!isComplete) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleExit()
      }
    }

    // Use capture phase to intercept before App.tsx listener
    window.addEventListener('keydown', handleKeyPress, true)
    return () => window.removeEventListener('keydown', handleKeyPress, true)
  }, [isComplete, onComplete])

  // Listen for click anywhere when loading is complete
  useEffect(() => {
    if (!isComplete) return

    const handleClick = () => {
      handleExit()
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [isComplete, onComplete])

  return (
    <div 
      className={`fixed inset-0 bg-alex-bg z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Monogram - Center - Inline SVG */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8">
        <svg 
          id="Livello_2" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1263.43 2883.67"
          className="w-32 h-32"
        >
          <g id="Layer_1">
            <path 
              fill="#CA2D2E"
              d="M1263.43,1415.07C1016.01,1400.47,629.29,0,629.29,0c-140.73,658.8-254.72,547.31-254.72,547.31C489.81,783.59,0,1468.6,0,1468.6c257.18,14.93,634.14,1415.07,634.14,1415.07,132.84-647.55,255.38-546.15,255.38-546.15-121.16-225.2,373.9-922.45,373.9-922.45h.01ZM627.43,2344.3c-41.13.18-104.98-237.14-131.55-295.93-18.05-39.95-8.23-86.27,25.95-116.98,34-30.55,77.87-34.82,77.87-34.82-42.11-.32-73.99-2.61-98.06-5.72-42.55-5.5-86.29-38.4-109.22-70.98-232.23-329.89,99.46-372.33,171.15-375.16l-210.64-5.66c-197.59-14.6-70.83-263.73-70.83-263.73,104.86-238.87,296.07-494,348.92-562.47,6.35-8.23,20.08-7.63,25.32,1.12,56.46,94.33,94.58,178.89,112.47,221.41,12.85,30.54,10.9,64.85-6.31,93.85-32.92,55.48-98.79,57.86-98.79,57.86,44.13,1.1,76.96,3.82,101.34,7.13,40.8,5.55,77.79,31.76,99.66,63.12,239.24,343.17-161.85,381.48-161.85,381.48l202.67,5.45c195.26,6.3,88.69,238.73,88.69,238.73-36.72,146.08-313.98,668.24-366.8,661.29h0Z"
            />
          </g>
        </svg>

        {/* Loading Messages / Press Space */}
        <div className="h-6 flex items-center justify-center">
          {!isComplete ? (
            <div 
              className="font-mono text-alex-accent transition-opacity duration-200 opacity-50"
              style={{ fontSize: '9px' }}
            >
              {currentMessage}
            </div>
          ) : (
            <div 
              className="font-mono text-alex-accent animate-pulse"
              style={{ fontSize: '9px' }}
            >
              PRESS <span className="font-bold">SPACE</span> OR <span className="font-bold">CLICK</span> TO START
            </div>
          )}
        </div>
      </div>

      {/* Loading Bar - Bottom */}
      <div 
        className={`absolute bottom-0 left-0 w-full transition-all duration-300 ${
          isComplete ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="relative h-4">
          {/* Progress Bar */}
          <div 
            className="h-full bg-alex-accent transition-all duration-100 ease-linear relative"
            style={{ width: `${progress}%` }}
          >
            {/* Percentage Text - Inside the red bar */}
            <div 
              className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-alex-bg"
              style={{ fontSize: '9px' }}
            >
              {Math.floor(progress)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

