import { STATES, ADDED_STATES, makeStyle, styleFrame, paintFrame, hexToRgb, swiftCode } from './dotsphere.js';

const $ = (sel, root = document) => root.querySelector(sel);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const ACCENT = '#4f8cff';

const TAGS = {
  working: 'particles on tilted orbits', searching: 'a scan meridian sweeps a globe', solving: 'bands scramble, then click back',
  listening: 'a waveform rolls through rings', connecting: 'a constellation wires itself', weaving: 'three strands plait',
  composing: 'an undulating sash', breathing: 'a ring slowly morphing', shaping: 'circle, triangle, square',
  pulsing: 'sonar rings from a beating core', scanning: 'a sweep crosses a dotted disc', charging: 'a sphere fills from the bottom',
  orbiting: 'a comet circles a planet', rippling: 'waves cross a dotted sphere', spinning: 'the classic spinner', syncing: 'three rings, like a gyroscope',
  uploading: 'light runs up the column', downloading: 'light runs down the column', typing: 'three bouncing spheres', recording: 'a beating core, glints on the rim',
  spiraling: 'a small galaxy', progressing: 'a ring that fills, then empties', waving: 'a dotted sheet like a flag', transforming: 'sphere to cube and back',
  blinking: 'an eye that looks and blinks', heartbeat: 'an ECG trace of dots', bubbling: 'bubbles rise in a column', raining: 'drops fall and splash',
  broadcasting: 'signal arcs pulse outward', twinkling: 'a turning starfield', swarming: 'a flock drifts as one', swinging: "Newton's cradle",
  bouncing: 'a ball squashes and bounces', juggling: 'three balls in a cascade', swirling: 'a vortex funnel', equalizing: 'audio bars of dots',
  reading: 'a highlight reads the page', drawing: 'a pen draws a curve', focusing: 'viewfinder brackets lock on', streaming: 'packets run along rails',
  ticking: 'a clock face, stepping', waiting: 'an hourglass turns over', flipping: 'a coin toss', rolling: 'a ball rolls along',
  blooming: 'petals open and close', knotting: 'a trefoil knot', sequencing: 'a double helix', bursting: 'fireworks',
};
const LABELS = {
  working: 'Working…', searching: 'Searching…', solving: 'Solving…', listening: 'Listening…', connecting: 'Connecting…',
  weaving: 'Weaving…', composing: 'Composing…', breathing: 'Thinking…', shaping: 'Shaping…', pulsing: 'Pulsing…', scanning: 'Scanning…', charging: 'Charging…',
  orbiting: 'Orbiting…', rippling: 'Rippling…', spinning: 'Loading…', syncing: 'Syncing…', uploading: 'Uploading…', downloading: 'Downloading…', typing: 'Typing…',
  recording: 'Recording…', spiraling: 'Spiraling…', progressing: 'In progress…', waving: 'Waving…', transforming: 'Transforming…',
  blinking: 'Blinking…', heartbeat: 'Heartbeat…', bubbling: 'Bubbling…', raining: 'Raining…', broadcasting: 'Broadcasting…', twinkling: 'Twinkling…',
  swarming: 'Swarming…', swinging: 'Swinging…', bouncing: 'Bouncing…', juggling: 'Juggling…', swirling: 'Swirling…', equalizing: 'Equalizing…',
  reading: 'Reading…', drawing: 'Drawing…', focusing: 'Focusing…', streaming: 'Streaming…', ticking: 'Ticking…', waiting: 'Waiting…',
  flipping: 'Flipping…', rolling: 'Rolling…', blooming: 'Blooming…', knotting: 'Knotting…', sequencing: 'Sequencing…', bursting: 'Bursting…',
};

// ---------------------------------------------------------------------------------------------------------------------
// Orbs on canvases. One animation loop, one shared clock, drawing only what is on screen.
const orbs = new Set();
const io = new IntersectionObserver((entries) => {
  for (const e of entries) { const o = e.target.__orb; if (o) { o.visible = e.isIntersecting; o.dirty = true; } }
});

class OrbCanvas {
  constructor(canvas, size) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.visible = true; this.dirty = true; this.dark = true; this.style = null;
    canvas.__orb = this; this.resize(size);
    orbs.add(this); io.observe(canvas);
  }
  resize(size) {
    this.size = size;
    this.canvas.width = Math.round(size * DPR); this.canvas.height = Math.round(size * DPR);
    this.canvas.style.width = size + 'px'; this.canvas.style.height = size + 'px';
    this.dirty = true;
  }
  set(style, dark) { this.style = style; this.dark = dark; this.dirty = true; }
  draw(seconds) {
    if (!this.style) return;
    const { ctx } = this;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, this.size, this.size);
    paintFrame(ctx, styleFrame(this.style, seconds), this.style.palette, this.dark);
    this.dirty = false;
  }
}

