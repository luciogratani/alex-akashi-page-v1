# Admin Panel - Alex Akashi Music

## 🎵 Funzionalità

L'admin panel permette di gestire i brani musicali del sito Alex Akashi con le seguenti funzionalità:

### 📊 Dashboard
- **Overview brani**: Visualizza tutti i brani caricati
- **Statistiche**: Contatore brani, durata totale, etc.
- **Azioni rapide**: Upload, preview, gestione brani

### 🎵 Gestione Brani
- **Lista brani**: Visualizza tutti i brani con metadata
- **Preview player**: Player integrato con sincronizzazione kick events
- **Modifica/elimina**: Gestione completa dei brani
- **Aggiungi brani**: Crea nuovi brani tramite upload

### 📤 Upload Audio
- **Drag & drop**: Caricamento file audio tramite drag & drop
- **Formati supportati**: MP3, WAV, M4A
- **Metadata form**: Compilazione automatica e manuale dei metadata
- **Supabase Storage**: Upload automatico su cloud storage

### ⚙️ Settings
- **Database status**: Verifica connessione Supabase
- **Storage status**: Verifica storage audio files
- **Configurazione**: Gestione variabili d'ambiente

## 🚀 Setup

### 1. Variabili d'Ambiente
Crea un file `.env` nella root del progetto:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin
VITE_ADMIN_EMAIL=admin@alexakashi.com
VITE_ADMIN_PASSWORD=your-secure-password
```

### 2. Database Supabase
Esegui questo script SQL nel pannello Supabase:

```sql
-- Tabella tracks
CREATE TABLE tracks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  featured_artist VARCHAR(255),
  original_artist VARCHAR(255),
  bpm INTEGER NOT NULL,
  key VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  master_engineer VARCHAR(255),
  genre VARCHAR(100),
  duration INTEGER NOT NULL,
  release_date DATE,
  audio_file_path TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella track_events
CREATE TABLE track_events (
  id SERIAL PRIMARY KEY,
  track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('kick', 'snare', 'hihat')),
  timestamp DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabella track_timeline
CREATE TABLE track_timeline (
  id SERIAL PRIMARY KEY,
  track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
  section_type VARCHAR(20) NOT NULL CHECK (section_type IN ('intro', 'bridge', 'outro')),
  start_time DECIMAL(10,6) NOT NULL,
  end_time DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Disabilita RLS per semplicità
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE track_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE track_timeline DISABLE ROW LEVEL SECURITY;
```

### 3. Storage Supabase
1. Vai su **Storage** nel pannello Supabase
2. Crea un bucket chiamato `audio-files`
3. Imposta come pubblico per permettere accesso ai file audio

## 🔐 Accesso

### URL Admin Panel
```
https://your-domain.com/admin
```

### Credenziali
- **Email**: Configurata in `VITE_ADMIN_EMAIL`
- **Password**: Configurata in `VITE_ADMIN_PASSWORD`

## 📁 Struttura File

```
src/
├── components/
│   ├── AdminPanel.tsx          # Componente principale admin
│   ├── AdminLogin.tsx          # Form di login
│   ├── AdminDashboard.tsx      # Dashboard principale
│   ├── AudioUpload.tsx         # Upload file audio
│   └── AdminPreviewPlayer.tsx  # Player preview con sincronizzazione
├── lib/
│   └── supabase.ts            # Configurazione Supabase
└── vite-env.d.ts              # Tipi TypeScript per env vars
```

## 🎵 Gestione Brani

Il sistema gestisce i brani direttamente dal database Supabase:

1. **Visualizza brani**: Lista completa con metadata e controlli
2. **Preview brani**: Player integrato con sincronizzazione kick events
3. **Aggiungi brani**: Upload tramite drag & drop con form metadata
4. **Modifica/Elimina**: Gestione completa dei brani esistenti

## 🎵 Preview Player

Il preview player include:
- **Controlli audio**: Play, pause, stop, reset
- **Progress bar**: Visualizzazione progresso e tempo
- **Kick sync**: Sincronizzazione eventi kick con visualizzazione
- **Metadata display**: BPM, key, durata, numero eventi
- **Responsive**: Funziona su desktop e mobile

## 🛠️ Sviluppo

### Comandi
```bash
# Sviluppo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

### Tecnologie
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 🚀 Deploy

### Vercel
1. Collega il repository a Vercel
2. Aggiungi le variabili d'ambiente in Vercel
3. Deploy automatico ad ogni push

### Variabili Vercel
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_PASSWORD`

## 🔧 Troubleshooting

### Errori Comuni
1. **Connessione Supabase**: Verifica URL e chiavi
2. **Upload fallito**: Controlla permessi bucket storage
3. **Migrazione fallita**: Verifica struttura file JSON
4. **Login fallito**: Controlla credenziali admin

### Log
Controlla la console del browser per errori dettagliati.

## 📞 Support

Per problemi o domande, controlla:
1. Console browser per errori
2. Network tab per richieste fallite
3. Supabase logs nel dashboard
4. Vercel logs per deploy issues
