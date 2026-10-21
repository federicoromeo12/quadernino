// Pure helpers, no DOM — tested by logic.test.js
export const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

// OSM-linked venues group by OSM id; typed-only venues group by name
export const venueKey = v => !v?.name ? '' : v.osm || 'name:' + v.name.trim().toLowerCase();

export const sortByDate = list =>
  [...list].sort((a, b) => `${b.date}${b.start || ''}`.localeCompare(`${a.date}${a.start || ''}`));

export function groupByVenue(sessions) {
  const m = new Map();
  for (const s of sortByDate(sessions)) {
    const k = venueKey(s.venue);
    if (!k) continue;
    if (!m.has(k)) m.set(k, { key: k, venue: s.venue, sessions: [] });
    m.get(k).sessions.push(s);
  }
  return [...m.values()].sort((a, b) => b.sessions.length - a.sessions.length);
}

export function windSummary(sessions) {
  const counts = Array(16).fill(0);
  let sum = 0, n = 0, maxGust = 0;
  for (const { wind: w = {} } of sessions) {
    const i = DIRS.indexOf(w.dir);
    if (i >= 0) counts[i]++;
    if (w.speed > 0) { sum += w.speed; n++; }
    if (w.gust > maxGust) maxGust = w.gust;
  }
  return { counts, avg: n ? Math.round((sum / n) * 10) / 10 : null, maxGust: maxGust || null };
}
