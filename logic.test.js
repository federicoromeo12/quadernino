import test from 'node:test';
import assert from 'node:assert/strict';
import { venueKey, groupByVenue, windSummary, sortByDate, overview } from './logic.js';

const a = { id: 'a', date: '2026-05-01', venue: { name: 'Bracciano', osm: 'relation/1' }, wind: { dir: 'SW', speed: 10, gust: 16 } };
const b = { id: 'b', date: '2026-06-01', venue: { name: 'Lago di Bracciano', osm: 'relation/1' }, wind: { dir: 'SW', speed: 14 } };
const c = { id: 'c', date: '2026-04-01', venue: { name: ' Anzio ' }, wind: {} };
const d = { id: 'd', date: '2026-04-02' };

test('venueKey', () => {
  assert.equal(venueKey(a.venue), 'relation/1');
  assert.equal(venueKey(c.venue), 'name:anzio');
  assert.equal(venueKey(undefined), '');
});

test('sortByDate newest first', () => {
  assert.deepEqual(sortByDate([a, b, c]).map(s => s.id), ['b', 'a', 'c']);
});

test('groupByVenue merges by OSM id, skips no venue', () => {
  const g = groupByVenue([a, b, c, d]);
  assert.equal(g.length, 2);
  assert.deepEqual(g[0].sessions.map(s => s.id), ['b', 'a']);
});

test('windSummary', () => {
  const w = windSummary([a, b, c]);
  assert.equal(w.counts[10], 2); // SW
  assert.equal(w.avg, 12);
  assert.equal(w.maxGust, 16);
  assert.equal(windSummary([]).avg, null);
});

test('overview', () => {
  const o = overview([a, b, c, { ...d, feel: 4 }]);
  assert.equal(o.count, 4);
  assert.equal(o.peak, 16);
  assert.equal(o.venues, 2);
  assert.equal(o.feel, 4);
  assert.deepEqual(o.series.map(p => p.date), ['2026-04-01', '2026-04-02', '2026-05-01', '2026-06-01']);
  assert.equal(overview([]).peak, null);
});
