import { DIRS, venueKey, groupByVenue, windSummary, sortByDate, overview } from './logic.js';

/* ---------- storage (IndexedDB, on this device only) ---------- */
const dbp = new Promise((res, rej) => {
  const r = indexedDB.open('quadernino', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('sessions', { keyPath: 'id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
async function tx(mode, fn) {
  const d = await dbp;
  return new Promise((res, rej) => {
    const t = d.transaction('sessions', mode);
    const req = fn(t.objectStore('sessions'));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
  });
}
const db = {
  all: () => tx('readonly', s => s.getAll()),
  get: id => tx('readonly', s => s.get(id)),
  put: v => tx('readwrite', s => s.put(v)),
  del: id => tx('readwrite', s => s.delete(id)),
};
navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

/* ---------- i18n ---------- */
const T = {
  en: {
    form_sub: 'Log what you saw on the water', custom: 'New session form', custom_text: 'Choose which parts appear when you add a session. Suggestions follow the class; the final choice is yours.', other_classes: 'Other classes', reset: 'Reset to suggested', sections: 'Sections', tuning_params: 'Tuning fields', temps: 'Temperatures',
    home: 'Home', hero: 'Your sailing at a glance', trend: 'Wind over time', avg_l: 'Average', gust_l: 'Gusts', peak: 'Strongest wind', avg_mood: 'Average mood', latest: 'Latest session', see_all: 'See all', kn: 'kn',
    sessions: 'Sessions', venues: 'Venues', settings: 'Settings', new_session: 'New session', edit_session: 'Edit session',
    empty_title: 'Your notebook is empty', empty_text: 'After every session on the water, write down what you saw and how you felt. Next time at the same venue, you will know more than everyone else.',
    when: 'When', date: 'Date', start: 'Start', end: 'End', venue: 'Venue', venue_ph: 'Type a place, lake, bay, club…', linked: '✓ Linked to map', type: 'Session type',
    opt_training: 'Training', opt_regatta: 'Regatta', opt_other: 'Other',
    boat: 'Boat', class: 'Class', setup: 'Setup', setup_ph: 'Sails, mast rake, settings…',
    wind: 'Wind', direction: 'Direction (coming from)', speed: 'Average (kn)', gust: 'Gusts (kn)', shifts: 'Shifts',
    shift_a: 'Shifts from', shift_b: 'to', gust_dir: 'Gusts come from', changes: 'Changes during the session', add_change: '+ Add change', at: 'At', tuning: 'Tuning', opt_steady: 'Steady', opt_oscillating: 'Oscillating', opt_persistent: 'Persistent',
    sea: 'Sea & sky', waves: 'Waves', opt_flat: 'Flat', opt_chop: 'Chop', opt_swell: 'Swell',
    current: 'Current', opt_none: 'None', opt_light: 'Light', opt_strong: 'Strong',
    tide: 'Tide', opt_rising: 'Rising', opt_falling: 'Falling', opt_high: 'High', opt_low: 'Low',
    air: 'Air °C', water: 'Water °C', sky: 'Sky',
    opt_sunny: 'Sunny', opt_partly: 'Partly cloudy', opt_cloudy: 'Cloudy', opt_rain: 'Rain', opt_storm: 'Storm',
    races: 'Races', race: 'Race', add_race: '+ Add race', result: 'Result', race_notes: 'Notes on this race', remove: 'Remove',
    reflection: 'Reflection', good: 'What went well', work: 'What to work on', feeling: 'How I felt', notes: 'Other notes',
    photos: 'Photos', add_photo: '+ Add photos',
    save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', confirm_delete: 'Delete this session? This cannot be undone.',
    not_found: 'Not found.', no_venues: 'Venues appear here once you log sessions.', n_sessions: 'sessions', n_session: 'session',
    avg_wind: 'Avg wind kn', max_gust: 'Max gust kn', wind_from: 'Where the wind came from', open_map: 'Open map',
    language: 'Language', backup: 'Backup', export: 'Export backup', import: 'Import backup',
    backup_text: 'Your notebook lives only on this device. Export a backup now and then and keep it somewhere safe.',
    imported: 'Sessions imported:', bad_file: 'This file is not a valid backup.',
    storage_ok: 'Storage is protected from automatic cleanup.',
    storage_warn: 'The browser may clear data it thinks is unused. Add the app to your home screen and export backups.',
  },
  it: {
    form_sub: 'Scrivi cosa hai visto in acqua', custom: 'Modulo nuova uscita', custom_text: 'Scegli quali parti compaiono quando aggiungi un’uscita. I suggerimenti seguono la classe; l’ultima parola è tua.', other_classes: 'Altre classi', reset: 'Ripristina suggeriti', sections: 'Sezioni', tuning_params: 'Campi di tuning', temps: 'Temperature',
    home: 'Home', hero: 'Il tuo mare in un colpo d’occhio', trend: 'Vento nel tempo', avg_l: 'Media', gust_l: 'Raffiche', peak: 'Vento più forte', avg_mood: 'Umore medio', latest: 'Ultima uscita', see_all: 'Vedi tutte', kn: 'nodi',
    sessions: 'Uscite', venues: 'Luoghi', settings: 'Impostazioni', new_session: 'Nuova uscita', edit_session: 'Modifica uscita',
    empty_title: 'Il tuo quadernino è vuoto', empty_text: 'Dopo ogni uscita in acqua, scrivi cosa hai visto e come stavi. La prossima volta nello stesso posto ne saprai più di tutti.',
    when: 'Quando', date: 'Data', start: 'Inizio', end: 'Fine', venue: 'Luogo', venue_ph: 'Scrivi un posto, lago, golfo, circolo…', linked: '✓ Collegato alla mappa', type: 'Tipo di uscita',
    opt_training: 'Allenamento', opt_regatta: 'Regata', opt_other: 'Altro',
    boat: 'Barca', class: 'Classe', setup: 'Regolazioni', setup_ph: 'Vele, inclinazione albero, regolazioni…',
    wind: 'Vento', direction: 'Direzione (da dove arriva)', speed: 'Media (nodi)', gust: 'Raffiche (nodi)', shifts: 'Salti',
    shift_a: 'Salti da', shift_b: 'a', gust_dir: 'Le raffiche arrivano da', changes: 'Cambiamenti durante l’uscita', add_change: '+ Aggiungi cambiamento', at: 'Alle', tuning: 'Tuning', opt_steady: 'Stabile', opt_oscillating: 'Oscillante', opt_persistent: 'Persistente',
    sea: 'Mare e cielo', waves: 'Onda', opt_flat: 'Piatto', opt_chop: 'Onda corta', opt_swell: 'Onda lunga',
    current: 'Corrente', opt_none: 'Assente', opt_light: 'Debole', opt_strong: 'Forte',
    tide: 'Marea', opt_rising: 'Crescente', opt_falling: 'Calante', opt_high: 'Alta', opt_low: 'Bassa',
    air: 'Aria °C', water: 'Acqua °C', sky: 'Cielo',
    opt_sunny: 'Sereno', opt_partly: 'Poco nuvoloso', opt_cloudy: 'Nuvoloso', opt_rain: 'Pioggia', opt_storm: 'Temporale',
    races: 'Prove', race: 'Prova', add_race: '+ Aggiungi prova', result: 'Piazzamento', race_notes: 'Note sulla prova', remove: 'Rimuovi',
    reflection: 'Riflessione', good: 'Cosa è andato bene', work: 'Su cosa lavorare', feeling: 'Come stavo', notes: 'Altre note',
    photos: 'Foto', add_photo: '+ Aggiungi foto',
    save: 'Salva', cancel: 'Annulla', edit: 'Modifica', delete: 'Elimina', confirm_delete: 'Eliminare questa uscita? Non si può annullare.',
    not_found: 'Non trovato.', no_venues: 'I luoghi compaiono qui quando registri le uscite.', n_sessions: 'uscite', n_session: 'uscita',
    avg_wind: 'Vento medio nodi', max_gust: 'Raffica max nodi', wind_from: 'Da dove arrivava il vento', open_map: 'Apri mappa',
    language: 'Lingua', backup: 'Backup', export: 'Esporta backup', import: 'Importa backup',
    backup_text: 'Il quadernino vive solo su questo dispositivo. Ogni tanto esporta un backup e conservalo in un posto sicuro.',
    imported: 'Uscite importate:', bad_file: 'Questo file non è un backup valido.',
    storage_ok: 'Lo spazio è protetto dalla pulizia automatica.',
    storage_warn: 'Il browser può cancellare i dati che ritiene inutilizzati. Aggiungi l’app alla schermata Home ed esporta i backup.',
  },
};
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
let lang = store.get('lang') || (navigator.language.startsWith('it') ? 'it' : 'en');
const t = k => T[lang][k] ?? k;
const dirLabel = d => (lang === 'it' ? d.replace(/W/g, 'O') : d);

/* ---------- helpers ---------- */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtDate = d => (d ? new Date(d + 'T00:00').toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '');
const today = () => new Date().toLocaleDateString('sv'); // YYYY-MM-DD local
// randomUUID only exists on https/localhost; phones on the home Wi-Fi use plain http
const newId = () => crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
const isImg = s => typeof s === 'string' && s.startsWith('data:image/');
const FEEL = ['😫', '😕', '😐', '🙂', '🤩'];
const CLASSES = ['Optimist', 'ILCA 4', 'ILCA 6', 'ILCA 7', '420', '470', '29er', '49er', 'Nacra 15', 'Nacra 17', 'Techno 293', 'iQFoil', 'Waszp', 'Finn'];
// Tuning fields per class (sailing jargon, same in every language). Extend a list to add a field.
const ILCA = [   'Mast ring / rake', 'Traveller / sheet'];
const TUNING = {
  optimist: ['Mast rake', 'Sprit tension', 'Boom vang',  'Daggerboard'],
  'ilca 4': ILCA, 'ilca 6': ILCA, 'ilca 7': ILCA,
  420: ['Shrouds tension', 'Rake', 'Mast foot pin', 'Spreaders (length / angle)', 'Forestay / jib halyard',    'Jib leads'],
  470: ['Shrouds tension', 'Rake', 'Mast foot pin', 'Spreaders',    'Jib leads'],
  '29er': ['Shrouds tension', 'Rake', 'Spreaders',    'Jib leads', 'Gennaker setup'],
  '49er': ['Shrouds tension', 'Rake', 'Spreaders',    'Jib leads'],
  'nacra 15': ['Diamonds', 'Shrouds tension', 'Rake', 'Mast foot', 'Spreaders',   'Jib leads', 'Rudder rake'],
  'nacra 17': ['Diamonds', 'Shrouds tension', 'Rake', 'Mast foot', 'Spreaders',   'Jib leads', 'Rudder rake', 'Daggerboard rake'],
  'techno 293': ['Mast foot position', 'Downhaul',  'Boom height', 'Fin'],
  iqfoil: ['Mast foot position', 'Downhaul',  'Boom height', 'Foil / front wing', 'Mast track'],
  waszp: ['Rig size', 'Downhaul',   'Wand length', 'Ride height'],
  finn: ['Mast rake', 'Mast partners wedge',   'Outhaul'],
};
const EXTRA_TUNING = ['Vang', 'Cunningham', 'Outhaul', 'Jib halyard', 'Traveller'];
const SECTIONS = ['changes', 'waves', 'current', 'tide', 'sky', 'temps', 'tuning', 'setup', 'feel', 'photos'];
const SEC_LABEL = { changes: 'changes', waves: 'waves', current: 'current', tide: 'tide', sky: 'sky', temps: 'temps', tuning: 'tuning', setup: 'setup', feel: 'feeling', photos: 'photos' };
const ckey = c => String(c || '').trim().toLowerCase();
const tuningFor = c => TUNING[String(c || '').trim().toLowerCase()] || [];
const poolFor = c => [...new Set([...tuningFor(c), ...EXTRA_TUNING])];
// shortcut: suggestions are a guess by class (small boats sail lakes, so no tide/current); the user overrides in Settings
const suggest = c => {
  const off = new Set(['temps']);
  if (['optimist', 'ilca 4', 'ilca 6'].includes(ckey(c))) ['tide', 'current'].forEach(x => off.add(x));
  if (!tuningFor(c).length) off.add('tuning');
  return { sec: SECTIONS.filter(x => !off.has(x)), tun: tuningFor(c) };
};
const cfgAll = () => { try { return JSON.parse(store.get('cfg')) || {}; } catch { return {}; } };
const cfgFor = c => { const a = cfgAll(), k = ckey(c); return a[k] ?? (k in TUNING ? suggest(c) : a[''] ?? suggest('')); };
const OPTS = {
  type: ['training', 'regatta', 'other'], shifts: ['steady', 'oscillating', 'persistent'], waves: ['flat', 'chop', 'swell'],
  current: ['none', 'light', 'strong'], tide: ['none', 'rising', 'falling', 'high', 'low'], sky: ['sunny', 'partly', 'cloudy', 'rain', 'storm'],
};
const get = (s, path) => path.split('.').reduce((o, k) => o?.[k], s);

const seg = (s, name, opts) => `<div class="seg" role="radiogroup">${opts.map(o =>
  `<label><input type="radio" name="${name}" value="${o}" ${get(s, name) === o ? 'checked' : ''}><span>${t('opt_' + o)}</span></label>`).join('')}</div>`;
const field = (label, inner) => `<div class="field"><span class="lbl">${label}</span>${inner}</div>`;
const input = (s, name, type = 'text', extra = '') => `<input type="${type}" name="${name}" value="${esc(get(s, name))}" ${extra}>`;
const SHIFTY = ['oscillating', 'persistent'];
const sec = (id, inner) => `<div data-sec="${id}">${inner}</div>`;
const sh = (tone, ic, label) => `<h2 class="sh"><span class="ico ${tone}">${icon(ic)}</span>${label}</h2>`;
const dirSel = (s, name) => `<select name="${name}"><option value=""></option>${DIRS.map(d => `<option value="${d}" ${get(s, name) === d ? 'selected' : ''}>${dirLabel(d)}</option>`).join('')}</select>`;
const area = (s, name, ph = '') => `<textarea name="${name}" placeholder="${esc(ph)}">${esc(get(s, name))}</textarea>`;

/* ---------- views ---------- */
const app = document.getElementById('app');

function sessionCard(s) {
  const w = s.wind || {};
  const chips = [
    s.type && `<span class="chip ${s.type === 'regatta' ? 'hot' : ''}">${t('opt_' + s.type)}</span>`,
    s.class && `<span class="chip plain">${esc(s.class)}</span>`,
    (w.dir || w.speed) && `<span class="chip plain">${w.dir ? dirLabel(w.dir) : ''} ${w.speed ? w.speed + (w.gust ? '–' + w.gust : '') + ' kn' : ''}</span>`,
    s.feel && `<span>${FEEL[s.feel - 1]}</span>`,
  ].filter(Boolean).join('');
  const snip = s.work || s.good || s.notes;
  return `<a class="card" href="#/s/${s.id}">
    <div class="date">${fmtDate(s.date)}</div>
    <div class="title">${esc(s.venue?.name) || '—'}</div>
    <div class="row" style="margin-top:8px">${chips}</div>
    ${snip ? `<p class="snippet">${esc(snip)}</p>` : ''}
  </a>`;
}

const ICON = {
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5v.01M15 9.5v.01"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  wave: '<path d="M3 9c3-3 5 3 9 0s6 3 9 0M3 15c3-3 5 3 9 0s6 3 9 0"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  note: '<path d="M6 3h9l4 4v14H6zM9 12h7M9 16h7"/>',
  boat: '<path d="M12 3v13M12 4c3 2 5 6 5 12h-5M12 7c-2 1.5-4 4.5-4 9h4M4 19h16l-2 2H6z"/>',
};
const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

// smooth line through points: horizontal tangents never overshoot the data
const curve = pts => pts.map((p, i) => i ? `C${(pts[i - 1].x + p.x) / 2},${pts[i - 1].y} ${(pts[i - 1].x + p.x) / 2},${p.y} ${p.x},${p.y}` : `M${p.x},${p.y}`).join('');

function trendChart(series) {
  const W = 340, H = 190, L = 30, R = 14, T = 14, B = 26;
  const top = Math.max(10, Math.ceil(Math.max(...series.map(p => Math.max(p.speed || 0, p.gust || 0))) / 5) * 5);
  const x = i => (series.length > 1 ? L + (i * (W - L - R)) / (series.length - 1) : (L + W - R) / 2);
  const y = v => T + (1 - v / top) * (H - T - B);
  const line = key => series.map((p, i) => p[key] && { x: x(i), y: y(p[key]) }).filter(Boolean);
  const [avg, gust] = [line('speed'), line('gust')];
  const grid = [0, top / 2, top].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid-l"/><text x="${L - 8}" y="${y(v)}" class="ax" text-anchor="end" dominant-baseline="central">${v}</text>`).join('');
  const path = (pts, cls) => pts.length > 1 ? `<path d="${curve(pts)}" class="ln ${cls}"/>` : '';
  const dots = (pts, cls) => pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4.5" class="dot ${cls}"/>`).join('');
  const area = avg.length > 1 ? `<path d="${curve(avg)} L${avg.at(-1).x},${y(0)} L${avg[0].x},${y(0)}Z" fill="url(#fillAvg)"/>` : '';
  const d = i => new Date(series[i].date + 'T00:00').toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('trend')}">
    <defs><linearGradient id="fillAvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--c-lav)" stop-opacity=".55"/><stop offset="1" stop-color="var(--c-lav)" stop-opacity="0"/></linearGradient></defs>
    ${grid}${area}${path(gust, 'gust')}${path(avg, 'avg')}${dots(gust, 'gust')}${dots(avg, 'avg')}
    <text x="${x(0)}" y="${H - 6}" class="ax" text-anchor="${series.length > 1 ? 'start' : 'middle'}">${d(0)}</text>
    ${series.length > 1 ? `<text x="${x(series.length - 1)}" y="${H - 6}" class="ax" text-anchor="end">${d(series.length - 1)}</text>` : ''}</svg>`;
}

async function homeView() {
  const all = await db.all();
  if (!all.length) return listView();
  const o = overview(all);
  const tile = (cls, ic, val, label) => `<div class="tile ${cls}"><span class="ico">${icon(ic)}</span><b>${val}</b><span class="tl">${label}</span></div>`;
  app.innerHTML = `
  <header class="hello"><span class="ico big">${icon('boat')}</span><div><small>${t('hero')}</small><h1>Quadernino</h1></div></header>
  <section class="hero">
    <div class="hero-top"><div><b class="big-n">${o.count}</b><span>${t(o.count === 1 ? 'n_session' : 'n_sessions')}</span></div>
      <div class="legend"><i class="avg"></i>${t('avg_l')}<i class="gust"></i>${t('gust_l')}</div></div>
    ${o.series.some(p => p.speed || p.gust) ? trendChart(o.series) : ''}
  </section>
  <div class="tiles">
    ${tile('lav', 'bolt', o.peak ? `${o.peak}<small> ${t('kn')}</small>` : '—', t('peak'))}
    ${tile('mint', 'wind', o.avg ? `${o.avg}<small> ${t('kn')}</small>` : '—', t('avg_wind').replace(/ kn$/i, ''))}
    ${tile('peach', 'pin', o.venues, t('venues'))}
    ${tile('pink', 'smile', o.feel ? `${FEEL[Math.round(o.feel) - 1]} <small>${o.feel}</small>` : '—', t('avg_mood'))}
  </div>
  <div class="row spread" style="margin-top:22px"><h2 style="margin:0">${t('latest')}</h2><a href="#/sessions" class="more">${t('see_all')} ›</a></div>
  <div style="margin-top:12px">${sessionCard(sortByDate(all)[0])}</div>
  <a class="btn fab" href="#/new" aria-label="${t('new_session')}">+</a>`;
}

async function listView() {
  const all = sortByDate(await db.all());
  app.innerHTML = !all.length
    ? `<div class="empty"><h2>${t('empty_title')}</h2><p class="muted">${t('empty_text')}</p><a class="btn" href="#/new">${t('new_session')}</a></div>`
    : `<h1>${t('sessions')}</h1>${all.map(sessionCard).join('')}<a class="btn fab" href="#/new" aria-label="${t('new_session')}">+</a>`;
}

async function formView(id) {
  const orig = id ? await db.get(id) : null;
  if (id && !orig) return notFound();
  const s = orig ? structuredClone(orig) : { date: today(), type: 'training', class: store.get('lastClass') || '', wind: {}, sea: {}, races: [], photos: [] };
  let venue = s.venue || null;
  let photos = [...(s.photos || [])];
  let races = s.races?.length ? s.races : [{}];
  let changes = [...(s.wind?.changes || [])];
  let tuning = { ...s.tuning };

  app.innerHTML = `
  <a class="back" href="${id ? '#/s/' + id : '#/sessions'}">‹ ${t('cancel')}</a>
  <header class="hello"><span class="ico big">${icon('boat')}</span><div><small>${t('form_sub')}</small><h1>${t(id ? 'edit_session' : 'new_session')}</h1></div></header>
  <form id="f" autocomplete="off">
    <section class="hero">${sh('sky', 'cal', t('when'))}
      <label class="field"><span class="lbl">${t('date')}</span>${input(s, 'date', 'date', 'required')}</label>
      <div class="grid">
        <label class="field"><span class="lbl">${t('start')}</span>${input(s, 'start', 'time')}</label>
        <label class="field"><span class="lbl">${t('end')}</span>${input(s, 'end', 'time')}</label>
      </div>
      <label class="field"><span class="lbl">${t('venue')}</span>
        <input id="venue" value="${esc(venue?.name)}" placeholder="${t('venue_ph')}" autocomplete="off">
        <div class="linked" id="linked" ${venue?.osm ? '' : 'hidden'}>${t('linked')}</div>
        <ul class="suggest" id="suggest"></ul>
      </label>
      ${field(t('type'), seg(s, 'type', OPTS.type))}
    </section>

    <section class="card t-lav">${sh('lav', 'boat', t('boat'))}
      <label class="field"><span class="lbl">${t('class')}</span>${input(s, 'class', 'text', 'list="classes"')}
        <datalist id="classes">${CLASSES.map(c => `<option value="${c}">`).join('')}</datalist></label>
      ${sec('tuning', '<div id="tuning"></div>')}
      ${sec('setup', `<label class="field"><span class="lbl">${t('setup')}</span>${area(s, 'setup', t('setup_ph'))}</label>`)}
    </section>

    <section class="card t-mint">${sh('mint', 'wind', t('wind'))}
      <span class="lbl muted" style="font-size:13px;font-weight:600">${t('direction')}</span>
      <div class="compass" role="radiogroup" aria-label="${t('direction')}">${DIRS.map((d, i) =>
        `<label class="${i % 4 ? '' : 'major'}" style="--a:${i * 22.5}deg"><input type="radio" name="wind.dir" value="${d}" ${s.wind?.dir === d ? 'checked' : ''}><span>${dirLabel(d)}</span></label>`).join('')}
      </div>
      <div class="grid">
        <label class="field"><span class="lbl">${t('speed')}</span>${input(s, 'wind.speed', 'number', 'min="0" max="80" step="0.5" inputmode="decimal"')}</label>
        <label class="field"><span class="lbl">${t('gust')}</span>${input(s, 'wind.gust', 'number', 'min="0" max="90" step="0.5" inputmode="decimal"')}</label>
      </div>
      <label class="field" id="gustDirF"><span class="lbl">${t('gust_dir')}</span>${dirSel(s, 'wind.gustDir')}</label>
      ${field(t('shifts'), seg(s, 'wind.shifts', OPTS.shifts))}
      <div class="grid" id="shiftF">
        <label class="field"><span class="lbl">${t('shift_a')}</span>${dirSel(s, 'wind.shiftA')}</label>
        <label class="field"><span class="lbl">${t('shift_b')}</span>${dirSel(s, 'wind.shiftB')}</label>
      </div>
      ${sec('changes', `<span class="lbl muted" style="font-size:13px;font-weight:600">${t('changes')}</span>
        <div id="changes"></div>
        <button type="button" class="btn ghost small" id="addChange">${t('add_change')}</button>`)}
    </section>

    <section class="card t-pink" id="seaCard">${sh('pink', 'wave', t('sea'))}
      ${sec('waves', field(t('waves'), seg(s, 'sea.waves', OPTS.waves)))}
      ${sec('current', field(t('current'), seg(s, 'sea.current', OPTS.current)))}
      ${sec('tide', field(t('tide'), seg(s, 'sea.tide', OPTS.tide)))}
      ${sec('sky', field(t('sky'), seg(s, 'sea.sky', OPTS.sky)))}
      ${sec('temps', `<div class="grid">
        <label class="field"><span class="lbl">${t('air')}</span>${input(s, 'sea.air', 'number', 'step="0.5" inputmode="decimal"')}</label>
        <label class="field"><span class="lbl">${t('water')}</span>${input(s, 'sea.water', 'number', 'step="0.5" inputmode="decimal"')}</label>
      </div>`)}
    </section>

    <section class="card t-peach" id="racesCard">${sh('peach', 'flag', t('races'))}
      <div id="races"></div>
      <button type="button" class="btn ghost small" id="addRace">${t('add_race')}</button>
    </section>

    <section class="card t-lav">${sh('lav', 'note', t('reflection'))}
      ${sec('feel', field(t('feeling'), `<div class="feel" role="radiogroup">${FEEL.map((e, i) =>
        `<label><input type="radio" name="feel" value="${i + 1}" ${s.feel == i + 1 ? 'checked' : ''} aria-label="${i + 1}/5"><span>${e}</span></label>`).join('')}</div>`))}
      <label class="field"><span class="lbl">${t('good')}</span>${area(s, 'good')}</label>
      <label class="field"><span class="lbl">${t('work')}</span>${area(s, 'work')}</label>
      <label class="field"><span class="lbl">${t('notes')}</span>${area(s, 'notes')}</label>
    </section>

    <section class="card t-mint" data-sec="photos">${sh('mint', 'camera', t('photos'))}
      <div class="photos" id="photos"></div>
      <label class="btn ghost small">${t('add_photo')}<input type="file" id="photoIn" accept="image/*" multiple hidden></label>
    </section>

    <div class="actions">
      <button class="btn">${t('save')}</button>
      ${id ? `<button type="button" class="btn danger" id="del">${t('delete')}</button>` : ''}
    </div>
  </form>`;

  const f = document.getElementById('f');

  // tap a selected chip again to clear it
  f.addEventListener('pointerdown', e => { const i = e.target.closest('label')?.querySelector('input[type=radio]'); if (i) i.dataset.was = i.checked; });
  f.addEventListener('click', e => { const i = e.target.closest('label')?.querySelector('input[type=radio]'); if (i && e.target === i && i.dataset.was === 'true') { i.checked = false; i.dataset.was = 'false'; } });

  // gust / shift direction fields only when relevant
  const showWind = () => {
    document.getElementById('gustDirF').hidden = !f.elements['wind.gust'].value;
    document.getElementById('shiftF').hidden = !SHIFTY.includes(f.elements['wind.shifts'].value); // steady: no shift directions
  };
  f.addEventListener('input', showWind); f.addEventListener('change', showWind); showWind();

  // wind changes over time
  const chEl = document.getElementById('changes');
  const drawChanges = () => {
    chEl.innerHTML = changes.map((c, i) => `<div class="race"><div class="grid">
      <label class="field"><span class="lbl">${t('at')}</span><input class="c-time" type="time" value="${esc(c.time)}"></label>
      <label class="field"><span class="lbl">${t('direction').split(' (')[0]}</span>${dirSel({ c }, 'c.dir').replace('<select', '<select class="c-dir"')}</label>
      <label class="field"><span class="lbl">${t('speed')}</span><input class="c-speed" type="number" min="0" max="80" step="0.5" inputmode="decimal" value="${esc(c.speed)}"></label>
      <div class="field"><span class="lbl">&nbsp;</span><button type="button" class="btn danger small wide" data-rm="${i}">${t('remove')}</button></div></div></div>`).join('');
  };
  const readChanges = () => [...chEl.querySelectorAll('.race')].map(el => ({ time: el.querySelector('.c-time').value, dir: el.querySelector('.c-dir').value, speed: el.querySelector('.c-speed').value }));
  chEl.onclick = e => { const i = e.target.dataset.rm; if (i != null) { changes = readChanges(); changes.splice(+i, 1); drawChanges(); } };
  document.getElementById('addChange').onclick = () => { changes = [...readChanges(), {}]; drawChanges(); };
  drawChanges();

  // tuning fields follow the class
  const tunEl = document.getElementById('tuning');
  const drawTuning = () => {
    const c = f.elements.class.value, on = cfgFor(c).tun;
    const ks = poolFor(c).filter(k => on.includes(k) || tuning[k]); // a field that already holds a value stays visible
    tunEl.innerHTML = ks.length ? `<span class="lbl muted" style="font-size:13px;font-weight:600">${t('tuning')}</span><div class="grid">${ks.map(k =>
      `<label class="field"><span class="lbl">${k}</span><input class="t-in" data-k="${esc(k)}" value="${esc(tuning[k])}"></label>`).join('')}</div>` : '';
  };
  // settings decide which parts of the form show; hidden inputs keep their values
  const applySections = () => {
    const on = new Set(cfgFor(f.elements.class.value).sec);
    f.querySelectorAll('[data-sec]').forEach(el => { el.hidden = !on.has(el.dataset.sec); });
    document.getElementById('seaCard').hidden = !document.querySelector('#seaCard [data-sec]:not([hidden])');
  };
  const readTuning = () => { tunEl.querySelectorAll('.t-in').forEach(i => { tuning[i.dataset.k] = i.value.trim(); }); };
  f.elements.class.addEventListener('input', () => { readTuning(); drawTuning(); applySections(); });
  drawTuning(); applySections();

  // regatta → races
  const racesCard = document.getElementById('racesCard'), racesEl = document.getElementById('races');
  const showRaces = () => { racesCard.hidden = f.elements.type.value !== 'regatta'; };
  const drawRaces = () => {
    racesEl.innerHTML = races.map((r, i) => `<div class="race" data-i="${i}">
      <div class="row spread"><b>${t('race')} ${i + 1}</b>${races.length > 1 ? `<button type="button" class="btn danger small" data-rm="${i}">${t('remove')}</button>` : ''}</div>
      <label class="field"><span class="lbl">${t('result')}</span><input class="r-result" value="${esc(r.result)}" inputmode="numeric" placeholder="1, 12, OCS, DNF…"></label>
      <label class="field"><span class="lbl">${t('race_notes')}</span><textarea class="r-notes">${esc(r.notes)}</textarea></label>
    </div>`).join('');
  };
  const readRaces = () => [...racesEl.querySelectorAll('.race')].map(el => ({ result: el.querySelector('.r-result').value.trim(), notes: el.querySelector('.r-notes').value.trim() }));
  racesEl.onclick = e => { const i = e.target.dataset.rm; if (i != null) { races = readRaces(); races.splice(+i, 1); drawRaces(); } };
  document.getElementById('addRace').onclick = () => { races = [...readRaces(), {}]; drawRaces(); racesEl.lastElementChild.querySelector('input').focus(); };
  f.addEventListener('change', e => e.target.name === 'type' && showRaces());
  drawRaces(); showRaces();

  // venue search (OpenStreetMap)
  const vin = document.getElementById('venue'), sug = document.getElementById('suggest'), linked = document.getElementById('linked');
  let timer, ctrl;
  vin.oninput = () => {
    const q = vin.value.trim();
    venue = q ? { name: q } : null; // typed name still works offline
    linked.hidden = true;
    clearTimeout(timer);
    if (q.length < 3) { sug.innerHTML = ''; return; }
    timer = setTimeout(async () => {
      ctrl?.abort(); ctrl = new AbortController();
      try {
        // shortcut: public Nominatim allows ~1 req/s and no heavy use; move to a hosted geocoder when users grow
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=${lang}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const list = await r.json();
        sug.innerHTML = list.map((p, i) => `<li><button type="button" data-i="${i}">${esc(p.name || p.display_name.split(',')[0])}<small>${esc(p.display_name)}</small></button></li>`).join('');
        sug.onclick = e => {
          const b = e.target.closest('button'); if (!b) return;
          const p = list[b.dataset.i];
          venue = { name: p.name || p.display_name.split(',')[0], place: p.display_name, lat: +p.lat, lon: +p.lon, osm: `${p.osm_type}/${p.osm_id}` };
          vin.value = venue.name; sug.innerHTML = ''; linked.hidden = false;
        };
      } catch { /* offline or aborted: keep the typed name */ }
    }, 700);
  };

  // photos, downscaled so they don't fill the phone
  const photosEl = document.getElementById('photos');
  const drawPhotos = () => { photosEl.innerHTML = photos.map((p, i) => `<figure><img src="${p}" alt=""><button type="button" data-i="${i}" aria-label="${t('remove')}">×</button></figure>`).join(''); };
  photosEl.onclick = e => { const i = e.target.dataset.i; if (i != null) { photos.splice(+i, 1); drawPhotos(); } };
  document.getElementById('photoIn').onchange = async e => {
    for (const file of e.target.files) photos.push(await shrink(file));
    e.target.value = ''; drawPhotos();
  };
  drawPhotos();

  document.getElementById('del')?.addEventListener('click', async () => {
    if (confirm(t('confirm_delete'))) { await db.del(id); location.hash = '#/sessions'; }
  });

  f.onsubmit = async e => {
    e.preventDefault();
    const out = { ...s, id: s.id || newId(), venue, photos, updated: Date.now() };
    readTuning();
    for (const el of f.elements) {
      if (!el.name) continue;
      const [a, b] = el.name.split('.');
      let v = el.type === 'number' ? (el.value === '' ? null : +el.value) : el.value.trim();
      if (el.type === 'radio') { if (!el.checked) { if (String(get(out, el.name)) === el.value) v = null; else continue; } }
      if (a === 'feel' && v) v = +v;
      if (b) (out[a] = { ...out[a] })[b] = v; else out[a] = v;
    }
    out.tuning = Object.fromEntries(poolFor(out.class).filter(k => tuning[k]).map(k => [k, tuning[k]]));
    if (f.elements['wind.gust'].value === '') out.wind.gustDir = '';
    if (!SHIFTY.includes(out.wind.shifts)) out.wind.shiftA = out.wind.shiftB = '';
    out.wind.changes = readChanges().filter(c => c.time || c.dir || c.speed);
    out.races = out.type === 'regatta' ? readRaces().filter(r => r.result || r.notes) : [];
    if (out.class) store.set('lastClass', out.class);
    await db.put(out);
    location.hash = '#/s/' + out.id;
  };
}

function shrink(file, max = 1280) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

async function sessionView(id) {
  const s = await db.get(id);
  if (!s) return notFound();
  const w = s.wind || {}, sea = s.sea || {};
  const opt = v => (v ? t('opt_' + v) : null);
  const rows = (pairs) => {
    const r = pairs.filter(([, v]) => v != null && v !== '');
    return r.length ? `<dl>${r.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '<p class="muted">—</p>';
  };
  const text = (label, v) => (v ? `<div class="lbl muted" style="font-size:13px;font-weight:600">${label}</div><p class="text">${esc(v)}</p>` : '');
  const vk = venueKey(s.venue);
  app.innerHTML = `
  <a class="back" href="#/sessions">‹ ${t('sessions')}</a>
  <div class="row spread"><div><div class="date">${fmtDate(s.date)}${s.start ? ` · ${s.start}${s.end ? '–' + s.end : ''}` : ''}</div>
    <h1 style="margin-top:2px">${vk ? `<a href="#/venue/${encodeURIComponent(vk)}" style="color:inherit">${esc(s.venue.name)}</a>` : '—'}</h1></div>
    <a class="btn ghost small" href="#/edit/${s.id}">${t('edit')}</a></div>
  <div class="row" style="margin:-6px 0 14px">
    ${s.type ? `<span class="chip ${s.type === 'regatta' ? 'hot' : ''}">${opt(s.type)}</span>` : ''}
    ${s.class ? `<span class="chip plain">${esc(s.class)}</span>` : ''}
    ${s.feel ? `<span style="font-size:22px">${FEEL[s.feel - 1]}</span>` : ''}
  </div>
  <section class="card"><h2>${t('wind')}</h2>${rows([
    [t('direction'), w.dir && dirLabel(w.dir)], [t('speed'), w.speed], [t('gust'), w.gust], [t('gust_dir'), w.gustDir && dirLabel(w.gustDir)], [t('shifts'), opt(w.shifts)],
    [t('shift_a') + ' → ' + t('shift_b'), w.shiftA || w.shiftB ? `${dirLabel(w.shiftA || '?')} → ${dirLabel(w.shiftB || '?')}` : null],
    ...(w.changes || []).map(c => [c.time || '—', [c.dir && dirLabel(c.dir), c.speed && c.speed + ' kn'].filter(Boolean).join(' · ')])])}</section>
  <section class="card"><h2>${t('sea')}</h2>${rows([
    [t('waves'), opt(sea.waves)], [t('current'), opt(sea.current)], [t('tide'), opt(sea.tide)], [t('sky'), opt(sea.sky)], [t('air'), sea.air], [t('water'), sea.water]])}</section>
  ${s.races?.length ? `<section class="card"><h2>${t('races')}</h2>${s.races.map((r, i) =>
    `<div class="race"><div class="row spread"><b>${t('race')} ${i + 1}</b><span class="chip hot">${esc(r.result) || '—'}</span></div>${r.notes ? `<p class="text">${esc(r.notes)}</p>` : ''}</div>`).join('')}</section>` : ''}
  ${s.good || s.work || s.notes ? `<section class="card"><h2>${t('reflection')}</h2>${text(t('good'), s.good)}${text(t('work'), s.work)}${text(t('notes'), s.notes)}</section>` : ''}
  ${s.setup || Object.keys(s.tuning || {}).length ? `<section class="card"><h2>${t('boat')}</h2>${rows(Object.entries(s.tuning || {}))}${text(t('setup'), s.setup)}</section>` : ''}
  ${s.photos?.filter(isImg).length ? `<section class="card"><h2>${t('photos')}</h2><div class="photos">${s.photos.filter(isImg).map(p => `<figure><img src="${p}" alt=""></figure>`).join('')}</div></section>` : ''}`;
}

function rose(counts) {
  const max = Math.max(1, ...counts), c = 100;
  const pt = (deg, r) => { const a = (deg * Math.PI) / 180; return `${(c + r * Math.sin(a)).toFixed(1)},${(c - r * Math.cos(a)).toFixed(1)}`; };
  const petals = counts.map((n, i) => n ? `<path d="M${c},${c} L${pt(i * 22.5 - 9, 18 + (62 * n) / max)} A1 1 0 0 1 ${pt(i * 22.5 + 9, 18 + (62 * n) / max)} Z" fill="var(--accent)" opacity="${0.45 + (0.55 * n) / max}"/>` : '').join('');
  const lbl = (d, deg) => { const [x, y] = pt(deg, 92).split(','); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="700" fill="var(--muted)">${dirLabel(d)}</text>`; };
  return `<svg class="rose" viewBox="0 0 200 200" role="img" aria-label="${t('wind_from')}">
    <circle cx="100" cy="100" r="80" fill="none" stroke="var(--line)"/><circle cx="100" cy="100" r="40" fill="none" stroke="var(--line)"/>
    ${petals}${lbl('N', 0)}${lbl('E', 90)}${lbl('S', 180)}${lbl('W', 270)}</svg>`;
}

async function venuesView() {
  const groups = groupByVenue(await db.all());
  app.innerHTML = `<h1>${t('venues')}</h1>` + (groups.length
    ? groups.map(g => `<a class="card" href="#/venue/${encodeURIComponent(g.key)}"><div class="row spread">
        <div><div class="title">${esc(g.venue.name)}</div>${g.venue.place ? `<small>${esc(g.venue.place)}</small>` : ''}</div>
        <span class="chip">${g.sessions.length} ${t(g.sessions.length === 1 ? 'n_session' : 'n_sessions')}</span></div></a>`).join('')
    : `<p class="muted">${t('no_venues')}</p>`);
}

async function venueView(key) {
  const g = groupByVenue(await db.all()).find(x => x.key === key);
  if (!g) return notFound();
  const w = windSummary(g.sessions), v = g.venue;
  app.innerHTML = `
  <a class="back" href="#/venues">‹ ${t('venues')}</a>
  <h1 style="margin-bottom:4px">${esc(v.name)}</h1>
  ${v.place ? `<p class="muted" style="margin:0 0 4px;font-size:14px">${esc(v.place)}</p>` : ''}
  ${v.lat ? `<a href="https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lon}#map=13/${v.lat}/${v.lon}" target="_blank" rel="noopener" style="font-size:14px;font-weight:600">${t('open_map')} ↗</a>` : ''}
  <section class="card" style="margin-top:14px">
    <div class="stats"><div><b>${g.sessions.length}</b><span>${t(g.sessions.length === 1 ? 'n_session' : 'n_sessions')}</span></div>
      <div><b>${w.avg ?? '—'}</b><span>${t('avg_wind')}</span></div><div><b>${w.maxGust ?? '—'}</b><span>${t('max_gust')}</span></div></div>
  </section>
  ${w.counts.some(Boolean) ? `<section class="card"><h2>${t('wind_from')}</h2>${rose(w.counts)}</section>` : ''}
  <h2 style="margin-top:20px">${t('sessions')}</h2>
  ${g.sessions.map(sessionCard).join('')}`;
}

function settingsView() {
  app.innerHTML = `
  <h1>${t('settings')}</h1>
  <section class="card"><h2>${t('language')}</h2>
    <div class="seg" role="radiogroup">${[['en', 'English'], ['it', 'Italiano']].map(([k, n]) =>
      `<label><input type="radio" name="lang" value="${k}" ${lang === k ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
  </section>
  <section class="card"><h2>${t('custom')}</h2>
    <p class="muted" style="margin-top:0">${t('custom_text')}</p>
    <label class="field"><span class="lbl">${t('class')}</span><select id="cc">${['', ...CLASSES].map(c => `<option value="${esc(c)}">${c ? esc(c) : t('other_classes')}</option>`).join('')}</select></label>
    <div id="ccBody"></div>
  </section>
  <section class="card"><h2>${t('backup')}</h2>
    <p class="muted" style="margin-top:0">${t('backup_text')}</p>
    <p id="persist" class="muted" style="font-size:14px"></p>
    <div class="row"><button class="btn" id="exp">${t('export')}</button>
      <label class="btn ghost">${t('import')}<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
    <p id="msg" style="font-weight:600"></p>
  </section>`;
  const cc = document.getElementById('cc'), ccBody = document.getElementById('ccBody');
  const drawCustom = () => {
    const c = cfgFor(cc.value), pool = ckey(cc.value) in TUNING ? poolFor(cc.value) : [];
    const chips = (g, items, on) => `<div class="seg">${items.map(([v, label]) => `<label><input type="checkbox" data-g="${g}" value="${esc(v)}" ${on.includes(v) ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}</div>`;
    ccBody.innerHTML = `<span class="lbl muted" style="font-size:13px;font-weight:600">${t('sections')}</span>${chips('sec', SECTIONS.map(x => [x, t(SEC_LABEL[x])]), c.sec)}
      ${pool.length ? `<span class="lbl muted" style="display:block;margin-top:14px;font-size:13px;font-weight:600">${t('tuning_params')}</span>${chips('tun', pool.map(x => [x, x]), c.tun)}` : ''}
      <button type="button" class="btn ghost small" id="ccReset" style="margin-top:14px">${t('reset')}</button>`;
    document.getElementById('ccReset').onclick = () => { const a = cfgAll(); delete a[ckey(cc.value)]; store.set('cfg', JSON.stringify(a)); drawCustom(); };
  };
  ccBody.onchange = () => {
    const pick = g => [...ccBody.querySelectorAll(`[data-g=${g}]:checked`)].map(i => i.value);
    const prev = cfgFor(cc.value);
    store.set('cfg', JSON.stringify({ ...cfgAll(), [ckey(cc.value)]: { sec: pick('sec'), tun: ccBody.querySelector('[data-g=tun]') ? pick('tun') : prev.tun } }));
  };
  cc.onchange = drawCustom; drawCustom();
  app.querySelectorAll('input[name=lang]').forEach(i => i.onchange = () => { lang = i.value; store.set('lang', lang); route(); });
  navigator.storage?.persisted?.().then(p => { document.getElementById('persist').textContent = t(p ? 'storage_ok' : 'storage_warn'); });
  document.getElementById('exp').onclick = async () => {
    const blob = new Blob([JSON.stringify({ app: 'quadernino', version: 1, sessions: await db.all() })], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `quadernino-${today()}.json` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  document.getElementById('imp').onchange = async e => {
    const msg = document.getElementById('msg');
    try {
      const data = JSON.parse(await e.target.files[0].text());
      const list = data?.sessions;
      if (data?.app !== 'quadernino' || !Array.isArray(list) || !list.every(s => s && typeof s.id === 'string' && typeof s.date === 'string')) throw 0;
      // same id → the newer edit wins, nothing on this device is lost to an older backup
      let n = 0;
      for (const s of list) {
        const cur = await db.get(s.id);
        if (!cur || (s.updated || 0) > (cur.updated || 0)) { s.photos = (s.photos || []).filter(isImg); await db.put(s); n++; }
      }
      msg.textContent = `${t('imported')} ${n}`;
    } catch { msg.textContent = t('bad_file'); }
    e.target.value = '';
  };
}

function notFound() { app.innerHTML = `<a class="back" href="#/sessions">‹ ${t('sessions')}</a><p class="muted">${t('not_found')}</p>`; }

/* ---------- router ---------- */
async function route() {
  const [, view = '', id] = location.hash.split('/');
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  const tab = { '': 'home', sessions: 'list', s: 'list', new: 'list', edit: 'list', venues: 'venues', venue: 'venues', settings: 'settings' }[view];
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  const views = { '': homeView, sessions: listView, new: () => formView(), edit: () => formView(id), s: () => sessionView(id), venues: venuesView, venue: () => venueView(decodeURIComponent(id || '')), settings: settingsView };
  await (views[view] || listView)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
