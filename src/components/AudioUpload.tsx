import { useState, useRef, useEffect } from 'react'
import { Upload, X, FileAudio, FileMusic, CheckCircle, AlertCircle } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'
import { Midi } from '@tonejs/midi'

interface AudioUploadProps {
  onUploadComplete: (trackData: any) => void
}

export default function AudioUpload({ onUploadComplete }: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedMidiFile, setSelectedMidiFile] = useState<File | null>(null)
  const [isMidiDragging, setIsMidiDragging] = useState(false)
  const [extractedKicks, setExtractedKicks] = useState<number[]>([])
  const [processingMidi, setProcessingMidi] = useState(false)
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
  const midiInputRef = useRef<HTMLInputElement>(null)

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

  // MIDI file handlers
  const handleMidiDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsMidiDragging(true)
  }

  const handleMidiDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsMidiDragging(false)
  }

  const handleMidiDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsMidiDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const midiFile = files.find(file => 
      file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')
    )
    
    if (midiFile) {
      // Quick size check before processing
      const maxSize = 1 * 1024 * 1024 // 1MB
      if (midiFile.size > maxSize) {
        const errorMsg = `MIDI file too large: ${(midiFile.size / 1024 / 1024).toFixed(2)}MB (max: 1MB)`
        showNotification('error', errorMsg)
        return
      }
      
      setSelectedMidiFile(midiFile)
      processMidiFile(midiFile)
    } else {
      showNotification('error', 'Please select a valid MIDI file (.mid or .midi)')
    }
  }

  const handleMidiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
        // Quick size check before processing
        const maxSize = 1 * 1024 * 1024 // 1MB
        if (file.size > maxSize) {
          const errorMsg = `MIDI file too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 1MB)`
          showNotification('error', errorMsg)
          return
        }
        
        setSelectedMidiFile(file)
        processMidiFile(file)
      } else {
        showNotification('error', 'Please select a valid MIDI file (.mid or .midi)')
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      showNotification('error', 'Please select an audio file')
      return
    }
    
    if (!selectedMidiFile) {
      showNotification('error', 'Please select a MIDI file')
      return
    }
    
    if (extractedKicks.length === 0) {
      showNotification('error', 'No kicks extracted from MIDI file. Please check the file.')
      return
    }
    
    if (!trackMetadata.title.trim()) {
      showNotification('error', 'Please enter a track title')
      return
    }
    
    if (!trackMetadata.artist.trim()) {
      showNotification('error', 'Please enter an artist name')
      return
    }
    
    if (!trackMetadata.bpm || trackMetadata.bpm < 60 || trackMetadata.bpm > 200) {
      showNotification('error', 'Please enter a valid BPM (60-200)')
      return
    }
    
    if (!trackMetadata.key.trim()) {
      showNotification('error', 'Please enter a musical key')
      return
    }
    
    if (!trackMetadata.year || trackMetadata.year < 1900 || trackMetadata.year > 2030) {
      showNotification('error', 'Please enter a valid year (1900-2030)')
      return
    }
    
    if (!trackMetadata.genre.trim()) {
      showNotification('error', 'Please enter a genre')
      return
    }

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

      // Generate filename from track title
      const sanitizeFileName = (title: string) => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      }
      
      const sanitizedTitle = sanitizeFileName(trackMetadata.title)
      
      if (!sanitizedTitle) {
        throw new Error('Invalid track title. Please use alphanumeric characters.')
      }
      
      const fileExtension = selectedFile.name.split('.').pop()
      const fileName = `${sanitizedTitle}.${fileExtension}`
      const filePath = fileName
      
      console.log(`Generated filename: ${fileName}`)

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
          kicks: extractedKicks, // Add extracted kicks from MIDI
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
      showNotification('success', `Track "${trackMetadata.title}" uploaded successfully with ${extractedKicks.length} kicks!`)
      
      onUploadComplete(trackData)
      
      // Reset form
      setSelectedFile(null)
      setSelectedMidiFile(null)
      setExtractedKicks([])
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

  const removeMidiFile = () => {
    setSelectedMidiFile(null)
    setExtractedKicks([])
    if (midiInputRef.current) {
      midiInputRef.current.value = ''
    }
  }

  // Process MIDI file to extract kicks
  const processMidiFile = async (file: File) => {
    setProcessingMidi(true)
    
    try {
      // File size validation (1MB limit)
      const maxSize = 1 * 1024 * 1024 // 1MB
      if (file.size > maxSize) {
        const errorMsg = `MIDI file too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 1MB)`
        console.error(errorMsg)
        showNotification('error', errorMsg)
        return
      }
      
      console.log(`Processing MIDI file: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`)
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Parse MIDI with additional validation
      const midi = new Midi(arrayBuffer)
      
      // Validate MIDI structure
      if (!midi.tracks || midi.tracks.length === 0) {
        throw new Error('No tracks found in MIDI file')
      }
      
      console.log(`MIDI file contains ${midi.tracks.length} tracks`)
      
      // Extract all note events from all tracks
      const allNotes: number[] = []
      
      midi.tracks.forEach((track, trackIndex) => {
        if (track.notes && track.notes.length > 0) {
          console.log(`Track ${trackIndex}: ${track.notes.length} notes`)
          track.notes.forEach(note => {
            allNotes.push(note.time)
          })
        }
      })
      
      if (allNotes.length === 0) {
        throw new Error('No note events found in MIDI file')
      }
      
      console.log(`Total note events: ${allNotes.length}`)
      
      // Sort by time and remove duplicates (including simultaneous events)
      const uniqueKicks = [...new Set(allNotes)].sort((a, b) => a - b)
      
      // Additional check for simultaneous events (same timestamp)
      const finalKicks: number[] = []
      uniqueKicks.forEach(kick => {
        // Check if this timestamp already exists (with floating point precision)
        const exists = finalKicks.some(existing => Math.abs(existing - kick) < 0.001)
        if (!exists) {
          finalKicks.push(kick)
        }
      })
      
      console.log(`Unique kicks after deduplication: ${uniqueKicks.length}`)
      console.log(`Final kicks after simultaneous event removal: ${finalKicks.length}`)
      
      if (uniqueKicks.length !== finalKicks.length) {
        console.log(`Removed ${uniqueKicks.length - finalKicks.length} simultaneous events`)
      }
      
      console.log(`First kick: ${finalKicks[0]}s, Last kick: ${finalKicks[finalKicks.length - 1]}s`)
      
      setExtractedKicks(finalKicks)
      showNotification('success', `Extracted ${finalKicks.length} kicks from MIDI file`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('MIDI processing error:', errorMessage)
      console.error('Full error:', error)
      
      // Show detailed error in notification
      let userMessage = 'Failed to process MIDI file'
      if (errorMessage.includes('too large')) {
        userMessage = errorMessage
      } else if (errorMessage.includes('No tracks')) {
        userMessage = 'MIDI file contains no tracks'
      } else if (errorMessage.includes('No note events')) {
        userMessage = 'MIDI file contains no note events'
      } else {
        userMessage = `MIDI processing error: ${errorMessage}`
      }
      
      showNotification('error', userMessage)
    } finally {
      setProcessingMidi(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio File Upload */}
        <div>
          <h3 className="text-alex-accent font-mono text-sm mb-3">AUDIO FILE</h3>
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
        </div>

        {/* MIDI File Upload */}
        <div>
          <h3 className="text-alex-accent font-mono text-sm mb-3">MIDI FILE</h3>
          <div
            className={`border-2 border-dashed p-8 text-center transition-colors ${
              isMidiDragging 
                ? 'border-alex-accent bg-alex-accent/10' 
                : 'border-alex-accent/40 hover:border-alex-accent/60'
            }`}
            onDragOver={handleMidiDragOver}
            onDragLeave={handleMidiDragLeave}
            onDrop={handleMidiDrop}
          >
            {selectedMidiFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-alex-accent">
                  <FileMusic size={24} />
                  <span className="font-mono">{selectedMidiFile.name}</span>
                  <button
                    onClick={removeMidiFile}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="text-alex-subtitle font-mono text-sm">
                  {(selectedMidiFile.size / 1024).toFixed(2)} KB
                  {selectedMidiFile.size > 1 * 1024 * 1024 && (
                    <span className="text-red-400 ml-2">⚠️ Large file</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FileMusic size={48} className="mx-auto text-alex-accent/60" />
                <div>
                  <p className="text-alex-accent font-mono mb-2">
                    Drag & drop your MIDI file here
                  </p>
                  <p className="text-alex-subtitle font-mono text-sm mb-4">
                    Supported formats: .mid, .midi
                  </p>
                  <button
                    onClick={() => midiInputRef.current?.click()}
                    className="px-4 py-2 border border-alex-accent text-alex-accent font-mono text-sm hover:bg-alex-accent hover:text-alex-bg transition-colors"
                  >
                    SELECT MIDI FILE
                  </button>
                </div>
              </div>
            )}
            
            <input
              ref={midiInputRef}
              type="file"
              accept=".mid,.midi"
              onChange={handleMidiFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Extracted Kicks Visualization */}
      {extractedKicks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-alex-accent font-mono text-lg">EXTRACTED KICKS ({extractedKicks.length})</h3>
          
          <div className="max-h-48 overflow-y-auto border border-alex-accent/20 p-4 bg-alex-bg">
            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
              {extractedKicks.map((kick, index) => (
                <div key={index} className="bg-alex-accent/10 px-2 py-1 text-alex-accent">
                  {kick.toFixed(3)}s
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-alex-subtitle font-mono text-sm">
            First kick: {extractedKicks[0]?.toFixed(3)}s | Last kick: {extractedKicks[extractedKicks.length - 1]?.toFixed(3)}s
          </div>
        </div>
      )}

      {/* MIDI Processing Indicator */}
      {processingMidi && (
        <div className="text-center py-4">
          <div className="text-alex-accent font-mono text-sm">Processing MIDI file...</div>
          <div className="text-alex-subtitle font-mono text-xs mt-1">Extracting kicks...</div>
        </div>
      )}

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
      {selectedFile && selectedMidiFile && extractedKicks.length > 0 && (
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
                placeholder="Enter track title"
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors placeholder:text-alex-subtitle"
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
                placeholder="Enter artist name"
                className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors placeholder:text-alex-subtitle"
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
              disabled={
                uploading || 
                !trackMetadata.title.trim() || 
                !trackMetadata.artist.trim() || 
                !trackMetadata.bpm || 
                !trackMetadata.key.trim() || 
                !trackMetadata.year || 
                !trackMetadata.genre.trim()
              }
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
