// Dotsphere for the web: the engine of thinking-orbs by Jakub Antalik (vendor/, MIT) plus the additions of Dotsphere
// (fifteen extra states, palettes, count and size multipliers), translated from the Swift package so both behave the same.
import { MORE_FRAMES } from './modes2.js';
import { MODE_FRAMES, finalizeFrame, makeProj, radiusScale, fibDir, frac, lerp, BASE_PROFILES, PRESETS } from './vendor/thinking-orbs-engine.js';

export const ORIGINAL_STATES = ['working', 'searching', 'solving', 'listening', 'connecting', 'weaving', 'composing', 'breathing', 'shaping'];
export const ADDED_STATES = [
  'pulsing', 'scanning', 'charging',
  'orbiting', 'rippling', 'spinning', 'syncing', 'uploading', 'downloading', 'typing', 'recording', 'spiraling', 'progressing', 'waving', 'transforming',
  'blinking', 'heartbeat', 'bubbling', 'raining', 'broadcasting', 'twinkling', 'swarming', 'swinging', 'bouncing', 'juggling', 'swirling', 'equalizing',
  'reading', 'drawing', 'focusing', 'streaming', 'ticking', 'waiting', 'flipping', 'rolling', 'blooming', 'knotting', 'sequencing', 'bursting',
];
export const STATES = [...ORIGINAL_STATES, ...ADDED_STATES];

const STATE_TO_MODE = {
  working: 'orbits', searching: 'globe', solving: 'rubik', listening: 'wave', connecting: 'web',
  weaving: 'braid', composing: 'ribbon', breathing: 'ring', shaping: 'morph',
  pulsing: 'pulse', scanning: 'radar', charging: 'charge',
  orbiting: 'orbit', rippling: 'ripple', spinning: 'spinner', syncing: 'gyro', uploading: 'rise', downloading: 'fall', typing: 'typing',
  recording: 'record', spiraling: 'spiral', progressing: 'progress', waving: 'sheet', transforming: 'cube',
  blinking: 'blink', heartbeat: 'heart', bubbling: 'bubble', raining: 'rain', broadcasting: 'broadcast', twinkling: 'twinkle', swarming: 'swarm',
  swinging: 'cradle', bouncing: 'bounce', juggling: 'juggle', swirling: 'swirl', equalizing: 'equalizer', reading: 'reader', drawing: 'draw',
  focusing: 'focus', streaming: 'stream', ticking: 'clock', waiting: 'glass', flipping: 'coin', rolling: 'roll', blooming: 'bloom',
  knotting: 'knot', sequencing: 'dna', bursting: 'burst',
};

