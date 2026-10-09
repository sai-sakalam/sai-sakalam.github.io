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
  '.mini-card, .exp-card, .tl-card, .explore-item, .flow-step, .stack-item, .connect-card, .chip, .win-card, .paper-card, .terminal, .oss-side, .kg-demo'
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

// ── Small helpers ────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg || 'Copied ✓'); }
  catch (e) { toast('Could not copy — please select it manually'); }
}

// ── Theme toggle (light / dark) ──────────────────────────────────
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('theme', t); } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'light' ? '#f7f8fc' : '#080c14');
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  setTheme(cur === 'light' ? 'dark' : 'light');
}
document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

// ── T-RKG demo: siloed vs composed ───────────────────────────────
(function () {
  const svg = document.getElementById('kg-svg');
  const verdict = document.getElementById('kg-verdict');
  const btns = document.querySelectorAll('#kg-demo .seg button');
  if (!svg) return;
  const copy = {
    siloed:   ['ok',  '0 conflicts', 'Each system checks only its own rules, so everything looks fine.'],
    composed: ['bad', '1 conflict',  'Linked in one graph, the same person appears in both: SOX says keep, GDPR says erase.']
  };
  let touched = false;
  function show(view) {
    svg.classList.toggle('composed', view === 'composed');
    btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    const [cls, pill, text] = copy[view];
    verdict.className = 'kg-verdict ' + cls;
    verdict.innerHTML = `<span class="pill">${pill}</span><span>${text}</span>`;
  }
  btns.forEach(b => b.addEventListener('click', () => { touched = true; show(b.dataset.view); }));
  // Auto-reveal once when the demo scrolls into view (unless the visitor already clicked)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        setTimeout(() => { if (!touched) show('composed'); }, 1400);
      }
    }, { threshold: 0.5 }).observe(svg);
  }
})();

// ── Live pyfirstaid numbers (PyPI + GitHub, both allow browser requests) ──
(function () {
  const set = (key, val) => document.querySelectorAll(`[data-live="${key}"]`).forEach(el => (el.textContent = val));
  const ago = d => {
    const days = Math.floor((Date.now() - d.getTime()) / 864e5);
    if (days < 1) return 'today';
    if (days < 31) return days + 'd ago';
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };
  fetch('https://pypi.org/pypi/pyfirstaid/json')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(j => {
      const v = j.info.version;
      set('version', 'v' + v);
      set('version-inline', ' v' + v);
      const files = j.releases?.[v] || [];
      const t = files.length ? files[0].upload_time_iso_8601 || files[0].upload_time : null;
      if (t) set('released', ago(new Date(t)));
    })
    .catch(() => {
      // Can't reach PyPI (offline / blocked): hide the live box rather than show half-empty numbers
      document.getElementById('live-stats')?.setAttribute('hidden', '');
      document.querySelector('.live-caption')?.setAttribute('hidden', '');
    });
  fetch('https://api.github.com/repos/sai-sakalam/pyfirstaid')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(j => set('stars', '★ ' + j.stargazers_count))
    .catch(() => set('stars', '—'));
})();

