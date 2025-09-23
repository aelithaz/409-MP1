// helpers
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

// Smooth scrolling for anchors
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href && href.startsWith('#')) {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const nav = qs('#nav');
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;
      const top = window.scrollY + target.getBoundingClientRect().top - navHeight + 6;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
});

// Reveal on scroll
const reveals = qsa('.reveal');
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.12 });
reveals.forEach(r => io.observe(r));

// Navbar resizing + position indicator
const navWrap = qs('#nav');
const menu = qs('#menu');
let menuLinks = [];
let sections = [];

function gatherMenu() {
  menuLinks = menu ? qsa('#menu a') : [];
  sections = menuLinks.map(a => document.querySelector(a.getAttribute('href')));
}
gatherMenu();

// update nav indicator / active menu
function updateNav() {
  const scrollY = window.scrollY;
  if (scrollY > 40) { navWrap.classList.add('nav-small'); navWrap.classList.remove('nav-large'); }
  else { navWrap.classList.add('nav-large'); navWrap.classList.remove('nav-small'); }

  const navBottom = navWrap.getBoundingClientRect().bottom;
  let activeIndex = 0;

  // bottom-of-page case -> last item active
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
    activeIndex = sections.length - 1;
  } else {
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec) continue;
      const rect = sec.getBoundingClientRect();
      if (rect.top <= navBottom && rect.bottom > navBottom) { activeIndex = i; break; }
    }
  }

  menuLinks.forEach((a, i) => a.classList.toggle('active', i === activeIndex));

  // move indicator below active link
  const navIndicator = qs('#navIndicator');
  if (!navIndicator || !menuLinks.length) return;

  const activeLink = menuLinks[activeIndex];
  const menuRect = menu.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  navIndicator.style.width = Math.max(8, linkRect.width - 8) + 'px';
  const left = (linkRect.left - menuRect.left) + 4;
  navIndicator.style.transform = `translateX(${left}px)`;
}

// re-gather on resize (useful if layout changes)
window.addEventListener('resize', () => {
  gatherMenu();
  updateNav();
});
window.addEventListener('scroll', updateNav);
setTimeout(updateNav, 120);

// ---------------- Carousel ----------------
(function () {
  const slidesEl = qs('#slides');
  const slides = qsa('.slide');
  const prev = qs('#prev');
  const next = qs('#next');
  const dotsWrap = qs('#dots');
  if (!slidesEl || !slides.length) return;
  let idx = 0;

  function renderDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const d = document.createElement('div'); d.className = 'dot' + (i === idx ? ' active' : '');
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
    });
  }
  function go(i) {
    idx = (i + slides.length) % slides.length;
    slidesEl.style.transform = `translateX(${ -idx * 100 }%)`;
    renderDots();
  }
  if (prev) prev.addEventListener('click', () => go(idx - 1));
  if (next) next.addEventListener('click', () => go(idx + 1));
  document.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });

  let autoplay = setInterval(() => go(idx + 1), 5000);
  [prev, next, slidesEl].forEach(el => {
    if (!el) return;
    el.addEventListener('mouseenter', () => clearInterval(autoplay));
    el.addEventListener('mouseleave', () => autoplay = setInterval(() => go(idx + 1), 5000));
  });

  renderDots(); go(0);
})();

// ---------------- Modal & forms ----------------
const openModalBtn = qs('#openModal');
const modal = qs('#modal');
const closeModalBtn = qs('#closeModal');
if (openModalBtn) openModalBtn.addEventListener('click', () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); });
if (closeModalBtn) closeModalBtn.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('open'); });

// newsletter demo
const newsForm = qs('#newsletter');
if (newsForm) {
  newsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsForm.email ? newsForm.email.value.trim() : (newsForm.querySelector('input') ? newsForm.querySelector('input').value.trim() : '');
    if (!email) { alert('Please enter email'); return; }
    alert('Thanks — demo saved: ' + email);
    newsForm.reset();
    modal.classList.remove('open');
  });
}

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

// ensure nav indicator correct after fonts/layout changes
window.addEventListener('load', () => { gatherMenu(); updateNav(); });
