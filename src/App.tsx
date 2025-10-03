import ThreeScene from './components/ThreeScene'
import Noise from './components/Noise'
import Crosshair from './components/Crosshair'
import AudioPlayer from './components/AudioPlayer'
import ScrollingText from './components/ScrollingText'
import Playlist from './components/Playlist'
import Contacts from './components/Contacts'
import About from './components/About'
import Theme from './components/Theme'
import Bio from './components/Bio'
import ControlsGuide from './components/ControlsGuide'
import LoadingScreen from './components/LoadingScreen'
import SupabaseTest from './components/SupabaseTest'
import CacheStats from './components/CacheStats'
import { ThemeProvider } from './contexts/ThemeContext'
import { useState, useRef, useEffect } from 'react'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [column1Hovered, setColumn1Hovered] = useState(false)
  const [column1MousePosition, setColumn1MousePosition] = useState({ x: 0, y: 0 })
  const [isClicked, setIsClicked] = useState(false)
  const [column1Clicked, setColumn1Clicked] = useState(false)
  const [kickActive, setKickActive] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackId, setCurrentTrackId] = useState(1)
  const [currentTrackMetadata, setCurrentTrackMetadata] = useState<any>(null)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const togglePlayPauseRef = useRef<(() => void) | null>(null)
  
  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5 // -0.5 to 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5 // -0.5 to 0.5
    
    // Update cursor position for visual cursor
    setCursorPosition({ 
      x: event.clientX - rect.left, 
      y: event.clientY - rect.top 
    })
    
    // Update mouse position for parallax (only when hovered)
    if (isHovered) {
      setMousePosition({ x, y })
    }
  }
  
  const handleColumn1MouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setColumn1MousePosition({ x, y })
  }

  const handleColumn1MouseDown = () => {
    setColumn1Clicked(true)
  }

  const handleColumn1MouseUp = () => {
    setColumn1Clicked(false)
  }

  const handleColumn2MouseDown = () => {
    setIsClicked(true)
  }

  const handleColumn2MouseUp = () => {
    setIsClicked(false)
  }

  // Spacebar listener for play/pause
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if spacebar and not in an input field or textarea
      if (event.code === 'Space') {
        const target = event.target as HTMLElement
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
        
        if (!isInputField) {
          event.preventDefault() // Prevent page scroll
          if (togglePlayPauseRef.current) {
            togglePlayPauseRef.current()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle track selection
  const handleTrackSelect = (trackId: number) => {
    setCurrentTrackId(trackId)
    // TODO: Load new track file when implemented
    console.log(`Selected track ${trackId}`)
  }
  
  return (
    <ThemeProvider>
      <div className="bg-alex-bg">
        {/* Loading Screen */}
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      
      {/* Hero Container - Full Screen */}
      <div className="w-screen h-screen bg-alex-bg flex overflow-hidden">
        {/* Column 1 - 66% width, anchored left */}
        <div 
          className={`
            flex flex-col items-center justify-center relative
            transition-all duration-500 ease-in-out
            ${isFullscreen ? 'w-0 opacity-0 overflow-hidden pointer-events-none' : 'w-2/3'}
          `}
          onMouseEnter={() => setColumn1Hovered(true)}
          onMouseLeave={() => setColumn1Hovered(false)}
          onMouseMove={handleColumn1MouseMove}
          onMouseDown={handleColumn1MouseDown}
          onMouseUp={handleColumn1MouseUp}
          style={{ cursor: 'none' }}
        >
          
          {/* Custom Crosshair Cursor for Column 1 */}
          <Crosshair 
            isVisible={column1Hovered && !isAboutOpen} 
            mousePosition={column1MousePosition}
            isClicked={column1Clicked}
          />

          {/* Audio Player - Inside Column 1 */}
          <AudioPlayer 
            onKick={setKickActive} 
            audioRef={audioRef}
            onPlayingChange={setIsPlaying}
            togglePlayPauseRef={togglePlayPauseRef}
            currentTrackId={currentTrackId}
            onMetadataChange={setCurrentTrackMetadata}
          />

          {/* Playlist - Top Right */}
          <Playlist 
            currentTrackId={currentTrackId}
            onTrackSelect={handleTrackSelect}
          />

          {/* Contacts - Top Right, next to Playlist */}
          <Contacts />

          {/* Theme - Top Right, between Contacts and About */}
          <Theme />

          {/* About - Top Right, between Theme and Playlist */}
          <About onOpenChange={setIsAboutOpen} />

          {/* Controls Guide - Bottom Left */}
          <ControlsGuide />

          {/* Bio - Center */}
          <div className="flex-1 flex items-center justify-center">
            <Bio />
          </div>

          {/* Scrolling Text - Bottom */}
          <div className="absolute bottom-0 left-0 w-full">
            <ScrollingText audioRef={audioRef} isPlaying={isPlaying} currentTrackMetadata={currentTrackMetadata} />
          </div>
        </div>
        
        {/* Supabase Test Component - Temporary */}
        <SupabaseTest />
        
        {/* Cache Stats Component - Temporary */}
        <CacheStats />
        
        {/* Vertical Separator */}
        <div className={`w-px h-full bg-alex-subtitle transition-opacity duration-500 ${isFullscreen ? 'opacity-0' : 'opacity-100'}`}></div>
        
        {/* Column 2 - 33% width, anchored right */}
        <div 
          className={`
            flex items-center justify-center relative overflow-hidden
            transition-all duration-500 ease-in-out
            ${isFullscreen ? 'w-full z-50' : 'w-1/3 z-0'}
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={handleMouseMove}
          onMouseDown={handleColumn2MouseDown}
          onMouseUp={handleColumn2MouseUp}
          style={{ cursor: 'none' }}
        >
          <ThreeScene 
            isHovered={isHovered} 
            mousePosition={mousePosition} 
            kickActive={kickActive}
            isFullscreen={isFullscreen}
            onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
            isLoaded={!isLoading}
            isPlaying={isPlaying}
          />
          <Noise 
            patternSize={200}
            patternScaleX={2}
            patternScaleY={2}
            patternAlpha={22}
          />
          
          {/* Custom Crosshair Cursor for Column 2 */}
          <Crosshair 
            isVisible={isHovered && !isAboutOpen} 
            mousePosition={cursorPosition}
            isClicked={isClicked}
          />
        </div>
      </div>
      
      </div>
    </ThemeProvider>
  )
}

export default App