// --- additions: profiles and presets (same numbers as the Swift package) -----------------------------------------------
const EXTRA_PROFILES = {
  pulse: { ringN: 5, gap: 12, tilt: 0.75, rBase: 1.6, rDepth: 2.1, rsPow: 0.6, rMin: 0.3 },
  radar: { dotN: 260, rimN: 72, tilt: 0.8, rBase: 0.9, rDepth: 1.2, rBoost: 1.6, rsPow: 0.6, rMin: 0.3 },
  charge: { latRings: 15, lonDensity: 40, rBase: 0.9, rDepth: 1.5, rBoost: 1.4, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
  orbit: { latRings: 11, lonDensity: 28, dotN: 22, rBase: 1.1, rDepth: 1.6, partR: 1.9, partRDepth: 2.2, rsPow: 0.6, rMin: 0.3 },
  ripple: { latRings: 15, lonDensity: 40, rBase: 0.6, rDepth: 1.7, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
  spinner: { dotN: 28, rBase: 2.2, rDepth: 2.2, rsPow: 0.6, rMin: 0.3 },
  gyro: { dotN: 30, rBase: 1.8, rDepth: 2.2, rsPow: 0.6, rMin: 0.3 },
  rise: { lanes: 12, segs: 12, flow: 1, rBase: 1.3, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  fall: { lanes: 12, segs: 12, flow: -1, rBase: 1.3, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  typing: { latRings: 5, lonDensity: 10, rBase: 1.2, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  record: { dotN: 56, rimN: 40, rBase: 1.4, rDepth: 1.6, rBoost: 1.4, rsPow: 0.6, rMin: 0.3 },
  spiral: { dotN: 360, rBase: 1.0, rDepth: 1.4, rsPow: 0.6, rMin: 0.3 },
  progress: { dotN: 40, rBase: 1.8, rDepth: 2.0, rsPow: 0.6, rMin: 0.3 },
  sheet: { lanes: 14, segs: 14, rBase: 0.9, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  cube: { dotN: 180, rBase: 0.8, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  blink: { dotN: 26, rBase: 1.3, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  heart: { dotN: 64, rBase: 1.8, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  bubble: { dotN: 34, rimN: 24, rBase: 2.0, rDepth: 2.2, rsPow: 0.6, rMin: 0.3 },
  rain: { dotN: 44, rBase: 1.7, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  broadcast: { ringN: 4, dotN: 16, rBase: 1.6, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  twinkle: { dotN: 220, rBase: 1.0, rDepth: 1.4, rsPow: 0.6, rMin: 0.3 },
  swarm: { dotN: 60, rBase: 1.5, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  cradle: { latRings: 4, lonDensity: 9, rBase: 1.0, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  bounce: { latRings: 7, lonDensity: 16, rBase: 0.9, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  juggle: { latRings: 3, lonDensity: 7, rBase: 1.4, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  swirl: { dotN: 240, rBase: 1.0, rDepth: 1.5, rsPow: 0.6, rMin: 0.3 },
  equalizer: { lanes: 9, segs: 10, rBase: 1.6, rDepth: 1.4, rsPow: 0.6, rMin: 0.3 },
  reader: { lanes: 8, segs: 20, rBase: 1.4, rDepth: 1.2, rsPow: 0.6, rMin: 0.3 },
  draw: { dotN: 120, rBase: 1.8, rDepth: 2.0, rsPow: 0.6, rMin: 0.3 },
  focus: { dotN: 8, rBase: 1.6, rDepth: 1.4, rsPow: 0.6, rMin: 0.3 },
  stream: { lanes: 3, segs: 18, rBase: 1.9, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
  clock: { dotN: 60, rBase: 1.2, rDepth: 1.4, rsPow: 0.6, rMin: 0.3 },
  glass: { latRings: 9, lonDensity: 22, rBase: 1.0, rDepth: 1.5, rsPow: 0.6, rMin: 0.3 },
  coin: { ringN: 5, dotN: 60, rBase: 1.1, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  roll: { latRings: 7, lonDensity: 16, dotN: 20, rBase: 0.9, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  bloom: { ringN: 4, dotN: 64, rBase: 1.5, rDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
  knot: { dotN: 160, rBase: 2.0, rDepth: 2.0, rsPow: 0.6, rMin: 0.3 },
  dna: { dotN: 44, rBase: 1.8, rDepth: 2.0, rsPow: 0.6, rMin: 0.3 },
  burst: { dotN: 120, rBase: 1.7, rDepth: 1.8, rsPow: 0.6, rMin: 0.3 },
};
const EXTRA_PRESETS = {
  pulse: { 64: { speed: 2.0, count: 1, size: 1 }, 20: { speed: 2.4, count: 1, size: 1.9, extra: { ringN: 3 } } },
  radar: { 64: { speed: 1.5, count: 1, size: 1 }, 20: { speed: 1.7, count: 0.3, size: 1.9, extra: { rimN: 28 } } },
  charge: { 64: { speed: 1.0, count: 0.42, size: 1.15 }, 20: { speed: 1.1, count: 0.105, size: 1.75 } },
  orbit: { 64: { speed: 1.6, count: 1, size: 1 }, 20: { speed: 2.0, count: 0.3, size: 1.9 } },
  ripple: { 64: { speed: 2.0, count: 0.42, size: 1.15 }, 20: { speed: 2.2, count: 0.105, size: 1.75 } },
  spinner: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.6, size: 1.5 } },
  gyro: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.5 } },
  rise: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.8 } },
  fall: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.8 } },
  typing: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.35, size: 1.3 } },
  record: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.35, size: 1.8, extra: { rimN: 20 } } },
  spiral: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.8 } },
  progress: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.5 } },
  sheet: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.8 } },
  cube: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.25, size: 1.8 } },
  blink: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.5 } },
  heart: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.5 } },
  bubble: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.35, size: 1.6 } },
  rain: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.6 } },
  broadcast: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.5 } },
  twinkle: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.2, size: 1.8 } },
  swarm: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.6 } },
  cradle: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.35, size: 1.3 } },
  bounce: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.5 } },
  juggle: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.4 } },
  swirl: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.8 } },
  equalizer: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.5 } },
  reader: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.5 } },
  draw: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.6 } },
  focus: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.4 } },
  stream: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.5 } },
  clock: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.5 } },
  glass: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.6 } },
  coin: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.5 } },
  roll: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.35, size: 1.5 } },
  bloom: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.5 } },
  knot: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.3, size: 1.7 } },
  dna: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.5, size: 1.5 } },
  burst: { 64: { speed: 1.0, count: 1, size: 1 }, 20: { speed: 1.2, count: 0.4, size: 1.7 } },
};

