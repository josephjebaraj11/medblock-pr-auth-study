/* Shared diagram viewer: renders mermaid, then makes every diagram
   clickable to open in a zoomable/pannable modal. */
(function () {
  var STYLES = [
    '.mermaid{position:relative;cursor:zoom-in;border-radius:8px;transition:background .15s;}',
    '.mermaid:hover{background:rgba(52,87,213,.05);}',
    '.mermaid .zoom-hint{position:absolute;top:.4rem;right:.5rem;font-size:.7rem;font-weight:600;',
    '  color:var(--muted,#5b5e64);background:var(--panel,#fff);border:1px solid var(--line,#e2e2e0);',
    '  border-radius:999px;padding:.15rem .55rem;opacity:.6;transition:opacity .15s;pointer-events:none;}',
    '.mermaid:hover .zoom-hint{opacity:1;}',
    '.dm-overlay{position:fixed;inset:0;z-index:9999;display:none;background:rgba(0,0,0,.82);',
    '  backdrop-filter:blur(2px);}',
    '.dm-overlay.open{display:flex;flex-direction:column;}',
    '.dm-bar{display:flex;align-items:center;gap:.5rem;padding:.6rem .9rem;color:#fff;',
    '  background:rgba(0,0,0,.35);flex:0 0 auto;}',
    '.dm-title{font-size:.9rem;font-weight:600;margin-right:auto;opacity:.9;',
    '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.dm-btn{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.22);',
    '  border-radius:6px;font-size:.85rem;line-height:1;padding:.45rem .7rem;cursor:pointer;}',
    '.dm-btn:hover{background:rgba(255,255,255,.22);}',
    '.dm-stage{flex:1 1 auto;overflow:hidden;display:flex;align-items:center;justify-content:center;',
    '  cursor:grab;touch-action:none;}',
    '.dm-stage.grabbing{cursor:grabbing;}',
    '.dm-inner{transform-origin:center center;will-change:transform;}',
    '.dm-inner svg{max-width:none!important;max-height:none!important;height:auto;',
    '  width:min(1400px,88vw);display:block;}',
    '.dm-foot{flex:0 0 auto;padding:.5rem .9rem .8rem;color:rgba(255,255,255,.65);font-size:.75rem;',
    '  text-align:center;}',
    '@media (max-width:640px){.dm-inner svg{width:94vw;}}'
  ].join('\n');

  var MIN = 0.3, MAX = 6;
  var scale = 1, tx = 0, ty = 0;
  var overlay, stage, inner, titleEl;

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function applyTransform() {
    inner.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }

  function setScale(next, originX, originY) {
    next = Math.min(MAX, Math.max(MIN, next));
    if (originX !== undefined) {
      // keep the point under the cursor stable while zooming
      var rect = stage.getBoundingClientRect();
      var cx = originX - rect.left - rect.width / 2;
      var cy = originY - rect.top - rect.height / 2;
      var ratio = next / scale;
      tx = cx - (cx - tx) * ratio;
      ty = cy - (cy - ty) * ratio;
    }
    scale = next;
    applyTransform();
  }

  function reset() {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  }

  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'dm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="dm-bar">' +
        '<span class="dm-title"></span>' +
        '<button class="dm-btn" data-act="out" aria-label="Zoom out">&minus;</button>' +
        '<button class="dm-btn" data-act="in" aria-label="Zoom in">+</button>' +
        '<button class="dm-btn" data-act="reset">Reset</button>' +
        '<button class="dm-btn" data-act="close" aria-label="Close">&times; Close</button>' +
      '</div>' +
      '<div class="dm-stage"><div class="dm-inner"></div></div>' +
      '<div class="dm-foot">Scroll to zoom &middot; drag to pan &middot; press Esc to close</div>';
    document.body.appendChild(overlay);

    stage = overlay.querySelector('.dm-stage');
    inner = overlay.querySelector('.dm-inner');
    titleEl = overlay.querySelector('.dm-title');

    overlay.querySelector('.dm-bar').addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'in') setScale(scale * 1.25);
      else if (act === 'out') setScale(scale / 1.25);
      else if (act === 'reset') reset();
      else if (act === 'close') close();
    });

    // click the dark background (not the diagram) to close
    stage.addEventListener('click', function (e) {
      if (e.target === stage) close();
    });

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      setScale(scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
    }, { passive: false });

    var dragging = false, lastX = 0, lastY = 0;
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      stage.classList.add('grabbing');
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      tx += e.clientX - lastX; ty += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      applyTransform();
    });
    ['pointerup', 'pointercancel'].forEach(function (evt) {
      stage.addEventListener(evt, function () {
        dragging = false;
        stage.classList.remove('grabbing');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') setScale(scale * 1.25);
      else if (e.key === '-') setScale(scale / 1.25);
      else if (e.key === '0') reset();
    });
  }

  function open(svg, label) {
    inner.innerHTML = '';
    var clone = svg.cloneNode(true);
    clone.removeAttribute('height');
    clone.style.maxWidth = 'none';
    inner.appendChild(clone);
    titleEl.textContent = label || 'Diagram';
    reset();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    inner.innerHTML = '';
  }

  function wireDiagrams() {
    document.querySelectorAll('.mermaid').forEach(function (box) {
      var svg = box.querySelector('svg');
      if (!svg) return;

      var hint = document.createElement('span');
      hint.className = 'zoom-hint';
      hint.textContent = '⤡ Click to enlarge';
      box.appendChild(hint);

      // nearest preceding heading makes a sensible modal title
      var section = box.closest('section');
      var heading = section ? section.querySelector('h2') : null;
      var label = heading ? heading.textContent.trim() : '';

      box.setAttribute('role', 'button');
      box.setAttribute('tabindex', '0');
      box.addEventListener('click', function () { open(svg, label); });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(svg, label);
        }
      });
    });
  }

  function start() {
    injectStyles();
    buildModal();
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    mermaid.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'default', securityLevel: 'loose' });
    mermaid.run({ querySelector: '.mermaid' }).then(wireDiagrams).catch(function (err) {
      console.error('Mermaid render failed:', err);
      wireDiagrams();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
