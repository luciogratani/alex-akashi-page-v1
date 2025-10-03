import { useState, useRef, useEffect } from 'react'
import { Circle } from 'lucide-react'
import { audioService, type TrackMetadata } from '../lib/audioService'
import { analyticsService } from '../lib/analyticsService'

interface AudioPlayerProps {
  onKick?: (active: boolean) => void
  audioRef?: React.RefObject<HTMLAudioElement | null>
  onPlayingChange?: (playing: boolean) => void
  togglePlayPauseRef?: React.MutableRefObject<(() => void) | null>
  currentTrackId?: number
  onMetadataChange?: (metadata: any) => void
}

export default function AudioPlayer({ onKick, audioRef: externalAudioRef, onPlayingChange, togglePlayPauseRef, currentTrackId = 1, onMetadataChange }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [kickActive, setKickActive] = useState(false)
  const [kicks, setKicks] = useState<number[]>([])
  const [showNowPlaying, setShowNowPlaying] = useState(false)
  const [currentTrackMetadata, setCurrentTrackMetadata] = useState<TrackMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const internalAudioRef = useRef<HTMLAudioElement>(null)
  const audioRef = externalAudioRef || internalAudioRef
  const kickIndexRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load track data from Supabase when track changes
  useEffect(() => {
    const loadTrack = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const track = await audioService.getTrackById(currentTrackId)
        
        if (!track) {
          throw new Error(`Track with ID ${currentTrackId} not found`)
        }

        setCurrentTrackMetadata(track.metadata)
        setKicks(track.trackData.kicks)
        
        if (onMetadataChange) {
          onMetadataChange(track.metadata)
        }

        // Update audio source
        if (audioRef.current) {
          try {
            // Try to get preloaded URL first, fallback to generating new URL
            let audioUrl = audioService.getPreloadedAudioUrl(track.id)
            if (!audioUrl) {
              audioUrl = audioService.getAudioFileUrl(track.metadata.audioFilePath || '')
            }
            
            audioRef.current.src = audioUrl
            // Reset playback position when changing tracks
            audioRef.current.currentTime = 0
            kickIndexRef.current = 0
            
            // Preload next track for seamless playback
            audioService.preloadNextTrack(track.id)
            
            // Aggiungi listener per fine traccia
            audioRef.current.addEventListener('ended', () => {
              analyticsService.trackTrackEnd()
            })
            
            // Auto-play when changing tracks
            audioRef.current.play()
              .then(() => {
                setIsPlaying(true)
                // Traccia il cambio traccia (pausa automatica + nuovo play)
                analyticsService.trackTrackChange(currentTrackId)
                if (onPlayingChange) {
                  onPlayingChange(true)
                }
              })
              .catch(err => {
                console.log('Auto-play prevented by browser:', err)
                // Browser blocked auto-play, user needs to interact first
              })
          } catch (audioError) {
            console.error('Error setting audio source:', audioError)
            setError(`Failed to load audio file: ${audioError}`)
          }
        }
      } catch (err) {
        console.error('Error loading track:', err)
        setError(err instanceof Error ? err.message : 'Failed to load track')
      } finally {
        setLoading(false)
      }
    }

    loadTrack()
  }, [currentTrackId])

  // Text alternation when playing
  useEffect(() => {
    if (isPlaying) {
      // Alternate between track info and "NOW PLAYING" every 3 seconds
      textIntervalRef.current = setInterval(() => {
        setShowNowPlaying(prev => !prev)
      }, 3000)
    } else {
      // Clear interval and show track info when paused
      if (textIntervalRef.current) {
        clearInterval(textIntervalRef.current)
      }
      setShowNowPlaying(false)
    }

    return () => {
      if (textIntervalRef.current) {
        clearInterval(textIntervalRef.current)
      }
    }
  }, [isPlaying])

  // Monitor audio playback and trigger kick events
  useEffect(() => {
    if (!isPlaying || kicks.length === 0) {
      kickIndexRef.current = 0
      return
    }

    const checkKicks = () => {
      if (!audioRef.current) return

      const currentTime = audioRef.current.currentTime

      // Check if we need to trigger a kick
      while (
        kickIndexRef.current < kicks.length &&
        kicks[kickIndexRef.current] <= currentTime
      ) {
        // Trigger kick visual
        setKickActive(true)
        if (onKick) onKick(true)
        
        setTimeout(() => {
          setKickActive(false)
          if (onKick) onKick(false)
        }, 150)
        
        kickIndexRef.current++
      }

      // Reset if audio loops back
      if (currentTime < 0.1 && kickIndexRef.current > 0) {
        kickIndexRef.current = 0
      }

      animationFrameRef.current = requestAnimationFrame(checkKicks)
    }

    animationFrameRef.current = requestAnimationFrame(checkKicks)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, kicks])

  const togglePlayPause = () => {
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        // Traccia la pausa
        analyticsService.trackPause()
      } else {
        audioRef.current.play()
        // Traccia l'inizio della riproduzione
        analyticsService.trackPlay(currentTrackId)
      }
      const newPlayingState = !isPlaying
      setIsPlaying(newPlayingState)
      if (onPlayingChange) {
        onPlayingChange(newPlayingState)
      }
    }
  }

  // Expose togglePlayPause to parent via ref
  useEffect(() => {
    if (togglePlayPauseRef) {
      togglePlayPauseRef.current = togglePlayPause
    }
  }, [togglePlayPauseRef, isPlaying]) // Include isPlaying to update closure

  return (
    <>
      {/* Audio Element */}
      <audio ref={audioRef} loop />
      
      {/* Track Info - Top Left - Now the Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        
        className="fixed top-8 left-8 z-50 flex items-center gap-3 px-2 py-1 transition-all duration-200 group bg-transparent border-none"
        style={{ fontSize: '9px', cursor: 'none' }}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {/* Kick Pulse - Only pulses when playing */}
        <Circle
          size={12}
          className="text-alex-accent group-hover:text-alex-bg transition-colors duration-200"
          fill={kickActive && isPlaying ? 'currentColor' : 'transparent'}
          strokeWidth={2}
          style={{
            opacity: isPlaying && kickActive ? 1 : 0.3,
            transition: 'opacity 150ms ease-out',
          }}
        />
        
          {/* Track Details - Animated alternation */}
        <div className="relative overflow-hidden">
          {/* Track Info */}
          <div 
            className={`flex items-center gap-2 font-mono text-alex-accent group-hover:text-alex-bg transition-all duration-500 ${
              showNowPlaying ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            } ${isPlaying ? 'font-bold' : ''}`}
          >
            {loading ? (
              <span>Loading...</span>
            ) : error ? (
              <span className="text-red-400">Error: {error}</span>
            ) : currentTrackMetadata ? (
              <>
                <span>{currentTrackMetadata.title}</span>
                {currentTrackMetadata.featuredArtist && (
                  <>
                    <span className="opacity-50">feat</span>
                    <span>{currentTrackMetadata.featuredArtist}</span>
                  </>
                )}
                <span className="opacity-50">|</span>
                <span>{currentTrackMetadata.bpm} BPM</span>
                <span className="opacity-50">|</span>
                <span>{currentTrackMetadata.key}</span>
              </>
            ) : (
              <span>No track data</span>
            )}
          </div>

          {/* NOW PLAYING */}
          <div 
            className={`absolute top-0 left-0 flex items-center gap-2 font-mono text-alex-accent group-hover:text-alex-bg transition-all duration-500 ${
              showNowPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <span className="font-bold">NOW PLAYING</span>
          </div>
        </div>
        
        {/* Hover Background */}
        <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
      </button>
    </>
  )
}

