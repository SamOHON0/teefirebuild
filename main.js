/* TEE Fire Safety Solutions — shared interactive behaviours
   Sections:
   1. Scroll progress bar
   2. Nav scroll state + mobile menu
   3. IntersectionObserver reveals (stagger aware)
   4. Hero slideshow (homepage only)
   5. Products tab-nav scroll spy
   6. Projects filter chips
   7. Count-up on in-view numbers
   8. Smooth anchor scroll
   9. FAQ accordion (native details behaviour enhanced)
*/

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doc = document.documentElement;

  /* ---------- 1. Scroll progress bar ---------- */
  function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    let ticking = false;
    function update() {
      const h = doc.scrollHeight - doc.clientHeight;
      const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.transform = 'scaleX(' + (pct / 100) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------- 2. Nav scroll + mobile menu ---------- */
  function initNav() {
    const nav = document.querySelector('nav.site-nav');
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > 24) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const toggle = nav.querySelector('.nav-toggle');
    const menu = nav.querySelector('.nav-links');
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ---------- 3. IntersectionObserver reveals ---------- */
  function initReveals() {
    const items = document.querySelectorAll('[data-reveal], [data-stagger]');
    if (!items.length) return;
    if (prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Hero slideshow ---------- */
  function initHero() {
    const hero = document.querySelector('.hero-slideshow');
    if (!hero) return;
    const slides = Array.from(hero.querySelectorAll('.hero-slide'));
    const dots = Array.from(document.querySelectorAll('.hero-indicators .dot'));
    if (slides.length < 2) return;

    let i = 0;
    let timer = null;

    function go(n) {
      slides[i].classList.remove('active');
      if (dots[i]) dots[i].classList.remove('active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('active');
      if (dots[i]) dots[i].classList.add('active');
    }

    function start() {
      stop();
      timer = window.setInterval(function () { go(i + 1); }, 5000);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    dots.forEach(function (d, idx) {
      d.addEventListener('click', function () { go(idx); start(); });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);

    slides[0].classList.add('active');
    if (dots[0]) dots[0].classList.add('active');
    if (!prefersReducedMotion) start();
  }

  /* ---------- 5. Products tab scroll-spy ---------- */
  function initProductsTabs() {
    const nav = document.querySelector('.tab-nav');
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    const targets = links.map(function (l) {
      const id = l.getAttribute('href').slice(1);
      return document.getElementById(id);
    }).filter(Boolean);

    links.forEach(function (l) {
      l.addEventListener('click', function (e) {
        const id = l.getAttribute('href').slice(1);
        const t = document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        const y = t.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- 6. Projects filter chips ---------- */
  function initProjectFilter() {
    const bar = document.querySelector('.filter-bar');
    if (!bar) return;
    const chips = bar.querySelectorAll('.filter-chip');
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('[data-sector]');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        const f = chip.getAttribute('data-filter');
        cards.forEach(function (card) {
          const s = card.getAttribute('data-sector');
          const show = f === 'all' || s === f;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------- 7. Count-up on in-view numbers ---------- */
  function initCountUp() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length || prefersReducedMotion) {
      els.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const dur = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          const rounded = target >= 100 ? Math.round(val) : (Math.round(val * 10) / 10);
          el.textContent = prefix + rounded + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = prefix + target + suffix;
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 8. Smooth anchor scroll (generic) ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]:not(.tab-nav a)').forEach(function (a) {
      a.addEventListener('click', function (e) {
        const href = a.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const t = document.querySelector(href);
        if (!t) return;
        e.preventDefault();
        const y = t.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- 9. Year stamp ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function boot() {
    initScrollProgress();
    initNav();
    initReveals();
    initHero();
    initProductsTabs();
    initProjectFilter();
    initCountUp();
    initAnchors();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
