import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Square, RotateCcw } from 'lucide-react'
import { supabase, Track, TrackEvent } from '../lib/supabase'
import { audioService } from '../lib/audioService'

interface AdminPreviewPlayerProps {
  track: Track
  onClose: () => void
}

export default function AdminPreviewPlayer({ track, onClose }: AdminPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [kickEvents, setKickEvents] = useState<TrackEvent[]>([])
  const [kickActive, setKickActive] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const kickIndexRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)

  // Load kick events for this track
  useEffect(() => {
    loadKickEvents()
  }, [track.id])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      kickIndexRef.current = 0
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [track.id])

  // Kick synchronization
  useEffect(() => {
    if (!isPlaying || kickEvents.length === 0) {
      kickIndexRef.current = 0
      return
    }

    const checkKicks = () => {
      if (!audioRef.current) return

      const currentTime = audioRef.current.currentTime

      // Check if we need to trigger a kick
      while (
        kickIndexRef.current < kickEvents.length &&
        kickEvents[kickIndexRef.current].timestamp <= currentTime
      ) {
        // Trigger kick visual
        setKickActive(true)
        
        setTimeout(() => {
          setKickActive(false)
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
  }, [isPlaying, kickEvents])

  const loadKickEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('track_events')
        .select('*')
        .eq('track_id', track.id)
        .eq('event_type', 'kick')
        .order('timestamp')

      if (error) {
        console.error('Error loading kick events:', error)
        return
      }

      setKickEvents(data || [])
    } catch (err) {
      console.error('Error loading kick events:', err)
    }
  }

  const togglePlayPause = () => {
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const stop = () => {
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      kickIndexRef.current = 0
    }
  }

  const reset = () => {
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      kickIndexRef.current = 0
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed inset-0 bg-alex-bg/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-alex-bg border border-alex-accent p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-mono text-alex-accent">{track.title}</h2>
            <p className="text-alex-subtitle font-mono text-sm">
              {track.artist}
              {track.featured_artist && ` feat. ${track.featured_artist}`}
            </p>
          </div>
          <button
            onClick={onClose}
            
            className="text-alex-subtitle hover:text-alex-accent transition-colors"
          >
            <Square size={20} />
          </button>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={track.audio_file_path ? audioService.getAudioFileUrl(track.audio_file_path) : ''}
          preload="metadata"
        />

        {/* Player Controls */}
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-alex-subtitle font-mono text-sm">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="w-full bg-alex-accent/20 rounded-full h-2">
              <div 
                className="bg-alex-accent h-2 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={reset}
              
              className="p-2 border border-alex-accent text-alex-accent hover:bg-alex-accent hover:text-alex-bg transition-colors"
            >
              <RotateCcw size={20} />
            </button>
            
            <button
              onClick={togglePlayPause}
              
              className="p-4 bg-alex-accent text-alex-bg hover:opacity-80 transition-opacity"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={stop}
              
              className="p-2 border border-alex-accent text-alex-accent hover:bg-alex-accent hover:text-alex-bg transition-colors"
            >
              <Square size={20} />
            </button>
          </div>

          {/* Kick Visualization */}
          <div className="flex items-center justify-center">
            <div className={`w-4 h-4 rounded-full border-2 border-alex-accent transition-all duration-150 ${
              kickActive ? 'bg-alex-accent' : 'bg-transparent'
            }`} />
          </div>

          {/* Track Info */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-alex-subtitle font-mono text-sm">BPM</div>
              <div className="text-alex-accent font-mono text-lg">{track.bpm}</div>
            </div>
            <div>
              <div className="text-alex-subtitle font-mono text-sm">KEY</div>
              <div className="text-alex-accent font-mono text-lg">{track.key}</div>
            </div>
            <div>
              <div className="text-alex-subtitle font-mono text-sm">KICK EVENTS</div>
              <div className="text-alex-accent font-mono text-lg">{kickEvents.length}</div>
            </div>
            <div>
              <div className="text-alex-subtitle font-mono text-sm">DURATION</div>
              <div className="text-alex-accent font-mono text-lg">{formatTime(duration)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
