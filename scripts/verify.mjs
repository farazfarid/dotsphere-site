// Checks the web engine against (1) the original's golden vectors for the nine original states and
// (2) the Swift package's output for all twelve states, both sizes and a tuned style. Run: node scripts/verify.mjs
import { readFileSync } from 'node:fs';
import { resolve, frameAt, ORIGINAL_STATES } from '../site/assets/js/dotsphere.js';

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const golden = load('./orbs-golden.json');
const swift = load('./swift-reference.json');
const TOL = 1e-4;
let bad = 0, values = 0, worst = 0;
const fail = (m) => { bad++; if (bad < 25) console.log('FAIL', m); };

function compareOpts(key, mine, want) {
  for (const k of new Set([...Object.keys(mine), ...Object.keys(want)])) {
    if (Math.abs((mine[k] ?? NaN) - (want[k] ?? NaN)) > 1e-9) fail(`${key}.${k}: ${mine[k]} vs ${want[k]}`);
  }
}

// every reference dot must match exactly one of mine (identical-z dots may swap places through rounding), and mine must be z-sorted
function compareFrame(key, frame, wantDots, wantLines) {
  if (frame.dots.length * 6 !== wantDots.length || frame.lines.length * 7 !== wantLines.length) {
    return fail(`${key}: ${frame.dots.length} dots/${frame.lines.length} lines vs ${wantDots.length / 6}/${wantLines.length / 7}`);
  }
  const free = frame.dots.map((_, i) => i);
  for (let i = 0; i < wantDots.length / 6; i++) {
    const w = wantDots.slice(i * 6, i * 6 + 6);
    const at = free.findIndex((j) => {
      const d = frame.dots[j];
      return [d.x, d.y, d.z, d.r, d.white, d.a ?? 1].every((v, k) => Math.abs(v - w[k]) <= TOL);
    });
    if (at < 0) { fail(`${key}: dot ${i} has no match`); break; }
    const d = frame.dots[free[at]];
    [d.x, d.y, d.z, d.r, d.white, d.a ?? 1].forEach((v, k) => { values++; worst = Math.max(worst, Math.abs(v - w[k])); });
    free.splice(at, 1);
  }
  for (let i = 1; i < frame.dots.length; i++) if (frame.dots[i].z < frame.dots[i - 1].z - 1e-12) fail(`${key}: not z-sorted at ${i}`);
  frame.lines.forEach((l, i) => [l.x1, l.y1, l.x2, l.y2, l.white, l.a ?? 1, l.w].forEach((v, k) => {
    values++; worst = Math.max(worst, Math.abs(v - wantLines[i * 7 + k]));
    if (Math.abs(v - wantLines[i * 7 + k]) > TOL) fail(`${key}: line ${i}[${k}]`);
  }));
}

// 1. the original's golden vectors
for (const [key, r] of Object.entries(golden.resolved)) {
  const [state, size] = key.split('-');
  const mine = resolve({ state, preset: Number(size) });
  if (mine.mode !== r.mode || Math.abs(mine.speed - r.speed) > 1e-9) fail(`${key}: mode/speed`);
  compareOpts(key, mine.opts, r.opts);
}
for (const c of golden.cases) {
  const r = resolve({ state: c.state, preset: c.size });
  compareFrame(c.key, frameAt(r.mode, c.size, c.t, r.opts), c.dots, c.lines ?? []);
}
console.log(`golden: ${golden.cases.length} cases`);

// 2. the Swift package
for (const c of swift.cases) {
  const tuned = c.tuned
    ? { dots: 2.2, dotSize: 1.2, opts: c.state === 'connecting' ? { thr: 0.52, lineW: 1.9 } : {} }
    : {};
  const r = resolve({ state: c.state, preset: c.tuned ? 64 : c.size, ...tuned });
  const key = `swift ${c.state}-${c.size}${c.tuned ? '-tuned' : ''}-${c.t}`;
  compareOpts(key, r.opts, c.opts);
  const t = c.tuned ? c.t * r.speed * 2 : c.t;
  compareFrame(key, frameAt(r.mode, c.size, t, r.opts), c.dots, c.lines);
}
console.log(`swift: ${swift.cases.length} cases (${ORIGINAL_STATES.length} original + 3 added states, both sizes, tuned)`);
console.log(`${values} values compared, largest difference ${worst.toExponential(2)}, ${bad} failures`);
process.exit(bad ? 1 : 0);
