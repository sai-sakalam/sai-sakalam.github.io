// ── NAV scroll effect ────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile hamburger ─────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ── Intersection Observer fade-in ────────────────────────────────
const fadeEls = document.querySelectorAll(
  '.mini-card, .exp-card, .tl-card, .explore-item, .flow-step, .stack-item, .connect-card, .chip, .win-card, .paper-card, .terminal, .oss-side'
);
fadeEls.forEach(el => el.classList.add('fade-in'));

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => io.observe(el));

// ── Smooth active nav highlight on scroll ────────────────────────
const sections = document.querySelectorAll('section[id]');
const sectionIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      document.querySelectorAll('.nav-links a').forEach(a => {
        a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--accent2)' : '';
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionIO.observe(s));

// ── Copy buttons (install command, BibTeX) ───────────────────────
document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const el = document.getElementById(btn.dataset.copy);
    if (!el) return;
    const label = btn.textContent;
    try {
      await navigator.clipboard.writeText(el.textContent.trim());
      btn.textContent = 'Copied ✓';
    } catch (e) {
      if (el.hidden) el.hidden = false;   // fallback: show it so people can select it
      btn.textContent = 'Select & copy';
    }
    setTimeout(() => (btn.textContent = label), 1800);
  });
});

// ── Terminal demo: type out pyfirstaid output when it scrolls into view ──
(function () {
  const term = document.getElementById('term-body');
  if (!term || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lines = term.innerHTML.split('\n');
  term.innerHTML = '';
  let started = false;
  const run = () => {
    let i = 0;
    const step = () => {
      if (i >= lines.length) { term.insertAdjacentHTML('beforeend', '<span class="term-cursor"></span>'); return; }
      term.insertAdjacentHTML('beforeend', lines[i] + (i < lines.length - 1 ? '\n' : ''));
      i++;
      setTimeout(step, i === 1 ? 700 : 220);
    };
    step();
  };
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting && !started) { started = true; run(); obs.disconnect(); }
  }, { threshold: 0.3 }).observe(term);
})();
