/* =============================================================
   nav.js — Shared navigation behaviour + theme toggle
   Audtheia Environmental Monitoring
   Session 7: theme toggle button added
   ============================================================= */

/* ----------------------------------------------------------
   1. Apply saved theme before first paint (runs synchronously)
   ---------------------------------------------------------- */
(function () {
  try {
    if (localStorage.getItem('audtheia-theme') === 'light') {
      document.documentElement.classList.add('theme-light');
    }
  } catch (e) { /* localStorage unavailable — silent fail */ }
}());

/* ----------------------------------------------------------
   2. DOM-ready logic
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {

  var html      = document.documentElement;
  var siteNav   = document.getElementById('site-nav');
  var navToggle = document.getElementById('nav-toggle');
  var navLinks  = document.getElementById('nav-links');

  /* ---- Mobile menu ---- */
  if (navToggle && navLinks) {

    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
      if (siteNav) { siteNav.classList.toggle('nav-menu-open', open); }
    });

    /* Close menu when any nav link is followed */
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (siteNav) { siteNav.classList.remove('nav-menu-open'); }
      });
    });

    /* Close menu on outside click */
    document.addEventListener('click', function (e) {
      if (siteNav && !siteNav.contains(e.target)) {
        navLinks.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('nav-menu-open');
      }
    });
  }

  /* ---- Scroll state ---- */
  if (siteNav) {
    function updateScroll() {
      siteNav.classList.toggle('nav-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

  /* ---- Active link highlight ---- */
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('nav-active');
    }
  });

  /* ---- Theme toggle: inject button into nav ---- */
  var navInner  = document.querySelector('.nav-inner');
  var hamburger = document.getElementById('nav-toggle');

  if (navInner) {

    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle color theme');
    btn.setAttribute('aria-pressed', String(html.classList.contains('theme-light')));

    /*
      Icon: circle split vertically — left half filled, right half stroke only,
      eight radiating rays. scaleX(-1) in CSS when light mode is active to
      invert the filled/empty halves as a visual state indicator.
    */
    btn.innerHTML =
      '<svg class="theme-icon" xmlns="http://www.w3.org/2000/svg" ' +
      'viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">' +

      /* eight rays */
      '<line x1="12" y1="2"    x2="12" y2="4.5"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="12" y1="19.5" x2="12" y2="22"   stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="2"  y1="12"   x2="4.5" y2="12"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="19.5" y1="12" x2="22" y2="12"   stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="4.93" y1="4.93"   x2="6.64"  y2="6.64"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="17.36" y1="17.36" x2="19.07" y2="19.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="19.07" y1="4.93"  x2="17.36" y2="6.64"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="6.64"  y1="17.36" x2="4.93"  y2="19.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +

      /* left half: filled solid */
      '<path d="M12 7 A5 5 0 0 0 12 17 Z" fill="currentColor"/>' +

      /* right half: stroke only (outline) */
      '<path d="M12 7 A5 5 0 0 1 12 17" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +

      '</svg>';

    /*
      DOM position: immediately before the hamburger button.
      On mobile: both theme-toggle and hamburger are visible in the top bar.
      On desktop: CSS order: 10 moves theme-toggle to the right of nav-links.
    */
    if (hamburger) {
      navInner.insertBefore(btn, hamburger);
    } else {
      navInner.appendChild(btn);
    }

    btn.addEventListener('click', function () {
      /* Start smooth colour transition across the page */
      html.classList.add('theme-transitioning');

      var nowLight = html.classList.toggle('theme-light');
      btn.setAttribute('aria-pressed', String(nowLight));

      try {
        localStorage.setItem('audtheia-theme', nowLight ? 'light' : 'dark');
      } catch (e) { /* storage unavailable */ }

      /* Remove transition class after colours have settled (0.3s + buffer) */
      setTimeout(function () {
        html.classList.remove('theme-transitioning');
      }, 350);
    });
  }
});
