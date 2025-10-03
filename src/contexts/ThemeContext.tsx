import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Definizione dei temi disponibili
export type ThemeType = 'default' | 'berlin' | 'acid' | 'coastal' | 'furry'

// Definizione della palette di colori per ogni tema
export interface ThemeColors {
  bg: string
  bgGradient: string
  text: string
  accent: string
  subtitle: string
}

// Palette dei temi
export const themePalettes: Record<ThemeType, ThemeColors> = {
  default: {
    bg: '#e3ded2',
    bgGradient: '#B9B6AE',
    text: '#030100',
    accent: '#CA2D2E',
    subtitle: '#757567'
  },
  berlin: {
    bg: '#1a1a1a',
    bgGradient: '#2d2d2d',
    text: '#ffffff',
    accent: '#ff6b35',
    subtitle: '#888888'
  },
  acid: {
    bg: '#0a0a0a',
    bgGradient: '#1a0a1a',
    text: '#00ff00',
    accent: '#ff00ff',
    subtitle: '#00ffff'
  },
  coastal: {
    bg: '#2c2c2c',
    bgGradient: '#404040',
    text: '#e0e0e0',
    accent: '#00d4ff',
    subtitle: '#a0a0a0'
  },
  furry: {
    bg: '#f4e4bc',
    bgGradient: '#e8d5a3',
    text: '#8b4513',
    accent: '#ff8c00',
    subtitle: '#a0522d'
  }
}

// Interfaccia del Context
interface ThemeContextType {
  currentTheme: ThemeType
  setTheme: (theme: ThemeType) => void
  themeColors: ThemeColors
}

// Creazione del Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Props per il Provider
interface ThemeProviderProps {
  children: ReactNode
}

// Provider Component
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Stato del tema corrente
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default')
  
  // Colori del tema corrente
  const themeColors = themePalettes[currentTheme]

  // Funzione per cambiare tema
  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme)
    // Salva nel localStorage per persistenza
    localStorage.setItem('alex-akashi-theme', theme)
    // Applica i colori al DOM
    applyThemeColors(themePalettes[theme])
  }

  // Funzione per applicare i colori CSS
  const applyThemeColors = (colors: ThemeColors) => {
    const root = document.documentElement
    root.style.setProperty('--alex-bg', colors.bg)
    root.style.setProperty('--alex-bg-gradient', colors.bgGradient)
    root.style.setProperty('--alex-text', colors.text)
    root.style.setProperty('--alex-accent', colors.accent)
    root.style.setProperty('--alex-subtitle', colors.subtitle)
  }

  // Funzione per rilevare il dark mode del sistema
  const detectSystemTheme = (): ThemeType => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'berlin'
    }
    return 'default'
  }

  // Carica il tema salvato al mount o rileva il dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('alex-akashi-theme') as ThemeType
    
    if (savedTheme && themePalettes[savedTheme]) {
      // Usa il tema salvato
      setCurrentTheme(savedTheme)
      applyThemeColors(themePalettes[savedTheme])
    } else {
      // Rileva il tema del sistema
      const systemTheme = detectSystemTheme()
      setCurrentTheme(systemTheme)
      applyThemeColors(themePalettes[systemTheme])
      
      // Salva il tema rilevato per la prossima volta
      localStorage.setItem('alex-akashi-theme', systemTheme)
    }
  }, [])

  // Listener per i cambiamenti del dark mode del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Solo se non c'è un tema salvato dall'utente, segui il sistema
      const savedTheme = localStorage.getItem('alex-akashi-theme')
      if (!savedTheme) {
        const newTheme = e.matches ? 'berlin' : 'default'
        setCurrentTheme(newTheme)
        applyThemeColors(themePalettes[newTheme])
        localStorage.setItem('alex-akashi-theme', newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  // Applica i colori quando cambia il tema
  useEffect(() => {
    applyThemeColors(themeColors)
  }, [currentTheme, themeColors])

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    themeColors
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook personalizzato per usare il Context
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
