import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { audioService, type CompleteTrack } from '../lib/audioService'

interface PlaylistProps {
  currentTrackId: number
  onTrackSelect: (trackId: number) => void
  openMenuComponent: string | null
  onMenuComponentChange: (componentName: string | null) => void
}


export default function Playlist({ currentTrackId, onTrackSelect, openMenuComponent, onMenuComponentChange }: PlaylistProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tracks, setTracks] = useState<CompleteTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load tracks from Supabase
  useEffect(() => {
    const loadTracks = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const loadedTracks = await audioService.getAllTracks()
        setTracks(loadedTracks)
        
        // Preload first track for better performance
        if (loadedTracks.length > 0) {
          audioService.preloadAudio(loadedTracks[0].id)
        }
      } catch (err) {
        console.error('Failed to load tracks:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tracks')
      } finally {
        setLoading(false)
      }
    }

    loadTracks()
  }, [])

  // Chiudi Playlist se viene aperto un altro componente del menu
  useEffect(() => {
    if (isOpen && openMenuComponent !== 'playlist' && openMenuComponent !== null) {
      setIsOpen(false)
    }
  }, [openMenuComponent, isOpen])


  return (
    <div className="relative flex flex-col items-end">
      {/* Playlist Header - Toggle Button */}
      <button
        onClick={() => {
          
          setIsOpen(!isOpen)
          onMenuComponentChange(isOpen ? null : 'playlist')
        }}
        
        className="relative flex items-center gap-2 px-2 py-1 transition-all duration-200 group bg-transparent border-none"
        style={{ fontSize: '9px', cursor: 'none' }}
      >
        <span className="font-mono text-alex-accent group-hover:text-alex-bg transition-colors duration-200 font-bold">
          PLAYLIST
        </span>
        {isOpen ? (
          <ChevronUp 
            size={12}
            className="text-alex-accent group-hover:text-alex-bg transition-colors duration-200"
          />
        ) : (
          <ChevronDown 
            size={12}
            className="text-alex-accent group-hover:text-alex-bg transition-colors duration-200"
          />
        )}
        
        {/* Hover Background */}
        <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
      </button>

      {/* Dropdown - Track List */}
      <div 
        className={`absolute top-full right-0 flex flex-col items-end gap-2 mt-2 transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {loading ? (
          <div className="font-mono text-alex-accent text-xs px-2 py-1">
            LOADING...
          </div>
        ) : error ? (
          <div className="font-mono text-red-400 text-xs px-2 py-1">
            ERROR: {error}
          </div>
        ) : tracks.length === 0 ? (
          <div className="font-mono text-alex-accent text-xs px-2 py-1">
            NO TRACKS FOUND
          </div>
        ) : (
          tracks.map((track) => {
          const isCurrentTrack = track.id === currentTrackId

          return (
            <div key={track.id} className="relative group">
              <button
                onClick={() => {
                  
                  onTrackSelect(track.id)
                  setIsOpen(false) // Chiude la playlist dopo la selezione
                }}
                
                className="flex items-center gap-3 px-2 py-1 transition-all duration-200 bg-transparent border-none"
                style={{ fontSize: '9px', cursor: 'none' }}
              >
                {/* Track Info - Single Line */}
                <div className="font-mono text-alex-accent group-hover:text-alex-bg transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <span className={isCurrentTrack ? 'font-bold' : ''}>{track.title}</span>
                    {track.metadata.featuredArtist && (
                      <>
                        <span className="opacity-50">feat</span>
                        <span className={isCurrentTrack ? 'font-bold' : ''}>{track.metadata.featuredArtist}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
              
              {/* Hover Background - Only covers the button content */}
              <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10 pointer-events-none" />
            </div>
          )
        })
        )}
      </div>
    </div>
  )
}