// --- scaling (profiles.ts of the original, plus the two count keys of the additions) ------------------------------------
const COUNT_PAIRS = [['latRings', 'lonDensity'], ['rings', 'lonDensity'], ['lanes', 'segs']];
const COUNT_KEYS = ['orbitN', 'ghostN', 'nodeN', 'strandN', 'signals', 'ringN', 'dotN'];
const RADIUS_KEYS = ['rBase', 'rDepth', 'rActive', 'rDot', 'ghostR', 'partR', 'partRDepth', 'nodeR', 'nodeRDepth'];
const jsRound = (x) => Math.floor(x + 0.5);

export function scaleCounts(opts, scale) {
  const out = { ...opts };
  const done = new Set();
  const rt = Math.sqrt(scale);
  for (const [a, b] of COUNT_PAIRS) {
    if (out[a] != null && out[b] != null && !done.has(a) && !done.has(b)) {
      out[a] = Math.max(2, jsRound(out[a] * rt));
      out[b] = Math.max(2, jsRound(out[b] * rt));
      done.add(a); done.add(b);
    }
  }
  for (const k of COUNT_KEYS) {
    const v = out[k];
    if (v != null && v !== 0 && !done.has(k)) out[k] = Math.max(1, jsRound(v * scale));
  }
  if (out.iconD != null) out.iconD = Math.max(0.02, out.iconD * scale);
  return out;
}

export function scaleRadii(opts, scale) {
  const out = { ...opts };
  for (const k of RADIUS_KEYS) if (out[k] != null) out[k] = out[k] * scale;
  out.rSizeMul = (out.rSizeMul ?? 1) * scale;
  return out;
}

/** The tuned design that fits a point size: 64 from 40 up, 20 below. */
export const presetForSize = (size) => (size >= 40 ? 64 : 20);

/** Preset, then `dots`, then `dotSize`, then `opts` (the last wins), like DotOrbStyle.resolved in Swift. */
export function resolve({ state, preset = 64, dots = 1, dotSize = 1, opts = {} }) {
  const mode = STATE_TO_MODE[state];
  const p = (PRESETS[mode] ?? EXTRA_PRESETS[mode])[preset];
  let o = { ...(BASE_PROFILES[mode] ?? EXTRA_PROFILES[mode]) };
  if (p.count !== 1) o = scaleCounts(o, p.count);
  if (p.size !== 1) o = scaleRadii(o, p.size);
  if (p.extra) o = { ...o, ...p.extra };
  if (dots !== 1) o = scaleCounts(o, dots);
  if (dotSize !== 1) o = scaleRadii(o, dotSize);
  return { mode, speed: p.speed, opts: { ...o, ...opts } };
}

// --- additions: the three extra modes -----------------------------------------------------------------------------------
const golden = Math.PI * (3 - Math.sqrt(5));

function framePulse(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.86;
  const pt = makeProj(0, o.tilt ?? 0.75, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const ringN = Math.max(1, Math.trunc(o.ringN ?? 5));
  const gap = (o.gap ?? 14) * rs;
  const rBase = o.rBase ?? 1.6, rDepth = o.rDepth ?? 2.1;
  const dots = [];
  for (let j = 0; j < ringN; j++) {
    const u = frac(t * 0.28 + j / ringN);
    const rad = R * (0.08 + 0.92 * u);
    const fade = Math.pow(1 - u, 1.4) * Math.min(1, u * 8);
    const count = Math.max(6, jsRound((2 * Math.PI * rad) / gap));
    const spin = (j % 2 === 0 ? 1 : -1) * t * 0.2 + j * 0.9;
    for (let k = 0; k < count; k++) {
      const a = (k / count) * 2 * Math.PI + spin;
      const [px, py, z] = pt(Math.cos(a) * rad, 0, Math.sin(a) * rad);
      const depth = (z / R + 1) / 2;
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.6 + 0.8 * (1 - u)), white: 0.5 - 0.4 * depth, a: Math.min(1, fade * 1.5) * (0.45 + 0.55 * depth) });
    }
  }
  const beat = 1 + 0.25 * Math.sin(t * 3);
  dots.push({ x: cx, y: cy, z: 0, r: (rBase * 2.2 + rDepth * 0.5) * rs * beat, white: 0.08, a: 1 });
  return finalizeFrame(dots, [], o.rMin);
}

