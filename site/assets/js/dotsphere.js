// Dotsphere for the web: the engine of thinking-orbs by Jakub Antalik (vendor/, MIT) plus the additions of Dotsphere
// (three extra states, palettes, count and size multipliers), translated from the Swift package so both behave the same.
import { MODE_FRAMES, finalizeFrame, makeProj, radiusScale, frac, lerp, BASE_PROFILES, PRESETS } from './vendor/thinking-orbs-engine.js';

export const ORIGINAL_STATES = ['working', 'searching', 'solving', 'listening', 'connecting', 'weaving', 'composing', 'breathing', 'shaping'];
export const ADDED_STATES = ['pulsing', 'scanning', 'charging'];
export const STATES = [...ORIGINAL_STATES, ...ADDED_STATES];

const STATE_TO_MODE = {
  working: 'orbits', searching: 'globe', solving: 'rubik', listening: 'wave', connecting: 'web',
  weaving: 'braid', composing: 'ribbon', breathing: 'ring', shaping: 'morph',
  pulsing: 'pulse', scanning: 'radar', charging: 'charge',
};

// --- additions: profiles and presets (same numbers as the Swift package) -----------------------------------------------
const EXTRA_PROFILES = {
  pulse: { ringN: 5, gap: 12, tilt: 0.75, rBase: 1.6, rDepth: 2.1, rsPow: 0.6, rMin: 0.3 },
  radar: { dotN: 260, rimN: 72, tilt: 0.8, rBase: 0.9, rDepth: 1.2, rBoost: 1.6, rsPow: 0.6, rMin: 0.3 },
  charge: { latRings: 15, lonDensity: 40, rBase: 0.9, rDepth: 1.5, rBoost: 1.4, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
};
const EXTRA_PRESETS = {
  pulse: { 64: { speed: 2.0, count: 1, size: 1 }, 20: { speed: 2.4, count: 1, size: 1.9, extra: { ringN: 3 } } },
  radar: { 64: { speed: 1.5, count: 1, size: 1 }, 20: { speed: 1.7, count: 0.3, size: 1.9, extra: { rimN: 28 } } },
  charge: { 64: { speed: 1.0, count: 0.42, size: 1.15 }, 20: { speed: 1.1, count: 0.105, size: 1.75 } },
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

const EXTRA_FRAMES = { pulse: framePulse, radar: frameRadar, charge: frameCharge };

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
