import { supabase } from './supabase'
import { Analytics } from './supabase'

class AnalyticsService {
  private sessionId: string
  private currentTrackId?: number
  private playStartTime?: number
  private totalListeningTime: number = 0
  private hasTrackedCurrentPlay: boolean = false
  private listeningTimer?: NodeJS.Timeout

  constructor() {
    // Genera un session ID unico per questa sessione
    this.sessionId = this.generateSessionId()
    
    // Traccia l'inizio della sessione
    this.trackEvent('session_start')
    
    // Traccia pause finale quando l'utente chiude la pagina
    window.addEventListener('beforeunload', () => {
      if (this.playStartTime && this.currentTrackId) {
        const listeningDuration = Math.floor((Date.now() - this.playStartTime) / 1000)
        // Usa sendBeacon per garantire l'invio
        this.trackEventWithBeacon('pause', this.currentTrackId, listeningDuration)
      }
    })
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private startListeningTimer(): void {
    this.clearListeningTimer()
    
    // Traccia tempo di ascolto ogni 30 secondi (tempo incrementale)
    this.listeningTimer = setInterval(() => {
      if (this.currentTrackId && this.playStartTime) {
        // Traccia solo 30 secondi incrementali, non il tempo totale
        this.trackEvent('listening_time', this.currentTrackId, 30)
      }
    }, 30000) // Ogni 30 secondi
  }

  private clearListeningTimer(): void {
    if (this.listeningTimer) {
      clearInterval(this.listeningTimer)
      this.listeningTimer = undefined
    }
  }


  private async trackEvent(
    eventType: Analytics['event_type'], 
    trackId?: number, 
    durationSeconds?: number
  ): Promise<void> {
    try {
      const analyticsData: Partial<Analytics> = {
        session_id: this.sessionId,
        event_type: eventType,
        track_id: trackId,
        timestamp: new Date().toISOString(),
        duration_seconds: durationSeconds,
        user_agent: navigator.userAgent,
        // Nota: IP address non è disponibile dal frontend per privacy
      }

      const { error } = await supabase
        .from('analytics')
        .insert([analyticsData])

      if (error) {
        console.error('Analytics tracking error:', error)
      } else {
        console.log(`📊 Analytics: ${eventType} tracked`)
      }
    } catch (err) {
      console.error('Analytics service error:', err)
    }
  }

  private trackEventWithBeacon(
    eventType: Analytics['event_type'], 
    trackId?: number, 
    durationSeconds?: number
  ): void {
    try {
      const analyticsData: Partial<Analytics> = {
        session_id: this.sessionId,
        event_type: eventType,
        track_id: trackId,
        timestamp: new Date().toISOString(),
        duration_seconds: durationSeconds,
        user_agent: navigator.userAgent,
      }

      if (navigator.sendBeacon) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics`
        const data = JSON.stringify([analyticsData])
        const success = navigator.sendBeacon(url, data)
        if (success) {
          console.log(`📊 Analytics: ${eventType} tracked via beacon`)
        }
      }
    } catch (err) {
      console.error('Analytics beacon error:', err)
    }
  }

  // Traccia quando inizia la riproduzione di una traccia
  trackPlay(trackId: number): void {
    // Evita doppio tracking se è la stessa traccia già in riproduzione
    if (this.currentTrackId === trackId && this.hasTrackedCurrentPlay) {
      return
    }
    
    this.currentTrackId = trackId
    this.playStartTime = Date.now()
    this.hasTrackedCurrentPlay = true
    this.trackEvent('play', trackId)
    this.startListeningTimer() // Avvia timer per tracking continuo
  }

  // Traccia quando si mette in pausa
  trackPause(): void {
    this.clearListeningTimer() // Ferma timer di ascolto continuo
    
    if (this.playStartTime && this.currentTrackId) {
      const listeningDuration = Math.floor((Date.now() - this.playStartTime) / 1000)
      this.totalListeningTime += listeningDuration
      this.trackEvent('pause', this.currentTrackId, listeningDuration)
    }
    this.playStartTime = undefined
    this.hasTrackedCurrentPlay = false // Reset flag per permettere nuovo tracking
  }

  // Traccia quando finisce una traccia
  trackTrackEnd(): void {
    this.clearListeningTimer() // Ferma timer di ascolto continuo
    
    if (this.playStartTime && this.currentTrackId) {
      const listeningDuration = Math.floor((Date.now() - this.playStartTime) / 1000)
      this.totalListeningTime += listeningDuration
      this.trackEvent('pause', this.currentTrackId, listeningDuration)
    }
    this.playStartTime = undefined
    this.currentTrackId = undefined
    this.hasTrackedCurrentPlay = false // Reset flag
  }

  // Traccia cambio traccia (pausa automatica della precedente)
  trackTrackChange(newTrackId: number): void {
    this.clearListeningTimer() // Ferma timer precedente
    
    // Se c'è una traccia in riproduzione, traccia la pausa automatica
    if (this.playStartTime && this.currentTrackId && this.currentTrackId !== newTrackId) {
      const listeningDuration = Math.floor((Date.now() - this.playStartTime) / 1000)
      this.totalListeningTime += listeningDuration
      this.trackEvent('pause', this.currentTrackId, listeningDuration)
    }
    
    // Inizia il tracking della nuova traccia
    this.currentTrackId = newTrackId
    this.playStartTime = Date.now()
    this.hasTrackedCurrentPlay = true
    this.trackEvent('play', newTrackId)
    this.startListeningTimer() // Avvia timer per nuova traccia
  }


  // Ottieni le statistiche aggregate
  async getStatistics(): Promise<{
    totalPlays: number
    uniqueVisitors: number
    totalListeningTime: number
    topTracks: Array<{ track_id: number; play_count: number; track_title: string; track_artist: string }>
  }> {
    try {
      // Total plays
      const { count: totalPlays } = await supabase
        .from('analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'play')

      // Unique visitors (sessioni uniche)
      const { data: uniqueSessions } = await supabase
        .from('analytics')
        .select('session_id')
        .eq('event_type', 'session_start')

      const uniqueVisitors = uniqueSessions ? new Set(uniqueSessions.map(s => s.session_id)).size : 0

      // Total listening time (somma di pause + listening_time events)
      const { data: pauseEvents } = await supabase
        .from('analytics')
        .select('duration_seconds')
        .eq('event_type', 'pause')
        .not('duration_seconds', 'is', null)

      const { data: listeningTimeEvents } = await supabase
        .from('analytics')
        .select('duration_seconds')
        .eq('event_type', 'listening_time')
        .not('duration_seconds', 'is', null)

      const pauseTime = pauseEvents 
        ? pauseEvents.reduce((sum, event) => sum + (event.duration_seconds || 0), 0)
        : 0

      const continuousTime = listeningTimeEvents 
        ? listeningTimeEvents.reduce((sum, event) => sum + (event.duration_seconds || 0), 0)
        : 0

      // Usa il valore più alto per evitare doppio conteggio
      const totalListeningTime = Math.max(pauseTime, continuousTime)

      // Top tracks (canzoni più ascoltate) con JOIN per ottenere i nomi
      const { data: topTracksData } = await supabase
        .from('analytics')
        .select(`
          track_id,
          tracks!inner(title, artist)
        `)
        .eq('event_type', 'play')
        .not('track_id', 'is', null)

      // Conta le riproduzioni per traccia
      const trackCounts: { [key: number]: { play_count: number; title: string; artist: string } } = {}
      topTracksData?.forEach(event => {
        if (event.track_id && event.tracks) {
          const trackId = event.track_id
          const trackData = event.tracks as unknown as { title: string; artist: string } // Cast esplicito
          if (!trackCounts[trackId]) {
            trackCounts[trackId] = {
              play_count: 0,
              title: trackData.title,
              artist: trackData.artist
            }
          }
          trackCounts[trackId].play_count++
        }
      })

      // Ordina per numero di riproduzioni e prendi le prime 3
      const topTracks = Object.entries(trackCounts)
        .map(([track_id, data]) => ({
          track_id: parseInt(track_id),
          play_count: data.play_count,
          track_title: data.title,
          track_artist: data.artist
        }))
        .sort((a, b) => b.play_count - a.play_count)
        .slice(0, 3)

      return {
        totalPlays: totalPlays || 0,
        uniqueVisitors,
        totalListeningTime,
        topTracks
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      return {
        totalPlays: 0,
        uniqueVisitors: 0,
        totalListeningTime: 0,
        topTracks: []
      }
    }
  }
}

// Esporta un'istanza singleton
export const analyticsService = new AnalyticsService()
