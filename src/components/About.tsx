import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { analyticsService } from '../lib/analyticsService'
import { useTheme } from '../contexts/ThemeContext'

interface AboutSlide {
  id: number
  title: string
  content: string
}

const aboutSlides: AboutSlide[] = [
  {
    id: 1,
    title: 'DEVELOPMENT/DESIGN',
    content: 'This website was created by Lucio Gratani, creative WebDev. Bold and minimalist aesthetic inspired by Don’t Stop by Alex Akashi. Follow me on Instagram for more spam content and collaborations.'
  },
  {
    id: 2,
    title: 'TECHNOLOGIES',
    content: 'Website developed with React, TypeScript, and Three.js. Audio synchronization and interactive elements created for immersive user experience. All tracks mastered by BMT. Kick synchronization technology for real-time visual feedback.'
  },
  {
    id: 3,
    title: 'STATISTICS',
    content: 'TOTAL PLAYS: 0\nUNIQUE VISITORS: 0\nLISTENING TIME: 0 min\n\nTOP TRACKS:\nNo data available'
  },
  {
    id: 4,
    title: 'CREDITS',
    content: "All music is created by Alex Akashi and mastered by BMT @bmt_techno. Main logo is designed by Christopher Dickey. Noise effect is created by David Haz (Reactbits.dev)."
  }
]

interface AboutProps {
  onOpenChange?: (isOpen: boolean) => void
  openMenuComponent: string | null
  onMenuComponentChange: (componentName: string | null) => void
}

