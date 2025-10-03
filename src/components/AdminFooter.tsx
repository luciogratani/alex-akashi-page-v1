import { useState, useEffect } from 'react'
import { Database, HardDrive, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface SystemError {
  type: 'database' | 'storage'
  message: string
  suggestion: string
}

export default function AdminFooter() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [storageStatus, setStorageStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [errors, setErrors] = useState<SystemError[]>([])
  const [showErrorLog, setShowErrorLog] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const addError = (type: 'database' | 'storage', message: string, suggestion: string) => {
    const newError: SystemError = { type, message, suggestion }
    setErrors(prev => {
      // Avoid duplicate errors
      const exists = prev.some(e => e.type === type && e.message === message)
      if (!exists) {
        return [...prev, newError]
      }
      return prev
    })
  }

  const removeError = (type: 'database' | 'storage') => {
    setErrors(prev => prev.filter(e => e.type !== type))
  }

  const checkStatus = async () => {
    // Check database connection
    try {
      const { error } = await supabase
        .from('tracks')
        .select('id', { count: 'exact', head: true })

      if (error) {
        setDbStatus('error')
        addError('database', 
          `Database connection failed: ${error.message}`, 
          'Please check your Supabase configuration and contact support if the issue persists.'
        )
      } else {
        setDbStatus('connected')
        removeError('database')
      }
    } catch (err) {
      setDbStatus('error')
      addError('database', 
        `Database connection error: ${err instanceof Error ? err.message : 'Unknown error'}`, 
        'Please verify your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
      )
    }

    // Check storage connection
    try {
      const { error } = await supabase.storage
        .from('audio-files')
        .list('', { limit: 1 })

      if (error) {
        setStorageStatus('error')
        addError('storage', 
          `Storage connection failed: ${error.message}`, 
          'Please check your Supabase Storage configuration and ensure the audio-files bucket exists.'
        )
      } else {
        setStorageStatus('connected')
        removeError('storage')
      }
    } catch (err) {
      setStorageStatus('error')
      addError('storage', 
        `Storage connection error: ${err instanceof Error ? err.message : 'Unknown error'}`, 
        'Please verify your Supabase Storage setup and contact support if needed.'
      )
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={16} className="text-alex-accent" />
      case 'error':
        return <XCircle size={16} className="text-alex-accent" />
      default:
        return <div className="w-4 h-4 border-2 border-alex-accent border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Error'
      default:
        return 'Checking...'
    }
  }

  return (
    <>
      {/* Error Log Modal */}
      {showErrorLog && (
        <div className="fixed inset-0 bg-alex-bg/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-alex-bg border border-alex-accent p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono text-alex-accent">SYSTEM ERROR LOG</h3>
              <button
                onClick={() => setShowErrorLog(false)}
                className="text-alex-subtitle hover:text-alex-accent transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            {errors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-alex-accent mb-4" />
                <p className="text-alex-subtitle font-mono">No system errors detected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {errors.map((error, index) => (
                  <div key={index} className="border border-alex-accent/20 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-alex-accent mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-mono text-alex-accent text-sm mb-2">
                          {error.type.toUpperCase()} ERROR
                        </h4>
                        <p className="text-alex-subtitle font-mono text-sm mb-2">
                          {error.message}
                        </p>
                        <p className="text-alex-subtitle font-mono text-xs">
                          <strong>Suggestion:</strong> {error.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowErrorLog(false)}
                className="px-4 py-2 bg-alex-accent text-alex-bg font-mono text-sm hover:opacity-80 transition-opacity"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Fixed to bottom */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-alex-accent/20 bg-alex-bg/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - System Status */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-alex-accent" />
                <span className="text-alex-subtitle font-mono text-sm">Database:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(dbStatus)}
                  <span className="text-alex-subtitle font-mono text-sm">
                    {getStatusText(dbStatus)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-alex-accent" />
                <span className="text-alex-subtitle font-mono text-sm">Storage:</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(storageStatus)}
                  <span className="text-alex-subtitle font-mono text-sm">
                    {getStatusText(storageStatus)}
                  </span>
                </div>
              </div>


              {/* Error Log Button */}
              {errors.length > 0 && (
                <button
                  onClick={() => setShowErrorLog(true)}
                  className="flex items-center gap-1 px-2 py-1 border border-alex-accent text-alex-accent font-mono text-xs hover:bg-alex-accent hover:text-alex-bg transition-colors"
                >
                  <AlertTriangle size={12} />
                  {errors.length} ERROR{errors.length > 1 ? 'S' : ''}
                </button>
              )}
            </div>

            {/* Right side - Info */}
            <div className="flex items-center gap-6">
              <div className="text-alex-subtitle font-mono text-sm">
                Alex Akashi Music Admin
              </div>
              <div className="text-alex-subtitle font-mono text-sm">
                v1.0.0
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
