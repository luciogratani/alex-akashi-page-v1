import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface AboutSlide {
  id: number
  title: string
  content: string
}

const aboutSlides: AboutSlide[] = [
  {
    id: 1,
    title: 'DEVELOPMENT/DESIGN',
    content: 'This website was created by Lucio Gratani, creative WebDev. Minimalist aesthetic inspired by Alex and electronic music culture. Follow me on Instagram for more spam content and collaborations.'
  },
  {
    id: 2,
    title: 'TECHNOLOGIES',
    content: 'Website developed with React, TypeScript, and Three.js. Audio synchronization and interactive elements created for immersive user experience. All tracks mastered by BMT. Kick synchronization technology for real-time visual feedback.'
  },
  {
    id: 3,
    title: 'STATISTICS',
    content: '┌─────────────────────┬─────────┐\n│ METRIC              │ VALUE   │\n├─────────────────────┼─────────┤\n│ TOTAL PLAYS         │ 0       │\n│ UNIQUE VISITORS     │ 0       │\n│ LISTENING TIME      │ 0 min   │\n│ AVG SESSION         │ 0 min   │\n└─────────────────────┴─────────┘\n\n● LIVE TRACKING ACTIVE'
  },
  {
    id: 4,
    title: 'CREDITS',
    content: "All music is created by Alex Akashi and mastered by BMT @bmt_techno. Main logo is designed by Christopher Dickey. Noise effect is created by David Haz (Reactbits.dev)."
  }
]

interface AboutProps {
  onOpenChange?: (isOpen: boolean) => void
}

export default function About({ onOpenChange }: AboutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [typedTitle, setTypedTitle] = useState('')
  const [typedContent, setTypedContent] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  const handleAboutClick = () => {
    
    setIsOpen(true)
    setCurrentSlide(0) // Reset to first slide when opening
    setIsTyping(true)
    setTypedTitle('')
    setTypedContent('')
    if (onOpenChange) onOpenChange(true)
  }

  const handleCloseClick = () => {
    
    setIsOpen(false)
    setIsTyping(false)
    setTypedTitle('')
    setTypedContent('')
    if (onOpenChange) onOpenChange(false)
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
            if (contentIndex < currentSlideData.content.length) {
              setTypedContent(currentSlideData.content.slice(0, contentIndex + 1))
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
  }, [currentSlide, isTyping, currentSlideData])

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <>
      <div className="absolute top-8 right-56 z-50 flex flex-col items-end">
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
          className="absolute inset-0 z-[100] pointer-events-auto bg-black bg-opacity-5"
          onClick={handleCloseClick}
          style={{ 
            cursor: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMHYxNk04IDB2MTZNMCA4aDE2TTAgOGgxNiIgc3Ryb2tlPSIjQ0EyRDJFIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9zdmc+Cg==") 8 8, auto'
          }}
        >
          {/* Modal Content - Same aspect ratio as column 1 */}
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
