const fs = require('fs');

// Read CSV file
const csv = fs.readFileSync('public/Alex Akashi - Don\'t Stop [BMT Master].csv', 'utf8');

// Parse CSV
const lines = csv.trim().split('\n').slice(1); // Skip header
const kicks = lines.map(line => {
  const [track, time, note, noteName, velocity, duration] = line.split(',');
  return {
    time: parseFloat(time),
    velocity: parseFloat(velocity),
    duration: parseFloat(duration)
  };
});

// Write JSON file
fs.writeFileSync('public/kicks.json', JSON.stringify(kicks, null, 2));

console.log(`✅ Converted ${kicks.length} kick events to kicks.json`);

