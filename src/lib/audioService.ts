import { supabase } from './supabase'

// Extended interfaces for the frontend
export interface TrackMetadata {
  id: number
  title: string
  artist: string
  featuredArtist?: string
  originalArtist?: string
  bpm: number
  key: string
  year: number
  masterEngineer?: string
  genre?: string
  duration: number
  releaseDate?: string
  audioFilePath?: string
  kicks: number[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TrackData {
  kicks: number[]
  snares: number[]
  hihats: number[]
  duration: number
  timeline: {
    intro: { start: number; end: number }
    bridge: { start: number; end: number }
    outro: { start: number; end: number }
  }
}

export interface CompleteTrack {
  id: number
  artist: string
  title: string
  bpm: number
  key: string
  metadata: TrackMetadata
  trackData: TrackData
}

class AudioService {
  private static instance: AudioService
  private tracksCache: CompleteTrack[] = []
  private cacheTimestamp: number = 0
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
  
  // Audio preloading cache
  private audioPreloadCache: Map<number, string> = new Map()
  private preloadedTracks: Set<number> = new Set()

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService()
    }
    return AudioService.instance
  }

  // Get all active tracks with their complete data
  async getAllTracks(): Promise<CompleteTrack[]> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.tracksCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.tracksCache
    }

    try {
      // Fetch tracks
      const { data: tracks, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true })

      if (tracksError) {
        console.error('Error fetching tracks:', tracksError)
        throw new Error(`Failed to fetch tracks: ${tracksError.message}`)
      }

      if (!tracks || tracks.length === 0) {
        console.warn('No tracks found in database')
        return []
      }

      // Fetch timeline for all tracks (kicks now come from tracks table)
      const trackIds = tracks.map(track => track.id)
      
      const timelineResult = await supabase
        .from('track_timeline')
        .select('*')
        .in('track_id', trackIds)

      if (timelineResult.error) {
        console.error('Error fetching track timeline:', timelineResult.error)
        throw new Error(`Failed to fetch track timeline: ${timelineResult.error.message}`)
      }

      const timeline = timelineResult.data || []

      // Process tracks and build complete track objects
      const completeTracks: CompleteTrack[] = tracks.map(track => {
        const trackTimeline = timeline.filter(tl => tl.track_id === track.id)

        // Get kicks directly from tracks table
        const kicks = track.kicks || []
        const snares: number[] = [] // TODO: Add snares to tracks table if needed
        const hihats: number[] = [] // TODO: Add hihats to tracks table if needed

        // Build timeline object
        const timelineObj = {
          intro: { start: 0, end: 0 },
          bridge: { start: 0, end: 0 },
          outro: { start: 0, end: 0 }
        }

        trackTimeline.forEach(tl => {
          if (tl.section_type === 'intro') {
            timelineObj.intro = { start: tl.start_time, end: tl.end_time }
          } else if (tl.section_type === 'bridge') {
            timelineObj.bridge = { start: tl.start_time, end: tl.end_time }
          } else if (tl.section_type === 'outro') {
            timelineObj.outro = { start: tl.start_time, end: tl.end_time }
          }
        })

        // Convert database track to frontend format
        const metadata: TrackMetadata = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          featuredArtist: track.featured_artist || undefined,
          originalArtist: track.original_artist || undefined,
          bpm: track.bpm,
          key: track.key,
          year: track.year,
          masterEngineer: track.master_engineer || undefined,
          genre: track.genre || undefined,
          duration: track.duration,
          releaseDate: track.release_date || undefined,
          audioFilePath: track.audio_file_path || undefined,
          kicks: kicks,
          isActive: track.is_active,
          createdAt: track.created_at,
          updatedAt: track.updated_at
        }

        const trackData: TrackData = {
          kicks,
          snares,
          hihats,
          duration: track.duration,
          timeline: timelineObj
        }

        return {
          id: track.id,
          artist: track.artist,
          title: track.title,
          bpm: track.bpm,
          key: track.key,
          metadata,
          trackData
        }
      })

      // Cache the results
      this.tracksCache = completeTracks
      this.cacheTimestamp = now

      return completeTracks
    } catch (error) {
      console.error('Error in getAllTracks:', error)
      throw error
    }
  }

  // Get a specific track by ID
  async getTrackById(trackId: number): Promise<CompleteTrack | null> {
    try {
      const tracks = await this.getAllTracks()
      return tracks.find(track => track.id === trackId) || null
    } catch (error) {
      console.error(`Error fetching track ${trackId}:`, error)
      throw error
    }
  }

  // Get audio file URL from Supabase Storage
  getAudioFileUrl(audioFilePath: string): string {
    if (!audioFilePath) {
      throw new Error('Audio file path is required')
    }

    // If it's already a full URL, return as is
    if (audioFilePath.startsWith('http')) {
      return audioFilePath
    }

    // Extract bucket and file path from the stored path
    // Expected format: "audio-files/filename.mp3"
    const pathParts = audioFilePath.split('/')
    if (pathParts.length < 2) {
      throw new Error(`Invalid audio file path format: ${audioFilePath}`)
    }

    const bucket = pathParts[0]
    const fileName = pathParts.slice(1).join('/')

    // Get public URL from Supabase Storage
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // Preload audio file for better performance
  async preloadAudio(trackId: number): Promise<void> {
    if (this.preloadedTracks.has(trackId)) {
      return // Already preloaded
    }

    try {
      const track = await this.getTrackById(trackId)
      if (!track || !track.metadata.audioFilePath) {
        return
      }

      const audioUrl = this.getAudioFileUrl(track.metadata.audioFilePath)
      
      // Create a hidden audio element to preload
      const audio = new Audio()
      audio.preload = 'metadata' // Only load metadata, not the full file
      audio.src = audioUrl
      
      // Store the URL for quick access
      this.audioPreloadCache.set(trackId, audioUrl)
      this.preloadedTracks.add(trackId)
      
      console.log(`Preloaded audio for track ${trackId}`)
    } catch (error) {
      console.warn(`Failed to preload audio for track ${trackId}:`, error)
    }
  }

  // Preload next track in playlist for seamless playback
  async preloadNextTrack(currentTrackId: number): Promise<void> {
    try {
      const tracks = await this.getAllTracks()
      const currentIndex = tracks.findIndex(track => track.id === currentTrackId)
      
      if (currentIndex === -1) return
      
      // Preload next track
      const nextIndex = (currentIndex + 1) % tracks.length
      const nextTrack = tracks[nextIndex]
      
      if (nextTrack) {
        await this.preloadAudio(nextTrack.id)
      }
    } catch (error) {
      console.warn('Failed to preload next track:', error)
    }
  }

  // Get preloaded audio URL (faster than generating new URL)
  getPreloadedAudioUrl(trackId: number): string | null {
    return this.audioPreloadCache.get(trackId) || null
  }

  // Clear cache (useful for admin operations)
  clearCache(): void {
    this.tracksCache = []
    this.cacheTimestamp = 0
    this.audioPreloadCache.clear()
    this.preloadedTracks.clear()
  }

  // Test database connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tracks')
        .select('count')
        .limit(1)
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Connection failed' }
    }
  }
}

// Export singleton instance
export const audioService = AudioService.getInstance()