require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'public')));

// Upstream calls (OpenSky, hexdb.io, CelesTrak, AviationStack) occasionally
// stall at the connection level rather than erroring cleanly. Without a
// timeout, a single stuck upstream call hangs the client request (and ties
// up the connection) indefinitely.
function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms || 8000);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// ---------------------------------------------------------------------------
// OpenSky Network OAuth2 (client-credentials). Anonymous access works with no
// env vars set, just at the lower (400 credits/day) rate limit. See README.
// ---------------------------------------------------------------------------
let openSkyToken = null; // { token, expiresAt }

async function getOpenSkyToken() {
  const id = process.env.OPENSKY_CLIENT_ID;
  const secret = process.env.OPENSKY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (openSkyToken && Date.now() < openSkyToken.expiresAt - 15000) {
    return openSkyToken.token;
  }

  const res = await fetchWithTimeout(
    'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: id,
        client_secret: secret,
      }),
    }
  );
  if (!res.ok) throw new Error(`OpenSky token request failed: ${res.status}`);
  const data = await res.json();
  openSkyToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return openSkyToken.token;
}

// ---------------------------------------------------------------------------
// In-memory caches. These exist to protect the free upstream APIs from being
// hammered by every connected browser tab, not to fake "live-ness" -- TTLs
// are short for anything that actually changes quickly.
// ---------------------------------------------------------------------------
const trafficCache = new Map(); // key -> { data, ts }
const TRAFFIC_TTL_MS = 8000;

const aircraftMetaCache = new Map(); // icao24 -> { data, ts }
const META_TTL_MS = 7 * 24 * 3600 * 1000; // registration/type basically never changes

const flightHistoryCache = new Map(); // icao24 -> { data, ts }
const HISTORY_TTL_MS = 10 * 60 * 1000;

const routeCache = new Map(); // callsign -> { data, ts }
const ROUTE_TTL_MS = 15 * 60 * 1000;

const satCache = { data: null, ts: 0 };
const SAT_TTL_MS = 3 * 3600 * 1000; // TLEs are refreshed by CelesTrak roughly daily

function nmToLatDeg(nm) {
  return nm / 60;
}
function nmToLonDeg(nm, atLatDeg) {
  const c = Math.cos((atLatDeg * Math.PI) / 180);
  return nm / (60 * (Math.abs(c) > 0.01 ? c : 0.01));
}

// ---------------------------------------------------------------------------
// Live ADS-B-derived state vectors (position, altitude, speed, heading, ...)
// ---------------------------------------------------------------------------
app.get('/api/traffic', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const radiusNm = Math.min(Math.max(parseFloat(req.query.radiusNm) || 60, 10), 150);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: 'lat and lon query params are required' });
    }

    const key = `${lat.toFixed(1)},${lon.toFixed(1)},${radiusNm}`;
    const cached = trafficCache.get(key);
    if (cached && Date.now() - cached.ts < TRAFFIC_TTL_MS) {
      return res.json(cached.data);
    }

    const dLat = nmToLatDeg(radiusNm);
    const dLon = nmToLonDeg(radiusNm, lat);
    const lamin = lat - dLat;
    const lamax = lat + dLat;
    const lomin = lon - dLon;
    const lomax = lon + dLon;

    const token = await getOpenSkyToken().catch(() => null);
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    const upstream = await fetchWithTimeout(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: 'OpenSky upstream error', status: upstream.status });
    }
    const raw = await upstream.json();

    const aircraft = (raw.states || [])
      .filter((s) => s[6] != null && s[5] != null)
      .map((s) => ({
        icao24: s[0],
        callsign: (s[1] || '').trim(),
        originCountry: s[2],
        lon: s[5],
        lat: s[6],
        baroAltitudeM: s[7],
        onGround: s[8],
        velocityMs: s[9],
        headingDeg: s[10],
        vertRateMs: s[11],
        geoAltitudeM: s[13],
        squawk: s[14],
        spi: s[15],
      }));

    const payload = { time: raw.time, authenticated: !!token, bbox: { lamin, lamax, lomin, lomax }, aircraft };
    trafficCache.set(key, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
});

