/**
 * trajectoryLoader.js
 * Loads drone flight paths from CSV files or the live Python API.
 */

// Parse a CSV file with x,y,z columns into an array of position objects
export async function loadTrajectoryFromCSV(csvPath) {
  const response = await fetch(csvPath);
  const text = await response.text();
  const lines = text.trim().split('\n');

  // Auto-detect header row
  const startIndex = lines[0].includes('x') || lines[0].includes('episode') ? 1 : 0;

  return lines.slice(startIndex).map(line => {
    const parts = line.split(',').map(Number);
    // Support both (x,y,z) and (episode, reward, steps, ...) formats
    if (parts.length >= 3) {
      return { x: parts[0], y: parts[1], z: parts[2] };
    }
    return { x: 0, y: 0, z: 0 };
  });
}

// For real-time inference from the Python Flask API
export async function resetEnvironmentFromAPI() {
  const response = await fetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numObstacles: 12, numRays: 10 })
  });
  return response.json();
}

export async function predictStepFromAPI(mode = 'policy') {
  const response = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  return response.json();
}

export async function loadMetricsFromAPI() {
  const response = await fetch('/api/metrics');
  return response.json();
}
