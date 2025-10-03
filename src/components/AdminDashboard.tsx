import { useState, useEffect } from 'react'
import { Plus, Music, Upload, Play, GripVertical } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase, supabaseAdmin, Track } from '../lib/supabase'
import AudioUpload from './AudioUpload'
import AdminPreviewPlayer from './AdminPreviewPlayer'
import AdminFooter from './AdminFooter'

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tracks' | 'upload'>('tracks')
  const [previewTrack, setPreviewTrack] = useState<Track | null>(null)
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    artist: '',
    featured_artist: '',
    bpm: 120,
    key: '',
    year: new Date().getFullYear(),
    genre: '',
    master_engineer: '',
    kicks: [] as number[]
  })

  // Load tracks from Supabase
  useEffect(() => {
    loadTracks()
  }, [])

  const loadTracks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('order_position', { ascending: true })

      if (error) {
        console.error('Error loading tracks:', error)
        return
      }

      setTracks(data || [])
    } catch (err) {
      console.error('Error loading tracks:', err)
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteTrack = async (trackId: number) => {
    if (!confirm('Are you sure you want to delete this track?')) return

    try {
      // First get the track to get the audio file path
      const { data: track, error: trackError } = await supabaseAdmin
        .from('tracks')
        .select('audio_file_path')
        .eq('id', trackId)
        .single()

      if (trackError) {
        console.error('Error fetching track:', trackError)
        return
      }

      // Delete the track from database
      const { error: deleteError } = await supabaseAdmin
        .from('tracks')
        .delete()
        .eq('id', trackId)

      if (deleteError) {
        console.error('Error deleting track:', deleteError)
        return
      }

      // Delete the audio file from storage if it exists
      if (track.audio_file_path) {
        const fileName = track.audio_file_path.split('/').pop()
        if (fileName) {
          const { error: storageError } = await supabaseAdmin.storage
            .from('audio-files')
            .remove([fileName])

          if (storageError) {
            console.error('Error deleting audio file from storage:', storageError)
          }
        }
      }

      // Reload tracks and stats
      loadTracks()
    } catch (err) {
      console.error('Error deleting track:', err)
    }
  }

  const handleEditTrack = (track: Track) => {
    setEditingTrack(track)
    setEditForm({
      title: track.title,
      artist: track.artist,
      featured_artist: track.featured_artist || '',
      bpm: track.bpm,
      key: track.key,
      year: track.year,
      genre: track.genre || '',
      master_engineer: track.master_engineer || '',
      kicks: track.kicks || []
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTrack) return

    try {
      const { error } = await supabaseAdmin
        .from('tracks')
        .update({
          title: editForm.title,
          artist: editForm.artist,
          featured_artist: editForm.featured_artist || null,
          bpm: editForm.bpm,
          key: editForm.key,
          year: editForm.year,
          genre: editForm.genre,
          master_engineer: editForm.master_engineer || null,
          kicks: editForm.kicks,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTrack.id)

      if (error) {
        console.error('Error updating track:', error)
        alert(`Error updating track: ${error.message}`)
        return
      }

      // Close edit form and reload tracks
      setEditingTrack(null)
      loadTracks()
    } catch (err) {
      console.error('Error updating track:', err)
      alert(`Error updating track: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleCancelEdit = () => {
    setEditingTrack(null)
    setEditForm({
      title: '',
      artist: '',
      featured_artist: '',
      bpm: 120,
      key: '',
      year: new Date().getFullYear(),
      genre: '',
      master_engineer: '',
      kicks: []
    })
  }

  // Helper functions for kicks management
  const addKick = () => {
    const newKick = prompt('Enter kick timestamp (in seconds):')
    if (newKick && !isNaN(parseFloat(newKick))) {
      const timestamp = parseFloat(newKick)
      setEditForm(prev => ({
        ...prev,
        kicks: [...prev.kicks, timestamp].sort((a, b) => a - b)
      }))
    }
  }

  const removeKick = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      kicks: prev.kicks.filter((_, i) => i !== index)
    }))
  }

  const clearKicks = () => {
    if (confirm('Are you sure you want to clear all kicks?')) {
      setEditForm(prev => ({ ...prev, kicks: [] }))
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result
    if (source.index === destination.index) return

    console.log('🔄 Drag & Drop:', { source: source.index, destination: destination.index })

    // Create new array with reordered tracks
    const newTracks = Array.from(tracks)
    const [reorderedTrack] = newTracks.splice(source.index, 1)
    newTracks.splice(destination.index, 0, reorderedTrack)

    console.log('📋 New order:', newTracks.map(t => ({ id: t.id, title: t.title, order_position: t.order_position })))

    // Update local state immediately for better UX
    setTracks(newTracks)

    try {
      // Temporarily set all order_position to negative values to avoid conflicts
      const tempUpdates = newTracks.map((track, index) => ({
        id: track.id,
        order_position: -(index + 1) // Negative values to avoid conflicts
      }))

      // First pass: set all to negative values
      const tempPromises = tempUpdates.map(update =>
        supabaseAdmin
          .from('tracks')
          .update({ order_position: update.order_position })
          .eq('id', update.id)
      )

      await Promise.all(tempPromises)

      // Second pass: set correct positive values
      const finalUpdates = newTracks.map((track, index) => ({
        id: track.id,
        order_position: index + 1
      }))

      console.log('💾 Saving to database:', finalUpdates)

      const finalPromises = finalUpdates.map(update =>
        supabaseAdmin
          .from('tracks')
          .update({ order_position: update.order_position })
          .eq('id', update.id)
      )

      await Promise.all(finalPromises)
      
      console.log('✅ Database updated successfully')
      
      // Reload tracks to ensure consistency
      loadTracks()
    } catch (err) {
      console.error('Error updating track order:', err)
      // Revert local state on error
      loadTracks()
    }
  }

  return (
    <div className="min-h-screen bg-alex-bg pb-20">
      {/* Header */}
      <header className="border-b border-alex-accent/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-mono text-alex-accent">ADMIN PANEL</h1>
            <p className="text-alex-subtitle font-mono text-sm">Music Management</p>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              className="text-alex-subtitle font-mono text-sm hover:text-alex-accent transition-colors"
            >
              View Site
            </a>
            <button
              onClick={onLogout}
              className="text-alex-subtitle font-mono text-sm hover:text-alex-accent transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-alex-accent/20">
        <div className="max-w-7xl mx-auto flex">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-6 py-4 font-mono text-sm border-b-2 transition-colors ${
              activeTab === 'tracks'
                ? 'border-alex-accent text-alex-accent'
                : 'border-transparent text-alex-subtitle hover:text-alex-accent'
            }`}
          >
            <Music size={16} className="inline mr-2" />
            TRACKS ({tracks.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-4 font-mono text-sm border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-alex-accent text-alex-accent'
                : 'border-transparent text-alex-subtitle hover:text-alex-accent'
            }`}
          >
            <Upload size={16} className="inline mr-2" />
            UPLOAD
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'tracks' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-mono text-alex-accent">TRACKS MANAGEMENT</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center gap-2 px-4 py-2 bg-alex-accent text-alex-bg font-mono text-sm hover:opacity-80 transition-opacity"
                >
                  <Plus size={16} />
                  ADD TRACK
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-alex-subtitle font-mono">Loading tracks...</div>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-alex-subtitle font-mono">No tracks found</div>
                <div className="text-alex-subtitle font-mono text-sm mt-2">
                  Upload your first track to get started
                </div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tracks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {tracks.map((track, index) => (
                        <Draggable key={track.id} draggableId={track.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border border-alex-accent/20 p-4 hover:border-alex-accent/40 transition-colors ${
                                snapshot.isDragging ? 'shadow-lg border-alex-accent' : ''
                              }`}
                            >
                              {editingTrack?.id === track.id ? (
                                // Edit Form
              <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-mono text-alex-accent text-lg">EDIT TRACK</h3>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={handleSaveEdit}
                                        className="px-3 py-1 bg-alex-accent text-alex-bg font-mono text-sm hover:opacity-80 transition-opacity"
                                      >
                                        SAVE
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 border border-alex-accent text-alex-accent font-mono text-sm hover:bg-alex-accent hover:text-alex-bg transition-colors"
                                      >
                                        CANCEL
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">TITLE *</label>
                                      <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                        required
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">ARTIST *</label>
                                      <input
                                        type="text"
                                        value={editForm.artist}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, artist: e.target.value }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                        required
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">FEATURED ARTIST</label>
                                      <input
                                        type="text"
                                        value={editForm.featured_artist}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, featured_artist: e.target.value }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">BPM *</label>
                                      <input
                                        type="number"
                                        value={editForm.bpm}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                        min="60"
                                        max="200"
                                        required
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">KEY *</label>
                                      <input
                                        type="text"
                                        value={editForm.key}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, key: e.target.value }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                        placeholder="C major"
                                        required
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">YEAR *</label>
                                      <input
                                        type="number"
                                        value={editForm.year}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                        min="1900"
                                        max="2030"
                                        required
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">GENRE *</label>
                                      <input
                                        type="text"
                                        value={editForm.genre}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                        required
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-alex-accent font-mono text-sm mb-2">MASTER ENGINEER</label>
                                      <input
                                        type="text"
                                        value={editForm.master_engineer}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, master_engineer: e.target.value }))}
                                        className="w-full px-3 py-2 bg-transparent border border-alex-accent text-alex-accent font-mono text-sm focus:outline-none focus:border-alex-bg transition-colors"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Kicks Management Section */}
                                  <div className="mt-6">
                                    <div className="flex items-center justify-between mb-3">
                                      <label className="block text-alex-accent font-mono text-sm">KICKS ({editForm.kicks.length})</label>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={addKick}
                                          className="px-3 py-1 bg-alex-accent text-alex-bg font-mono text-xs hover:opacity-80 transition-opacity"
                                        >
                                          ADD KICK
                                        </button>
                                        <button
                                          type="button"
                                          onClick={clearKicks}
                                          className="px-3 py-1 border border-alex-accent text-alex-accent font-mono text-xs hover:bg-alex-accent hover:text-alex-bg transition-colors"
                                        >
                                          CLEAR ALL
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {editForm.kicks.length > 0 ? (
                                      <div className="max-h-32 overflow-y-auto border border-alex-accent/20 p-3 bg-alex-bg">
                                        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                                          {editForm.kicks.map((kick, index) => (
                                            <div key={index} className="flex items-center justify-between bg-alex-accent/10 px-2 py-1">
                                              <span className="text-alex-accent">{kick.toFixed(3)}s</span>
                                              <button
                                                type="button"
                                                onClick={() => removeKick(index)}
                                                className="text-red-400 hover:text-red-300 ml-2"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="border border-alex-accent/20 p-3 bg-alex-bg text-center">
                                        <span className="text-alex-subtitle font-mono text-sm">No kicks defined</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                // Normal Track Display
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1">
                                    {/* Drag Handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing text-alex-subtitle hover:text-alex-accent transition-colors"
                                    >
                                      <GripVertical size={16} />
                                    </div>
                                    
                      <div className="flex-1">
                        <h3 className="font-mono text-alex-accent text-lg">{track.title}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-alex-subtitle font-mono text-sm">
                            {track.artist}
                            {track.featured_artist && ` feat. ${track.featured_artist}`}
                          </span>
                          <span className="text-alex-subtitle font-mono text-sm">
                            {track.bpm} BPM
                          </span>
                          <span className="text-alex-subtitle font-mono text-sm">
                            {track.key}
                          </span>
                          <span className="text-alex-subtitle font-mono text-sm">
                            {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                          </span>
                          <span className="text-alex-subtitle font-mono text-sm">
                            {track.kicks?.length || 0} kicks
                          </span>
                        </div>
                      </div>
                                  </div>
                                  
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewTrack(track)}
                          className="px-3 py-1 border border-alex-accent text-alex-accent font-mono text-sm hover:bg-alex-accent hover:text-alex-bg transition-colors flex items-center gap-1"
                        >
                          <Play size={12} />
                          PREVIEW
                        </button>
                        <button
                                      onClick={() => handleEditTrack(track)}
                          className="px-3 py-1 border border-alex-accent text-alex-accent font-mono text-sm hover:bg-alex-accent hover:text-alex-bg transition-colors"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="px-3 py-1 border border-red-400 text-red-400 font-mono text-sm hover:bg-red-400 hover:text-alex-bg transition-colors"
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                              )}
                  </div>
                          )}
                        </Draggable>
                ))}
                      {provided.placeholder}
              </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <h2 className="text-lg font-mono text-alex-accent mb-6">UPLOAD AUDIO</h2>
            <AudioUpload onUploadComplete={loadTracks} />
          </div>
        )}


      </main>

      {/* Preview Player Modal */}
      {previewTrack && (
        <AdminPreviewPlayer 
          track={previewTrack} 
          onClose={() => setPreviewTrack(null)} 
        />
      )}

      {/* Footer */}
      <AdminFooter />
    </div>
  )
}