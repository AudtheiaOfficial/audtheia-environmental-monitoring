/* Audtheia — landing page interactions
   Features:
   1. Platform ID expand/collapse (⟷ toggle button injected per element)
   2. Platform carousel scroll (left/right arrow buttons with state sync)
*/

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────────────────────
     1. PLATFORM ID EXPAND / COLLAPSE
     For each .platform-id, the <code> element is wrapped in a
     .platform-id-inner div, and a toggle button is injected after
     it. Clicking the button switches the inner div between
     overflow:hidden (truncated) and overflow-x:auto (scrollable).
  ──────────────────────────────────────────────────────────────── */

  document.querySelectorAll('.platform-id').forEach(el => {
    const code = el.querySelector('code');
    if (!code) return;

    // Wrap code in scrollable inner container
    const inner = document.createElement('div');
    inner.className = 'platform-id-inner';
    el.insertBefore(inner, code);
    inner.appendChild(code);

    // Inject toggle button
    const btn = document.createElement('button');
    btn.className = 'platform-id-toggle';
    btn.setAttribute('aria-label', 'Expand identifier');
    btn.textContent = '⟷';
    el.appendChild(btn);

    btn.addEventListener('click', e => {
      e.stopPropagation(); // prevent document click from immediately collapsing
      const isExpanded = el.classList.toggle('expanded');
      btn.textContent = isExpanded ? '↩' : '⟷';
      btn.setAttribute('aria-label', isExpanded ? 'Collapse' : 'Expand identifier');
    });
  });

  // Collapse all expanded platform-ids when clicking anywhere outside them
  document.addEventListener('click', () => {
    document.querySelectorAll('.platform-id.expanded').forEach(el => {
      el.classList.remove('expanded');
      const btn = el.querySelector('.platform-id-toggle');
      if (btn) {
        btn.textContent = '⟷';
        btn.setAttribute('aria-label', 'Expand identifier');
      }
    });
  });


  /* ─────────────────────────────────────────────────────────────
     2. PLATFORM CAROUSEL SCROLL
     Left/right arrow buttons scroll the #psc-track container by
     one card width (~244px). Arrow visibility is synced to
     scroll position — left arrow is hidden at start, right arrow
     is hidden at end.
  ──────────────────────────────────────────────────────────────── */

  const track = document.getElementById('psc-track');
  const btnLeft  = document.getElementById('psc-left');
  const btnRight = document.getElementById('psc-right');

  if (!track || !btnLeft || !btnRight) return;

  const STEP = 244; // card width (220px) + gap (--space-5 ≈ 24px)

  const syncArrows = () => {
    const atStart = track.scrollLeft <= 0;
    const atEnd   = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    btnLeft.hidden  = atStart;
    btnRight.hidden = atEnd;
  };

  btnLeft.addEventListener('click',  () => track.scrollBy({ left: -STEP, behavior: 'smooth' }));
  btnRight.addEventListener('click', () => track.scrollBy({ left:  STEP, behavior: 'smooth' }));
  track.addEventListener('scroll', syncArrows, { passive: true });

  syncArrows(); // set initial arrow visibility on page load

});