// ---------------------------------------------------------------------------
// Per-aircraft enrichment: registration / manufacturer / type / owner via
// hexdb.io, plus estimated origin airport from OpenSky's track-history
// analysis. This is called lazily (only when a user selects a target), not
// for every aircraft on every poll, to stay within free rate limits.
// ---------------------------------------------------------------------------
app.get('/api/aircraft/:icao24', async (req, res) => {
  const icao24 = String(req.params.icao24 || '').toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(icao24)) {
    return res.status(400).json({ error: 'invalid icao24' });
  }

  try {
    let meta = aircraftMetaCache.get(icao24);
    if (!meta || Date.now() - meta.ts > META_TTL_MS) {
      let data = null;
      try {
        const r = await fetchWithTimeout(`https://hexdb.io/api/v1/aircraft/${icao24}`, {}, 5000);
        if (r.ok) {
          const json = await r.json();
          if (!json.error) data = json;
        }
      } catch (e) {
        /* metadata is best-effort */
      }
      meta = { data, ts: Date.now() };
      aircraftMetaCache.set(icao24, meta);
    }

    let hist = flightHistoryCache.get(icao24);
    if (!hist || Date.now() - hist.ts > HISTORY_TTL_MS) {
      let flights = [];
      try {
        const end = Math.floor(Date.now() / 1000);
        const begin = end - 6 * 3600;
        const token = await getOpenSkyToken().catch(() => null);
        const r = await fetchWithTimeout(
          `https://opensky-network.org/api/flights/aircraft?icao24=${icao24}&begin=${begin}&end=${end}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (r.ok) flights = await r.json();
      } catch (e) {
        /* history is best-effort */
      }
      hist = { data: flights, ts: Date.now() };
      flightHistoryCache.set(icao24, hist);
    }

    const latestLeg = hist.data && hist.data.length ? hist.data[hist.data.length - 1] : null;

    res.json({
      icao24,
      registration: meta.data?.Registration || null,
      manufacturer: meta.data?.Manufacturer || null,
      typeCode: meta.data?.ICAOTypeCode || null,
      typeName: meta.data?.Type || null,
      owner: meta.data?.RegisteredOwners || null,
      operatorFlagCode: meta.data?.OperatorFlagCode || null,
      estDepartureAirport: latestLeg?.estDepartureAirport || null,
      estArrivalAirport: latestLeg?.estArrivalAirport || null,
    });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
});

// ---------------------------------------------------------------------------
// OPTIONAL: real scheduled route + ETA/ETD via AviationStack, only if the
// deployer supplies their own free-tier API key. ADS-B broadcasts carry no
// flight-plan data at all, so without a schedule provider like this, real
// departure/arrival + times cannot be shown -- and this app will say so
// rather than inventing them. This integration has not been exercised
// against a live key in development; verify field names against your own
// account's docs if AviationStack ever changes its response shape.
// ---------------------------------------------------------------------------
app.get('/api/route/:callsign', async (req, res) => {
  const callsign = String(req.params.callsign || '').trim().toUpperCase();
  const apiKey = process.env.AVIATIONSTACK_KEY;
  if (!apiKey) return res.json({ available: false, reason: 'no_api_key' });
  if (!callsign) return res.status(400).json({ error: 'callsign required' });

  try {
    const cached = routeCache.get(callsign);
    if (cached && Date.now() - cached.ts < ROUTE_TTL_MS) return res.json(cached.data);

    const url = `https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(
      apiKey
    )}&flight_icao=${encodeURIComponent(callsign)}`;
    const r = await fetchWithTimeout(url, {}, 6000);
    if (!r.ok) return res.json({ available: false, reason: 'upstream_error' });
    const json = await r.json();
    const flight = json.data && json.data[0];
    if (!flight) {
      const payload = { available: false, reason: 'not_found' };
      routeCache.set(callsign, { data: payload, ts: Date.now() });
      return res.json(payload);
    }

    const payload = {
      available: true,
      airline: flight.airline?.name || null,
      flightNumber: flight.flight?.iata || flight.flight?.icao || null,
      status: flight.flight_status || null,
      departure: {
        airport: flight.departure?.airport || null,
        iata: flight.departure?.iata || null,
        scheduled: flight.departure?.scheduled || null,
        estimated: flight.departure?.estimated || null,
        actual: flight.departure?.actual || null,
      },
      arrival: {
        airport: flight.arrival?.airport || null,
        iata: flight.arrival?.iata || null,
        scheduled: flight.arrival?.scheduled || null,
        estimated: flight.arrival?.estimated || null,
        actual: flight.arrival?.actual || null,
      },
    };
    routeCache.set(callsign, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (err) {
    res.json({ available: false, reason: 'error', message: String((err && err.message) || err) });
  }
});

// ---------------------------------------------------------------------------
// Curated satellite set: live orbital elements fetched from CelesTrak, cached
// for a few hours. The client propagates continuous real-time positions from
// these elements itself using SGP4 (satellite.js), so it stays smooth between
// refreshes without hammering CelesTrak on every frame.
// ---------------------------------------------------------------------------
const SATELLITES = [
  { catnr: 25544, name: 'ISS', fullName: 'International Space Station', type: 'Space Station' },
  { catnr: 20580, name: 'HST', fullName: 'Hubble Space Telescope', type: 'Space Telescope' },
  { catnr: 48274, name: 'Tianhe', fullName: 'Tiangong Space Station (Tianhe)', type: 'Space Station' },
  { catnr: 43013, name: 'NOAA-20', fullName: 'NOAA-20 (JPSS-1)', type: 'Weather Satellite' },
  { catnr: 25994, name: 'Terra', fullName: 'Terra (EOS AM-1)', type: 'Earth Observation' },
  { catnr: 26407, name: 'GPS IIR-5', fullName: 'GPS Block IIR-5 (PRN 22)', type: 'GPS Navigation' },
  { catnr: 44714, name: 'Starlink-1008', fullName: 'Starlink-1008', type: 'Communications' },
];

app.get('/api/satellites', async (req, res) => {
  try {
    if (satCache.data && Date.now() - satCache.ts < SAT_TTL_MS) {
      return res.json(satCache.data);
    }

    const fetched = await Promise.allSettled(
      SATELLITES.map(async (sat) => {
        const r = await fetchWithTimeout(
          `https://celestrak.org/NORAD/elements/gp.php?CATNR=${sat.catnr}&FORMAT=TLE`,
          {},
          6000
        );
        if (!r.ok) return null;
        const text = (await r.text()).trim();
        const lines = text.split('\n').map((l) => l.trim());
        if (lines.length >= 3 && lines[1].startsWith('1 ') && lines[2].startsWith('2 ')) {
          return { ...sat, tleLine1: lines[1], tleLine2: lines[2] };
        }
        return null;
      })
    );
    const results = fetched
      .map((r) => (r.status === 'fulfilled' ? r.value : null))
      .filter(Boolean);

    const payload = { fetchedAt: Date.now(), satellites: results };
    satCache.data = payload;
    satCache.ts = Date.now();
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
});

app.listen(PORT, () => {
  console.log(`AR flight & satellite tracker running at http://localhost:${PORT}`);
  if (!process.env.OPENSKY_CLIENT_ID) {
    console.log('OpenSky: running anonymous (400 credits/day). See README to add OPENSKY_CLIENT_ID/SECRET.');
  }
  if (!process.env.AVIATIONSTACK_KEY) {
    console.log('AviationStack: no key set. Route/ETA fields will report unavailable. See README.');
  }
});
