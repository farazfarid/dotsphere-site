// Runs before first paint: marks the page as script-enabled and notes reduced motion, so CSS can pick the right static or animated layout.
const root = document.documentElement;
root.classList.add('js');
if (matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('rm');
// Safety net: if the page script never finishes, show everything after a moment.
setTimeout(() => root.classList.add('ui'), 2500);
