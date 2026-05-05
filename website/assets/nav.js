/* ============================================================
   AUDTHEIA — SHARED NAVIGATION BEHAVIOR
   website/assets/nav.js
   Session 2
   ============================================================ */

(function () {
  'use strict';

  // ── Active nav link ────────────────────────────────────────
  // Marks the link matching the current page with .active
  // and aria-current="page". Handles both /index.html and /
  // as equivalent for the Home link.

  const currentPath = window.location.pathname;

  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const linkPath = new URL(link.href, window.location.origin).pathname;

    const normalise = function (p) {
      return p.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
    };

    if (normalise(currentPath) === normalise(linkPath)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // ── Mobile toggle ──────────────────────────────────────────
  const toggle   = document.querySelector('.nav-toggle');
  const linkList = document.querySelector('.nav-links');

  if (toggle && linkList) {

    // Open / close on button click
    toggle.addEventListener('click', function () {
      const isOpen = linkList.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close when any nav link is clicked (handles mobile navigation)
    linkList.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        linkList.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close when the user clicks anywhere outside the nav
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.site-nav')) {
        linkList.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Scroll — nav border ────────────────────────────────────
  // Adds .scrolled to the nav after 20px of scroll,
  // which activates the border-bottom and slightly darkens
  // the background (defined in style.css).

  const nav = document.querySelector('.site-nav');

  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Run once on load in case page is pre-scrolled
  }

}());