// ── ⌘K command palette ───────────────────────────────────────────
(function () {
  const wrap = document.getElementById('cmdk');
  const input = document.getElementById('cmdk-input');
  const list = document.getElementById('cmdk-list');
  if (!wrap) return;
  const go = id => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const open = url => () => window.open(url, '_blank', 'noopener');
  const bib = () => document.getElementById('bibtex-trkg')?.textContent.trim() || '';
  const items = [
    { g: 'Jump to', ic: '👤', t: 'About me',          k: 'about bio',                  run: go('about') },
    { g: 'Jump to', ic: '📄', t: 'Research — T-RKG paper', k: 'paper research ieee publication', run: go('research') },
    { g: 'Jump to', ic: '🩹', t: 'Open source — pyfirstaid', k: 'pyfirstaid package oss python', run: go('opensource') },
    { g: 'Jump to', ic: '🧭', t: 'Journey / timeline', k: 'experience career timeline',  run: go('journey') },
    { g: 'Jump to', ic: '✉️', t: 'Connect',            k: 'contact connect',            run: go('connect') },
    { g: 'Open',    ic: '🎓', t: 'Read T-RKG on IEEE Xplore', k: 'paper ieee xplore doi read', h: '↗', run: open('https://ieeexplore.ieee.org/document/11675805') },
    { g: 'Open',    ic: '🧪', t: 'T-RKG code & experiments', k: 'code repo github trkg reproduce', h: '↗', run: open('https://github.com/kpulagam/T-RKG') },
    { g: 'Open',    ic: '📦', t: 'pyfirstaid on PyPI',  k: 'pypi pip package',            h: '↗', run: open('https://pypi.org/project/pyfirstaid/') },
    { g: 'Open',    ic: '🐙', t: 'pyfirstaid on GitHub', k: 'github repo source',          h: '↗', run: open('https://github.com/sai-sakalam/pyfirstaid') },
    { g: 'Open',    ic: '💼', t: 'LinkedIn',            k: 'linkedin profile',            h: '↗', run: open('https://www.linkedin.com/in/sai-sakalam/') },
    { g: 'Open',    ic: '🐙', t: 'GitHub profile',      k: 'github profile',              h: '↗', run: open('https://github.com/sai-sakalam') },
    { g: 'Do',      ic: '📋', t: 'Copy: pip install pyfirstaid', k: 'pip install copy',    run: () => copyText('pip install pyfirstaid', 'Install command copied ✓') },
    { g: 'Do',      ic: '📚', t: 'Copy T-RKG BibTeX',   k: 'bibtex cite citation copy',   run: () => copyText(bib(), 'BibTeX copied ✓') },
    { g: 'Do',      ic: '✉️', t: 'Copy email address',  k: 'email mail copy',             run: () => copyText('ssaigavaskar@hotmail.com', 'Email copied ✓') },
    { g: 'Do',      ic: '🌗', t: 'Switch light / dark theme', k: 'theme dark light mode', run: toggleTheme },
  ];
  let shown = [], sel = 0, lastFocus = null;

  function render() {
    const q = input.value.trim().toLowerCase();
    shown = items.filter(i => !q || (i.t + ' ' + i.k).toLowerCase().split(/\s+/).some(w => w.startsWith(q)) || (i.t + ' ' + i.k).toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(shown.length - 1, 0));
    if (!shown.length) { list.innerHTML = '<li class="empty">No match. Try “paper”, “pip” or “email”.</li>'; return; }
    let html = '', grp = '';
    shown.forEach((i, n) => {
      if (i.g !== grp) { grp = i.g; html += `<li class="group" role="presentation">${grp}</li>`; }
      html += `<li role="option" id="cmdk-${n}" data-n="${n}" aria-selected="${n === sel}"><span class="ic">${i.ic}</span>${i.t}${i.h ? `<span class="hint">${i.h}</span>` : ''}</li>`;
    });
    list.innerHTML = html;
    input.setAttribute('aria-activedescendant', 'cmdk-' + sel);
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  function show() {
    lastFocus = document.activeElement;
    wrap.classList.add('open'); wrap.setAttribute('aria-hidden', 'false');
    input.value = ''; sel = 0; render();
    setTimeout(() => input.focus(), 10);
  }
  function hide() {
    wrap.classList.remove('open'); wrap.setAttribute('aria-hidden', 'true');
    lastFocus?.focus?.();
  }
  function run(n) { const i = shown[n]; if (!i) return; hide(); setTimeout(i.run, 60); }

  document.getElementById('cmdk-open')?.addEventListener('click', show);
  document.addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName) && document.activeElement !== input;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); wrap.classList.contains('open') ? hide() : show(); return; }
    if (e.key === '/' && !typing && !wrap.classList.contains('open')) { e.preventDefault(); show(); return; }
    if (!wrap.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
  });
  input.addEventListener('input', () => { sel = 0; render(); });
  list.addEventListener('click', e => { const li = e.target.closest('[data-n]'); if (li) run(+li.dataset.n); });
  list.addEventListener('mousemove', e => { const li = e.target.closest('[data-n]'); if (li && +li.dataset.n !== sel) { sel = +li.dataset.n; render(); } });
  wrap.addEventListener('click', e => { if (e.target === wrap) hide(); });

  // Show ⌃K instead of ⌘K on non-Mac machines
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    const kbd = document.querySelector('#cmdk-open kbd'); if (kbd) kbd.textContent = 'Ctrl K';
  }
})();
