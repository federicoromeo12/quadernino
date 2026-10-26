# Quadernino — Product spec

**Goal:** be the default, low-friction replacement for the paper sailing notebook, especially for young sailors who don't yet have the habit of writing things down after a session. Logging must take less effort than not logging.

---

## 1. What the app does today (demo)

### Stack
- Vanilla JS PWA, no framework, no build step (`index.html`, `app.js`, `logic.js`, `style.css`).
- Service worker (`sw.js`): network-first, cached copy offline. Installable via `manifest.webmanifest`.
- Storage: **IndexedDB on the device only** (single `sessions` store). Preferences (language, form config, last class) in `localStorage`.
- No backend, no accounts, no sync.
- Unit tests for pure helpers in `logic.test.js`.

### Screens
| Screen | What it shows |
|---|---|
| **Home** | Session count, wind trend chart (avg vs gusts, last 12 sessions), tiles: strongest wind, avg wind, venue count, avg mood; latest session card. |
| **Sessions** | Chronological list of session cards (date, venue, type, class logo, wind, mood emoji, note snippet). |
| **Session detail** | Wind, sea & sky, races, reflection, boat/tuning, photos. Edit button. |
| **New / Edit session** | Full form (below). |
| **Venues** | Venues grouped and ranked by number of sessions. |
| **Venue detail** | Session count, avg wind, max gust, wind rose (direction frequency), OSM map link, sessions at that venue. |
| **Settings** | Language (EN/IT), per-class form customisation, JSON backup export/import. |

### Session data captured
- **When/where:** date, start/end time, venue (free text or OpenStreetMap/Nominatim search → name, lat/lon, OSM id), type (training / regatta / other).
- **Boat:** class picked from a logo carousel (Optimist, ILCA 4/6/7, 420, 470, 29er, 49er, Nacra 15/17, Techno 293, iQFoil, Waszp, Finn, or custom); class-specific tuning fields (e.g. 420: shrouds tension, rake, mast foot pin, spreaders, jib leads…); free-text setup.
- **Wind:** direction (16-point compass), avg speed, gusts, gust direction, shift type (steady / oscillating / persistent) with shift range, timed changes during the session.
- **Sea & sky:** waves, current, tide, sky, air/water temperature.
- **Races** (regatta only): result per race + notes.
- **Reflection:** mood (5 emoji), what went well, what to work on, other notes.
- **Photos:** downscaled to 1280px JPEG, stored inline as base64.

### Smart behaviour already in place
- Form sections and tuning fields adapt to the class (e.g. no tide/current for Optimist/ILCA 4/6); user can override per class.
- Last-used class is remembered.
- Tap a selected chip again to clear it; irrelevant fields (gust dir, shift range) hide automatically.
- Venue typed offline still works; linking to OSM is optional.
- Import merges by id, newer `updated` wins.

### Known limitations / technical debt
- **Data lives on one device.** Lost phone or cleared browser data = lost notebook. Backup is manual.
- No identity, no sharing, no coach view.
- Venues are not entities: they are copied into each session and grouped by OSM id or lower-cased name → duplicates ("Bracciano" vs "Lago di Bracciano").
- Photos as base64 inside session records: bloats storage and backups; won't scale to sync.
- Nominatim public API called directly from the client (rate-limited ~1 req/s, usage policy forbids heavy use).
- Grouping exists only by venue. No filtering or grouping by wind range, direction, class, tuning, type, date.
- `app.js` is a single ~45 KB file building HTML strings; fine for a demo, hard to grow (auth, roles, offline sync).
- Tuning values are free text → cannot be compared or aggregated (e.g. "rake 6.70" vs "670").
- No numeric "performance" outcome beyond mood and race results.

---

## 2. What the app must do (target)

### 2.1 Accounts & multi-device
- Sign up / log in (email magic link + Google/Apple sign-in; minimal friction for teenagers).
- Sessions sync across devices; **offline-first stays mandatory** (log on the dock with no signal, sync later).
- Conflict policy: last-write-wins per session (as today), with server timestamps.
- Migration: on first login, import existing local IndexedDB sessions into the account.
- Profile: name, birth year, club, classes sailed, sail number, preferred units/language.
- Minors: parental/guardian consent flow where legally required (GDPR: under 14 in Italy needs parental consent for data processing).

