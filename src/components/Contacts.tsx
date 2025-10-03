import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Contact {
  id: number
  name: string
  url: string
  type: 'social' | 'distributor'
}

const contacts: Contact[] = [
  { id: 1, name: 'Instagram', url: 'https://instagram.com/alexakashi', type: 'social' },
  { id: 2, name: 'Spotify', url: 'https://open.spotify.com/artist/alexakashi', type: 'distributor' },
  { id: 3, name: 'Apple Music', url: 'https://music.apple.com/artist/alexakashi', type: 'distributor' },
  { id: 4, name: 'SoundCloud', url: 'https://soundcloud.com/alexakashi', type: 'social' },
  { id: 5, name: 'YouTube', url: 'https://youtube.com/@alexakashi', type: 'social' },
  { id: 6, name: 'Bandcamp', url: 'https://alexakashi.bandcamp.com', type: 'distributor' },
]

interface ContactsProps {
  openMenuComponent: string | null
  onMenuComponentChange: (componentName: string | null) => void
}

export default function Contacts({ openMenuComponent, onMenuComponentChange }: ContactsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Chiudi Contacts se viene aperto un altro componente del menu
  useEffect(() => {
    if (isOpen && openMenuComponent !== 'contacts' && openMenuComponent !== null) {
      setIsOpen(false)
    }
  }, [openMenuComponent, isOpen])

  const handleContactClick = (contact: Contact) => {
    
    window.open(contact.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative flex flex-col items-end">
      {/* Contacts Header - Toggle Button */}
      <button
        onClick={() => {
          
          setIsOpen(!isOpen)
          onMenuComponentChange(isOpen ? null : 'contacts')
        }}
        
        className="relative flex items-center gap-2 px-2 py-1 transition-all duration-200 group bg-transparent border-none"
        style={{ fontSize: '9px', cursor: 'none' }}
      >
        <span className="font-mono text-alex-accent group-hover:text-alex-bg transition-colors duration-200 font-bold">
          CONTACTS
        </span>
        {isOpen ? (
          <ChevronUp 
            size={12}
            className="text-alex-accent group-hover:text-alex-bg transition-colors duration-200"
          />
        ) : (
          <ChevronDown 
            size={12}
            className="text-alex-accent group-hover:text-alex-bg transition-colors duration-200"
          />
        )}
        
        {/* Hover Background */}
        <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
      </button>

      {/* Dropdown - Contact List */}
      <div 
        className={`absolute top-full right-0 flex flex-col items-end gap-2 mt-2 transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {contacts.map((contact) => (
          <div key={contact.id} className="relative group">
            <button
              onClick={() => handleContactClick(contact)}
              
              className="flex items-center gap-3 px-2 py-1 transition-all duration-200 bg-transparent border-none"
              style={{ fontSize: '9px', cursor: 'none' }}
            >
              {/* Contact Info */}
              <div className="font-mono text-alex-accent group-hover:text-alex-bg transition-colors duration-200">
                <span>{contact.name}</span>
              </div>
            </button>
            
            {/* Hover Background - Only covers the button content */}
            <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
