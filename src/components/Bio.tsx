import { useState } from 'react'

interface BioSection {
  id: number
  title: string
  content: string
}

const sections: BioSection[] = [
  {
    id: 1,
    title: 'MUSIC PRODUCER & SOUND DESIGNER',
    content: 'Crafting immersive sonic experiences through electronic composition and sound design. Specializing in atmospheric textures and rhythmic experimentation.'
  },
  {
    id: 2,
    title: 'TOKYO, JAPAN | ACTIVE SINCE 2018',
    content: 'Based in Tokyo, exploring the intersection of technology and music. Active in the underground electronic scene since 2018, with releases on independent labels.'
  },
  {
    id: 3,
    title: 'ELECTRONIC / EXPERIMENTAL / AMBIENT',
    content: 'Genre-fluid approach spanning techno, ambient, and experimental electronic music. Influences include minimal techno, IDM, and contemporary classical.'
  },
  {
    id: 4,
    title: 'ACTIVE PROJECTS: TECHNOROOM & COASTAL DRIFT',
    content: 'TECHNOROOM: Sardinian techno culture event series featuring underground electronic music and immersive experiences. COASTAL DRIFT: Electronic duo founded with SYRA, crafting energetic sounds and groovy rhythms that blend experimental textures with dancefloor dynamics.'
  }
]

export default function Bio() {
  const [openSection, setOpenSection] = useState<number | null>(null)

  const toggleSection = (id: number) => {
    
    setOpenSection(openSection === id ? null : id)
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      {/* Name - Large, minimal */}
      <div className="text-center">
        <h1 className="font-mono font-bold text-6xl text-alex-text tracking-tight">
          ALEX AKASHI
        </h1>
      </div>

      {/* Expandable Sections - Terminal Style */}
      <div className="flex flex-col gap-2">
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col">
            {/* Header - Clickable */}
            <button
              onClick={() => toggleSection(section.id)}
              
              className="flex items-center gap-3 font-mono text-alex-text bg-transparent border-none transition-all duration-200 group px-2 py-1 relative"
              style={{ fontSize: '9px', cursor: 'none', textAlign: 'left' }}
            >
              <span className="text-alex-accent">0{section.id}</span>
              <span className="text-alex-subtitle">—</span>
              <span className="group-hover:text-alex-accent transition-colors duration-200">{section.title}</span>
              
              {/* Hover background */}
              <div className="absolute inset-0 bg-alex-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
            </button>

            {/* Expandable Content */}
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                openSection === section.id ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}
            >
              <div 
                className="font-mono text-alex-text pl-12 pr-2"
                style={{ fontSize: '9px', lineHeight: '1.6' }}
              >
                {section.content}
                
                {/* Project Logos - Only show for section 4 */}
                {section.id === 4 && openSection === section.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    {/* Technoroom Logo */}
                    <div className="flex items-center gap-2">
                      <img 
                        src="/images/Technoroom Textmark.svg" 
                        alt="Technoroom Logo"
                        className="h-4 w-auto opacity-80"
                      />
                      <span className="text-alex-accent opacity-70">TECHNOROOM</span>
                    </div>
                    
                    {/* Coastal Drift Logo */}
                    <div className="flex items-center gap-2">
                      <img 
                        src="/images/Coastal-Drift-Textmark.svg" 
                        alt="Coastal Drift Logo"
                        className="h-4 w-auto opacity-80"
                      />
                      <span className="text-alex-accent opacity-70">COASTAL DRIFT</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  )
}

