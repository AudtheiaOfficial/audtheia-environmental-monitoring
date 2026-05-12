/* =============================================================
   nav.js — Shared navigation + theme toggle
   Audtheia Environmental Monitoring
   Session 7 R2: mobile overlay menu added
   ============================================================= */

/* ----------------------------------------------------------
   1. Apply saved theme before first paint (synchronous IIFE)
   ---------------------------------------------------------- */
(function () {
  try {
    if (localStorage.getItem('audtheia-theme') === 'light') {
      document.documentElement.classList.add('theme-light');
    }
  } catch (e) { /* localStorage unavailable */ }
}());

/* ----------------------------------------------------------
   2. DOM-ready logic
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {

  var html      = document.documentElement;
  var siteNav   = document.getElementById('site-nav');
  var navToggle = document.getElementById('nav-toggle');
  var navLinks  = document.getElementById('nav-links');

  /* ---- Scroll state ---- */
  if (siteNav) {
    function updateScroll() {
      siteNav.classList.toggle('nav-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
  }

  /* ---- Active nav link (header links) ---- */
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('nav-active');
    }
  });

  /* ----------------------------------------------------------
     Mobile overlay menu
     Injected into the document on DOMContentLoaded.
     Styled entirely by Section 19 CSS. Does not depend on any
     existing dropdown behaviour from earlier CSS sections.
     ---------------------------------------------------------- */

  var overlay  = null;
  var closeBtn = null;

  if (navToggle) {

    /* Create overlay container */
    overlay           = document.createElement('div');
    overlay.id        = 'mobile-nav-overlay';
    overlay.className = 'mobile-nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role',        'dialog');
    overlay.setAttribute('aria-label',  'Navigation menu');

    /* Close (X) button */
    closeBtn           = document.createElement('button');
    closeBtn.className = 'overlay-close-btn';
    closeBtn.setAttribute('aria-label', 'Close navigation');
    closeBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" ' +
      'viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '</svg>';
    overlay.appendChild(closeBtn);

    /* Decorative accent line above the links */
    var accentLine           = document.createElement('div');
    accentLine.className     = 'overlay-accent-line';
    overlay.appendChild(accentLine);

    /* Nav links */
    var overlayNav     = document.createElement('nav');
    overlayNav.className = 'overlay-links';
    overlayNav.setAttribute('aria-label', 'Mobile navigation');

    var linkData = [
      { href: 'index.html',     label: 'Home'      },
      { href: 'demo.html',      label: 'Demo'      },
      { href: 'dashboard.html', label: 'Dashboard' },
      { href: 'setup.html',     label: 'Setup'     },
      { href: 'about.html',     label: 'About'     }
    ];

    linkData.forEach(function (item) {
      var a         = document.createElement('a');
      a.href        = item.href;
      a.textContent = item.label;
      if (item.href === page || (page === '' && item.href === 'index.html')) {
        a.classList.add('nav-active');
      }
      overlayNav.appendChild(a);
    });

    overlay.appendChild(overlayNav);

    /* Brand mark — bottom of overlay */
    var brand           = document.createElement('div');
    brand.className     = 'overlay-brand';
    brand.textContent   = 'AUDTHEIA';
    overlay.appendChild(brand);

    document.body.appendChild(overlay);

    /* --- Open / close helpers --- */
    function openOverlay() {
      overlay.classList.add('overlay-open');
      overlay.setAttribute('aria-hidden', 'false');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.classList.add('nav-toggle-open');
      document.body.classList.add('overlay-active');
    }

    function closeOverlay() {
      overlay.classList.remove('overlay-open');
      overlay.setAttribute('aria-hidden', 'true');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.classList.remove('nav-toggle-open');
      document.body.classList.remove('overlay-active');
    }

    /* Hamburger click: overlay on mobile, dropdown fallback on desktop */
    navToggle.addEventListener('click', function () {
      if (window.innerWidth <= 640) {
        if (overlay.classList.contains('overlay-open')) {
          closeOverlay();
        } else {
          openOverlay();
        }
      } else {
        /* Desktop fallback — existing dropdown logic */
        if (navLinks) {
          var open = navLinks.classList.toggle('nav-open');
          navToggle.setAttribute('aria-expanded', String(open));
          if (siteNav) siteNav.classList.toggle('nav-menu-open', open);
        }
      }
    });

    /* Close button */
    closeBtn.addEventListener('click', closeOverlay);

    /* Overlay link clicks: close then navigate */
    overlayNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeOverlay);
    });

    /* Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('overlay-open')) {
        closeOverlay();
      }
    });

    /* Backdrop click (clicking the overlay itself, not its children) */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay();
    });

    /* Resize: auto-close if screen grows beyond mobile breakpoint */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 640 && overlay.classList.contains('overlay-open')) {
        closeOverlay();
      }
    }, { passive: true });
  }

  /* ---- Desktop dropdown: close on outside click ---- */
  if (navLinks) {
    document.addEventListener('click', function (e) {
      if (siteNav && !siteNav.contains(e.target)) {
        navLinks.classList.remove('nav-open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        if (siteNav)   siteNav.classList.remove('nav-menu-open');
      }
    });
  }

  /* ---- Theme toggle: inject button into .nav-inner ---- */
  var navInner  = document.querySelector('.nav-inner');
  var hamburger = document.getElementById('nav-toggle');

  if (navInner) {

    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle color theme');
    btn.setAttribute('aria-pressed', String(html.classList.contains('theme-light')));

    btn.innerHTML =
      '<svg class="theme-icon" xmlns="http://www.w3.org/2000/svg" ' +
      'viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">' +

      '<line x1="12" y1="2"    x2="12" y2="4.5"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="12" y1="19.5" x2="12" y2="22"   stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="2"  y1="12"   x2="4.5" y2="12"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="19.5" y1="12" x2="22" y2="12"   stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="4.93" y1="4.93"   x2="6.64"  y2="6.64"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="17.36" y1="17.36" x2="19.07" y2="19.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="19.07" y1="4.93"  x2="17.36" y2="6.64"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="6.64"  y1="17.36" x2="4.93"  y2="19.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +

      '<path d="M12 7 A5 5 0 0 0 12 17 Z" fill="currentColor"/>' +
      '<path d="M12 7 A5 5 0 0 1 12 17" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +

      '</svg>';

    if (hamburger) {
      navInner.insertBefore(btn, hamburger);
    } else {
      navInner.appendChild(btn);
    }

    btn.addEventListener('click', function () {
      html.classList.add('theme-transitioning');
      var nowLight = html.classList.toggle('theme-light');
      btn.setAttribute('aria-pressed', String(nowLight));
      try {
        localStorage.setItem('audtheia-theme', nowLight ? 'light' : 'dark');
      } catch (e) { /* storage unavailable */ }
      setTimeout(function () {
        html.classList.remove('theme-transitioning');
      }, 350);
    });
  }

});
