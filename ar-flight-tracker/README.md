# Overhead — Live AR Air Traffic & Orbital Scope

Point a phone or laptop camera at the sky and see real aircraft and satellites
overlaid on the view — tail number, manufacturer, airline, altitude, speed,
and orbital data, computed from genuinely live sources. This is a small
full-stack app (Node/Express backend + a static frontend), not a sandboxed
demo — it makes real outbound network calls to public flight- and
satellite-tracking APIs.

## What's actually live, and what isn't

| Data | Source | Live? |
|---|---|---|
| Aircraft position, altitude, speed, heading, squawk | [OpenSky Network](https://opensky-network.org) | Yes — polled every ~9s |
| Registration (tail number), manufacturer, aircraft type, registered owner | [hexdb.io](https://hexdb.io) | Yes — looked up per aircraft, cached |
| Estimated origin airport | OpenSky flight-history analysis | Yes, but *estimated* from past track data, not a flight plan |
| Satellite orbital elements (ISS, Hubble, Tiangong, GPS, Starlink, weather/earth-observation sats) | [CelesTrak](https://celestrak.org) | Yes — fetched live, refreshed every few hours |
| Satellite position (lat/lon/alt, az/el from you, velocity) | Computed client-side with SGP4 ([satellite.js](https://github.com/shashwatak/satellite-js)) from the live elements above | Yes — propagated continuously, not just at fetch time |
| **Departure/arrival airport + ETD/ETA** | Not available for free | **No**, by default |

That last row matters: ADS-B broadcasts (what OpenSky and every other free
"live flight tracker" ultimately reads) contain *only* the aircraft's own
telemetry — position, altitude, speed, squawk. They do not, and structurally
cannot, contain flight-plan data like assigned route or scheduled arrival
time. That lives in airline/ATC systems and is normally only exposed through
paid commercial APIs (FlightAware AeroAPI, etc.).

This app doesn't fake that data. If you set an `AVIATIONSTACK_KEY` (see
below), it will show real scheduled route and ETD/ETA where AviationStack has
it; otherwise the detail panel says plainly that it's unavailable, with the
estimated-origin-airport note as a (real, if imprecise) consolation.

## Running it

```bash
npm install
npm start
```

Then open `http://localhost:3000`. No environment variables are required —
the app runs against OpenSky anonymously and CelesTrak needs no key at all.

### Optional: raise the OpenSky rate limit

Anonymous OpenSky access is capped at 400 credits/day, shared across every
person using your deployment. For personal/low-traffic use this is plenty.
For anything public-facing, create a free API client:

1. Sign up / log in at [opensky-network.org](https://opensky-network.org)
2. Account → API Client → create a new client, note the client ID/secret
3. Copy `.env.example` to `.env` and fill in `OPENSKY_CLIENT_ID` /
   `OPENSKY_CLIENT_SECRET`

### Optional: real route + ETA

Sign up for a free [AviationStack](https://aviationstack.com) key (100
requests/month on the free tier) and set `AVIATIONSTACK_KEY` in `.env`. This
integration hasn't been exercised against a live key during development —
if AviationStack has changed its response shape since, the field mapping is
isolated to the `/api/route/:callsign` handler in `server.js`.

## A note on live-data reliability

OpenSky's public endpoint occasionally stalls for several seconds on a given
request before either responding or dropping the connection — this is normal
for a free, heavily-shared public API, not something a client can prevent.
Every upstream call in `server.js` (OpenSky, hexdb.io, CelesTrak,
AviationStack) is wrapped in a server-side timeout so a stalled upstream
fails fast with a clean error instead of hanging the request indefinitely.
The frontend polls every ~9s regardless, so a single failed poll just shows
a brief "OPENSKY ERROR" status chip and recovers on the next cycle — it's
expected behavior, not a bug, and no different from what any live
flight-tracking site experiences against the same data source.

## Permissions & HTTPS

The camera (`getUserMedia`) and device-orientation (`DeviceOrientationEvent`)
browser APIs only work in a "secure context" — `localhost` is exempted for
development, but a real deployment **must be served over HTTPS** or these
will silently fail. Every permission in this app degrades gracefully if
denied or unavailable:

- **Camera denied/unsupported** → falls back to a drawn sky/horizon backdrop
  that still tracks device pitch.
- **Compass denied/unsupported** → falls back to drag-to-look (mouse or
  touch).
- **Location denied** → falls back to manual latitude/longitude entry (the
  app can't query nearby traffic or compute satellite look-angles without
  *some* position, real or entered).

iOS Safari requires an explicit tap to grant camera and orientation access
(`DeviceOrientationEvent.requestPermission()`), which is why onboarding is a
button-per-permission flow rather than an automatic prompt on load.

## How the AR projection works

- **Aircraft**: real lat/lon/altitude from OpenSky, extrapolated between the
  ~9s polls using the aircraft's own reported ground speed and track (a
  great-circle destination-point calculation), then converted to azimuth/
  elevation/range relative to your position using standard bearing,
  haversine-distance, and elevation-angle trigonometry (with a small
  Earth-curvature correction for distant traffic).
- **Satellites**: full SGP4 propagation (via `satellite.js`, MIT-licensed)
  from live CelesTrak elements, converted to your local az/el/range via
  standard ECI → ECF → topocentric look-angle transforms. This is the same
  class of math real satellite-tracking software uses — accuracy is limited
  by how recently CelesTrak refreshed that object's elements, not by
  anything approximate in this app.
- Your device's compass heading and tilt (or manual drag) determine which
  slice of that sky is currently on screen, projected with a ~62° horizontal
  field of view approximating a phone's rear camera.

A small radar-style PPI scope (bottom-left) plots every tracked contact by
azimuth and range regardless of where you're currently looking, since a
phone's narrow FOV makes pure AR hard to search with.

## Deploying

This is a plain Node/Express app — deploy it anywhere that runs Node 18+
(Render, Railway, Fly.io, a VPS, etc.). Make sure:

1. It's served over HTTPS (required for camera/orientation permissions).
2. The `PORT` env var is respected by your host (already wired up).
3. If you expect meaningful traffic, set the OpenSky credentials above —
   the anonymous quota is shared across all your visitors.

## Project structure

```
server.js              Express app: static hosting + API proxy/cache layer
public/index.html      Markup: camera/canvas layers, HUD chrome, onboarding
public/styles.css      HUD styling
public/app.js          Geolocation, orientation, camera, live data polling,
                        SGP4 propagation, AR projection & rendering, radar
public/vendor/         Vendored satellite.js browser bundle (MIT license)
```
