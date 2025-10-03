import { createClient } from '@supabase/supabase-js'

// Verifica che le variabili d'ambiente siano definite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Client per operazioni pubbliche (frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client per operazioni admin (con service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// Funzione per testare la connessione
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Supabase connection successful!')
    return { success: true, data }
  } catch (err) {
    console.error('Supabase connection failed:', err)
    return { success: false, error: 'Connection failed' }
  }
}

// Tipi TypeScript per le tabelle
export interface Track {
  id: number
  title: string
  artist: string
  featured_artist?: string
  original_artist?: string
  bpm: number
  key: string
  year: number
  master_engineer?: string
  genre?: string
  duration: number
  release_date?: string
  audio_file_path?: string
  is_active: boolean
  order_position: number
  created_at: string
  updated_at: string
}

export interface TrackEvent {
  id: number
  track_id: number
  event_type: 'kick' | 'snare' | 'hihat'
  timestamp: number
  created_at: string
}

export interface TrackTimeline {
  id: number
  track_id: number
  section_type: 'intro' | 'bridge' | 'outro'
  start_time: number
  end_time: number
  created_at: string
}
