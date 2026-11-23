// Twenty-four more states of Dotsphere (all 24 only exist here and in the Swift package). Same style as the original engine:
// pure math over (size, t, opts), z-sorted dots, depth carried by dot size and ink value.
import { finalizeFrame, makeProj, radiusScale, fibDir, frac } from './vendor/thinking-orbs-engine.js';

const TAU = Math.PI * 2;
const golden = Math.PI * (3 - Math.sqrt(5));
const jsRound = (x) => Math.floor(x + 0.5);
const smoothE = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const hash = (a, b) => { const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return h - Math.floor(h); };
const N = (v, d, min = 1) => Math.max(min, Math.trunc(v ?? d));

/** blinking: an eye that looks around and blinks */
function frameBlink(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.88;
  const pt = makeProj(0.25 * Math.sin(t * 0.5), 0.12, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 26, 2);
  const rBase = o.rBase ?? 1.3, rDepth = o.rDepth ?? 1.6;
  const W = R * 0.95, H = R * 0.5;
  const u = frac(t / 3.2);
  const L = u < 0.88 ? 1 : u < 0.94 ? 1 - smoothE((u - 0.88) / 0.06) : smoothE((u - 0.94) / 0.06);
  const lidUp = (x) => H * L * (1 - (x / W) * (x / W));
  const lidLo = (x) => -H * L * 0.8 * (1 - (x / W) * (x / W));
  const dots = [];
  for (let i = 0; i < n; i++) {
    const x = -W * Math.cos((Math.PI * (i + 0.5)) / n);
    for (const y of [lidUp(x), lidLo(x)]) {
      const [px, py, z] = pt(x, y, 0);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase * 0.8 + rDepth * 0.3 * depth) * rs, white: 0.3, a: 0.9 });
    }
  }
  if (L > 0.05) {
    const ix = 0.14 * R * Math.sin(t * 0.9), iy = 0.05 * R * Math.sin(t * 1.7), ri = 0.36 * R;
    const m = jsRound(n * 1.3);
    for (let i = 0; i < m; i++) {
      const rr = Math.sqrt((i + 0.5) / m) * ri, th = i * golden;
      const x = ix + Math.cos(th) * rr, y = iy + Math.sin(th) * rr;
      if (Math.abs(x) >= W) continue;
      const e = Math.min(lidUp(x) - y, y - lidLo(x)) / (0.1 * R);
      if (e <= 0) continue;
      const [px, py, z] = pt(x, y, 0.12 * R);
      const depth = clamp01((z / R + 1) / 2);
      const pupil = i < 4;
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (pupil ? 1.3 : 1), white: pupil ? 0.02 : 0.25 + 0.35 * (rr / ri), a: Math.min(1, clamp01(e) * (0.55 + 0.45 * depth)) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** heartbeat: an ECG trace made of dots scrolls past */
function ecg(p) {
  if (p < 0.10) return 0;
  if (p < 0.18) return 0.12 * Math.sin((Math.PI * (p - 0.10)) / 0.08);
  if (p < 0.24) return 0;
  if (p < 0.27) return (-0.15 * (p - 0.24)) / 0.03;
  if (p < 0.31) return -0.15 + (1.15 * (p - 0.27)) / 0.04;
  if (p < 0.36) return 1.0 - (1.3 * (p - 0.31)) / 0.05;
  if (p < 0.40) return -0.3 + (0.3 * (p - 0.36)) / 0.04;
  if (p < 0.55) return 0;
  if (p < 0.70) return 0.22 * Math.sin((Math.PI * (p - 0.55)) / 0.15);
  return 0;
}
function frameHeart(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.92;
  const pt = makeProj(0.2 * Math.sin(t * 0.4), 0.1, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 64, 2);
  const rBase = o.rBase ?? 1.4, rDepth = o.rDepth ?? 1.6;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const e = ecg(frac(u * 1.6 + t * 0.45));
    const [px, py, z] = pt((u * 2 - 1) * R, e * R * 0.5, 0);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * 0.5 * depth) * rs * (0.75 + 0.5 * Math.min(1, Math.abs(e))) * (i === n - 1 ? 1.6 : 1), white: i === n - 1 ? 0.05 : 0.3 - 0.2 * u, a: Math.min(1, clamp01(u * 5) * (0.3 + 0.7 * u)) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** bubbling: bubbles rise through a glass column */
function frameBubble(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.86;
  const pt = makeProj(t * 0.2, 0.25, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 26), rimN = N(o.rimN, 24, 0);
  const rBase = o.rBase ?? 1.4, rDepth = o.rDepth ?? 1.8;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const v = 0.18 + 0.25 * hash(i, 1.3);
    const h = frac(hash(i, 2.7) + t * v);
    const ang = hash(i, 4.1) * TAU, rad = Math.sqrt(hash(i, 5.9)) * 0.42 * R;
    const sway = 0.05 * R * Math.sin(t * 1.7 + i);
    const [px, py, z] = pt(Math.cos(ang) * rad + sway, (h * 2 - 1) * 0.9 * R, Math.sin(ang) * rad);
    const depth = clamp01((z / R + 1) / 2), b = 0.5 + 0.9 * hash(i, 6.3);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * b * (0.6 + 0.6 * h), white: 0.55 - 0.4 * depth, a: Math.min(1, Math.min(1, h * 6) * Math.min(1, (1 - h) * 5) * (0.5 + 0.5 * depth)) });
  }
  for (const yy of [-0.9, 0.9]) {
    for (let k = 0; k < rimN; k++) {
      const a = (k / rimN) * TAU;
      const [px, py, z] = pt(Math.cos(a) * 0.5 * R, yy * R, Math.sin(a) * 0.5 * R);
      dots.push({ x: px, y: py, z, r: rBase * 0.5 * rs, white: 0.6, a: 0.3 });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** raining: drops fall, leave a trail and splash on the ground */
function frameRain(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.86;
  const pt = makeProj(0.4, 0.35, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 30);
  const rBase = o.rBase ?? 1.3, rDepth = o.rDepth ?? 1.6;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const sp = 0.5 + 0.5 * hash(i, 1.1);
    const h = frac(hash(i, 2.3) + t * sp * 0.8);
    const xa = (hash(i, 3.7) - 0.5) * 1.7 * R, za = (hash(i, 4.9) - 0.5) * 1.7 * R;
    const y = (0.9 - 1.8 * h) * R;
    for (let k = 0; k < 4; k++) {
      const yk = y + k * 0.07 * R;
      if (yk > 0.9 * R) continue;
      const [px, py, z] = pt(xa, yk, za);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (1 - 0.22 * k), white: 0.5 - 0.4 * depth + 0.1 * k, a: Math.min(1, Math.min(1, h * 8) * (1 - 0.3 * k) * (0.5 + 0.5 * depth)) });
    }
    if (h < 0.15) {
      const s = h / 0.15, rad = (0.02 + 0.1 * s) * R;
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU;
        const [px, py, z] = pt(xa + Math.cos(a) * rad, -0.9 * R, za + Math.sin(a) * rad);
        dots.push({ x: px, y: py, z, r: rBase * 0.6 * rs * (1 - s * 0.5), white: 0.5, a: (1 - s) * 0.6 });
      }
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** broadcasting: signal arcs pulse outward from a base dot */
function frameBroadcast(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0.35 * Math.sin(t * 0.6), 0.12, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const arcs = N(o.ringN, 4), nOut = N(o.dotN, 16);
  const rBase = o.rBase ?? 1.6, rDepth = o.rDepth ?? 1.8;
  const dots = [];
  const by = -0.62 * R;
  const beat = Math.sin(t * 3);
  {
    const [px, py, z] = pt(0, by, 0);
    dots.push({ x: px, y: py, z, r: (rBase * 1.6 + rDepth * 0.5) * rs * (1 + 0.2 * beat), white: 0.08, a: 1 });
  }
  for (let k = 0; k < arcs; k++) {
    const rho = R * (0.28 + 0.22 * k);
    const glow = Math.pow(Math.max(0, Math.sin(t * 3 - k * 0.9)), 2);
    const m = Math.max(5, jsRound((nOut * rho) / (R * 0.94)));
    for (let j = 0; j < m; j++) {
      const th = (j / (m - 1) - 0.5) * 1.745;
      const [px, py, z] = pt(Math.sin(th) * rho, by + Math.cos(th) * rho, 0);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase * 0.7 + rDepth * 0.35 * glow + rDepth * 0.1 * depth) * rs, white: 0.55 - 0.45 * glow, a: Math.min(1, 0.25 + 0.75 * glow) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** twinkling: a slowly turning starfield, every star on its own tempo */
function frameTwinkle(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.85;
  const pt = makeProj(t * 0.1, 0.3, cx, cy, R);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 220);
  const rBase = o.rBase ?? 1.0, rDepth = o.rDepth ?? 1.4;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const [dx, dy, dz] = fibDir(i, n);
    const [px, py, z] = pt(dx, dy, dz);
    const depth = clamp01((z + 1) / 2);
    const tw = 0.5 + 0.5 * Math.sin(t * (1.2 + 2.0 * hash(i, 1.1)) + TAU * hash(i, 2.2));
    const sp = Math.pow(tw, 4);
    dots.push({ x: px, y: py, z, r: (rBase * 0.5 + rDepth * depth * 0.5 + 1.8 * sp) * rs, white: 0.6 - 0.5 * sp, a: Math.min(1, (0.2 + 0.8 * sp) * (0.5 + 0.5 * depth)) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** swarming: a flock that drifts as one, every member on its own loop */
function frameSwarm(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.85;
  const pt = makeProj(t * 0.1, 0.3, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 60);
  const rBase = o.rBase ?? 1.0, rDepth = o.rDepth ?? 1.5;
  const dots = [];
  for (let k = 0; k < 3; k++) {
    const tt = t - 0.07 * k;
    const ccx = 0.28 * R * Math.sin(tt * 0.5), ccy = 0.2 * R * Math.sin(tt * 0.7 + 1), ccz = 0.2 * R * Math.sin(tt * 0.4 + 2);
    for (let i = 0; i < n; i++) {
      const ph = TAU * hash(i, 1.7), w = 0.8 + 1.6 * hash(i, 2.9), am = (0.2 + 0.4 * hash(i, 4.3)) * R;
      const [px, py, z] = pt(ccx + am * Math.sin(w * tt + ph), ccy + am * Math.sin(w * 1.3 * tt + ph * 2), ccz + am * Math.cos(w * 0.8 * tt + ph * 3));
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.6 + 0.7 * hash(i, 5.5)) * (1 - 0.3 * k), white: 0.55 - 0.45 * depth, a: Math.min(1, (0.5 + 0.5 * depth) * (1 - 0.35 * k)) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** swinging: Newton's cradle */
function frameCradle(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0.3, 0.2, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = N(o.latRings, 4), lonDensity = o.lonDensity ?? 9;
  const rBase = o.rBase ?? 1.0, rDepth = o.rDepth ?? 1.6;
  const rho = R * 0.19, yTop = 0.82 * R, L = 1.05 * R, A = 0.75;
  const s = Math.sin(t * 2.6);
  const dots = [];
  for (let k = 0; k < 5; k++) {
    const th = k === 0 ? -A * Math.max(0, s) : k === 4 ? A * Math.max(0, -s) : 0;
    const pivx = (k - 2) * 2 * rho, bx = pivx + L * Math.sin(th), by = yTop - L * Math.cos(th);
    for (let j = 1; j <= 8; j++) {
      const f = j / 9;
      const [px, py, z] = pt(pivx + (bx - pivx) * f, yTop + (by - yTop) * f, 0);
      dots.push({ x: px, y: py, z, r: rBase * 0.55 * rs, white: 0.5, a: 0.55 });
    }
    for (let li = 0; li <= latRings; li++) {
      const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
      const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
      const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = (lj / lonCount) * TAU;
        const vx = cosLat * Math.cos(lon), vy = sinLat, vz = cosLat * Math.sin(lon);
        const [px, py, z] = pt(bx + vx * rho, by + vy * rho, vz * rho);
        const depth = clamp01((vz + 1) / 2);
        dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.5 - 0.4 * depth, a: Math.min(1, 0.6 + 0.4 * depth) });
      }
    }
  }
  for (let j = 0; j <= 12; j++) {
    const [px, py, z] = pt((j / 12 - 0.5) * 11 * rho, yTop, 0);
    dots.push({ x: px, y: py, z, r: rBase * 0.8 * rs, white: 0.2, a: 0.9 });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** bouncing: a dotted ball squashes on the ground and leaves a shadow */
function frameBounce(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0, 0.3, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = N(o.latRings, 7), lonDensity = o.lonDensity ?? 16;
  const rBase = o.rBase ?? 0.9, rDepth = o.rDepth ?? 1.6;
  const rho = R * 0.3, ground = -0.82 * R;
  const h = Math.abs(Math.sin(t * 2.4));
  const sqz = smoothE(clamp01(1 - h / 0.14));
  const sq = 1 - 0.28 * sqz, wide = 1 + 0.16 * sqz;
  const cyb = ground + rho * sq + h * 1.2 * R;
  const yaw = t * 1.2, cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const dots = [];
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * TAU, rad = rho * (1.1 - 0.4 * h);
    const [px, py, z] = pt(Math.cos(a) * rad, ground, Math.sin(a) * rad);
    dots.push({ x: px, y: py, z, r: rBase * 0.7 * rs, white: 0.5, a: 0.5 * (1 - h) });
  }
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
    const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * TAU;
      const vx0 = cosLat * Math.cos(lon), vy = sinLat, vz0 = cosLat * Math.sin(lon);
      const vx = vx0 * cyw + vz0 * syw, vz = -vx0 * syw + vz0 * cyw;
      const [px, py, z] = pt(vx * rho * wide, cyb + vy * rho * sq, vz * rho * wide);
      const depth = clamp01((vz + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.62 - 0.52 * depth, a: 1 });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** juggling: three balls in a cascade between two hands */
function frameJuggle(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0, 0.2, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = N(o.latRings, 3), lonDensity = o.lonDensity ?? 7;
  const rBase = o.rBase ?? 1.1, rDepth = o.rDepth ?? 1.6;
  const xh = 0.5 * R, yh = -0.55 * R, Hh = 1.15 * R, rho = R * 0.17;
  const ballAt = (tt, i) => {
    const p = frac(tt * 0.5 + i / 3) * 2;
    const leg = p < 1 ? 0 : 1, q = leg ? p - 1 : p;
    return [leg ? xh - 2 * xh * q : -xh + 2 * xh * q, yh + Hh * 4 * q * (1 - q)];
  };
  const dots = [];
  for (const sx of [-1, 1]) {
    const [px, py, z] = pt(sx * xh, yh - 0.1 * R, 0);
    dots.push({ x: px, y: py, z, r: rBase * 1.4 * rs, white: 0.3, a: 0.6 });
  }
  for (let i = 0; i < 3; i++) {
    for (let k = 1; k <= 3; k++) {
      const [bx, by] = ballAt(t - 0.05 * k, i);
      const [px, py, z] = pt(bx, by, 0);
      dots.push({ x: px, y: py, z, r: rBase * (1 - 0.2 * k) * rs, white: 0.5, a: 0.5 * (1 - 0.25 * k) });
    }
    const [bx, by] = ballAt(t, i);
    for (let li = 0; li <= latRings; li++) {
      const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
      const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
      const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = (lj / lonCount) * TAU;
        const vx = cosLat * Math.cos(lon), vy = sinLat, vz = cosLat * Math.sin(lon);
        const [px, py, z] = pt(bx + vx * rho, by + vy * rho, vz * rho);
        const depth = clamp01((vz + 1) / 2);
        dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.4 - 0.3 * depth, a: 1 });
      }
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** swirling: a vortex funnel, particles spiral down faster as they near the tip */
function frameSwirl(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.86;
  const pt = makeProj(0, 0.35, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 240);
  const rBase = o.rBase ?? 1.0, rDepth = o.rDepth ?? 1.5;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const s = frac(hash(i, 1.1) + t * 0.12);
    const rho = R * 0.9 * Math.pow(1 - s, 0.8) + 0.04 * R;
    const th = hash(i, 2.2) * TAU + s * 7 + t * 1.6 * (1 + 2 * s);
    const [px, py, z] = pt(Math.cos(th) * rho, R * 0.85 * (1 - 2 * s), Math.sin(th) * rho);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.5 + 0.8 * (1 - s)), white: 0.55 - 0.45 * depth, a: Math.min(1, Math.min(1, s * 6) * Math.min(1, (1 - s) * 8) * (0.4 + 0.6 * depth)) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** equalizing: audio bars made of dots */
function frameEqualizer(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0.3 * Math.sin(t * 0.4), 0.12, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const C = N(o.lanes, 9, 2), S = N(o.segs, 10, 2);
  const rBase = o.rBase ?? 1.6, rDepth = o.rDepth ?? 1.4;
  const gx = (1.7 * R) / (C - 1), gy = (1.6 * R) / (S - 1);
  const dots = [];
  for (let c = 0; c < C; c++) {
    const prod = (0.5 + 0.5 * Math.sin(t * (1.8 + 0.43 * c) + c * 1.9)) * (0.55 + 0.45 * Math.sin(t * 2.9 + c * 0.7));
    const lvl = 0.12 + 0.88 * prod;
    const pk = Math.min(S - 1, Math.floor(lvl * S) + 1);
    for (let r = 0; r < S; r++) {
      const lit = (r + 0.5) / S <= lvl;
      const [px, py, z] = pt((c - (C - 1) / 2) * gx, (r - (S - 1) / 2) * gy, 0);
      const depth = clamp01((z / R + 1) / 2);
      if (lit) dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.1 + 0.35 * (r / S), a: 0.95 });
      else if (r === pk) dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * 0.9, white: 0.1, a: 0.8 });
      else dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * 0.35, white: 0.7, a: 0.18 });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** reading: lines of dotted text, a highlight reads down the page */
function frameReader(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0.45, 0.18, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const rowsN = N(o.lanes, 8, 2), cols = N(o.segs, 20, 2);
  const rBase = o.rBase ?? 1.4, rDepth = o.rDepth ?? 1.2;
  const f = frac(t * 0.18) * (rowsN + 1) - 0.5;
  const dots = [];
  for (let r = 0; r < rowsN; r++) {
    const len = 0.35 + 0.6 * hash(r, 3.3);
    const glow = Math.exp(-Math.pow((r - f) / 0.9, 2));
    for (let s = 0; s < cols; s++) {
      if (s / (cols - 1) > len || hash(r * 37 + s, 5.1) <= 0.17) continue;
      const [px, py, z] = pt((s / (cols - 1) - 0.5) * 1.5 * R, (0.8 - (1.6 * r) / (rowsN - 1)) * R, 0);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth * 0.5) * rs * (0.7 + 0.5 * glow), white: 0.5 - 0.4 * glow, a: Math.min(1, 0.45 + 0.55 * glow) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** drawing: a pen draws a looping curve in dots, then lets it fade */
function frameDraw(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.85;
  const pt = makeProj(t * 0.15, 0.3, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 120);
  const rBase = o.rBase ?? 1.2, rDepth = o.rDepth ?? 1.6;
  const p = frac(t / 5) * 1.15;
  const fade = p > 1 ? Math.max(0, 1 - (p - 1) / 0.15) : 1;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const u = i / n;
    if (u > p) continue;
    const th = u * TAU;
    const [px, py, z] = pt(0.85 * R * Math.sin(3 * th + 0.6), 0.7 * R * Math.sin(2 * th), 0.3 * R * Math.sin(th));
    const depth = clamp01((z / R + 1) / 2);
    const head = Math.exp(-((p - u) / 0.05) * 2);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.7 + 1.3 * head), white: 0.55 - 0.45 * depth - 0.3 * head, a: Math.min(1, (0.75 + 0.25 * depth) * fade) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** focusing: viewfinder brackets close in and lock */
function frameFocus(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0.3 * Math.sin(t * 0.5), 0.1, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const m = N(o.dotN, 8, 2);
  const rBase = o.rBase ?? 1.6, rDepth = o.rDepth ?? 1.4;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const S = R * (0.55 + 0.3 * smoothE(pulse));
  const lock = Math.exp(-Math.pow(pulse / 0.12, 2));
  const arm = 0.3 * R;
  const dots = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (let i = 0; i < m; i++) {
        const d = (i / (m - 1)) * arm;
        for (const [x, y] of [[sx * (S - d), sy * S], [sx * S, sy * (S - d)]]) {
          const [px, py, z] = pt(x, y, 0);
          const depth = clamp01((z / R + 1) / 2);
          dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.8 + 0.5 * lock), white: 0.3 - 0.2 * lock, a: Math.min(1, 0.7 + 0.3 * lock) });
        }
      }
    }
  }
  for (let k = -2; k <= 2; k++) {
    for (const [x, y] of [[k * 0.05 * R, 0], [0, k * 0.05 * R]]) {
      const [px, py, z] = pt(x, y, 0);
      dots.push({ x: px, y: py, z, r: rBase * 0.5 * rs * (1 + lock), white: 0.4 - 0.3 * lock, a: 0.5 + 0.5 * lock });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** streaming: packets of data run along parallel rails */
function frameStream(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0.5, 0.35, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const Ln = N(o.lanes, 3, 2), segs = N(o.segs, 18, 2);
  const rBase = o.rBase ?? 1.4, rDepth = o.rDepth ?? 1.5;
  const dots = [];
  for (let l = 0; l < Ln; l++) {
    const yy = (l - (Ln - 1) / 2) * 0.36 * R, zz = (l - (Ln - 1) / 2) * -0.35 * R;
    const dir = l % 2 === 0 ? 1 : -1, sp = 0.22 + 0.1 * l;
    for (let j = 0; j < segs; j++) {
      const [px, py, z] = pt((j / (segs - 1) * 2 - 1) * 0.9 * R, yy, zz);
      dots.push({ x: px, y: py, z, r: rBase * 0.45 * rs, white: 0.7, a: 0.22 });
    }
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 3; k++) {
        const u = frac(frac(i / 3 + t * sp) - 0.03 * k);
        const [px, py, z] = pt((u * 2 - 1) * 0.9 * R * dir, yy, zz);
        const depth = clamp01((z / R + 1) / 2);
        dots.push({ x: px, y: py, z, r: (rBase * 1.3 + rDepth * depth * 0.5) * rs * (1 - 0.2 * k), white: 0.1 + 0.1 * k, a: Math.min(1, 1 - 0.3 * k) });
      }
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** ticking: a clock face, the second hand steps, the minute hand creeps */
function frameClock(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.88;
  const pt = makeProj(0.35 * Math.sin(t * 0.4), 0.1, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 60, 12);
  const rBase = o.rBase ?? 1.2, rDepth = o.rDepth ?? 1.4;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, big = i % Math.max(1, Math.round(n / 12)) === 0;
    const [px, py, z] = pt(Math.sin(a) * R, Math.cos(a) * R, 0);
    const depth = clamp01((z / R + 1) / 2);
    dots.push({ x: px, y: py, z, r: (rBase * (big ? 1.5 : 0.6) + rDepth * 0.3 * depth) * rs, white: big ? 0.15 : 0.6, a: big ? 1 : 0.5 });
  }
  const sec = (Math.floor(t) + smoothE(clamp01(frac(t) / 0.25))) * (TAU / 12);
  const min = (t * TAU) / 72;
  for (const [ang, len, cnt, w, rr] of [[sec, 0.82, 9, 0.1, 1.0], [min, 0.55, 6, 0.3, 1.3]]) {
    for (let i = 1; i <= cnt; i++) {
      const d = (i / cnt) * len * R;
      const [px, py, z] = pt(Math.sin(ang) * d, Math.cos(ang) * d, 0.02 * R);
      dots.push({ x: px, y: py, z, r: rBase * rr * rs, white: w, a: 1 });
    }
  }
  {
    const [px, py, z] = pt(0, 0, 0.03 * R);
    dots.push({ x: px, y: py, z, r: rBase * 1.6 * rs, white: 0.05, a: 1 });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** waiting: an hourglass, the sand runs, then it turns over */
function frameGlass(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.88;
  const pt = makeProj(0.5, 0.2, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const K = N(o.latRings, 9, 2), lonDensity = o.lonDensity ?? 22;
  const rBase = o.rBase ?? 1.0, rDepth = o.rDepth ?? 1.5;
  const Hh = R * 0.9, Rb = R * 0.5;
  const u = frac(t / 5);
  const p = u < 0.88 ? u / 0.88 : 1;
  const rot = u < 0.88 ? 0 : Math.PI * smoothE((u - 0.88) / 0.12);
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const tr = (x, y, z) => pt(x * cr - y * sr, x * sr + y * cr, z);
  const dots = [];
  for (const half of [1, -1]) {
    for (let k = 0; k <= K; k++) {
      const f = k / K;
      const rho = Rb * (0.12 + 0.88 * Math.pow(f, 1.3));
      const y = half * Hh * f;
      const m = Math.max(3, jsRound(rho * lonDensity / Rb));
      const sand = half > 0 ? (k + 0.5) / (K + 1) <= 1 - p : (K - k + 0.5) / (K + 1) <= p;
      for (let j = 0; j < m; j++) {
        const a = ((j + (k % 2) * 0.5) / m) * TAU;
        const [px, py, z] = tr(Math.cos(a) * rho, y, Math.sin(a) * rho);
        const depth = clamp01((z / R + 1) / 2);
        if (sand) dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.3 - 0.2 * depth, a: 0.95 });
        else dots.push({ x: px, y: py, z, r: rBase * 0.6 * rs, white: 0.55, a: 0.38 });
      }
    }
  }
  if (p > 0 && p < 1) {
    for (let i = 0; i < 4; i++) {
      const q = frac(t * 1.5 + i / 4);
      const [px, py, z] = tr(0, Hh * 0.08 - q * Hh * 0.7, 0);
      dots.push({ x: px, y: py, z, r: rBase * 0.9 * rs, white: 0.2, a: 0.9 * (1 - q * 0.5) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** flipping: a dotted coin is tossed and turns in the air */
function frameCoin(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0, 0.5, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const rings = N(o.ringN, 5), n = N(o.dotN, 60);
  const rBase = o.rBase ?? 1.1, rDepth = o.rDepth ?? 1.6;
  const Rc = R * 0.42, th = R * 0.04, ground = -0.7 * R;
  const u = frac(t / 1.6);
  const h = Math.sin(u * Math.PI);
  const phi = TAU * u * 3;
  const cp = Math.cos(phi), sp = Math.sin(phi);
  const yc = ground + R * 0.12 + h * 0.9 * R;
  const dots = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU, rad = Rc * (1.05 - 0.3 * h);
    const [px, py, z] = pt(Math.cos(a) * rad, ground, Math.sin(a) * rad);
    dots.push({ x: px, y: py, z, r: rBase * 0.6 * rs, white: 0.5, a: 0.5 * (1 - h) });
  }
  const place = (x, y, z) => pt(x, yc + y * cp - z * sp, y * sp + z * cp);
  for (const side of [1, -1]) {
    for (let l = 1; l <= rings; l++) {
      const rr = (l / rings) * Rc;
      const m = Math.max(3, jsRound((n * l) / (rings * (rings + 1) / 2) * 1.0));
      for (let j = 0; j < m; j++) {
        const a = (j / m) * TAU + (side > 0 ? 0 : 0.5);
        const [px, py, z] = place(Math.cos(a) * rr, side * th, Math.sin(a) * rr);
        const depth = clamp01((z / R + 1) / 2);
        dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (side > 0 ? 1 : 0.8), white: side > 0 ? 0.15 + 0.1 * depth : 0.45 - 0.2 * depth, a: 1 });
      }
    }
  }
  for (let j = 0; j < 28; j++) {
    const a = (j / 28) * TAU;
    for (const side of [-1, 0, 1]) {
      const [px, py, z] = place(Math.cos(a) * Rc, side * th, Math.sin(a) * Rc);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase * 0.7 + rDepth * 0.3 * depth) * rs, white: 0.3, a: 0.8 });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** rolling: a dotted ball rolls back and forth along the ground */
function frameRoll(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0, 0.35, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const latRings = N(o.latRings, 7), lonDensity = o.lonDensity ?? 16, g = N(o.dotN, 20, 2);
  const rBase = o.rBase ?? 0.9, rDepth = o.rDepth ?? 1.6;
  const rho = 0.3 * R, ground = -0.4 * R;
  const bx = 0.55 * R * Math.sin(t * 0.9);
  const ang = -bx / rho, ca = Math.cos(ang), sa = Math.sin(ang);
  const dots = [];
  for (let j = 0; j < g; j++) {
    const [px, py, z] = pt((j / (g - 1) * 2 - 1) * 0.95 * R, ground - rho, 0);
    dots.push({ x: px, y: py, z, r: rBase * 0.5 * rs, white: 0.7, a: 0.25 });
  }
  for (let li = 0; li <= latRings; li++) {
    const lat = -Math.PI / 2 + (li / latRings) * Math.PI;
    const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
    const lonCount = Math.max(1, jsRound(Math.abs(cosLat) * lonDensity));
    for (let lj = 0; lj < lonCount; lj++) {
      const lon = (lj / lonCount) * TAU;
      const vx0 = cosLat * Math.cos(lon), vy0 = sinLat, vz = cosLat * Math.sin(lon);
      const vx = vx0 * ca - vy0 * sa, vy = vx0 * sa + vy0 * ca;
      const [px, py, z] = pt(bx + vx * rho, ground + vy * rho, vz * rho);
      const depth = clamp01((vz + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: 0.62 - 0.52 * depth - (vx0 > 0.9 ? 0.2 : 0), a: 1 });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** blooming: layered petals open and close */
function frameBloom(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.88;
  const pt = makeProj(0, 0.8, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const layers = N(o.ringN, 4), n = N(o.dotN, 64);
  const rBase = o.rBase ?? 1.5, rDepth = o.rDepth ?? 1.6;
  const open = 0.5 + 0.5 * Math.sin(t * 1.1);
  const dots = [];
  for (let l = 0; l < layers; l++) {
    const sc = (l + 1) / layers;
    const m = Math.max(8, jsRound(n * sc));
    const off = l * 0.4 + t * 0.12 * (l % 2 === 0 ? 1 : -1);
    for (let j = 0; j < m; j++) {
      const th = (j / m) * TAU;
      const petal = Math.pow(Math.abs(Math.cos(2.5 * (th - off))), 0.8);
      const rho = R * sc * (0.22 + 0.78 * petal * (0.3 + 0.7 * open));
      const lift = 0.35 * R * sc * sc * open;
      const [px, py, z] = pt(Math.cos(th) * rho, lift, Math.sin(th) * rho);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.6 + 0.5 * sc), white: 0.5 - 0.4 * sc * depth - 0.1 * (1 - sc), a: Math.min(1, 0.5 + 0.5 * sc) });
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** knotting: a trefoil knot with a runner of light */
function frameKnot(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.88;
  const pt = makeProj(t * 0.4, 0.5 + 0.2 * Math.sin(t * 0.3), cx, cy, R / 3.2);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 160);
  const rBase = o.rBase ?? 1.3, rDepth = o.rDepth ?? 1.8;
  const head = t * 1.1;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const u = (i / n) * TAU;
    const [px, py, z] = pt(Math.sin(u) + 2 * Math.sin(2 * u), Math.cos(u) - 2 * Math.cos(2 * u), -Math.sin(3 * u));
    const depth = clamp01((z / 3 + 1) / 2);
    const glow = Math.exp(-frac((head - u) / TAU) * 6);
    dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (0.7 + 0.8 * glow), white: 0.6 - 0.4 * depth - 0.2 * glow, a: Math.min(1, (0.55 + 0.45 * depth) * (0.7 + 0.3 * glow)) });
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** sequencing: a double helix of dots, rungs between the strands */
function frameDna(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.9;
  const pt = makeProj(0, 0.25, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 36, 2);
  const rBase = o.rBase ?? 1.4, rDepth = o.rDepth ?? 1.8;
  const rho = 0.38 * R;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const y = (i / (n - 1) * 2 - 1) * 0.9 * R;
    const th = (i / n) * 2 * TAU + t * 1.4;
    const ax = Math.cos(th) * rho, az = Math.sin(th) * rho;
    for (const [sgn, w] of [[1, 0.2], [-1, 0.5]]) {
      const [px, py, z] = pt(ax * sgn, y, az * sgn);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs, white: w - 0.15 * depth, a: Math.min(1, 0.55 + 0.45 * depth) });
    }
    if (i % 2 === 0) {
      for (let k = 1; k <= 3; k++) {
        const f = k / 4;
        const [px, py, z] = pt(ax * (1 - 2 * f), y, az * (1 - 2 * f));
        const depth = clamp01((z / R + 1) / 2);
        dots.push({ x: px, y: py, z, r: rBase * 0.45 * rs, white: 0.6, a: 0.4 * (0.5 + 0.5 * depth) });
      }
    }
  }
  return finalizeFrame(dots, [], o.rMin);
}

/** bursting: fireworks, a burst of dots that fall and fade, then the next one */
function frameBurst(size, t, o) {
  const cx = size / 2, cy = size / 2, R = (size / 2) * 0.88;
  const T = 2.6;
  const burst = Math.floor(t / T), u = frac(t / T);
  const pt = makeProj(burst * 1.3 + t * 0.1, 0.3, cx, cy, 1);
  const rs = radiusScale(size, o.rsPow ?? 0.6);
  const n = N(o.dotN, 120);
  const rBase = o.rBase ?? 1.2, rDepth = o.rDepth ?? 1.6;
  const ease = (x) => (1 - Math.exp(-x * 4)) / (1 - Math.exp(-4));
  const dots = [];
  for (let k = 0; k < 2; k++) {
    const uu = u - 0.04 * k;
    if (uu < 0) continue;
    for (let i = 0; i < n; i++) {
      const [dx, dy, dz] = fibDir(i, n);
      const sp = 0.55 + 0.45 * hash(i, 1.9);
      const rad = R * 0.95 * sp * ease(uu);
      const [px, py, z] = pt(dx * rad, dy * rad - 0.25 * R * uu * uu, dz * rad);
      const depth = clamp01((z / R + 1) / 2);
      dots.push({ x: px, y: py, z, r: (rBase + rDepth * depth) * rs * (1 - 0.6 * uu) * (1 - 0.3 * k), white: 0.5 - 0.4 * depth - 0.1 * (1 - uu), a: Math.min(1, (1 - uu) * 1.3 * Math.min(1, uu * 40) * (1 - 0.4 * k)) });
    }
  }
  if (u < 0.15) {
    const [px, py, z] = pt(0, 0, 0);
    dots.push({ x: px, y: py, z, r: (rBase * 2.5) * rs * (1 - u / 0.15), white: 0.02, a: 1 - u / 0.15 });
  }
  return finalizeFrame(dots, [], o.rMin);
}

export const MORE_FRAMES = {
  blink: frameBlink, heart: frameHeart, bubble: frameBubble, rain: frameRain, broadcast: frameBroadcast, twinkle: frameTwinkle, swarm: frameSwarm,
  cradle: frameCradle, bounce: frameBounce, juggle: frameJuggle, swirl: frameSwirl, equalizer: frameEqualizer, reader: frameReader, draw: frameDraw,
  focus: frameFocus, stream: frameStream, clock: frameClock, glass: frameGlass, coin: frameCoin, roll: frameRoll, bloom: frameBloom, knot: frameKnot,
  dna: frameDna, burst: frameBurst,
};
