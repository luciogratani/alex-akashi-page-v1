import { useState, useRef, useEffect } from 'react'
import { Upload, X, FileAudio, CheckCircle, AlertCircle } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'

interface AudioUploadProps {
  onUploadComplete: (trackData: any) => void
}

export default function AudioUpload({ onUploadComplete }: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [trackMetadata, setTrackMetadata] = useState({
    title: '',
    artist: '',
    featured_artist: '',
    bpm: 120,
    key: 'C major',
    year: new Date().getFullYear(),
    genre: 'Electronic',
    master_engineer: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.type) {
      const timer = setTimeout(() => {
        setNotification({ type: null, message: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const audioFile = files.find(file => 
      file.type.startsWith('audio/') && 
      ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a'].includes(file.type)
    )
    
    if (audioFile) {
      setSelectedFile(audioFile)
      // Auto-fill title from filename
      const title = audioFile.name.replace(/\.[^/.]+$/, '')
      setTrackMetadata(prev => ({ ...prev, title }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const title = file.name.replace(/\.[^/.]+$/, '')
      setTrackMetadata(prev => ({ ...prev, title }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Check if admin client is available
      if (!supabaseAdmin) {
        throw new Error('Admin client not configured. Please check VITE_SUPABASE_SERVICE_ROLE_KEY')
      }

      // Test admin connection
      console.log('Testing admin connection...')
      const { error: testError } = await supabaseAdmin
        .from('tracks')
        .select('count', { count: 'exact', head: true })
      
      if (testError) {
        console.error('Admin connection test failed:', testError)
        throw new Error(`Admin connection failed: ${testError.message}`)
      }
      console.log('Admin connection successful')

      // Use original filename
      const fileName = selectedFile.name
      const filePath = fileName

      // Upload to Supabase Storage using admin client
      setUploadProgress(25)
      const { error: uploadError } = await supabaseAdmin.storage
        .from('audio-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }
      setUploadProgress(50)

      // Get public URL using admin client
      setUploadProgress(60)
      const { data: urlData } = supabaseAdmin.storage
        .from('audio-files')
        .getPublicUrl(filePath)

      // Get next order_position (highest + 1)
      const { data: maxOrderData } = await supabaseAdmin
        .from('tracks')
        .select('order_position')
        .order('order_position', { ascending: false })
        .limit(1)
      
      const nextOrderPosition = (maxOrderData?.[0]?.order_position || 0) + 1

      // Create track in database using admin client
      setUploadProgress(75)
      const { data: trackData, error: trackError } = await supabaseAdmin
        .from('tracks')
        .insert({
          title: trackMetadata.title,
          artist: trackMetadata.artist,
          featured_artist: trackMetadata.featured_artist || null,
          bpm: trackMetadata.bpm,
          key: trackMetadata.key,
          year: trackMetadata.year,
          master_engineer: trackMetadata.master_engineer || null,
          genre: trackMetadata.genre,
          duration: 0, // Will be updated after audio analysis
          audio_file_path: urlData.publicUrl,
          is_active: true,
          order_position: nextOrderPosition
        })
        .select()
        .single()

      if (trackError) {
        throw trackError
      }
      setUploadProgress(90)

      // Get actual duration from audio file
      const audio = new Audio(urlData.publicUrl)
      const duration = await new Promise<number>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(Math.floor(audio.duration))
        })
        audio.addEventListener('error', () => {
          resolve(0) // Fallback to 0 if audio fails to load
        })
      })
      
      // Update track with actual duration using admin client
      await supabaseAdmin
        .from('tracks')
        .update({ duration })
        .eq('id', trackData.id)

      setUploadProgress(100)
      
      // Small delay to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Show success message
      showNotification('success', `Track "${trackMetadata.title}" has been uploaded successfully!`)
      
      onUploadComplete(trackData)
      
      // Reset form
      setSelectedFile(null)
      setTrackMetadata({
        title: '',
        artist: '',
        featured_artist: '',
        bpm: 120,
        key: 'C major',
        year: new Date().getFullYear(),
        genre: 'Electronic',
        master_engineer: ''
      })

    } catch (error: any) {
      console.error('Upload error:', error)
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        error: error?.error,
        details: error?.details
      })
      
      let errorMessage = 'Upload failed'
      if (error?.message) {
        errorMessage += `: ${error.message}`
      } else if (error?.error) {
        errorMessage += `: ${error.error}`
      } else {
        errorMessage += ': Unknown error occurred'
      }
      
      showNotification('error', errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragging 
            ? 'border-alex-accent bg-alex-accent/10' 
            : 'border-alex-accent/40 hover:border-alex-accent/60'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-alex-accent">
              <FileAudio size={24} />
              <span className="font-mono">{selectedFile.name}</span>
              <button
                onClick={removeFile}
                
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-alex-subtitle font-mono text-sm">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload size={48} className="mx-auto text-alex-accent/60" />
            <div>
              <p className="text-alex-accent font-mono mb-2">
                Drag & drop your audio file here
              </p>
              <p className="text-alex-subtitle font-mono text-sm mb-4">
                Supported formats: MP3, WAV, M4A
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                
                className="px-4 py-2 border border-alex-accent text-alex-accent font-mono text-sm hover:bg-alex-accent hover:text-alex-bg transition-colors"
              >
                SELECT FILE
              </button>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/mp4,audio/m4a"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-alex-subtitle font-mono text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-alex-accent/20 rounded-full h-2">
            <div 
              className="bg-alex-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Track Metadata Form */}
      {selectedFile && (
        <div className="space-y-4">
          <h3 className="text-alex-accent font-mono text-lg">TRACK METADATA</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                TITLE *
              </label>
              <input
                type="text"
                value={trackMetadata.title}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, title: e.target.value }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                ARTIST *
              </label>
              <input
                type="text"
                value={trackMetadata.artist}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, artist: e.target.value }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                FEATURED ARTIST
              </label>
              <input
                type="text"
                value={trackMetadata.featured_artist}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, featured_artist: e.target.value }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
              />
            </div>

            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                BPM *
              </label>
              <input
                type="number"
                value={trackMetadata.bpm}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                min="60"
                max="200"
                required
              />
            </div>

            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                KEY *
              </label>
              <input
                type="text"
                value={trackMetadata.key}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, key: e.target.value }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                placeholder="C major"
                required
              />
            </div>

            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                YEAR *
              </label>
              <input
                type="number"
                value={trackMetadata.year}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                min="1900"
                max="2030"
                required
              />
            </div>

            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                GENRE *
              </label>
              <input
                type="text"
                value={trackMetadata.genre}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, genre: e.target.value }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-alex-accent font-mono text-sm mb-2">
                MASTER ENGINEER
              </label>
              <input
                type="text"
                value={trackMetadata.master_engineer}
                onChange={(e) => setTrackMetadata(prev => ({ ...prev, master_engineer: e.target.value }))}
                
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading || !trackMetadata.title || !trackMetadata.artist}
              
              className="px-6 py-2 bg-alex-accent text-alex-bg font-mono text-sm hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {uploading ? 'UPLOADING...' : 'UPLOAD TRACK'}
            </button>
          </div>
        </div>
      )}

      {/* Custom Notification */}
      {notification.type && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 border font-mono text-sm transition-all duration-300 transform ${
          notification.type === 'success'
            ? 'bg-alex-bg border-alex-accent text-alex-accent'
            : 'bg-alex-bg border-red-400 text-red-400'
        } ${notification.type ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle size={20} className="text-alex-accent" />
            ) : (
              <AlertCircle size={20} className="text-red-400" />
            )}
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification({ type: null, message: '' })}
              className={`hover:opacity-70 transition-opacity ${
                notification.type === 'success' ? 'text-alex-accent' : 'text-red-400'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
