// The page's own motion: hero intro, the living "o", the dot field, the scrubbed run through all 48 states, reveals and counters.
// GSAP is the animation system, Lenis the only smooth-scroll engine. Reduced motion gets the final, static states instead.
import { STATES, ADDED_STATES, makeStyle, hexToRgb, swiftCode } from './dotsphere.js';
import { OrbCanvas, reduced, DPR, startLoop } from './orbs.js';
import { TAGS } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger, Lenis = window.Lenis;
const motion = !reduced && !!gsap && !!ScrollTrigger;
const ACCENT = hexToRgb('#4f8cff');
const cleanups = [];

function init() {
  startLoop();
  navState();
  copyButtons();
  heroOrb();
  dotField();
  ink();
  beyond();
  if (!motion) { scrub(null); return; }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('scrubbing');
  const lenis = smoothScroll();
  heroIntro();
  scrub(lenis);
  splitHeadings();
  reveals();
  counters();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  addEventListener('pagehide', () => {
    cleanups.forEach((f) => f());
    ScrollTrigger.getAll().forEach((t) => t.kill());
    lenis?.destroy();
  }, { once: true });
}

/* ------------------------------------------------------------------ navigation and scroll */
function navState() {
  const bar = $('#top-bar');
  const on = () => bar.classList.toggle('solid', scrollY > 24);
  on(); addEventListener('scroll', on, { passive: true });
}

function smoothScroll() {
  if (!Lenis) return null;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  cleanups.push(() => gsap.ticker.remove(tick));
  // in-page links and "go to the demo" requests from the demo script
  const go = (hash) => { const el = $(hash); if (el) lenis.scrollTo(el, { offset: hash === '#top' ? 0 : -8 }); };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const el = $(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault(); go(a.getAttribute('href')); history.replaceState(null, '', a.getAttribute('href'));
  });
  document.addEventListener('dotsphere:goto', (e) => go(e.detail));
  window.__lenis = lenis;
  return lenis;
}
if (!window.__gotoBound) {
  window.__gotoBound = true;
  document.addEventListener('dotsphere:goto', (e) => { if (!window.__lenis) $(e.detail)?.scrollIntoView({ behavior: 'auto', block: 'start' }); });
}

/* ------------------------------------------------------------------ copy */
function copyButtons() {
  for (const b of $$('[data-copy-text]')) {
    b.addEventListener('click', async () => {
      const old = b.textContent;
      try { await navigator.clipboard.writeText(b.dataset.copyText); b.textContent = 'Copied'; } catch { b.textContent = 'Copy failed'; }
      setTimeout(() => { b.textContent = old; }, 1400);
    });
  }
}

/* ------------------------------------------------------------------ the living "o" */
const heroState = { i: 0, speed: 1, tint: false };
let heroOrbCanvas = null;
let dotRipple = () => {};

function styleFor(state, size, speed = 1, tinted = false) {
  // bolder than the tuned look: the o has to hold its own next to 17vw letters
  return makeStyle({ state, size, speed, dots: 1.35, dotSize: 1.9, palette: tinted ? { kind: 'tint', color: ACCENT } : { kind: 'mono' } });
}

