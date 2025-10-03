# Public Assets Structure

## 📁 Folder Organization

```
public/
├── audio/                    # Master/backup audio files
│   └── dont-stop-master.wav  # Original WAV (backup)
│
├── models/                   # 3D models (GLB/GLTF)
│   ├── AA.glb               # Main logo model
│   └── THORN.glb            # Secondary text model
│
├── images/                   # Images and icons
│   ├── favicon.svg          # Site favicon (black monogram)
│   ├── Monogram.svg         # Main logo SVG (red)
│   └── propic.jpg           # Profile picture
│
└── tracks/                   # Track-specific assets
    └── dont-stop/           # "Don't Stop" track folder
        ├── audio.mp3        # Optimized audio (192kbps)
        ├── kicks.json       # Kick events for sync
        ├── kicks.csv        # Original MIDI export
        └── original.mid     # Original MIDI file

## 🎵 Adding New Tracks

For each new track, create a folder structure like:

```
tracks/
└── [track-slug]/
    ├── audio.mp3            # Optimized MP3 (192kbps recommended)
    ├── kicks.json           # Kick events JSON
    ├── kicks.csv            # MIDI export CSV (optional)
    └── original.mid         # Original MIDI (optional)
```

Example for track "Neon Dreams":
```
tracks/neon-dreams/
├── audio.mp3
├── kicks.json
└── ...
```

## 📝 Notes

- **Audio**: Use MP3 192kbps for optimal quality/size
- **Models**: GLB format for 3D models
- **Data**: Keep JSON for runtime, CSV/MID for reference
- **Images**: SVG preferred for icons/logos

