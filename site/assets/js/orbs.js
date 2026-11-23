// Orbs on canvases. One animation loop, one shared clock, drawing only what is on screen. Shared by the demo and the page's own motion.
import { styleFrame, paintFrame } from './dotsphere.js';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

const orbs = new Set();
const io = new IntersectionObserver((entries) => {
  for (const e of entries) { const o = e.target.__orb; if (o) { o.visible = e.isIntersecting; o.dirty = true; } }
}, { rootMargin: '80px' });

export class OrbCanvas {
  constructor(canvas, size) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.visible = true; this.dirty = true; this.dark = true; this.style = null; this.offset = 0;
    canvas.__orb = this; this.resize(size);
    orbs.add(this); io.observe(canvas);
  }
  resize(size) {
    this.size = size;
    this.canvas.width = Math.round(size * DPR); this.canvas.height = Math.round(size * DPR);
    this.canvas.style.width = size + 'px'; this.canvas.style.height = size + 'px';
    this.dirty = true;
  }
  set(style, dark = true) { this.style = style; this.dark = dark; this.dirty = true; }
  draw(seconds) {
    if (!this.style) return;
    const { ctx } = this;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, this.size, this.size);
    paintFrame(ctx, styleFrame(this.style, seconds + this.offset), this.style.palette, this.dark);
    this.dirty = false;
  }
  destroy() { orbs.delete(this); io.unobserve(this.canvas); }
}

const clock = () => performance.now() / 1000;
let raf = 0;
function tick() {
  if (!document.hidden) {
    const t = clock();
    for (const o of orbs) {
      if (!o.visible) continue;
      if (reduced) { if (o.dirty) o.draw(0.6 / (o.style?.resolved.speed * o.style?.speed || 1)); } else o.draw(t);
    }
  }
  raf = requestAnimationFrame(tick);
}
export function startLoop() { if (!raf) raf = requestAnimationFrame(tick); }
export function stopLoop() { cancelAnimationFrame(raf); raf = 0; for (const o of orbs) io.unobserve(o.canvas); }
