/**
 * setup.js — Audtheia Setup Guide
 * Handles: collapsible sections, copy-to-clipboard,
 *          scroll-based progress tracker, troubleshooting accordion.
 *
 * No external dependencies. Independent of all other site scripts.
 */

(function () {
  'use strict';

  /* ── 1. Section Collapse / Expand ──────────────────────────────── */

  function initSectionToggles() {
    var toggles = document.querySelectorAll('.setup-section-toggle');
    if (!toggles.length) return;

    toggles.forEach(function (btn) {
      btn.addEventListener('click', toggleSection);
    });

    // Make the whole header clickable, delegating to the button.
    var headers = document.querySelectorAll('.setup-section-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function (e) {
        // Let the button handle its own click to avoid double-firing.
        if (e.target.closest && e.target.closest('.setup-section-toggle')) return;
        var btn = header.querySelector('.setup-section-toggle');
        if (btn) btn.click();
      });
    });
  }

  function toggleSection() {
    var btn = this;
    var bodyId = btn.getAttribute('aria-controls');
    var body = bodyId ? document.getElementById(bodyId) : null;
    if (!body) return;

    var isExpanded = btn.getAttribute('aria-expanded') === 'true';
    var lbl = btn.querySelector('.toggle-label');

    if (isExpanded) {
      body.classList.add('is-collapsed');
      btn.setAttribute('aria-expanded', 'false');
      if (lbl) lbl.textContent = 'Expand';
    } else {
      body.classList.remove('is-collapsed');
      btn.setAttribute('aria-expanded', 'true');
      if (lbl) lbl.textContent = 'Collapse';
    }
  }

  /* ── 2. Copy to Clipboard ───────────────────────────────────────── */

  function initCopyButtons() {
    var btns = document.querySelectorAll('.copy-btn');
    if (!btns.length) return;

    btns.forEach(function (btn) {
      btn.addEventListener('click', handleCopy);
    });
  }

  function handleCopy() {
    var btn = this;
    var targetId = btn.getAttribute('data-copy-target');
    var codeEl;

    if (targetId) {
      codeEl = document.getElementById(targetId);
    } else {
      var block = btn.closest('.code-block');
      if (block) codeEl = block.querySelector('code');
    }

    if (!codeEl) return;
    var text = codeEl.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () { showCopied(btn); })
        .catch(function () { fallbackCopy(text, btn); });
    } else {
      fallbackCopy(text, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showCopied(btn);
    } catch (e) {
      // Silent fail — clipboard not accessible.
    }
    document.body.removeChild(ta);
  }

  function showCopied(btn) {
    var original = btn.textContent;
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    btn.setAttribute('disabled', 'disabled');
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove('copied');
      btn.removeAttribute('disabled');
    }, 2000);
  }

  /* ── 3. Scroll-based Progress Tracker ──────────────────────────── */

  function initProgressTracker() {
    var items = document.querySelectorAll('.setup-progress-item[data-section]');
    if (!items.length) return;

    // Build a map of section id → progress item.
    var sectionIds = [];
    items.forEach(function (item) {
      sectionIds.push(item.getAttribute('data-section'));
    });

    var sections = [];
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sections.push(el);
    });

    if (!sections.length) return;

    // Compute offset: nav height + extra breathing room.
    function getOffset() {
      var navEl = document.getElementById('site-nav');
      var navH = navEl ? navEl.offsetHeight : 64;
      return navH + 60;
    }

    function updateActive() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var offset = getOffset();
      var activeId = null;

      for (var i = 0; i < sections.length; i++) {
        var sectionTop = sections[i].getBoundingClientRect().top + scrollY;
        if (sectionTop - offset <= scrollY) {
          activeId = sections[i].id;
        }
      }

      // Default to first section before any scroll.
      if (!activeId && sections.length) {
        activeId = sections[0].id;
      }

      items.forEach(function (item) {
        var id = item.getAttribute('data-section');
        if (id === activeId) {
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      });
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive, { passive: true });
    updateActive();
  }

  /* ── 4. Troubleshooting Accordion ──────────────────────────────── */

  function initTroubleshootAccordion() {
    var items = document.querySelectorAll('.trouble-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var btn = item.querySelector('.trouble-question');
      var answer = item.querySelector('.trouble-answer');
      if (!btn || !answer) return;

      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        // Close all others first.
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            other.classList.remove('is-open');
            var otherAnswer = other.querySelector('.trouble-answer');
            var otherBtn = other.querySelector('.trouble-question');
            if (otherAnswer) otherAnswer.classList.remove('is-open');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('is-open');
          answer.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          answer.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ── 5. Schema Category Collapse / Expand ──────────────────────── */

  function initSchemaToggles() {
    var categories = document.querySelectorAll('.schema-category');
    if (!categories.length) return;

    categories.forEach(function (cat) {
      var h4   = cat.querySelector('h4');
      var wrap = cat.querySelector('.cred-table-wrap');
      if (!h4) return;

      /* If no .cred-table-wrap, look for the schema-table directly */
      var tableEl = wrap || cat.querySelector('.schema-table');
      if (!tableEl) return;

      /* Wrap the table if not already wrapped */
      if (!wrap) {
        var newWrap = document.createElement('div');
        newWrap.className = 'cred-table-wrap';
        tableEl.parentNode.insertBefore(newWrap, tableEl);
        newWrap.appendChild(tableEl);
        wrap = newWrap;
      }

      cat.classList.add('schema-collapsible');

      /* Chevron indicator */
      var chevron = document.createElement('span');
      chevron.className = 'schema-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      h4.appendChild(chevron);

      /* Start expanded */
      cat.classList.add('schema-open');
      h4.setAttribute('role', 'button');
      h4.setAttribute('tabindex', '0');
      h4.setAttribute('aria-expanded', 'true');

      function toggle() {
        var isOpen = cat.classList.contains('schema-open');
        if (isOpen) {
          cat.classList.remove('schema-open');
          h4.setAttribute('aria-expanded', 'false');
        } else {
          cat.classList.add('schema-open');
          h4.setAttribute('aria-expanded', 'true');
        }
      }

      h4.addEventListener('click', toggle);
      h4.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ── 6. Init ────────────────────────────────────────────────────── */

  function init() {
    initSectionToggles();
    initCopyButtons();
    initProgressTracker();
    initTroubleshootAccordion();
    initSchemaToggles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
