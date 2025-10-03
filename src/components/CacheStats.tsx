import { useState, useEffect } from 'react'
import { audioService } from '../lib/audioService'

export default function CacheStats() {
  const [stats, setStats] = useState({
    tracksInCache: 0,
    preloadedTracks: 0,
    cacheAge: 0
  })

  useEffect(() => {
    const updateStats = () => {
      // Get cache info from audioService (we'll need to expose this)
      const tracks = (audioService as any).tracksCache || []
      const preloadedTracks = (audioService as any).preloadedTracks || new Set()
      const cacheTimestamp = (audioService as any).cacheTimestamp || 0
      
      setStats({
        tracksInCache: tracks.length,
        preloadedTracks: preloadedTracks.size,
        cacheAge: cacheTimestamp ? Math.floor((Date.now() - cacheTimestamp) / 1000) : 0
      })
    }

    updateStats()
    const interval = setInterval(updateStats, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-white font-mono text-xs">
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span>Metadata Cache:</span>
          <span className="text-green-400">{stats.tracksInCache} tracks</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span>Preloaded Audio:</span>
          <span className="text-blue-400">{stats.preloadedTracks} tracks</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span>Cache Age:</span>
          <span className={stats.cacheAge > 300 ? 'text-yellow-400' : 'text-green-400'}>
            {stats.cacheAge}s
          </span>
        </div>
      </div>
    </div>
  )
}
