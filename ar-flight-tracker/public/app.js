(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  const EARTH_R_M = 6371000;
  const rad = (d) => d * RAD;
  const deg = (r) => r * DEG;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const wrap360 = (d) => ((d % 360) + 360) % 360;
  function angleDiff(a, b) {
    // shortest signed difference a-b, result in (-180, 180]
    let d = wrap360(a - b);
    if (d > 180) d -= 360;
    return d;
  }
  function bearingDeg(lat1, lon1, lat2, lon2) {
    const phi1 = rad(lat1), phi2 = rad(lat2), dl = rad(lon2 - lon1);
    const y = Math.sin(dl) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dl);
    return wrap360(deg(Math.atan2(y, x)));
  }
  function distanceM(lat1, lon1, lat2, lon2) {
    const phi1 = rad(lat1), phi2 = rad(lat2), dphi = rad(lat2 - lat1), dl = rad(lon2 - lon1);
    const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dl / 2) ** 2;
    return EARTH_R_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function destinationPoint(lat1, lon1, bearing, distM) {
    const phi1 = rad(lat1), lam1 = rad(lon1), theta = rad(bearing), delta = distM / EARTH_R_M;
    const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
    const lam2 =
      lam1 +
      Math.atan2(
        Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
        Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
      );
    return { lat: deg(phi2), lon: deg(lam2) };
  }
  const mToFt = (m) => m * 3.28084;
  const mpsToKt = (v) => v * 1.94384;
  const nmFromM = (m) => m / 1852;
  function fmtAlt(m) {
    if (m == null) return '—';
    return Math.round(mToFt(m) / 100) * 100 + ' ft';
  }
  function fmtSpeed(ms) {
    if (ms == null) return '—';
    return Math.round(mpsToKt(ms)) + ' kt';
  }
  function fmtDeg(d) {
    if (d == null) return '—';
    return Math.round(d) + '°';
  }
  function timeAgo(unixSec) {
    if (!unixSec) return null;
    const s = Math.max(0, Math.floor(Date.now() / 1000 - unixSec));
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm ago';
  }
  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(v) {
    if (v == null) return '';
    return String(v).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
  }
  function fmtIso(iso) {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
  }

  // ---------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const videoEl = $('camera');
  const skyCanvas = $('skyFallback');
  const arCanvas = $('arCanvas');
  const skyCtx = skyCanvas.getContext('2d');
  const arCtx = arCanvas.getContext('2d');
  const radarCanvas = $('radarCanvas');
  const radarCtx = radarCanvas.getContext('2d');

  const onboard = $('onboard');
  const enterBtn = $('enterBtn');
  const manualLoc = $('manualLoc');
  const manualLat = $('manualLat');
  const manualLon = $('manualLon');
  const dock = $('dock');
  const radarWrap = $('radarWrap');
  const radarRangeLabel = $('radarRangeLabel');
  const hint = $('hint');
  const toastEl = $('toast');
  const brandDot = $('brandDot');
  const clockChip = $('clockChip');
  const headingChip = $('headingChip');
  const dataChip = $('dataChip');
  const stripSheet = $('stripSheet');
  const stripTab = $('stripTab');
  const stripBody = $('stripBody');
  const stripClose = $('stripClose');
  const radiusSlider = $('radiusSlider');
  const radiusVal = $('radiusVal');
  const radarToggle = $('radarToggle');

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const state = {
    viewer: { lat: null, lon: null, altM: 0, headingDeg: 0, pitchDeg: 0 },
    hasLocation: false,
    orientationActive: false,
    cameraActive: false,
    dragging: false,
    dragLast: null,
    mode: 'planes',
    radiusNm: 60,
    radarVisible: true,
    aircraft: new Map(), // icao24 -> record
    satellites: [], // { ...meta, satrec, az, el, rangeKm, subLat, subLon, altKm, velKmS }
    satellitesLoaded: false,
    selected: null, // { type: 'aircraft'|'satellite', id }
    detailCache: new Map(),
    lastTrafficPoll: 0,
    FOV_H: 62,
    trafficStatus: 'idle', // 'idle' | 'live' | 'auth' | 'error'
    satStatus: 'idle', // 'idle' | 'live' | 'error'
  };

  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (toastEl.hidden = true), ms || 4000);
  }

  // ---------------------------------------------------------------------
  // Permission wiring
  // ---------------------------------------------------------------------
  function markPerm(rowId, text, cls) {
    const row = $(rowId);
    const btn = row.querySelector('.perm-btn');
    btn.textContent = text;
    btn.classList.remove('is-done', 'is-skipped');
    if (cls) btn.classList.add(cls);
  }

  function updateEnterState() {
    enterBtn.disabled = !state.hasLocation;
  }

  $('permLocation').querySelector('[data-action="location"]').addEventListener('click', () => {
    if (!navigator.geolocation) {
      manualLoc.hidden = false;
      markPerm('permLocation', 'Unavailable', 'is-skipped');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.viewer.lat = pos.coords.latitude;
        state.viewer.lon = pos.coords.longitude;
        if (pos.coords.altitude != null) state.viewer.altM = pos.coords.altitude;
        state.hasLocation = true;
        markPerm('permLocation', 'Located', 'is-done');
        updateEnterState();
        startLocationWatch();
      },
      (err) => {
        manualLoc.hidden = false;
        markPerm('permLocation', 'Denied — enter manually', 'is-skipped');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  $('manualLoc').querySelector('[data-action="manual-loc-apply"]').addEventListener('click', () => {
    const lat = parseFloat(manualLat.value);
    const lon = parseFloat(manualLon.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      toast('Enter valid latitude and longitude');
      return;
    }
    state.viewer.lat = lat;
    state.viewer.lon = lon;
    state.hasLocation = true;
    markPerm('permLocation', 'Set manually', 'is-done');
    updateEnterState();
  });

  let watchId = null;
  function startLocationWatch() {
    if (watchId != null || !navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        state.viewer.lat = pos.coords.latitude;
        state.viewer.lon = pos.coords.longitude;
        if (pos.coords.altitude != null) state.viewer.altM = pos.coords.altitude;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
  }

  $('permCamera').querySelector('[data-action="camera"]').addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      videoEl.srcObject = stream;
      await videoEl.play();
      videoEl.hidden = false;
      state.cameraActive = true;
      markPerm('permCamera', 'Live', 'is-done');
    } catch (err) {
      markPerm('permCamera', 'Blocked — using sky view', 'is-skipped');
    }
  });

  $('permCompass').querySelector('[data-action="compass"]').addEventListener('click', async () => {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          markPerm('permCompass', 'Denied — drag to look', 'is-skipped');
          return;
        }
      }
      attachOrientation();
      markPerm('permCompass', 'Waiting for signal…', null);
      setTimeout(() => {
        if (state.orientationActive) {
          markPerm('permCompass', 'Live', 'is-done');
        } else {
          markPerm('permCompass', 'No sensor — drag to look', 'is-skipped');
        }
      }, 1500);
    } catch (err) {
      markPerm('permCompass', 'Unavailable — drag to look', 'is-skipped');
    }
  });

  function attachOrientation() {
    const handler = (e) => {
      let heading;
      if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) {
        heading = e.webkitCompassHeading;
      } else if (e.alpha != null) {
        heading = wrap360(360 - e.alpha);
      } else {
        return;
      }
      state.orientationActive = true;
      state.viewer.headingDeg = heading;
      if (e.beta != null) {
        state.viewer.pitchDeg = clamp(e.beta - 90, -85, 85);
      }
    };
    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);
  }

  enterBtn.addEventListener('click', () => {
    onboard.hidden = true;
    dock.hidden = false;
    radarWrap.hidden = !state.radarVisible || state.mode === 'satellites';
    setTimeout(() => (hint.style.opacity = '0'), 6000);
    boot();
  });

  // ---------------------------------------------------------------------
  // Drag-to-look (used whenever device orientation isn't actively driving)
  // ---------------------------------------------------------------------
  function pointerDown(e) {
    if (state.orientationActive) return;
    state.dragging = true;
    state.dragLast = { x: e.clientX, y: e.clientY };
  }
  function pointerMove(e) {
    if (!state.dragging) return;
    const dx = e.clientX - state.dragLast.x;
    const dy = e.clientY - state.dragLast.y;
    state.dragLast = { x: e.clientX, y: e.clientY };
    const degPerPx = state.FOV_H / arCanvas.clientWidth;
    state.viewer.headingDeg = wrap360(state.viewer.headingDeg - dx * degPerPx);
    state.viewer.pitchDeg = clamp(state.viewer.pitchDeg + dy * degPerPx, -85, 85);
  }
  function pointerUp() {
    state.dragging = false;
  }
  arCanvas.addEventListener('pointerdown', (e) => {
    state.dragDownAt = { x: e.clientX, y: e.clientY };
    pointerDown(e);
  });
  window.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);

  arCanvas.addEventListener('click', (e) => {
    const dx = state.dragDownAt ? e.clientX - state.dragDownAt.x : 0;
    const dy = state.dragDownAt ? e.clientY - state.dragDownAt.y : 0;
    if (Math.hypot(dx, dy) > 6) return; // was a drag, not a tap
    handleCanvasTap(e.clientX, e.clientY);
  });

  // ---------------------------------------------------------------------
  // Mode / controls
  // ---------------------------------------------------------------------
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      state.mode = btn.dataset.mode;
      radarWrap.hidden = !state.radarVisible || state.mode === 'satellites';
      if ((state.mode === 'satellites' || state.mode === 'both') && !state.satellitesLoaded) {
        loadSatellites();
      }
      updateDataChip();
    });
  });

  radarToggle.addEventListener('click', () => {
    state.radarVisible = !state.radarVisible;
    radarToggle.classList.toggle('is-active', state.radarVisible);
    radarWrap.hidden = !state.radarVisible || state.mode === 'satellites';
  });

  radiusSlider.addEventListener('input', () => {
    state.radiusNm = parseInt(radiusSlider.value, 10);
    radiusVal.textContent = state.radiusNm + 'nm';
    radarRangeLabel.textContent = state.radiusNm;
  });

  stripClose.addEventListener('click', () => {
    stripSheet.hidden = true;
    state.selected = null;
  });

  function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 12000);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  }

  // ---------------------------------------------------------------------
  // Data: live traffic polling
  // ---------------------------------------------------------------------
  async function pollTraffic() {
    if (!state.hasLocation) return;
    if (state.mode === 'satellites') return;
    try {
      const { lat, lon } = state.viewer;
      const r = await fetchWithTimeout(`/api/traffic?lat=${lat}&lon=${lon}&radiusNm=${state.radiusNm}`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      const now = Date.now();
      const seen = new Set();
      for (const a of data.aircraft) {
        seen.add(a.icao24);
        const existing = state.aircraft.get(a.icao24);
        state.aircraft.set(a.icao24, {
          ...a,
          updatedAt: now,
          baseLat: a.lat,
          baseLon: a.lon,
          baseAltM: a.geoAltitudeM ?? a.baroAltitudeM,
        });
      }
      // drop aircraft we haven't seen in 3 polls' worth of time
      for (const [icao24, rec] of state.aircraft) {
        if (!seen.has(icao24) && now - rec.updatedAt > 45000) state.aircraft.delete(icao24);
      }
      state.trafficStatus = data.authenticated ? 'auth' : 'live';
      brandDot.classList.add('is-live');
      state.lastTrafficPoll = now;
    } catch (err) {
      state.trafficStatus = 'error';
    }
    updateDataChip();
  }

  function updateDataChip() {
    const parts = [];
    let hasError = false;
    if (state.mode === 'planes' || state.mode === 'both') {
      if (state.trafficStatus === 'auth') parts.push('OPENSKY (AUTH)');
      else if (state.trafficStatus === 'live') parts.push('OPENSKY');
      else if (state.trafficStatus === 'error') { parts.push('OPENSKY ERROR'); hasError = true; }
    }
    if (state.mode === 'satellites' || state.mode === 'both') {
      if (state.satStatus === 'live') parts.push('CELESTRAK/SGP4');
      else if (state.satStatus === 'error') { parts.push('CELESTRAK ERROR'); hasError = true; }
    }
    dataChip.textContent = parts.length ? (hasError ? '' : 'LIVE · ') + parts.join(' + ') : 'STANDBY';
    dataChip.className = 'chip mono chip-source ' + (hasError ? 'is-error' : parts.length ? 'is-planes' : '');
  }

  // ---------------------------------------------------------------------
  // Data: satellites (live TLEs, propagated client-side with SGP4)
  // ---------------------------------------------------------------------
  async function loadSatellites() {
    try {
      const r = await fetchWithTimeout('/api/satellites');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      state.satellites = data.satellites.map((s) => ({
        ...s,
        satrec: window.satellite.twoline2satrec(s.tleLine1, s.tleLine2),
      }));
      state.satellitesLoaded = true;
      state.satStatus = 'live';
      state._satFetchedAt = data.fetchedAt;
    } catch (err) {
      state.satStatus = 'error';
      toast('Could not load satellite elements — check connection');
    }
    updateDataChip();
  }

  function updateSatellitePositions(now) {
    if (!state.hasLocation || !state.satellites.length) return;
    const sat = window.satellite;
    const gmst = sat.gstime(now);
    const observerGd = {
      longitude: rad(state.viewer.lon),
      latitude: rad(state.viewer.lat),
      height: state.viewer.altM / 1000,
    };
    for (const s of state.satellites) {
      try {
        const pv = sat.propagate(s.satrec, now);
        if (!pv.position) continue;
        const ecf = sat.eciToEcf(pv.position, gmst);
        const look = sat.ecfToLookAngles(observerGd, ecf);
        const geo = sat.eciToGeodetic(pv.position, gmst);
        s.az = wrap360(deg(look.azimuth));
        s.el = deg(look.elevation);
        s.rangeKm = look.rangeSat;
        s.subLat = sat.degreesLat ? sat.degreesLat(geo.latitude) : deg(geo.latitude);
        s.subLon = sat.degreesLong ? sat.degreesLong(geo.longitude) : deg(geo.longitude);
        s.altKm = geo.height;
        const v = pv.velocity;
        s.velKmS = v ? Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) : null;
      } catch (e) {
        /* propagation can fail for decayed objects; skip this frame */
      }
    }
  }

  // ---------------------------------------------------------------------
  // Aircraft position extrapolation between polls (using real velocity/heading)
  // ---------------------------------------------------------------------
  function extrapolateAircraft(rec, now) {
    const dtS = (now - rec.updatedAt) / 1000;
    let lat = rec.baseLat, lon = rec.baseLon;
    if (!rec.onGround && rec.velocityMs && rec.headingDeg != null && dtS > 0 && dtS < 60) {
      const dest = destinationPoint(rec.baseLat, rec.baseLon, rec.headingDeg, rec.velocityMs * dtS);
      lat = dest.lat;
      lon = dest.lon;
    }
    let altM = rec.baseAltM;
    if (altM != null && rec.vertRateMs) altM += rec.vertRateMs * clamp(dtS, 0, 60);
    return { lat, lon, altM };
  }

  function aircraftLookAngles(rec, now) {
    const { lat, lon, altM } = extrapolateAircraft(rec, now);
    const distGround = distanceM(state.viewer.lat, state.viewer.lon, lat, lon);
    const curvatureDrop = (distGround * distGround) / (2 * EARTH_R_M);
    const heightDiff = (altM ?? 0) - state.viewer.altM - curvatureDrop;
    return {
      az: bearingDeg(state.viewer.lat, state.viewer.lon, lat, lon),
      el: deg(Math.atan2(heightDiff, Math.max(distGround, 1))),
      rangeNm: nmFromM(Math.sqrt(distGround * distGround + heightDiff * heightDiff)),
      lat, lon, altM,
    };
  }

  // ---------------------------------------------------------------------
  // Projection: az/el -> screen xy given current viewer heading/pitch & FOV
  // ---------------------------------------------------------------------
  function project(az, el, w, h) {
    const fovH = state.FOV_H;
    const fovV = (fovH * h) / w;
    const dAz = angleDiff(az, state.viewer.headingDeg);
    const dEl = el - state.viewer.pitchDeg;
    const x = w / 2 + (dAz / (fovH / 2)) * (w / 2);
    const y = h / 2 - (dEl / (fovV / 2)) * (h / 2);
    const visible = Math.abs(dAz) <= fovH / 2 + 4 && Math.abs(dEl) <= fovV / 2 + 4;
    return { x, y, visible, dAz, dEl };
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  let markerHits = []; // reset each frame: {x,y,r,type,id}

  function resizeCanvases() {
    const w = window.innerWidth, h = window.innerHeight, ratio = window.devicePixelRatio || 1;
    for (const c of [arCanvas, skyCanvas]) {
      c.width = w * ratio;
      c.height = h * ratio;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      c.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  }
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  function drawSkyFallback() {
    if (state.cameraActive) return;
    const w = window.innerWidth, h = window.innerHeight;
    const pitchT = clamp((state.viewer.pitchDeg + 20) / 90, 0, 1); // more sky as pitch rises
    const top = lerpColor([5, 8, 20], [20, 46, 74], pitchT);
    const bot = lerpColor([11, 20, 38], [70, 110, 130], pitchT);
    const g = skyCtx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgb(${top.join(',')})`);
    g.addColorStop(1, `rgb(${bot.join(',')})`);
    skyCtx.fillStyle = g;
    skyCtx.fillRect(0, 0, w, h);
    // horizon line, offset by pitch
    const horizonY = h / 2 + state.viewer.pitchDeg * (h / state.FOV_H / (h / w));
    skyCtx.strokeStyle = 'rgba(233,237,245,0.12)';
    skyCtx.beginPath();
    skyCtx.moveTo(0, horizonY);
    skyCtx.lineTo(w, horizonY);
    skyCtx.stroke();
  }
  function lerpColor(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  }

  function drawAircraftMarker(x, y, rec, look) {
    const size = clamp(26 - look.rangeNm / 8, 10, 26);
    const rel = angleDiff(rec.headingDeg ?? 0, state.viewer.headingDeg);
    arCtx.save();
    arCtx.translate(x, y);
    arCtx.rotate(rad(rel));
    arCtx.fillStyle = 'rgba(242,169,59,0.14)';
    arCtx.strokeStyle = '#F2A93B';
    arCtx.lineWidth = 1.6;
    arCtx.beginPath();
    arCtx.moveTo(0, -size);
    arCtx.lineTo(size * 0.22, size * 0.15);
    arCtx.lineTo(size * 0.85, size * 0.55);
    arCtx.lineTo(size * 0.18, size * 0.35);
    arCtx.lineTo(size * 0.18, size * 0.85);
    arCtx.lineTo(size * 0.4, size);
    arCtx.lineTo(0, size * 0.8);
    arCtx.lineTo(-size * 0.4, size);
    arCtx.lineTo(-size * 0.18, size * 0.85);
    arCtx.lineTo(-size * 0.18, size * 0.35);
    arCtx.lineTo(-size * 0.85, size * 0.55);
    arCtx.lineTo(-size * 0.22, size * 0.15);
    arCtx.closePath();
    arCtx.fill();
    arCtx.stroke();
    arCtx.restore();

    const label = (rec.callsign || rec.icao24).trim();
    drawChip(x, y + size + 8, label, '#F2A93B');
    markerHits.push({ x, y, r: size + 14, type: 'aircraft', id: rec.icao24 });
  }

  function drawSatelliteMarker(x, y, sat) {
    arCtx.save();
    arCtx.translate(x, y);
    arCtx.fillStyle = 'rgba(98,182,203,0.18)';
    arCtx.strokeStyle = '#62B6CB';
    arCtx.lineWidth = 1.6;
    arCtx.beginPath();
    arCtx.moveTo(0, -9);
    arCtx.lineTo(9, 0);
    arCtx.lineTo(0, 9);
    arCtx.lineTo(-9, 0);
    arCtx.closePath();
    arCtx.fill();
    arCtx.stroke();
    arCtx.strokeRect(-16, -3, 8, 6);
    arCtx.strokeRect(8, -3, 8, 6);
    arCtx.restore();

    drawChip(x, y + 22, `${sat.name}  ${Math.round(sat.altKm)}km`, '#62B6CB');
    markerHits.push({ x, y, r: 24, type: 'satellite', id: sat.catnr });
  }

  function drawChip(cx, y, text, color) {
    arCtx.font = '500 11px "IBM Plex Mono", monospace';
    const padX = 7;
    const tw = arCtx.measureText(text).width;
    const x = cx - tw / 2 - padX;
    const w = tw + padX * 2;
    arCtx.fillStyle = 'rgba(11,20,38,0.72)';
    arCtx.strokeStyle = color;
    arCtx.globalAlpha = 0.9;
    roundRect(arCtx, x, y, w, 20, 10);
    arCtx.fill();
    arCtx.lineWidth = 1;
    arCtx.stroke();
    arCtx.globalAlpha = 1;
    arCtx.fillStyle = '#E9EDF5';
    arCtx.textAlign = 'center';
    arCtx.textBaseline = 'middle';
    arCtx.fillText(text, cx, y + 10);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawOffscreenCaret(dAzdEl, label, color) {
    const w = window.innerWidth, h = window.innerHeight;
    const cx = w / 2, cy = h / 2;
    const ang = Math.atan2(dAzdEl.dEl_screen, dAzdEl.dAz_screen);
    const R = Math.min(w, h) / 2 - 46;
    const x = cx + Math.cos(ang) * R;
    const y = cy - Math.sin(ang) * R;
    arCtx.save();
    arCtx.translate(x, y);
    arCtx.rotate(-ang + Math.PI / 2);
    arCtx.fillStyle = color;
    arCtx.beginPath();
    arCtx.moveTo(0, -8);
    arCtx.lineTo(6, 6);
    arCtx.lineTo(-6, 6);
    arCtx.closePath();
    arCtx.fill();
    arCtx.restore();
  }

  function drawCompassTape() {
    const w = window.innerWidth;
    const y = 58;
    const fovH = state.FOV_H;
    arCtx.save();
    arCtx.font = '500 11px "IBM Plex Mono", monospace';
    arCtx.textAlign = 'center';
    arCtx.fillStyle = 'rgba(233,237,245,0.7)';
    arCtx.strokeStyle = 'rgba(233,237,245,0.25)';
    const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    for (let d = -Math.ceil(fovH / 2 / 15) * 15; d <= fovH / 2 + 15; d += 15) {
      const heading = wrap360(state.viewer.headingDeg + d);
      const x = w / 2 + (d / (fovH / 2)) * (w / 2);
      const rounded = Math.round(heading / 15) * 15;
      const label = names[rounded] || rounded;
      arCtx.beginPath();
      arCtx.moveTo(x, y);
      arCtx.lineTo(x, y + (rounded % 90 === 0 ? 10 : 6));
      arCtx.stroke();
      arCtx.fillText(label, x, y + 24);
    }
    arCtx.beginPath();
    arCtx.moveTo(w / 2, y - 6);
    arCtx.lineTo(w / 2 - 5, y - 14);
    arCtx.lineTo(w / 2 + 5, y - 14);
    arCtx.closePath();
    arCtx.fillStyle = '#F2A93B';
    arCtx.fill();
    arCtx.restore();
  }

  function drawRadar(activeTargets) {
    if (radarWrap.hidden) return;
    const w = radarCanvas.width, h = radarCanvas.height, cx = w / 2, cy = h / 2, R = w / 2 - 10;
    radarCtx.clearRect(0, 0, w, h);
    radarCtx.strokeStyle = 'rgba(140,153,176,0.28)';
    for (const f of [0.34, 0.67, 1]) {
      radarCtx.beginPath();
      radarCtx.arc(cx, cy, R * f, 0, Math.PI * 2);
      radarCtx.stroke();
    }
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy - R);
    radarCtx.lineTo(cx, cy + R);
    radarCtx.moveTo(cx - R, cy);
    radarCtx.lineTo(cx + R, cy);
    radarCtx.stroke();

    // FOV wedge showing where the AR view currently points
    radarCtx.fillStyle = 'rgba(242,169,59,0.12)';
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    const a0 = rad(state.viewer.headingDeg - state.FOV_H / 2 - 90);
    const a1 = rad(state.viewer.headingDeg + state.FOV_H / 2 - 90);
    radarCtx.arc(cx, cy, R, a0, a1);
    radarCtx.closePath();
    radarCtx.fill();

    for (const t of activeTargets) {
      const rr = clamp(t.rangeNm / state.radiusNm, 0, 1) * R;
      const a = rad(t.az - 90);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      radarCtx.fillStyle = t.type === 'satellite' ? '#62B6CB' : '#F2A93B';
      radarCtx.beginPath();
      radarCtx.arc(x, y, 3.2, 0, Math.PI * 2);
      radarCtx.fill();
    }

    radarCtx.fillStyle = '#E9EDF5';
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, 3, 0, Math.PI * 2);
    radarCtx.fill();
  }

  function render(ts) {
    const now = new Date();
    markerHits = [];
    const w = window.innerWidth, h = window.innerHeight;

    drawSkyFallback();
    arCtx.clearRect(0, 0, w, h);

    if (state.mode === 'satellites' || state.mode === 'both') updateSatellitePositions(now);

    const radarTargets = [];

    if (state.mode === 'planes' || state.mode === 'both') {
      for (const rec of state.aircraft.values()) {
        const look = aircraftLookAngles(rec, now.getTime());
        rec._look = look;
        radarTargets.push({ type: 'aircraft', az: look.az, rangeNm: look.rangeNm });
        if (look.el < -8) continue; // below horizon-ish, don't clutter
        const p = project(look.az, look.el, w, h);
        if (p.visible) {
          drawAircraftMarker(p.x, p.y, rec, look);
        } else if (look.rangeNm <= state.radiusNm * 1.2) {
          drawOffscreenCaret({ dAz_screen: p.dAz, dEl_screen: p.dEl }, rec.callsign, '#F2A93B');
        }
      }
    }

    if (state.mode === 'satellites' || state.mode === 'both') {
      for (const s of state.satellites) {
        if (s.el == null) continue;
        radarTargets.push({ type: 'satellite', az: s.az, rangeNm: s.rangeKm ? s.rangeKm / 1.852 : 999 });
        if (s.el < -3) continue;
        const p = project(s.az, s.el, w, h);
        if (p.visible) {
          drawSatelliteMarker(p.x, p.y, s);
        } else {
          drawOffscreenCaret({ dAz_screen: p.dAz, dEl_screen: p.dEl }, s.name, '#62B6CB');
        }
      }
    }

    drawCompassTape();
    drawRadar(radarTargets);

    headingChip.textContent = 'HDG ' + Math.round(state.viewer.headingDeg) + '°';
    clockChip.textContent =
      now.toISOString().slice(11, 19) + ' UTC';

    requestAnimationFrame(render);
  }

  // ---------------------------------------------------------------------
  // Tap → detail panel
  // ---------------------------------------------------------------------
  function handleCanvasTap(clientX, clientY) {
    let best = null, bestD = Infinity;
    for (const m of markerHits) {
      const d = Math.hypot(clientX - m.x, clientY - m.y);
      if (d < m.r && d < bestD) {
        best = m;
        bestD = d;
      }
    }
    if (!best) return;
    if (best.type === 'aircraft') openAircraftDetail(best.id);
    else openSatelliteDetail(best.id);
  }

  async function openAircraftDetail(icao24) {
    const rec = state.aircraft.get(icao24);
    if (!rec) return;
    state.selected = { type: 'aircraft', id: icao24 };
    stripTab.classList.remove('is-satellite');
    renderAircraftStrip(rec, null);
    stripSheet.hidden = false;

    let detail = state.detailCache.get(icao24);
    if (!detail) {
      try {
        const r = await fetchWithTimeout(`/api/aircraft/${icao24}`);
        detail = r.ok ? await r.json() : {};
      } catch (e) {
        detail = {};
      }
      state.detailCache.set(icao24, detail);
    }
    if (state.selected?.id !== icao24) return;
    renderAircraftStrip(rec, detail);

    if (rec.callsign) {
      try {
        const rr = await fetchWithTimeout(`/api/route/${encodeURIComponent(rec.callsign)}`);
        const route = rr.ok ? await rr.json() : { available: false };
        if (state.selected?.id === icao24) renderAircraftStrip(rec, detail, route);
      } catch (e) {
        /* route lookup is optional */
      }
    }
  }

  function renderAircraftStrip(rec, detail, route) {
    const look = rec._look || {};
    const depNote = detail?.estDepartureAirport
      ? `Est. origin ${esc(detail.estDepartureAirport)} <span class="unavailable">(from track history, not a flight plan)</span>`
      : null;

    let routeHtml = '';
    if (route && route.available) {
      routeHtml = `
        <div class="strip-route">
          <div class="airport"><span class="code">${esc(route.departure.iata) || '—'}</span><span class="city">${esc(fmtIso(route.departure.estimated || route.departure.scheduled))}</span></div>
          <span class="arrow">✈ →</span>
          <div class="airport"><span class="code">${esc(route.arrival.iata) || '—'}</span><span class="city">${esc(fmtIso(route.arrival.estimated || route.arrival.scheduled))}</span></div>
        </div>`;
    } else {
      routeHtml = `<p class="strip-note">Route &amp; ETA: <em>not available</em> — ADS-B broadcasts carry no flight-plan data.${depNote ? ' ' + depNote : ''}</p>`;
    }

    stripBody.innerHTML = `
      <p class="strip-callsign">${esc((rec.callsign || rec.icao24).trim())}</p>
      <p class="strip-sub">${detail?.manufacturer ? esc(detail.manufacturer) + ' ' + esc(detail.typeName || '') : 'Aircraft type unknown'} ${detail?.owner ? '· ' + esc(detail.owner) : ''}</p>
      ${routeHtml}
      <dl class="strip-grid">
        <div class="strip-field"><dt>Registration</dt><dd class="${detail?.registration ? '' : 'unavailable'}">${esc(detail?.registration) || (detail ? 'unlisted' : 'looking up…')}</dd></div>
        <div class="strip-field"><dt>Altitude</dt><dd>${fmtAlt(look.altM)}</dd></div>
        <div class="strip-field"><dt>Ground speed</dt><dd>${fmtSpeed(rec.velocityMs)}</dd></div>
        <div class="strip-field"><dt>Track</dt><dd>${fmtDeg(rec.headingDeg)}</dd></div>
        <div class="strip-field"><dt>Squawk</dt><dd>${esc(rec.squawk) || '—'}</dd></div>
        <div class="strip-field"><dt>Range</dt><dd>${look.rangeNm ? look.rangeNm.toFixed(1) + ' nm' : '—'}</dd></div>
        <div class="strip-field"><dt>ICAO24</dt><dd>${esc(rec.icao24)}</dd></div>
        <div class="strip-field"><dt>Origin country</dt><dd>${esc(rec.originCountry) || '—'}</dd></div>
      </dl>
      <p class="strip-note">Live position from OpenSky Network, extrapolated between polls using its reported ground speed and track. Registration/type from hexdb.io.</p>
    `;
  }

  function openSatelliteDetail(catnr) {
    const s = state.satellites.find((x) => x.catnr === catnr);
    if (!s) return;
    state.selected = { type: 'satellite', id: catnr };
    stripTab.classList.add('is-satellite');
    stripBody.innerHTML = `
      <p class="strip-callsign">${s.fullName}</p>
      <p class="strip-sub">${s.type} · NORAD ${s.catnr}</p>
      <dl class="strip-grid">
        <div class="strip-field"><dt>Altitude</dt><dd>${s.altKm ? Math.round(s.altKm) + ' km' : '—'}</dd></div>
        <div class="strip-field"><dt>Velocity</dt><dd>${s.velKmS ? s.velKmS.toFixed(2) + ' km/s' : '—'}</dd></div>
        <div class="strip-field"><dt>Sub-point lat</dt><dd>${s.subLat != null ? s.subLat.toFixed(2) + '°' : '—'}</dd></div>
        <div class="strip-field"><dt>Sub-point lon</dt><dd>${s.subLon != null ? s.subLon.toFixed(2) + '°' : '—'}</dd></div>
        <div class="strip-field"><dt>Range</dt><dd>${s.rangeKm ? Math.round(s.rangeKm) + ' km' : '—'}</dd></div>
        <div class="strip-field"><dt>Elevation</dt><dd>${s.el != null ? s.el.toFixed(1) + '°' : '—'}</dd></div>
      </dl>
      <p class="strip-note">Position propagated in real time from live CelesTrak orbital elements using SGP4 (satellite.js), fetched at ${new Date(state._satFetchedAt || Date.now()).toLocaleTimeString()}.</p>
    `;
    stripSheet.hidden = false;
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  function boot() {
    pollTraffic();
    setInterval(pollTraffic, 9000);
    requestAnimationFrame(render);
  }

  radiusVal.textContent = state.radiusNm + 'nm';
  radarRangeLabel.textContent = state.radiusNm;
})();