### 2.2 Roles & coach privileges
| Role | Can |
|---|---|
| **Sailor** | Full CRUD on own sessions; choose which coaches/teams see them. |
| **Coach** | Create a team/squad, invite sailors (code or link). Read sailors' sessions shared with the team. Comment on sessions. Create a **team session** (same date/venue/conditions) that pre-fills sailors' forms so they only add the personal part. Team-level stats and comparisons. |
| **Admin (club)** *(later)* | Manage coaches and teams for a club. |

- Sharing is opt-in per sailor per team; sailor can revoke.
- Private notes field never visible to coaches.
- Coach feedback: comments on a session, visible to the sailor, with notification.

### 2.3 Database
Normalised entities instead of everything nested inside a session:

- **User** (id, profile, role flags)
- **Team** (id, name, club, coach ids) + **Membership** (user, team, role, sharing on/off)
- **Venue** (id, name, aliases, lat/lon, OSM id, type: lake/sea/river, tide yes/no, notes) — shared across all users, deduplicated, so venue stats accumulate across the community.
- **Boat** (id, owner, class, sail number, name, equipment notes) — one sailor can own several.
- **Session** (id, user, boat, venue, team session id?, date/time, type, conditions, reflection, mood, created/updated)
- **WindObservation** (session, time, dir, speed, gust) — replaces `wind.changes`
- **TuningEntry** (session, field key, numeric value + unit, or enum) — **structured**, so it can be grouped and compared
- **Race** (session, number, result, status code OCS/DNF/…, notes)
- **Photo** (session, storage URL, thumbnail) — files in object storage, not in the DB row
- **Comment** (session, author, text, created)

Candidate backend: Supabase (Postgres + auth + row-level security + storage) or Firebase. Postgres preferred: the grouping queries below are relational/aggregate queries.

### 2.4 Grouping & analysis
The core value: **"Last time I sailed in these conditions, what worked?"**

Group/filter sessions by any combination of:
- **Wind:** speed bands (e.g. 0–6, 6–10, 10–14, 14–18, 18+ kn), direction sector, shift type, gustiness (gust − avg).
- **Location:** venue, venue type (lake/sea), region.
- **Boat tuning:** class, individual tuning values (e.g. rake bucket), boat.
- **Other:** session type, sea state, date range/season, team, mood.

Views:
- "Similar conditions" panel on the session form: as soon as venue + wind are entered, show past sessions with matching conditions and the tuning used + mood/result.
- Tuning vs. conditions table per class: what setting was used in each wind band, and how it felt.
- Venue page: wind rose, typical wind per month, best/worst sessions there.
- Coach: same grouping across the whole team (who used which setting in 12–16 kn at Bracciano and how they felt/placed).

### 2.5 Habit-building for young sailors (product priority)
- **Quick log** (< 60 s): date/venue/class pre-filled, wind + mood + one sentence. Everything else optional, can be completed later.
- Optional auto-fill of wind/weather from a forecast/observation API for venue + time (sailor confirms/corrects).
- Reminder notification after the expected session end time.
- Streaks / gentle progress indicators (no leaderboards between minors by default).
- Coach-created team session → sailor only adds personal reflection.
- Voice note → transcription into "notes" (later).

---

## 3. Open decisions
1. Backend: Supabase vs Firebase vs custom (recommend Supabase).
2. Keep vanilla JS or move to a framework (Svelte/React) before adding auth + sync + roles. Recommendation: migrate now; the current string-template approach won't hold state complexity.
3. Native apps vs PWA only (PWA push on iOS requires home-screen install).
4. Which tuning fields become numeric with units per class (needs a per-class schema).
5. Weather auto-fill provider and cost.
6. Privacy model for minors and coach access (consent, data retention, export/delete).

## 4. Suggested order of work
1. Data model + backend with auth (sailor role only), local → cloud migration, offline sync.
2. Venue entity + dedup; photos to object storage.
3. Structured tuning; grouping/filter UI; "similar conditions" panel.
4. Teams, coach role, sharing, comments.
5. Quick log, reminders, weather auto-fill.