function frameRadar(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.86;
  const pt = makeProj(0, o.tilt ?? 0.8, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = Math.max(1, Math.trunc(o.dotN ?? 260)), rimN = Math.max(0, Math.trunc(o.rimN ?? 72));
  const rBase = o.rBase ?? 0.9, rDepth = o.rDepth ?? 1.2, rBoost = o.rBoost ?? 1.6;
  const sweep = t * 1.7;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const rr = Math.sqrt((i + 0.5) / n) * R;
    const th = i * golden;
    const [px, py, z] = pt(Math.cos(th) * rr, 0, Math.sin(th) * rr);
    const depth = (z / R + 1) / 2;
    const behind = frac((sweep - th) / (2 * Math.PI));
    const glow = Math.exp(-behind * 5);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth + rBoost * glow) * rs, white: 0.62 - 0.5 * depth - 0.35 * glow, a: 0.28 + 0.72 * glow });
  }
  for (let k = 0; k < rimN; k++) {
    const a = (k / rimN) * 2 * Math.PI;
    const [px, py, z] = pt(Math.cos(a) * R, 0, Math.sin(a) * R);
    const depth = (z / R + 1) / 2;
    dots.push({ x: px, y: py, z, r: (rBase * 0.8 + rDepth * 0.4 * depth) * rs, white: 0.7, a: 0.25 });
  }
  return finalizeFrame(dots, [], o.rMin);
}

function frameCharge(size, t, o) {
  const cx = size / 2, cy = size / 2, radius = (size / 2) * 0.82;
  const pt = makeProj(t * 0.35, 0.35, cx, cy, radius);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = Math.max(1, Math.trunc(o.latRings ?? 15)), lonDensity = o.lonDensity ?? 40;
  const rBase = o.rBase ?? 0.9, rDepth = o.rDepth ?? 1.5, rBoost = o.rBoost ?? 1.4;
  const inkFar = o.inkFar ?? 0.62, inkSpan = o.inkSpan ?? 0.54;
  const u = frac(t / 4);
  const smooth = (x) => x * x * (3 - 2 * x);
  let level;
  if (u < 0.8) level = lerp(-1.05, 1.05, smooth(u / 0.8));
  else if (u < 0.92) level = 1.05;
  else { const q = (u - 0.92) / 0.08; level = lerp(1.05, -1.05, q * q); }
  const dots = [];
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
    const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * 2 * Math.PI;
      const [px, py, z] = pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon));
      const depth = (z + 1) / 2;
      const edge = Math.exp(-Math.pow((sinLat - level) / 0.12, 2));
      if (sinLat <= level) dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth + rBoost * edge) * rs, white: inkFar - inkSpan * depth, a: 1 });
      else dots.push({ x: px, y: py, z, r: (rBase * 0.55 + rDepth * 0.4 * depth) * rs, white: 0.78, a: 0.22 + 0.18 * depth });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}


// --- twelve more states -------------------------------------------------------------------------------------------------
const TAU = Math.PI * 2;
const smoothE = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const hash = (a, b) => { const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return h - Math.floor(h); };

