// src/js/main.js
// Updated nav click/scroll logic: prevents indicator flicker and spam-click jumps

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

// --- smooth anchor scrolling with guarded auto-scroll mode ---
let isAutoScrolling = false;
let autoScrollTimeout = null;
let autoTargetTop = 0;
let autoStartScrollY = 0;

function clearAutoScroll(interrupted = false) {
  isAutoScrolling = false;
  autoTargetTop = 0;
  autoStartScrollY = 0;
  if (autoScrollTimeout) { clearTimeout(autoScrollTimeout); autoScrollTimeout = null; }
  updateNav();
}

function startAutoScroll(targetTop) {
  isAutoScrolling = true;
  autoTargetTop = Math.round(targetTop);
  autoStartScrollY = Math.round(window.scrollY || window.pageYOffset || 0);
  if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
  autoScrollTimeout = setTimeout(() => {
    clearAutoScroll();
  }, 900);
}

// click anchors
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  const target = document.querySelector(href);
  if (!target) return;
  if (isAutoScrolling) { e.preventDefault(); return; }
  e.preventDefault();
  // immediate feedback
  setActiveLink(a);

  const nav = qs('#nav');
  const navHeight = nav ? nav.getBoundingClientRect().height : 0;
  const top = window.scrollY + target.getBoundingClientRect().top - navHeight + 6;

  startAutoScroll(top);
  window.scrollTo({ top, behavior: 'smooth' });
});

// reveal-on-scroll
const reveals = qsa('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach(ent => {
    if (ent.isIntersecting) { ent.target.classList.add('in'); io.unobserve(ent.target); }
  });
}, { threshold: 0.12 });
reveals.forEach(r => io.observe(r));

// NAV
const navWrap = qs('#nav');
const menu = qs('#menu');
let menuLinks = [];
let sections = [];

function gatherMenu() {
  menuLinks = menu ? qsa('#menu a') : [];
  sections = menuLinks.map(a => document.querySelector(a.getAttribute('href')));
}
gatherMenu();

function setActiveLink(linkEl) {
  if (!menuLinks || !menuLinks.length) return;
  menuLinks.forEach(a => a.classList.toggle('active', a === linkEl));
}

function updateNav() {
  if (!navWrap) return;
  if (isAutoScrolling) return;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  if (scrollY > 40) {
    navWrap.classList.add('nav-small');
    navWrap.classList.remove('nav-large');
  } else {
    navWrap.classList.add('nav-large');
    navWrap.classList.remove('nav-small');
  }
  const navBottom = navWrap.getBoundingClientRect().bottom;
  let activeIndex = 0;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
    activeIndex = Math.max(0, sections.length - 1);
  } else {
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec) continue;
      const rect = sec.getBoundingClientRect();
      if (rect.top <= navBottom && rect.bottom > navBottom) { activeIndex = i; break; }
    }
  }
  menuLinks.forEach((a, i) => a.classList.toggle('active', i === activeIndex));
}

if (menu) {
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (isAutoScrolling) { e.preventDefault(); return; }
    setActiveLink(a);
  });
}

window.addEventListener('scroll', () => {
  if (!isAutoScrolling) { updateNav(); return; }
  const currentY = Math.round(window.scrollY || window.pageYOffset || 0);
  if (Math.abs(currentY - autoTargetTop) <= 6) { clearAutoScroll(false); return; }
  if (Math.abs(currentY - autoStartScrollY) > 120) { clearAutoScroll(true); return; }
});

window.addEventListener('resize', () => { gatherMenu(); if (!isAutoScrolling) updateNav(); });

// Carousel
(function () {
  const slidesEl = qs('#slides');
  if (!slidesEl) return;
  const slides = qsa('.slide');
  const prev = qs('#prev'); const next = qs('#next'); const dotsWrap = qs('#dots');
  let idx = 0;
  function renderDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'dot' + (i === idx ? ' active' : '');
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
    });
  }
  function go(i) {
    idx = (i + slides.length) % slides.length;
    slidesEl.style.transform = `translateX(${-idx * 100}%)`;
    renderDots();
  }
  if (prev) prev.addEventListener('click', () => go(idx - 1));
  if (next) next.addEventListener('click', () => go(idx + 1));
  document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });

  let autoplay = setInterval(() => go(idx + 1), 5000);
  [prev, next, slidesEl].forEach(el => {
    if (!el) return;
    el.addEventListener('mouseenter', () => clearInterval(autoplay));
    el.addEventListener('mouseleave', () => autoplay = setInterval(() => go(idx + 1), 5000));
  });

  renderDots(); go(0);
})();

// Modal
const openModalBtn = qs('#openModal');
const modal = qs('#modal');
const closeModalBtn = qs('#closeModal');
if (openModalBtn) openModalBtn.addEventListener('click', () => { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); });
if (closeModalBtn) closeModalBtn.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); });
if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });

// newsletter demo
const newsForm = qs('#newsletter');
if (newsForm) newsForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = (newsForm.querySelector('input') || {}).value || '';
  if (!email) { alert('Please enter email'); return; }
  alert('Thanks — demo saved: ' + email);
  newsForm.reset(); modal.classList.remove('open');
});

// contact form demo
const contactForm = qs('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactForm.name.value.trim(), email = contactForm.email.value.trim(), msg = contactForm.message.value.trim();
    if (!name || !email || !msg) { alert('Please fill all fields.'); return; }
    qs('#formNote').textContent = `Thanks, ${name.split(' ')[0] || name}! (Demo only)`;
    contactForm.reset();
  });
  const clearBtn = qs('#clearForm');
  if (clearBtn) clearBtn.addEventListener('click', () => contactForm.reset());
}

// newsletter-card subscribe demo
const subscribeBtn = qs('#subscribeBtn');
if (subscribeBtn) {
  subscribeBtn.addEventListener('click', () => {
    const email = (qs('.newsletter-input') || {}).value || '';
    if (!email) { alert('Please enter an email'); return; }
    alert('Subscribed (demo): ' + email);
  });
}

window.addEventListener('load', () => { gatherMenu(); updateNav(); });
setTimeout(() => { gatherMenu(); updateNav(); }, 120);