const clock = () => performance.now() / 1000;
function tick() {
  if (!document.hidden) {
    const t = clock();
    for (const o of orbs) {
      if (!o.visible) continue;
      if (reduced) { if (o.dirty) o.draw(0.6 / (o.style?.resolved.speed * o.style?.speed || 1)); } else o.draw(t);
    }
  }
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------------------------------------------------
// Demo state
const DEFAULTS = { state: 'connecting', dark: true, palette: 'tint', near: '#0071e3', far: '#e659bf', speed: 2, dots: 2.2, dotSize: 1.2, size: 150, thr: 0.52, lineW: 1.9 };
const S = { ...DEFAULTS };

const palette = () =>
  S.palette === 'gradient' ? { kind: 'gradient', near: hexToRgb(S.near), far: hexToRgb(S.far) }
  : S.palette === 'tint' ? { kind: 'tint', color: hexToRgb(S.near) } : { kind: 'mono' };
const optsFor = (state) => (state === 'connecting' ? { thr: S.thr, lineW: S.lineW } : {});
const styleFor = (size) => makeStyle({ state: S.state, size, speed: S.speed, dots: S.dots, dotSize: S.dotSize, opts: optsFor(S.state), palette: palette() });

const stage = new OrbCanvas($('#orb-stage'), S.size);
const chat = new OrbCanvas($('#orb-chat'), 20);
const brand = new OrbCanvas($('#brand-orb'), 28);
brand.set(makeStyle({ state: 'searching', size: 28, speed: 1, palette: { kind: 'mono' } }), true);

// ---------------------------------------------------------------------------------------------------------------------
// Controls
const chipsEl = $('#state-chips');
const stateButtons = STATES.map((s) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip' + (ADDED_STATES.includes(s) ? ' new' : ''); b.textContent = s;
  b.addEventListener('click', () => { S.state = s; apply(); });
  chipsEl.append(b); return b;
});

function segment(root, items, key) {
  const btns = items.map(([value, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.addEventListener('click', () => { S[key] = value; apply(); });
    root.append(b); return [value, b];
  });
  return () => btns.forEach(([v, b]) => b.setAttribute('aria-pressed', String(S[key] === v)));
}
const syncTheme = segment($('#seg-theme'), [[true, 'Dark'], [false, 'Light']], 'dark');
const syncPalette = segment($('#seg-palette'), [['mono', 'Mono'], ['tint', 'Tint'], ['gradient', 'Gradient']], 'palette');

const sliderSpecs = [
  ['speed', 'speed', 0.25, 4, 0.05], ['dots', 'dots', 0.2, 3, 0.05], ['dotSize', 'dotSize', 0.4, 3, 0.05], ['size', 'size', 20, 150, 1],
  ['thr', 'thr', 0.2, 1.2, 0.01, 'connecting'], ['lineW', 'lineW', 0.3, 4, 0.05, 'connecting'],
];
const sliderRows = sliderSpecs.map(([key, label, min, max, step, only]) => {
  const row = document.createElement('div'); row.className = 'row';
  const l = document.createElement('span'); l.textContent = label;
  const input = document.createElement('input'); input.type = 'range'; input.min = min; input.max = max; input.step = step; input.setAttribute('aria-label', label);
  const out = document.createElement('span');
  input.addEventListener('input', () => { S[key] = Number(input.value); apply(); });
  row.append(l, input, out); $('#sliders').append(row);
  return { key, row, input, out, only, step };
});

$('#c-near').addEventListener('input', (e) => { S.near = e.target.value; apply(); });
$('#c-far').addEventListener('input', (e) => { S.far = e.target.value; apply(); });

const PRESETS = [
  ['Original', { palette: 'mono', speed: 1, dots: 1, dotSize: 1, thr: 0.72, lineW: 0.8 }],
  ['Leadwolf CarPlay', { state: 'connecting', dark: true, palette: 'tint', near: '#0071e3', speed: 2, dots: 2.2, dotSize: 1.2, thr: 0.52, lineW: 1.9, size: 150 }],
  ['Calm', { palette: 'gradient', near: '#7aa7ff', far: '#b69cff', speed: 0.6, dots: 1, dotSize: 1, thr: 0.72, lineW: 0.8 }],
  ['Dense', { palette: 'tint', near: ACCENT, speed: 1.3, dots: 3, dotSize: 0.7, thr: 0.6, lineW: 0.8 }],
];
for (const [name, patch] of PRESETS) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = name;
  b.addEventListener('click', () => { Object.assign(S, patch); apply(); });
  $('#preset-chips').append(b);
}

const device = $('#device');
const screenApp = $('#screen-app'), screenTune = $('#screen-tune');
const codeMini = $('#code-mini code');

