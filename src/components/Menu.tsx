import About from './About'
import Theme from './Theme'
import Contacts from './Contacts'
import Playlist from './Playlist'

interface MenuProps {
  currentTrackId: number
  onTrackSelect: (trackId: number) => void
  onAboutOpenChange?: (isOpen: boolean) => void
  openMenuComponent: string | null
  onMenuComponentChange: (componentName: string | null) => void
}

export default function Menu({ currentTrackId, onTrackSelect, onAboutOpenChange, openMenuComponent, onMenuComponentChange }: MenuProps) {
  return (
    <div className="absolute top-8 right-8 z-50 flex items-center gap-6">
      <About 
        onOpenChange={onAboutOpenChange} 
        openMenuComponent={openMenuComponent}
        onMenuComponentChange={onMenuComponentChange}
      />
      <Theme 
        openMenuComponent={openMenuComponent}
        onMenuComponentChange={onMenuComponentChange}
      />
      <Contacts 
        openMenuComponent={openMenuComponent}
        onMenuComponentChange={onMenuComponentChange}
      />
      <Playlist 
        currentTrackId={currentTrackId} 
        onTrackSelect={onTrackSelect}
        openMenuComponent={openMenuComponent}
        onMenuComponentChange={onMenuComponentChange}
      />
    </div>
  )
}

