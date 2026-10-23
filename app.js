import { DIRS, venueKey, groupByVenue, windSummary, sortByDate } from './logic.js';

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
const tuningFor = c => TUNING[String(c || '').trim().toLowerCase()] || [];
const OPTS = {
  type: ['training', 'regatta', 'other'], shifts: ['steady', 'oscillating', 'persistent'], waves: ['flat', 'chop', 'swell'],
  current: ['none', 'light', 'strong'], tide: ['none', 'rising', 'falling', 'high', 'low'], sky: ['sunny', 'partly', 'cloudy', 'rain', 'storm'],
};
const get = (s, path) => path.split('.').reduce((o, k) => o?.[k], s);

const seg = (s, name, opts) => `<div class="seg" role="radiogroup">${opts.map(o =>
  `<label><input type="radio" name="${name}" value="${o}" ${get(s, name) === o ? 'checked' : ''}><span>${t('opt_' + o)}</span></label>`).join('')}</div>`;
const field = (label, inner) => `<div class="field"><span class="lbl">${label}</span>${inner}</div>`;
const input = (s, name, type = 'text', extra = '') => `<input type="${type}" name="${name}" value="${esc(get(s, name))}" ${extra}>`;
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
  <a class="back" href="${id ? '#/s/' + id : '#/'}">‹ ${t('cancel')}</a>
  <h1>${t(id ? 'edit_session' : 'new_session')}</h1>
  <form id="f" autocomplete="off">
    <section class="card"><h2>${t('when')}</h2>
      <div class="grid">
        <label class="field"><span class="lbl">${t('date')}</span>${input(s, 'date', 'date', 'required')}</label>
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

    <section class="card"><h2>${t('boat')}</h2>
      <label class="field"><span class="lbl">${t('class')}</span>${input(s, 'class', 'text', 'list="classes"')}
        <datalist id="classes">${CLASSES.map(c => `<option value="${c}">`).join('')}</datalist></label>
      <div id="tuning"></div>
      <label class="field"><span class="lbl">${t('setup')}</span>${area(s, 'setup', t('setup_ph'))}</label>
    </section>

    <section class="card"><h2>${t('wind')}</h2>
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
      <h2 style="margin-top:16px">${t('changes')}</h2>
      <div id="changes"></div>
      <button type="button" class="btn ghost small" id="addChange">${t('add_change')}</button>
    </section>

    <section class="card"><h2>${t('sea')}</h2>
      ${field(t('waves'), seg(s, 'sea.waves', OPTS.waves))}
      ${field(t('current'), seg(s, 'sea.current', OPTS.current))}
      ${field(t('tide'), seg(s, 'sea.tide', OPTS.tide))}
      ${field(t('sky'), seg(s, 'sea.sky', OPTS.sky))}
      <div class="grid">
        <label class="field"><span class="lbl">${t('air')}</span>${input(s, 'sea.air', 'number', 'step="0.5" inputmode="decimal"')}</label>
        <label class="field"><span class="lbl">${t('water')}</span>${input(s, 'sea.water', 'number', 'step="0.5" inputmode="decimal"')}</label>
      </div>
    </section>

    <section class="card" id="racesCard"><h2>${t('races')}</h2>
      <div id="races"></div>
      <button type="button" class="btn ghost small" id="addRace">${t('add_race')}</button>
    </section>

    <section class="card"><h2>${t('reflection')}</h2>
      ${field(t('feeling'), `<div class="feel" role="radiogroup">${FEEL.map((e, i) =>
        `<label><input type="radio" name="feel" value="${i + 1}" ${s.feel == i + 1 ? 'checked' : ''} aria-label="${i + 1}/5"><span>${e}</span></label>`).join('')}</div>`)}
      <label class="field"><span class="lbl">${t('good')}</span>${area(s, 'good')}</label>
      <label class="field"><span class="lbl">${t('work')}</span>${area(s, 'work')}</label>
      <label class="field"><span class="lbl">${t('notes')}</span>${area(s, 'notes')}</label>
    </section>

    <section class="card"><h2>${t('photos')}</h2>
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
    document.getElementById('shiftF').hidden = !f.elements['wind.shifts'].value;
  };
  f.addEventListener('input', showWind); f.addEventListener('change', showWind); showWind();

  // wind changes over time
  const chEl = document.getElementById('changes');
  const drawChanges = () => {
    chEl.innerHTML = changes.map((c, i) => `<div class="race"><div class="grid">
      <label class="field"><span class="lbl">${t('at')}</span><input class="c-time" type="time" value="${esc(c.time)}"></label>
      <label class="field"><span class="lbl">${t('direction').split(' (')[0]}</span>${dirSel({ c }, 'c.dir').replace('<select', '<select class="c-dir"')}</label>
      <label class="field"><span class="lbl">${t('speed')}</span><input class="c-speed" type="number" min="0" max="80" step="0.5" inputmode="decimal" value="${esc(c.speed)}"></label></div>
      <button type="button" class="btn danger small" data-rm="${i}">${t('remove')}</button></div>`).join('');
  };
  const readChanges = () => [...chEl.querySelectorAll('.race')].map(el => ({ time: el.querySelector('.c-time').value, dir: el.querySelector('.c-dir').value, speed: el.querySelector('.c-speed').value }));
  chEl.onclick = e => { const i = e.target.dataset.rm; if (i != null) { changes = readChanges(); changes.splice(+i, 1); drawChanges(); } };
  document.getElementById('addChange').onclick = () => { changes = [...readChanges(), {}]; drawChanges(); };
  drawChanges();

  // tuning fields follow the class
  const tunEl = document.getElementById('tuning');
  const drawTuning = () => {
    tunEl.innerHTML = tuningFor(f.elements.class.value).length ? `<span class="lbl muted" style="font-size:13px;font-weight:600">${t('tuning')}</span><div class="grid">${tuningFor(f.elements.class.value).map(k =>
      `<label class="field"><span class="lbl">${k}</span><input class="t-in" data-k="${esc(k)}" value="${esc(tuning[k])}"></label>`).join('')}</div>` : '';
  };
  const readTuning = () => { tunEl.querySelectorAll('.t-in').forEach(i => { tuning[i.dataset.k] = i.value.trim(); }); };
  f.elements.class.addEventListener('input', () => { readTuning(); drawTuning(); });
  drawTuning();

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
    if (confirm(t('confirm_delete'))) { await db.del(id); location.hash = '#/'; }
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
    const keep = tuningFor(out.class);
    out.tuning = Object.fromEntries(keep.filter(k => tuning[k]).map(k => [k, tuning[k]]));
    if (f.elements['wind.gust'].value === '') out.wind.gustDir = '';
    if (!out.wind.shifts) out.wind.shiftA = out.wind.shiftB = '';
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
  <a class="back" href="#/">‹ ${t('sessions')}</a>
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
  <section class="card"><h2>${t('backup')}</h2>
    <p class="muted" style="margin-top:0">${t('backup_text')}</p>
    <p id="persist" class="muted" style="font-size:14px"></p>
    <div class="row"><button class="btn" id="exp">${t('export')}</button>
      <label class="btn ghost">${t('import')}<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
    <p id="msg" style="font-weight:600"></p>
  </section>`;
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

function notFound() { app.innerHTML = `<a class="back" href="#/">‹ ${t('sessions')}</a><p class="muted">${t('not_found')}</p>`; }

/* ---------- router ---------- */
async function route() {
  const [, view = '', id] = location.hash.split('/');
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  const tab = { '': 'list', s: 'list', new: 'list', edit: 'list', venues: 'venues', venue: 'venues', settings: 'settings' }[view];
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  const views = { '': listView, new: () => formView(), edit: () => formView(id), s: () => sessionView(id), venues: venuesView, venue: () => venueView(decodeURIComponent(id || '')), settings: settingsView };
  await (views[view] || listView)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