/** orbiting: a comet circles a small dotted planet */
function frameOrbit(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.82;
  const pt = makeProj(t * 0.15, 0.3, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = Math.max(1, Math.trunc(o.latRings ?? 11)), lonDensity = o.lonDensity ?? 28;
  const n = Math.max(1, Math.trunc(o.dotN ?? 22));
  const rBase = o.rBase ?? 1.0, rDepth = o.rDepth ?? 1.5, cR = o.partR ?? 1.6, cRD = o.partRDepth ?? 2.0;
  const dots = [];
  const Rp = R * 0.58;
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
    const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * TAU;
      const [px, py, z] = pt(cosLat * Math.cos(lon) * Rp, sinLat * Rp, cosLat * Math.sin(lon) * Rp);
      const depth = (z / Rp + 1) / 2;
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.7 - 0.5 * depth, a: 0.3 + 0.3 * depth });
    }
  }
  const incl = 0.9, head = t * 1.8;
  for (let i = 0; i < n; i++) {
    const age = i / n;
    const ang = head - age * 1.6;
    const px0 = Math.cos(ang) * R, pz0 = Math.sin(ang) * R;
    const [px, py, z] = pt(px0, -pz0 * Math.sin(incl), pz0 * Math.cos(incl));
    const depth = (z / R + 1) / 2;
    dots.push({ x: px, y: py, z, r: (cR + cRD * depth) * (1 - 0.75 * age) * rs, white: 0.05 + 0.5 * age, a: Math.min(1, Math.pow(1 - age, 1.2) * (0.5 + 0.5 * depth)) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** rippling: waves travel across a dotted sphere from a wandering source */
function frameRipple(size, t, o) {
  const cx = size / 2, cy = size / 2, radius = (size / 2) * 0.8;
  const pt = makeProj(t * 0.12, 0.35, cx, cy, radius);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = Math.max(1, Math.trunc(o.latRings ?? 15)), lonDensity = o.lonDensity ?? 40;
  const rBase = o.rBase ?? 0.6, rDepth = o.rDepth ?? 1.7, inkFar = o.inkFar ?? 0.62, inkSpan = o.inkSpan ?? 0.54;
  const sa = t * 0.4;
  let sx = Math.cos(sa), sy = 0.3, sz = Math.sin(sa);
  const sl = Math.sqrt(sx * sx + sy * sy + sz * sz);
  sx /= sl; sy /= sl; sz /= sl;
  const dots = [];
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
    const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * TAU;
      const vx = cosLat * Math.cos(lon), vy = sinLat, vz = cosLat * Math.sin(lon);
      const d = Math.acos(Math.min(1, Math.max(-1, vx * sx + vy * sy + vz * sz)));
      const wave = Math.sin(d * 9 - t * 3.2) * Math.exp(-d * 0.9);
      const rr = 1 + 0.09 * wave;
      const [px, py, z] = pt(vx * rr, vy * rr, vz * rr);
      const depth = clamp01((z + 1) / 2);
      const crest = Math.max(0, wave);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * (1 + 0.5 * crest) * rs, white: inkFar - inkSpan * depth - 0.12 * crest, a: 1 });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** spinning: the classic spinner, a comet of dots around a ring */
function frameSpinner(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.8;
  const pt = makeProj(0, 0.62, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = Math.max(1, Math.trunc(o.dotN ?? 28));
  const rBase = o.rBase ?? 1.4, rDepth = o.rDepth ?? 1.8;
  const head = t * 3.4;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * TAU;
    const glow = Math.exp(-frac((head - a) / TAU) * 3.2);
    const [px, py, z] = pt(Math.cos(a) * R, 0, Math.sin(a) * R);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.4 + 0.8 * glow), white: 0.55 - 0.5 * glow, a: Math.min(1, (0.3 + 0.7 * glow) * (0.65 + 0.35 * depth)) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** syncing: three nested rings turn against each other, like a gyroscope */
function frameGyro(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.84;
  const pt = makeProj(t * 0.2, 0.5, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = Math.max(1, Math.trunc(o.dotN ?? 30));
  const rBase = o.rBase ?? 1.2, rDepth = o.rDepth ?? 1.8;
  const rings = [
    { r: 0.94, plane: 0, rot: t * 0.6, head: t * 2.2 },
    { r: 0.78, plane: 1, rot: t * 0.8 + 1.0, head: -t * 2.7 + 1 },
    { r: 0.62, plane: 2, rot: -t * 0.7 + 2.0, head: t * 3.2 + 2 },
  ];
  const dots = [];
  for (const ring of rings) {
    const cr = Math.cos(ring.rot), sr = Math.sin(ring.rot);
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * TAU;
      const glow = Math.exp(-frac((ring.head - a) / TAU) * 3);
      let x, y, z;
      if (ring.plane === 0) { const y0 = 0, z0 = Math.sin(a); x = Math.cos(a); y = y0 * cr - z0 * sr; z = y0 * sr + z0 * cr; }
      else if (ring.plane === 1) { const x0 = Math.cos(a), z0 = 0; x = x0 * cr + z0 * sr; y = Math.sin(a); z = -x0 * sr + z0 * cr; }
      else { const x0 = 0, y0 = Math.cos(a); x = x0 * cr - y0 * sr; y = x0 * sr + y0 * cr; z = Math.sin(a); }
      const [px, py, zz] = pt(x * ring.r * R, y * ring.r * R, z * ring.r * R);
      const depth = clamp01((zz / R + 1) / 2);
      dots.push({ x: px, y: py, z: zz, r: (rBase + rDepth * depth) * rs * (0.45 + 0.75 * glow), white: 0.6 - 0.5 * glow - 0.1 * depth, a: Math.min(1, (0.38 + 0.62 * glow) * (0.6 + 0.4 * depth)) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** uploading (flow +1) and downloading (flow -1): bands of light run along a dotted arrow-shaped column */
function frameFlow(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.82;
  const pt = makeProj(t * 0.25, 0.4, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const flow = o.flow ?? 1;
  const lanes = Math.max(2, Math.trunc(o.lanes ?? 12)), segs = Math.max(2, Math.trunc(o.segs ?? 12));
  const rBase = o.rBase ?? 0.9, rDepth = o.rDepth ?? 1.5;
  const Rc = R * 0.62, H = R * 0.92;
  const bc = flow > 0 ? -1.15 + 2.3 * frac(t * 0.45) : 1.15 - 2.3 * frac(t * 0.45);
  const dots = [];
  for (let c = 0; c < lanes; c++) {
    const a = (c / lanes) * TAU;
    for (let k = 0; k <= segs; k++) {
      const h = -1 + (2 * k) / segs;
      const rad = Rc * (1 - 0.35 * flow * h);
      const [px, py, z] = pt(Math.cos(a) * rad, h * H, Math.sin(a) * rad);
      const depth = clamp01((z / R + 1) / 2);
      const band = Math.exp(-Math.pow((h - bc) / 0.3, 2));
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.55 + 0.9 * band), white: 0.62 - 0.5 * depth - 0.3 * band, a: Math.min(1, (0.28 + 0.72 * band) * (0.6 + 0.4 * depth)) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** typing: three small dotted spheres bounce one after the other */
function frameTyping(size, t, o) {
  const cx = size / 2, cy = size / 2, R = size / 2;
  const pt = makeProj(0, 0.25, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = Math.max(1, Math.trunc(o.latRings ?? 4)), lonDensity = o.lonDensity ?? 8;
  const rBase = o.rBase ?? 0.9, rDepth = o.rDepth ?? 1.6;
  const Rcl = R * 0.28;
  const dots = [];
  for (let k = 0; k < 3; k++) {
    const b = Math.max(0, Math.sin(t * 3.4 - k * 0.8));
    const sc = 1 + 0.25 * b;
    const ox = (k - 1) * R * 0.64, oy = b * R * 0.34 - R * 0.05;
    const yaw = t * 0.8 + k, cyw = Math.cos(yaw), syw = Math.sin(yaw);
    for (let li = 0; li <= latRings; li++) {
      const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
      const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
      const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = (lj / lonCount) * TAU;
        const vx0 = cosLat * Math.cos(lon), vy = sinLat, vz0 = cosLat * Math.sin(lon);
        const vx = vx0 * cyw + vz0 * syw, vz = -vx0 * syw + vz0 * cyw;
        const [px, py, z] = pt(ox + vx * Rcl * sc, oy + vy * Rcl * sc, vz * Rcl * sc);
        const depth = clamp01((vz + 1) / 2);
        dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * sc, white: 0.55 - 0.45 * depth - 0.15 * b, a: Math.min(1, (0.5 + 0.5 * b) * (0.55 + 0.45 * depth)) });
      }
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** recording: a beating core, and two glints that run around its rim */
function frameRecord(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.84;
  const pt = makeProj(0, 0.55, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = Math.max(1, Math.trunc(o.dotN ?? 56)), rimN = Math.max(0, Math.trunc(o.rimN ?? 40));
  const rBase = o.rBase ?? 1.0, rDepth = o.rDepth ?? 1.4, rBoost = o.rBoost ?? 1.2;
  const beat = Math.sin(t * 4.2);
  const Rcore = R * 0.46 * (1 + 0.12 * beat);
  const dots = [];
  for (let i = 0; i < n; i++) {
    const rr = Math.sqrt((i + 0.5) / n) * Rcore;
    const th = i * golden;
    const [px, py, z] = pt(Math.cos(th) * rr, 0, Math.sin(th) * rr);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.9 + 0.3 * beat), white: 0.1 + 0.25 * depth, a: Math.min(1, 0.75 + 0.25 * depth) });
  }
  for (let k = 0; k < rimN; k++) {
    const a = (k / rimN) * TAU;
    const b1 = frac((t * 0.9 - a) / TAU), b2 = frac((t * 0.9 + Math.PI - a) / TAU);
    const glow = Math.max(Math.exp(-b1 * 4), Math.exp(-b2 * 4));
    const [px, py, z] = pt(Math.cos(a) * R, 0, Math.sin(a) * R);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase * 0.7 + rDepth * 0.4 * depth + rBoost * glow) * rs, white: 0.6 - 0.45 * glow, a: Math.min(1, 0.22 + 0.78 * glow) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** spiraling: a small galaxy with three turning arms */
function frameSpiral(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.88;
  const pt = makeProj(0, 0.95, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = Math.max(1, Math.trunc(o.dotN ?? 360));
  const rBase = o.rBase ?? 0.8, rDepth = o.rDepth ?? 1.3;
  const arms = 3, per = Math.ceil(n / arms);
  const dots = [];
  for (let i = 0; i < n; i++) {
    const arm = i % arms;
    const s = (Math.floor(i / arms) + 0.5) / per;
    const rr = R * Math.pow(s, 0.8) + (hash(i, 7.7) - 0.5) * 0.04 * R;
    const ang = (arm * TAU) / arms + s * 4.4 + t * 0.6 + (hash(i, 3.1) - 0.5) * 0.35 * (1 - 0.5 * s);
    const thick = (hash(i, 9.3) - 0.5) * 0.12 * R * (1 - s);
    const [px, py, z] = pt(Math.cos(ang) * rr, thick, Math.sin(ang) * rr);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (1.1 - 0.5 * s), white: 0.1 + 0.5 * s - 0.1 * depth, a: Math.min(1, 0.3 + 0.7 * Math.pow(1 - s, 0.5)) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** progressing: an indeterminate progress ring that fills, then empties from behind */
function frameProgress(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.82;
  const pt = makeProj(0, 0.5, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = Math.max(1, Math.trunc(o.dotN ?? 40));
  const rBase = o.rBase ?? 1.5, rDepth = o.rDepth ?? 1.8;
  const u = frac(t / 2.4);
  const head = u < 0.5 ? TAU * smoothE(u / 0.5) : TAU;
  const tail = u < 0.5 ? 0 : TAU * smoothE((u - 0.5) / 0.5);
  const base = t * 0.7;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const a0 = ((i + 0.5) / n) * TAU;
    const lit = a0 >= tail && a0 <= head;
    const edge = Math.exp(-Math.pow((a0 - head) / 0.4, 2));
    const ang = a0 + base;
    const [px, py, z] = pt(Math.cos(ang) * R, 0, Math.sin(ang) * R);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (lit ? 0.9 + 0.5 * edge : 0.55), white: lit ? 0.1 + 0.3 * (1 - edge) : 0.5, a: lit ? 0.7 + 0.3 * depth : 0.4 });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** waving: a dotted sheet ripples like a flag */
function frameSheet(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.86;
  const pt = makeProj(0.55, 0.62, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const lanes = Math.max(2, Math.trunc(o.lanes ?? 14)), segs = Math.max(2, Math.trunc(o.segs ?? 14));
  const rBase = o.rBase ?? 0.9, rDepth = o.rDepth ?? 1.6;
  const dots = [];
  for (let i = 0; i < lanes; i++) {
    const u = ((i + 0.5) / lanes) * 2 - 1;
    for (let j = 0; j < segs; j++) {
      const v = ((j + 0.5) / segs) * 2 - 1;
      const y = 0.16 * Math.sin(u * 3.2 + t * 2.4) * (0.55 + 0.45 * Math.cos(v * 1.6)) + 0.08 * Math.sin(v * 4.1 - t * 1.7);
      const [px, py, z] = pt(u * R * 0.92, y * R, v * R * 0.92);
      const depth = clamp01((z / R + 1) / 2);
      const h = y / 0.24;
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.85 + 0.3 * h), white: 0.62 - 0.5 * depth - 0.12 * h, a: Math.min(1, 0.4 + 0.6 * depth) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** transforming: a dotted sphere turns into a cube and back */
function frameCube(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.8;
  const pt = makeProj(t * 0.35, 0.45, cx, cy, R);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = Math.max(1, Math.trunc(o.dotN ?? 180));
  const rBase = o.rBase ?? 0.8, rDepth = o.rDepth ?? 1.6;
  const m = smoothE(clamp01(0.5 + 0.8 * Math.sin(t * 0.8)));
  const dots = [];
  for (let i = 0; i < n; i++) {
    const [dx, dy, dz] = fibDir(i, n);
    const mx = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
    const [px, py, z] = pt(lerp(dx, (dx / mx) * 0.62, m), lerp(dy, (dy / mx) * 0.62, m), lerp(dz, (dz / mx) * 0.62, m));
    const depth = clamp01((z + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.62 - 0.5 * depth, a: 1 });
  }
  return finalizeFrame(dots, [], o.rMin);
}

const EXTRA_FRAMES = {
  pulse: framePulse, radar: frameRadar, charge: frameCharge,
  orbit: frameOrbit, ripple: frameRipple, spinner: frameSpinner, gyro: frameGyro, rise: frameFlow, fall: frameFlow, typing: frameTyping,
  record: frameRecord, spiral: frameSpiral, progress: frameProgress, sheet: frameSheet, cube: frameCube,
  ...MORE_FRAMES,
};

/** Geometry for one instant: `t` is orb time (seconds x preset speed x user speed). */
export function frameAt(mode, size, t, opts) {
  return (EXTRA_FRAMES[mode] ?? MODE_FRAMES[mode])(size, t, opts);
}

// --- inks ---------------------------------------------------------------------------------------------------------------
export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** Palette: { kind: 'mono' } | { kind: 'tint', color } | { kind: 'gradient', near, far } with colours as {r,g,b} in 0...1. */
export function ink(palette, white, dark) {
  const w = Math.min(1, Math.max(0, white));
  if (palette.kind === 'gradient') {
    const { near: n, far: f } = palette;
    return [n.r + (f.r - n.r) * w, n.g + (f.g - n.g) * w, n.b + (f.b - n.b) * w];
  }
  const g = Math.round((dark ? 1 - w : w) * 255) / 255;
  if (palette.kind === 'tint') {
    const c = palette.color;
    return dark ? [c.r * g, c.g * g, c.b * g] : [c.r + (1 - c.r) * g, c.g + (1 - c.g) * g, c.b + (1 - c.b) * g];
  }
  return [g, g, g];
}

const css = (c, a) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${Math.min(1, a)})`;

/** Paints a finished frame into a 2D context in point units: lines first, then the dots in z order. */
export function paintFrame(ctx, frame, palette, dark) {
  for (const l of frame.lines) {
    ctx.strokeStyle = css(ink(palette, l.white, dark), l.a ?? 1);
    ctx.lineWidth = l.w;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  }
  for (const d of frame.dots) {
    ctx.fillStyle = css(ink(palette, d.white, dark), d.a ?? 1);
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
  }
}

/** Everything needed to draw an orb, mirroring DotOrbStyle: state, size, speed, dots, dotSize, opts, palette. */
export function makeStyle({ state = 'working', size = 64, speed = 1, dots = 1, dotSize = 1, opts = {}, palette = { kind: 'mono' } } = {}) {
  const r = resolve({ state, preset: presetForSize(size), dots, dotSize, opts });
  return { state, size, speed, dots, dotSize, opts, palette, resolved: r };
}

export function styleFrame(style, seconds) {
  const r = style.resolved;
  return frameAt(r.mode, style.size, seconds * r.speed * style.speed, r.opts);
}

/** The Swift call that reproduces a style (used by the demo's code box). */
export function swiftCode(s, dark = true) {
  const f = (n) => String(Math.round(n * 100) / 100);
  const hex = (c) => '0x' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  const args = [`state: .${s.state}`, `size: ${Math.round(s.size)}`];
  if (!dark) args.push('theme: .light');
  if (s.speed !== 1) args.push(`speed: ${f(s.speed)}`);
  if (s.palette.kind === 'tint') args.push(`palette: .tinted(hex: ${hex(s.palette.color)})`);
  if (s.palette.kind === 'gradient') args.push(`palette: .gradient(near: DotOrbRGB(hex: ${hex(s.palette.near)}), far: DotOrbRGB(hex: ${hex(s.palette.far)}))`);
  if (s.dots !== 1) args.push(`dots: ${f(s.dots)}`);
  if (s.dotSize !== 1) args.push(`dotSize: ${f(s.dotSize)}`);
  const o = Object.entries(s.opts ?? {});
  if (o.length) args.push(`opts: [${o.map(([k, v]) => `"${k}": ${f(v)}`).join(', ')}]`);
  return `DotOrb(${args.join(', ')})`;
}