function apply() {
  const dark = S.dark;
  screenApp.classList.toggle('dark', dark); screenApp.classList.toggle('light', !dark);
  screenTune.classList.toggle('dark', dark); screenTune.classList.toggle('light', !dark);

  if (stage.size !== S.size) stage.resize(S.size);
  stage.set(styleFor(S.size), dark);
  chat.set(styleFor(20), dark);

  $('#app-sub').textContent = `${S.state} · ${Math.round(S.size)} pt`;
  $('#chat-label').textContent = LABELS[S.state];
  stateButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === S.state)));
  document.querySelectorAll('.card').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.state === S.state)));
  syncTheme(); syncPalette();

  for (const r of sliderRows) {
    r.row.hidden = !!r.only && r.only !== S.state;
    r.input.value = S[r.key];
    r.out.textContent = r.key === 'size' ? String(Math.round(S[r.key])) : Number(S[r.key]).toFixed(2);
  }
  $('#colors').hidden = S.palette === 'mono';
  $('#far-wrap').hidden = S.palette !== 'gradient';
  $('#c-near').value = S.near; $('#c-far').value = S.far;

  codeMini.textContent = swiftCode(styleFor(S.size), dark);
}

// ---------------------------------------------------------------------------------------------------------------------
// The phone: fold, tune sheet, scaling to fit
const fit = $('#device-fit'), stageEl = $('#stage');
const DEVICE_H = 640;
function layout() {
  const open = device.classList.contains('open');
  const dw = open ? 580 : 300;
  const k = Math.min(1, (stageEl.clientWidth || dw) / dw);
  device.style.transform = `scale(${k})`;
  fit.style.height = Math.round(DEVICE_H * k) + 'px';
  screenTune.inert = !open && !device.classList.contains('sheet');
}
new ResizeObserver(layout).observe(stageEl);

const foldBtn = $('#fold');
foldBtn.addEventListener('click', () => {
  const open = device.classList.toggle('open');
  device.classList.remove('sheet');
  foldBtn.setAttribute('aria-pressed', String(open));
  foldBtn.textContent = open ? 'Fold' : 'Unfold';
  layout();
});
$('#tune-open').addEventListener('click', () => { device.classList.add('sheet'); layout(); });
$('#tune-close').addEventListener('click', () => { device.classList.remove('sheet'); layout(); });

// ---------------------------------------------------------------------------------------------------------------------
// The scripted agent run
const playBtn = $('#play'), answer = $('#answer');
const RUN = [
  [0, 'listening'], [2400, 'searching'], [4800, 'connecting'], [7200, 'working'], [9600, 'composing'],
];
let running = false;
playBtn.addEventListener('click', () => {
  if (running) return;
  running = true; playBtn.disabled = true; answer.hidden = true; playBtn.textContent = 'Running…';
  for (const [at, state] of RUN) setTimeout(() => { S.state = state; apply(); }, at);
  setTimeout(() => {
    answer.textContent = 'Found one: a quiet loop around the lake, 38 minutes, mostly side roads.';
    answer.hidden = false; $('#chat-label').textContent = 'Done.';
    running = false; playBtn.disabled = false; playBtn.textContent = 'Play again';
  }, 12000);
});

// ---------------------------------------------------------------------------------------------------------------------
// The gallery of all states
const grid = $('#grid');
for (const s of STATES) {
  const card = document.createElement('button');
  card.type = 'button'; card.className = 'card'; card.dataset.state = s;
  const cv = document.createElement('canvas');
  const name = document.createElement('div'); name.className = 'name'; name.textContent = s;
  if (ADDED_STATES.includes(s)) { const n = document.createElement('span'); n.className = 'new'; n.textContent = 'new'; name.append(' ', n); }
  const tag = document.createElement('div'); tag.className = 'tag'; tag.textContent = TAGS[s];
  card.append(cv, name, tag); grid.append(card);
  const orb = new OrbCanvas(cv, 96);
  orb.set(makeStyle({ state: s, size: 96, speed: 1, palette: ADDED_STATES.includes(s) ? { kind: 'tint', color: hexToRgb(ACCENT) } : { kind: 'mono' } }), true);
  card.addEventListener('click', () => { S.state = s; apply(); $('#demo').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); });
}

// ---------------------------------------------------------------------------------------------------------------------
// Copy buttons
async function copy(text, btn) {
  const old = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; } catch { btn.textContent = 'Select and copy'; }
  setTimeout(() => { btn.textContent = old; }, 1400);
}
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copy($('#' + b.dataset.copy).textContent, b)));
$('#copy-code').addEventListener('click', (e) => copy(codeMini.textContent, e.currentTarget));

apply(); layout();
requestAnimationFrame(tick);
