import { useState, useEffect } from 'react'

interface ScrollingTextProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  currentTrackMetadata?: any
}

export default function ScrollingText({ audioRef, isPlaying, currentTrackMetadata }: ScrollingTextProps) {
  const [progress, setProgress] = useState(0) // 0-100%
  const [currentTime, setCurrentTime] = useState('0:00')
  const [totalDuration, setTotalDuration] = useState('0:00')

  // Get total duration when audio is loaded
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      
      const updateDuration = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          const minutes = Math.floor(audio.duration / 60)
          const seconds = Math.floor(audio.duration % 60)
          setTotalDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`)
        }
      }

      // Try immediately if already loaded
      updateDuration()
      
      // Listen for loadedmetadata event
      audio.addEventListener('loadedmetadata', updateDuration)
      return () => audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [audioRef])

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return

    const updateProgress = () => {
      if (audioRef.current) {
        const audio = audioRef.current
        const percent = (audio.currentTime / audio.duration) * 100
        setProgress(percent)

        // Format time as M:SS
        const minutes = Math.floor(audio.currentTime / 60)
        const seconds = Math.floor(audio.currentTime % 60)
        setCurrentTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }

    const interval = setInterval(updateProgress, 100)
    return () => clearInterval(interval)
  }, [isPlaying, audioRef])

  return (
    <div className="w-full overflow-hidden bg-alex-bg relative">
      {/* Complete Progress Bar - Slide up/down animation */}
      <div 
        className={`w-full transition-all duration-500 ${
          isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* Scrolling text */}
        <div 
          className="flex whitespace-nowrap text-alex-accent font-mono animate-scroll"
          style={{ fontSize: '9px' }}
        >
          {/* Ripeto il testo multiple volte per loop seamless */}
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="px-4">
                {currentTrackMetadata ? (
                  <>
                    <span className="font-bold">{currentTrackMetadata.title}</span>
                    {currentTrackMetadata.featuredArtist && (
                      <> feat <span className="font-bold">{currentTrackMetadata.featuredArtist}</span></>
                    )}
                    <span> | </span>
                    <span>BPM: {currentTrackMetadata.bpm}</span>
                    <span> | </span>
                    <span>Key: {currentTrackMetadata.key}</span>
                    <span> | </span>
                    <span>Genre: {currentTrackMetadata.genre}</span>
                    <span> | </span>
                    <span>Release Date: {currentTrackMetadata.releaseDate}</span>
                    <span> | </span>
                    <span>Master Engineer: {currentTrackMetadata.masterEngineer}</span>
                  </>
                ) : (
                  'Loading...'
                )}
              </span>
              <span className="opacity-50">|</span>
            </span>
          ))}
        </div>

        {/* Progress bar overlay with current time */}
        <div 
          className="absolute top-0 left-0 h-full bg-alex-accent transition-all duration-100 flex items-center justify-end"
          style={{ width: `${progress}%` }}
        >
          {/* Current time label */}
          <span 
            className="text-alex-bg font-mono font-bold pr-2"
            style={{ fontSize: '9px' }}
          >
            {currentTime}
          </span>
        </div>

        {/* Total duration box - Right end */}
        <div className="absolute top-0 right-0 h-full bg-alex-accent flex items-center px-2">
          <span 
            className="text-alex-bg font-mono font-bold"
            style={{ fontSize: '9px' }}
          >
            {totalDuration}
          </span>
        </div>
      </div>
    </div>
  )
}