function heroOrb() {
  const wrap = $('#hero-o'), canvas = $('#hero-o-canvas');
  if (!wrap || !canvas) return;
  const measure = () => Math.max(40, Math.round(canvas.getBoundingClientRect().width || 120));
  const orb = new OrbCanvas(canvas, measure());
  heroOrbCanvas = orb;
  const apply = () => { orb.set(styleFor(STATES[heroState.i], orb.size, heroState.speed), true); };
  apply(); wrap.classList.add('ready');
  new ResizeObserver(() => { const s = measure(); if (s !== orb.size) { orb.resize(s); apply(); } }).observe(wrap);

  const name = $('#tick-name'), count = $('#tick-count');
  const show = (animate) => {
    const label = STATES[heroState.i];
    count.textContent = `${String(heroState.i + 1).padStart(2, '0')} / 48`;
    if (animate && motion) {
      gsap.fromTo(name, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
    }
    name.textContent = label;
  };
  show(false);
  const next = (step = 1) => {
    heroState.i = (heroState.i + step + 48) % 48;
    apply(); show(true); dotRipple();
  };

  // tap the o: next state. Hold anywhere on the hero: time runs three times faster.
  wrap.addEventListener('click', () => next());
  const hero = $('#hero');
  const faster = (on) => { heroState.speed = on ? 3 : 1; apply(); };
  hero.addEventListener('pointerdown', (e) => { if (!e.target.closest('a,button')) faster(true); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) hero.addEventListener(ev, () => faster(false));
  addEventListener('blur', () => faster(false));

  // the o glances toward the pointer (fine pointers only, additive)
  if (motion && matchMedia('(pointer: fine)').matches) {
    const qx = gsap.quickTo(wrap, 'x', { duration: 0.8, ease: 'power3.out' });
    const qy = gsap.quickTo(wrap, 'y', { duration: 0.8, ease: 'power3.out' });
    const move = (e) => {
      const r = wrap.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 600) * 10;
      qx((dx / d) * k); qy((dy / d) * k);
    };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', () => { qx(0); qy(0); });
  }

  // cycle on its own while the hero is on screen
  if (motion) {
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    const timer = setInterval(() => { if (visible && !document.hidden) next(); }, 3000);
    cleanups.push(() => clearInterval(timer));
  }
}

/* ------------------------------------------------------------------ the dot field behind the hero */
function dotField() {
  const cv = $('#dotfield'); if (!cv) return;
  const ctx = cv.getContext('2d'), hero = $('#hero');
  const GAP = 30;
  let w = 0, h = 0, ptr = { x: -999, y: -999, on: false }, smooth = { x: -999, y: -999 };
  const ripples = [];
  let raf = 0, idleSince = 0;

  const resize = () => {
    w = hero.clientWidth; h = hero.clientHeight;
    cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
    draw(performance.now());
  };
  const draw = (now) => {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const orbEl = $('#hero-o'); const ob = orbEl?.getBoundingClientRect(), hb = hero.getBoundingClientRect();
    const ox = ob ? ob.left + ob.width / 2 - hb.left : w / 2, oy = ob ? ob.top + ob.height / 2 - hb.top : h / 2;
    for (let y = GAP / 2; y < h; y += GAP) {
      for (let x = GAP / 2; x < w; x += GAP) {
        let a = 0.12, r = 1.05;
        if (ptr.on) {
          const d = Math.hypot(x - smooth.x, y - smooth.y);
          if (d < 190) { const k = 1 - d / 190; a += 0.7 * k * k; r += 1.7 * k * k; }
        }
        for (const rp of ripples) {
          const age = (now - rp.t) / 1000, front = age * 520;
          const d = Math.abs(Math.hypot(x - ox, y - oy) - front);
          if (d < 70) { const k = (1 - d / 70) * Math.max(0, 1 - age / 1.6); a += 0.55 * k; r += 1.3 * k; }
        }
        ctx.fillStyle = `rgba(150,185,255,${Math.min(1, a)})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      }
    }
  };
  const loop = (now) => {
    smooth.x += (ptr.x - smooth.x) * 0.18; smooth.y += (ptr.y - smooth.y) * 0.18;
    while (ripples.length && now - ripples[0].t > 1700) ripples.shift();
    draw(now);
    const settled = Math.hypot(ptr.x - smooth.x, ptr.y - smooth.y) < 0.5;
    if (!ripples.length && (!ptr.on || settled) && now - idleSince > 400) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
  };
  const wake = () => { idleSince = performance.now(); if (!raf && !document.hidden) raf = requestAnimationFrame(loop); };

  new ResizeObserver(resize).observe(hero);
  resize();
  if (!motion) return;
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    if (!ptr.on) { smooth.x = e.clientX - r.left; smooth.y = e.clientY - r.top; }
    ptr = { x: e.clientX - r.left, y: e.clientY - r.top, on: true }; wake();
  });
  hero.addEventListener('pointerleave', () => { ptr.on = false; wake(); });
  addEventListener('blur', () => { ptr.on = false; wake(); });
  dotRipple = () => { ripples.push({ t: performance.now() }); wake(); };
  cleanups.push(() => cancelAnimationFrame(raf));
}

/* ------------------------------------------------------------------ hero intro */
function heroIntro() {
  const letters = $$('.wordmark .ch > span');
  const rest = ['.kicker', '.hero-row', '.hero-actions', '.hero-foot', '.top'];
  gsap.set(letters, { yPercent: 112 });
  gsap.set(rest.map((s) => $(s)), { opacity: 0, y: 18 });
  root.classList.add('ui');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
  tl.to(letters, { yPercent: 0, duration: 1.25, stagger: 0.055 })
    .to($('.kicker'), { opacity: 1, y: 0, duration: 0.8 }, 0.1)
    .to($('.top'), { opacity: 1, y: 0, duration: 0.8 }, 0.2)
    .to($('.hero-row'), { opacity: 1, y: 0, duration: 0.9 }, 0.55)
    .to($('.hero-actions'), { opacity: 1, y: 0, duration: 0.9 }, 0.7)
    .to($('.hero-foot'), { opacity: 1, y: 0, duration: 0.9 }, 0.85)
    .add(() => dotRipple(), 0.5);
}

/* ------------------------------------------------------------------ the scrubbed run through all 48 */
function scrub(lenis) {
  const section = $('#states'); if (!section) return;
  const canvas = $('#scrub-canvas'), orbWrap = canvas.parentElement;
  const nameEl = $('#scrub-name'), tagEl = $('#scrub-tag'), originEl = $('#scrub-origin'), codeEl = $('#scrub-code code'), countEl = $('#scrub-count');
  const btns = $$('#scrub-index button'), fill = $('#scrub-bar-fill');
  const measure = () => Math.max(120, Math.round(orbWrap.clientWidth));
  const orb = new OrbCanvas(canvas, measure());
  let cur = -1;

  const set = (i, animate) => {
    if (i === cur) return;
    cur = i;
    const s = STATES[i], added = ADDED_STATES.includes(s);
    const style = makeStyle({ state: s, size: orb.size, speed: 1, palette: added ? { kind: 'tint', color: ACCENT } : { kind: 'mono' } });
    orb.set(style, true);
    nameEl.textContent = s; tagEl.textContent = TAGS[s];
    originEl.textContent = added ? 'new in Dotsphere' : 'from thinking-orbs'; originEl.classList.toggle('new', added);
    codeEl.textContent = `DotOrb(state: .${s}, size: 64${added ? ', color: .blue' : ''})`;
    countEl.textContent = `${String(i + 1).padStart(2, '0')} / 48`;
    btns.forEach((b, k) => { const on = k === i; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    if (animate && motion) gsap.fromTo(nameEl, { yPercent: 55, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
  };
  new ResizeObserver(() => { const s = measure(); if (s !== orb.size) { orb.resize(s); const c = cur; cur = -1; set(c < 0 ? 0 : c, false); } }).observe(orbWrap);
  set(0, false);

  if (motion) {
    ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        set(Math.min(47, Math.floor(self.progress * 48)), true);
        fill.style.transform = `scaleX(${self.progress})`;
      },
    });
    btns.forEach((b, i) => b.addEventListener('click', () => {
      const top = section.getBoundingClientRect().top + scrollY;
      const y = top + ((i + 0.5) / 48) * (section.offsetHeight - innerHeight);
      if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else scrollTo(0, y);
    }));
  } else {
    btns.forEach((b, i) => b.addEventListener('click', () => set(i, false)));
  }
}

/* ------------------------------------------------------------------ ink and beyond-the-view */
function ink() {
  for (const cv of $$('.ink-orb')) {
    const kind = cv.dataset.palette;
    const light = kind === 'gradient';
    const palette = kind === 'tint' ? { kind: 'tint', color: hexToRgb('#0071e3') }
      : light ? { kind: 'gradient', near: hexToRgb('#1d3fd6'), far: hexToRgb('#f0652a') } : { kind: 'mono' };
    const orb = new OrbCanvas(cv, 240);
    orb.set(makeStyle({ state: 'rippling', size: 240, speed: 1, palette }), !light);
  }
}

function beyond() {
  const blue = { kind: 'tint', color: hexToRgb('#0071e3') };
  const mk = (id, size, state, extra = {}) => {
    const cv = $(id); if (!cv) return;
    const orb = new OrbCanvas(cv, size);
    orb.set(makeStyle({ state, size, palette: blue, ...extra }), true);
  };
  mk('#car-orb', 190, 'connecting', { speed: 2, dots: 2.2, dotSize: 1.2, opts: { thr: 0.52, lineW: 1.9 } });
  mk('#pill-orb', 28, 'searching', { speed: 1.4 });
  mk('#widget-orb', 76, 'charging');
}

/* ------------------------------------------------------------------ reveals */
function splitHeadings() {
  for (const el of $$('[data-split]')) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    for (const word of text.split(/\s+/)) {
      const w = document.createElement('span'); w.className = 'word'; w.setAttribute('aria-hidden', 'true');
      const i = document.createElement('span'); i.textContent = word; w.append(i); el.append(w, ' ');
    }
    gsap.from($$('.word > span', el), {
      yPercent: 115, duration: 1, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  }
}

function reveals() {
  const groups = ['.sub', '.steps li', '.grid', '.triptych figure', '.mock', '.install > div', '.faq details', '.credits p', '.finale .hero-actions', '.made', '.stats > div'];
  for (const sel of groups) {
    for (const el of $$(sel)) {
      gsap.from(el, { opacity: 0, y: 32, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    }
  }
}

function counters() {
  for (const el of $$('[data-count]')) {
    const end = Number(el.dataset.count), o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); } }),
    });
    el.textContent = '0';
  }
}

try { init(); } finally { root.classList.add('ui'); }