export default function About({ onOpenChange, openMenuComponent, onMenuComponentChange }: AboutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [typedTitle, setTypedTitle] = useState('')
  const [typedContent, setTypedContent] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [statistics, setStatistics] = useState({
    totalPlays: 0,
    uniqueVisitors: 0,
    totalListeningTime: 0,
    topTracks: [] as Array<{ track_id: number; play_count: number; track_title: string; track_artist: string }>
  })
  const { themeColors } = useTheme()

  // Genera il cursore crosshair con il colore del tema
  const getCrosshairCursor = () => {
    const svg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 0v16M8 0v16M0 8h16M0 8h16" stroke="${themeColors.accent}" stroke-width="1"/>
    </svg>`
    return `url("data:image/svg+xml;base64,${btoa(svg)}") 8 8, auto`
  }

  const loadStatistics = async () => {
    try {
      const stats = await analyticsService.getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  // Carica le statistiche all'apertura di About
  useEffect(() => {
    if (isOpen) {
      loadStatistics()
    }
  }, [isOpen])

  // Chiudi About se viene aperto un altro componente del menu
  useEffect(() => {
    if (isOpen && openMenuComponent !== 'about' && openMenuComponent !== null) {
      setIsOpen(false)
      setIsTyping(false)
      setTypedTitle('')
      setTypedContent('')
      if (onOpenChange) onOpenChange(false)
    }
  }, [openMenuComponent, isOpen, onOpenChange])

  const handleAboutClick = () => {
    
    setIsOpen(true)
    setCurrentSlide(0) // Reset to first slide when opening
    setIsTyping(true)
    setTypedTitle('')
    setTypedContent('')
    if (onOpenChange) onOpenChange(true)
    onMenuComponentChange('about')
  }

  const handleCloseClick = () => {
    
    setIsOpen(false)
    setIsTyping(false)
    setTypedTitle('')
    setTypedContent('')
    if (onOpenChange) onOpenChange(false)
    onMenuComponentChange(null)
  }

  const handleNextSlide = () => {
    
    setCurrentSlide((prev) => (prev + 1) % aboutSlides.length)
    setIsTyping(true)
    setTypedTitle('')
    setTypedContent('')
  }

  const handlePrevSlide = () => {
    
    setCurrentSlide((prev) => (prev - 1 + aboutSlides.length) % aboutSlides.length)
    setIsTyping(true)
    setTypedTitle('')
    setTypedContent('')
  }

  // Genera il contenuto dinamico per le statistiche
  const getStatisticsContent = () => {
    let content = `TOTAL PLAYS: ${statistics.totalPlays}\nUNIQUE VISITORS: ${statistics.uniqueVisitors}\nLISTENING TIME: ${Math.floor(statistics.totalListeningTime / 60)} min`
    
    // Top tracks
    if (statistics.topTracks.length > 0) {
      content += `\n\nTOP TRACKS:\n`
      statistics.topTracks.forEach((track, index) => {
        content += `${index + 1}. ${track.track_title} by ${track.track_artist} - ${track.play_count} plays\n`
      })
    } else {
      content += `\n\nTOP TRACKS:\nNo data available`
    }
    
    return content
  }

  // Usa il contenuto originale per il typing effect, poi aggiorna solo quando necessario
  const currentSlideData = aboutSlides[currentSlide]

  // Terminal typing effect
  useEffect(() => {
    if (!isTyping) return

    let titleIndex = 0
    let contentIndex = 0
    let titleTimeout: NodeJS.Timeout
    let contentTimeout: NodeJS.Timeout

    const typeTitle = () => {
      if (titleIndex < currentSlideData.title.length) {
        setTypedTitle(currentSlideData.title.slice(0, titleIndex + 1))
        titleIndex++
        titleTimeout = setTimeout(typeTitle, 30) // Typing speed
      } else {
        // Start typing content after title is done
        setTimeout(() => {
          const typeContent = () => {
            // Per la slide STATISTICS, usa il contenuto dinamico dopo il typing
            const contentToType = currentSlide === 2 ? getStatisticsContent() : currentSlideData.content
            
            if (contentIndex < contentToType.length) {
              setTypedContent(contentToType.slice(0, contentIndex + 1))
              contentIndex++
              contentTimeout = setTimeout(typeContent, 20) // Faster for content
            } else {
              setIsTyping(false)
            }
          }
          typeContent()
        }, 200)
      }
    }

    typeTitle()

    return () => {
      clearTimeout(titleTimeout)
      clearTimeout(contentTimeout)
    }
  }, [currentSlide, isTyping, currentSlideData, statistics]) // Aggiungiamo statistics come dipendenza

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <>
      <div className="relative flex flex-col items-end">
        {/* About Button */}
        <button
          onClick={handleAboutClick}
          
          className="relative flex items-center gap-2 px-2 py-1 transition-all duration-200 group bg-transparent border-none"
          style={{ fontSize: '9px', cursor: 'none' }}
        >
          <span className="font-mono text-alex-accent group-hover:text-alex-bg transition-colors duration-200 font-bold">
            ABOUT
          </span>
          
          {/* Hover Background */}
          <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
        </button>
      </div>

      {/* About Modal - Treated as a "column" like Crosshair */}
      {isOpen && (
        <div 
          className="fixed top-0 left-0 w-2/3 h-full z-[100] pointer-events-auto bg-black bg-opacity-10"
          onClick={handleCloseClick}
          style={{ 
            cursor: getCrosshairCursor()
          }}
        >
          {/* Modal Content - Centered in Column 1 */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-alex-bg border-2 border-alex-accent"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Top Right */}
            <button
              onClick={handleCloseClick}
              
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center transition-all duration-200 group bg-transparent border-none"
              style={{ cursor: 'none' }}
            >
              <X 
                size={16}
                className="text-alex-accent group-hover:text-alex-bg transition-all duration-200 relative z-10"
              />
              {/* Hover Background */}
              <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>

            {/* Modal Content */}
            <div className="p-8 pt-14 pb-14 h-full flex flex-col">
              {/* Terminal Header */}
              <div className="text-center">
                <div className="font-mono text-alex-accent font-bold" style={{ fontSize: '9px' }}>
                  alex-akashi@terminal:~$ ./about --verbose
                </div>
              </div>

              {/* Current Slide Content */}
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <h3 className="font-mono text-alex-accent font-bold mb-6 mt-4" style={{ fontSize: '9px' }}>
                  {typedTitle}
                  {showCursor && isTyping && <span className="text-alex-accent animate-pulse">|</span>}
                </h3>
                {currentSlide === 2 ? (
                  <pre className="font-mono text-alex-text leading-relaxed max-w-sm" style={{ fontSize: '9px', lineHeight: '1.6' }}>
                    {typedContent}
                    {!isTyping && typedContent.length > 0 && <span className="text-alex-text animate-pulse">|</span>}
                  </pre>
                ) : (
                  <p className="font-mono text-alex-text leading-relaxed max-w-sm" style={{ fontSize: '9px', lineHeight: '1.6' }}>
                    {typedContent}
                    {!isTyping && typedContent.length > 0 && <span className="text-alex-text animate-pulse">|</span>}
                    {currentSlide === 0 && !isTyping && typedContent.length > 0 && (
                      <div className="mt-4">
                        <a 
                          href="https://instagram.com/luciogratani" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-mono text-alex-accent hover:text-alex-bg transition-colors duration-200 underline"
                          style={{ fontSize: '9px' }}
                          
                        >
                          @luciogratani
                        </a>
                      </div>
                    )}
                  </p>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-center gap-6">
                {/* Previous Button */}
                <button
                  onClick={handlePrevSlide}
                  
                  className="relative flex items-center justify-center w-8 h-8 transition-all duration-200 group bg-transparent border-none"
                  style={{ cursor: 'none' }}
                >
                  <ChevronUp 
                    size={20}
                    className="text-alex-accent group-hover:text-alex-bg transition-all duration-200 relative z-10"
                  />
                  {/* Hover Background */}
                  <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>

                {/* Slide Indicator */}
                <div className="font-mono text-alex-accent" style={{ fontSize: '9px' }}>
                  {currentSlide + 1}/{aboutSlides.length}
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNextSlide}
                  
                  className="relative flex items-center justify-center w-8 h-8 transition-all duration-200 group bg-transparent border-none"
                  style={{ cursor: 'none' }}
                >
                  <ChevronDown 
                    size={20}
                    className="text-alex-accent group-hover:text-alex-bg transition-all duration-200 relative z-10"
                  />
                  {/* Hover Background */}
                  <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
