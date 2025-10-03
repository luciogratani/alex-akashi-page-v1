import pkg from '@tonejs/midi';
const { Midi } = pkg;
import { readFileSync, writeFileSync } from 'fs';

// Leggi il file MIDI
const midiData = readFileSync('./public/Untitled.mid');
const midi = new Midi(midiData);

// Array per memorizzare gli eventi note_on
const noteOnEvents = [];

// Estrai tutti gli eventi note_on
midi.tracks.forEach((track, trackIndex) => {
  track.notes.forEach(note => {
    noteOnEvents.push({
      track: trackIndex,
      time: note.time,
      midi: note.midi,
      noteName: note.name,
      velocity: note.velocity,
      duration: note.duration
    });
  });
});

// Ordina per tempo
noteOnEvents.sort((a, b) => a.time - b.time);

// Crea il CSV
let csv = 'Track,Time,MIDI Note,Note Name,Velocity,Duration\n';
noteOnEvents.forEach(event => {
  csv += `${event.track},${event.time},${event.midi},${event.noteName},${event.velocity},${event.duration}\n`;
});

// Salva il CSV
writeFileSync('./public/Untitled.csv', csv);

console.log(`✓ Convertiti ${noteOnEvents.length} eventi note_on in CSV`);
console.log('✓ File salvato in: public/Untitled.csv');

