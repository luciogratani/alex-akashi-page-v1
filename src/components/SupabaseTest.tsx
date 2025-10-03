import { useState, useEffect } from 'react'
import { audioService } from '../lib/audioService'

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [tracksCount, setTracksCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test database connection
        const connectionResult = await audioService.testConnection()
        
        if (connectionResult.success) {
          setConnectionStatus('success')
          
          // Load tracks to get count
          const tracks = await audioService.getAllTracks()
          setTracksCount(tracks.length)
        } else {
          setConnectionStatus('error')
          setError(connectionResult.error || 'Unknown error')
        }
      } catch (err) {
        setConnectionStatus('error')
        setError(err instanceof Error ? err.message : 'Connection failed')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg font-mono text-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'testing' ? 'bg-yellow-400 animate-pulse' :
          connectionStatus === 'success' ? 'bg-green-400' : 'bg-red-400'
        }`} />
        <span>Supabase Status:</span>
        <span className={
          connectionStatus === 'success' ? 'text-green-400' : 
          connectionStatus === 'error' ? 'text-red-400' : 'text-yellow-400'
        }>
          {connectionStatus.toUpperCase()}
        </span>
      </div>
      
      {connectionStatus === 'success' && (
        <div className="text-green-400">
          Tracks loaded: {tracksCount}
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="text-red-400">
          Error: {error}
        </div>
      )}
    </div>
  )
}
