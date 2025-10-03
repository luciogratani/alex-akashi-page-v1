import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useTheme, ThemeType } from '../contexts/ThemeContext'

interface ThemeOption {
  id: number
  name: string
  value: ThemeType
}

const themeOptions: ThemeOption[] = [
  { id: 1, name: 'Default (Red)', value: 'default' },
  { id: 2, name: 'Berlin (Dark)', value: 'berlin' },
  { id: 3, name: 'Acid (Green)', value: 'acid' },
  { id: 4, name: 'Furry (Pink)', value: 'furry' },
  { id: 5, name: 'Technoroom', value: 'technoroom' }
]

export default function Theme() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentTheme, setTheme } = useTheme()

  const handleThemeSelect = (theme: ThemeOption) => {
    
    setTheme(theme.value)
    setIsOpen(false)
  }

  return (
    <div className="absolute top-8 right-40 z-50 flex flex-col items-end">
      {/* Theme Header - Toggle Button */}
      <button
        onClick={() => {
          
          setIsOpen(!isOpen)
        }}
        
        className="relative flex items-center gap-2 px-2 py-1 transition-all duration-200 group bg-transparent border-none"
        style={{ fontSize: '9px', cursor: 'none' }}
      >
        <span className="font-mono text-alex-accent group-hover:text-alex-bg transition-colors duration-200 font-bold">
          THEME
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

      {/* Dropdown - Theme Options */}
      <div 
        className={`flex flex-col items-end gap-2 mt-2 transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {themeOptions.map((theme) => (
          <div key={theme.id} className="relative group">
            <button
              onClick={() => handleThemeSelect(theme)}
              
              className="flex items-center gap-3 px-2 py-1 transition-all duration-200 bg-transparent border-none"
              style={{ fontSize: '9px', cursor: 'none' }}
            >
              {/* Theme Info */}
              <div className={`font-mono transition-colors duration-200 ${
                currentTheme === theme.value 
                  ? 'text-alex-bg bg-alex-accent' 
                  : 'text-alex-accent group-hover:text-alex-bg'
              }`}>
                <span>{theme.name}</span>
              </div>
            </button>
            
            {/* Hover Background - Only covers the button content */}
            <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
