/* =============================================================
   nav.js — Shared navigation, theme toggle, page illustration
   Audtheia Environmental Monitoring
   ============================================================= */

/* ----------------------------------------------------------
   1. Apply saved or system-preferred theme before first paint
   Synchronous IIFE — runs before any CSS renders, preventing
   a flash of the wrong colour scheme.
   Priority: saved preference > system preference > dark (default)
   ---------------------------------------------------------- */
(function () {
  try {
    var saved = localStorage.getItem('audtheia-theme');
    if (saved === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (!saved) {
      /* No saved preference — honour the operating system setting */
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('theme-light');
      }
    }
    /* saved === 'dark' or any unrecognised value: no class, dark mode */
  } catch (e) { /* localStorage unavailable — continue in dark mode */ }
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


  /* ---- Active nav link ---- */
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
     Styled entirely by Section 19 CSS.
     ---------------------------------------------------------- */

  var overlay  = null;
  var closeBtn = null;

  if (navToggle) {

    overlay           = document.createElement('div');
    overlay.id        = 'mobile-nav-overlay';
    overlay.className = 'mobile-nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role',        'dialog');
    overlay.setAttribute('aria-label',  'Navigation menu');

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

    var accentLine       = document.createElement('div');
    accentLine.className = 'overlay-accent-line';
    overlay.appendChild(accentLine);

    var overlayNav      = document.createElement('nav');
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

    var brand         = document.createElement('div');
    brand.className   = 'overlay-brand';
    brand.textContent = 'AUDTHEIA';
    overlay.appendChild(brand);

    document.body.appendChild(overlay);

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

    navToggle.addEventListener('click', function () {
      if (window.innerWidth <= 640) {
        if (overlay.classList.contains('overlay-open')) {
          closeOverlay();
        } else {
          openOverlay();
        }
      } else {
        if (navLinks) {
          var open = navLinks.classList.toggle('nav-open');
          navToggle.setAttribute('aria-expanded', String(open));
          if (siteNav) siteNav.classList.toggle('nav-menu-open', open);
        }
      }
    });

    closeBtn.addEventListener('click', closeOverlay);

    overlayNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeOverlay);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('overlay-open')) {
        closeOverlay();
      }
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay();
    });

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


  /* ----------------------------------------------------------
     Page illustration
     Injects a decorative silhouette div immediately before
     <footer class="site-footer"> on every page.
     Dark mode: ocean reef (wave + corals). Uses .illus-ocean.
     Light mode: forest floor (ground + ferns). Uses .illus-forest.
     CSS in Section 20 controls visibility via opacity transitions.
     ---------------------------------------------------------- */

  var footer = document.querySelector('footer.site-footer');

  if (footer) {

    var illus       = document.createElement('div');
    illus.className = 'page-illustration';
    illus.setAttribute('aria-hidden', 'true');

    /* Ocean SVG — visible in dark mode */
    var oceanSvg =
      '<svg class="illus-ocean" viewBox="0 0 1440 80" ' +
      'xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">' +
      /* Wave horizon */
      '<path d="M0 56 C120 50 180 62 360 55 C540 48 600 64 720 57 C840 50 900 63 1080 56 C1200 51 1320 64 1440 57" ' +
      'fill="none" stroke="currentColor" stroke-width="0.8"/>' +
      /* Coral 1 at x~220 */
      '<path d="M220 56 L220 36 M220 46 L212 28 M220 46 L228 30 M212 28 L208 18 M212 28 L215 20 M228 30 L225 20 M228 30 L232 20" ' +
      'fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>' +
      /* Sea fan at x~720 */
      '<path d="M720 56 L720 28 M720 42 Q708 36 702 24 M720 42 Q732 36 738 24 M720 36 Q711 28 706 18 M720 36 Q729 28 734 18 M720 32 Q715 22 714 14 M720 32 Q725 22 726 14" ' +
      'fill="none" stroke="currentColor" stroke-width="0.75" stroke-linecap="round"/>' +
      /* Coral 2 at x~1200 */
      '<path d="M1200 56 L1200 36 M1200 46 L1192 28 M1200 46 L1208 30 M1192 28 L1188 18 M1192 28 L1195 20 M1208 30 L1205 20 M1208 30 L1212 20" ' +
      'fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';

    /* Forest SVG — visible in light mode */
    var forestSvg =
      '<svg class="illus-forest" viewBox="0 0 1440 80" ' +
      'xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">' +
      /* Ground line */
      '<line x1="0" y1="56" x2="1440" y2="56" stroke="currentColor" stroke-width="0.8"/>' +
      /* Grass tuft 1 at x~195 — stems */
      '<path d="M192 56 L188 42 M196 56 L194 39 M200 56 L202 43 M204 56 L208 44 M188 56 L184 46" ' +
      'fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>' +
      /* Grass tuft 1 — small leaf ellipses at stem tips */
      '<ellipse cx="188" cy="41" rx="3" ry="1.4" transform="rotate(-20 188 41)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="194" cy="38" rx="3" ry="1.4" transform="rotate(-5 194 38)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="202" cy="42" rx="3" ry="1.4" transform="rotate(15 202 42)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="208" cy="43" rx="3" ry="1.4" transform="rotate(25 208 43)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="184" cy="45" rx="2.5" ry="1.2" transform="rotate(-30 184 45)" fill="currentColor" opacity="0.45"/>' +
      /* Fern at x~710 — trunk and branches */
      '<path d="M710 56 L710 30 M710 50 Q700 44 696 36 M710 47 Q720 41 724 34 M710 44 Q702 36 698 28 M710 41 Q718 33 722 26 M710 38 Q705 30 703 22 M710 38 Q715 30 717 22" ' +
      'fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round"/>' +
      /* Fern — leaf ellipses at branch tips (left side) */
      '<ellipse cx="696" cy="35" rx="4.5" ry="1.8" transform="rotate(-35 696 35)" fill="currentColor" opacity="0.5"/>' +
      '<ellipse cx="698" cy="27" rx="4" ry="1.6" transform="rotate(-40 698 27)" fill="currentColor" opacity="0.5"/>' +
      '<ellipse cx="703" cy="21" rx="3.5" ry="1.4" transform="rotate(-45 703 21)" fill="currentColor" opacity="0.45"/>' +
      /* Fern — leaf ellipses at branch tips (right side) */
      '<ellipse cx="724" cy="33" rx="4.5" ry="1.8" transform="rotate(35 724 33)" fill="currentColor" opacity="0.5"/>' +
      '<ellipse cx="722" cy="25" rx="4" ry="1.6" transform="rotate(40 722 25)" fill="currentColor" opacity="0.5"/>' +
      '<ellipse cx="717" cy="21" rx="3.5" ry="1.4" transform="rotate(45 717 21)" fill="currentColor" opacity="0.45"/>' +
      /* Fern tip leaf */
      '<ellipse cx="710" cy="29" rx="3" ry="1.5" transform="rotate(0 710 29)" fill="currentColor" opacity="0.5"/>' +
      /* Grass tuft 2 at x~1235 — stems */
      '<path d="M1232 56 L1228 42 M1236 56 L1234 39 M1240 56 L1242 43 M1244 56 L1248 44 M1228 56 L1224 46" ' +
      'fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>' +
      /* Grass tuft 2 — small leaf ellipses at stem tips */
      '<ellipse cx="1228" cy="41" rx="3" ry="1.4" transform="rotate(-20 1228 41)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="1234" cy="38" rx="3" ry="1.4" transform="rotate(-5 1234 38)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="1242" cy="42" rx="3" ry="1.4" transform="rotate(15 1242 42)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="1248" cy="43" rx="3" ry="1.4" transform="rotate(25 1248 43)" fill="currentColor" opacity="0.55"/>' +
      '<ellipse cx="1224" cy="45" rx="2.5" ry="1.2" transform="rotate(-30 1224 45)" fill="currentColor" opacity="0.45"/>' +
      '</svg>';

    illus.innerHTML = oceanSvg + forestSvg;
    footer.parentNode.insertBefore(illus, footer);
  }

});
