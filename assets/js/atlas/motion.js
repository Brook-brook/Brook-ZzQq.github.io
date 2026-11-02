const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const active = new Set();
function animate(element, frames, options) {
  if (reduce.matches || !element.animate) return;
  const animation = element.animate(frames, options);
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => active.delete(animation));
}
const targets = [
  ...document.querySelectorAll(
    '.title-line, main h1:not(:has(.title-line)), .campus-kicker, .campus-intro, .campus-path, .section-heading, .campus-place, .fields > a, .note-row'
  )
];
if (
  'IntersectionObserver' in window &&
  !reduce.matches &&
  !document.body.classList.contains('campus-app')
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = targets.indexOf(entry.target);
        animate(
          entry.target,
          [
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          {
            duration: 560,
            delay: (index % 3) * 65,
            easing: 'cubic-bezier(.22,1,.36,1)',
            fill: 'backwards'
          }
        );
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.06 }
  );
  targets.forEach((target) => observer.observe(target));
}
const responsive = [];
for (const element of document.querySelectorAll(
  '.js-magnetic, .motion-card, .field'
)) {
  let frame, bounds;
  const magnetic = element.classList.contains('js-magnetic');
  function reset() {
    cancelAnimationFrame(frame);
    element.style.removeProperty('--mx');
    element.style.removeProperty('--my');
    element.style.removeProperty('--rx');
    element.style.removeProperty('--ry');
    element.style.removeProperty('--spot-x');
    element.style.removeProperty('--spot-y');
  }
  responsive.push(reset);
  element.addEventListener('pointerenter', () => {
    bounds = element.getBoundingClientRect();
  });
  element.addEventListener('pointermove', (event) => {
    if (reduce.matches || !fine.matches || event.pointerType !== 'mouse')
      return;
    bounds ||= element.getBoundingClientRect();
    const x = Math.max(
        0,
        Math.min(1, (event.clientX - bounds.left) / bounds.width)
      ),
      y = Math.max(
        0,
        Math.min(1, (event.clientY - bounds.top) / bounds.height)
      );
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      element.style.setProperty('--spot-x', `${x * 100}%`);
      element.style.setProperty('--spot-y', `${y * 100}%`);
      if (magnetic) {
        element.style.setProperty('--mx', `${(x - 0.5) * 8}px`);
        element.style.setProperty('--my', `${(y - 0.5) * 8}px`);
      } else {
        element.style.setProperty('--rx', `${(0.5 - y) * 4}deg`);
        element.style.setProperty('--ry', `${(x - 0.5) * 4}deg`);
      }
    });
  });
  element.addEventListener('pointerleave', reset);
  element.addEventListener('pointercancel', reset);
}
// Native cross-document View Transitions keep link semantics and browser history.
// Unsupported browsers use their normal navigation; no navigation is intercepted.
reduce.addEventListener('change', () => {
  if (reduce.matches) {
    active.forEach((animation) => animation.cancel());
    responsive.forEach((reset) => reset());
  }
});
fine.addEventListener('change', () => {
  if (!fine.matches) responsive.forEach((reset) => reset());
});

// One real navigation indicator; native links remain responsible for navigation.
const dock = document.getElementById('primary-nav');
const indicator = dock?.querySelector('.dock-indicator');
if (indicator) {
  let last;
  function pointTo(link, animated = true) {
    if (!link || !dock.clientWidth || !fine.matches) return;
    const next = `translateX(${link.offsetLeft}px) scaleX(${link.offsetWidth / 100})`;
    indicator.hidden = false;
    if (last && animated && !reduce.matches)
      animate(indicator, [{ transform: last }, { transform: next }], {
        duration: 320,
        easing: 'cubic-bezier(.22,1,.36,1)'
      });
    indicator.style.transform = next;
    last = next;
  }
  const current = () => pointTo(dock.querySelector('[aria-current]'));
  dock.querySelectorAll('a').forEach((link) => {
    link.addEventListener('pointerenter', () => pointTo(link));
    link.addEventListener('focus', () => pointTo(link));
  });
  dock.addEventListener('pointerleave', current);
  dock.addEventListener('focusout', (event) => {
    if (!dock.contains(event.relatedTarget)) current();
  });
  new ResizeObserver(() =>
    pointTo(dock.querySelector('[aria-current]'), false)
  ).observe(dock);
  document.fonts.ready.then(current);
}
