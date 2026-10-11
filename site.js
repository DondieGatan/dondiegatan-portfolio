(function () {
  var root = document.documentElement;
  var page = document.body.getAttribute('data-page') || 'home';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader hand-off: reveal content once the animation has opened ---------- */
  var loaded = false;
  function markLoaded() {
    if (loaded) return;
    loaded = true;
    root.classList.add('loaded');
    startReveal();
  }
  if (reduceMotion) { markLoaded(); } else { setTimeout(markLoaded, 900); }

  /* ---------- Page leave transition ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || reduceMotion) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return; // same page / in-page anchor
    if (!/\.html$|\/$/.test(url.pathname)) return;  // only site pages (not the CV pdf etc.)
    e.preventDefault();
    root.classList.add('leaving');
    setTimeout(function () { location.href = url.href; }, 460);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('leaving'); });

  /* ---------- Scroll progress + nav ---------- */
  var progress = document.getElementById('scrollProgress');
  var nav = document.querySelector('.nav');
  function onScroll() {
    var h = document.documentElement;
    var height = h.scrollHeight - h.clientHeight;
    if (progress) progress.style.width = (height > 0 ? (h.scrollTop / height) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal (starts after the loader opens) ---------- */
  function startReveal() {
    var els = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Projects filter ---------- */
  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    var cards = document.querySelectorAll('.project[data-cat]');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        filters.forEach(function (b) { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        cards.forEach(function (c) {
          var show = f === 'all' || (' ' + c.getAttribute('data-cat') + ' ').indexOf(' ' + f + ' ') > -1;
          c.hidden = !show;
          if (show) { c.classList.remove('reveal'); c.classList.add('is-visible'); c.style.animation = 'rise 0.6s cubic-bezier(.2,.7,.2,1) both'; }
        });
      });
    });
  }


  /* ---------- Light / dark theme switch ---------- */
  var themeBtn = document.getElementById('themeToggle');
  function storedTheme() { try { var t = localStorage.getItem('theme'); return (t === 'light' || t === 'dark') ? t : null; } catch (e) { return null; } }
  function systemTheme() { return (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'; }
  function currentTheme() { return root.getAttribute('data-theme-effective') || storedTheme() || systemTheme(); }
  function syncThemeButton() {
    if (!themeBtn) return;
    var cur = currentTheme();
    themeBtn.setAttribute('aria-label', cur === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    themeBtn.setAttribute('title', cur === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    root.setAttribute('data-theme-effective', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    syncThemeButton();
    window.dispatchEvent(new Event('themechange'));
  }
  syncThemeButton();
  if (themeBtn) {
    themeBtn.addEventListener('click', function (e) {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      var r = themeBtn.getBoundingClientRect();
      var x = e.clientX || (r.left + r.width / 2), y = e.clientY || (r.top + r.height / 2);
      if (!reduceMotion && document.startViewTransition) {
        var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        var vt = document.startViewTransition(function () { applyTheme(next); });
        vt.ready.then(function () {
          root.animate(
            { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 700, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }
          );
        }, function () {});
      } else if (!reduceMotion) {
        root.classList.add('theme-fade');
        applyTheme(next);
        setTimeout(function () { root.classList.remove('theme-fade'); }, 600);
      } else {
        applyTheme(next);
      }
    });
  }
  if (window.matchMedia) {
    var sysMq = matchMedia('(prefers-color-scheme: light)');
    var onSys = function () {
      if (storedTheme()) return;
      root.setAttribute('data-theme-effective', systemTheme());
      syncThemeButton();
      window.dispatchEvent(new Event('themechange'));
    };
    if (sysMq.addEventListener) sysMq.addEventListener('change', onSys); else if (sysMq.addListener) sysMq.addListener(onSys);
  }

  /* ---------- Copy email ---------- */
  var toast = document.getElementById('toast');
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done() {
        if (!toast) return;
        toast.textContent = 'Copied ' + text;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
      else { window.prompt('Copy this:', text); }
    });
  });


  /* ---------- Swipeable project carousel (home page) ---------- */
  (function initCarousel() {
    var wrap = document.getElementById('carousel');
    if (!wrap) return;
    var stage = wrap.querySelector('.car-stage');
    var slides = [].slice.call(wrap.querySelectorAll('.slide'));
    var dots = [].slice.call(wrap.querySelectorAll('.car-dot'));
    var cap = wrap.querySelector('.car-caption');
    var capTitle = cap.querySelector('.cap-title'), capSub = cap.querySelector('.cap-sub');
    var capDemo = cap.querySelector('.cap-demo'), capMore = cap.querySelector('.cap-more');
    var n = slides.length;
    var START = 1;                         // Mori Matcha in the centre to begin with
    var pos = START, target = START, active = -1;
    var dragging = false, startX = 0, startPos = 0, moved = 0, lastX = 0, lastT = 0, vel = 0, raf = 0, wheelLock = 0;

    // lookup tables keyed by distance from the centre: 0, 1, 2, 2.6
    var DESK = { x: [0, 60, 94, 114], rot: [0, 26, 34, 38], sc: [1, 0.82, 0.66, 0.56], op: [1, 0.92, 0.5, 0] };
    var MOB = { x: [0, 66, 100, 118], rot: [0, 14, 20, 24], sc: [1, 0.8, 0.64, 0.52], op: [1, 0.7, 0.25, 0] };

    function wrapD(d) { d = ((d % n) + n) % n; return d > n / 2 ? d - n : d; }
    function seg(a) { if (a <= 1) return [0, a]; if (a <= 2) return [1, a - 1]; return [2, Math.min((a - 2) / 0.6, 1)]; }
    function val(arr, i, f) { return arr[i] + (arr[i + 1] - arr[i]) * f; }

    function render() {
      var T = window.innerWidth < 900 ? MOB : DESK;
      for (var i = 0; i < n; i++) {
        var d = wrapD(i - pos), a = Math.abs(d), s = d < 0 ? -1 : 1, g = seg(a);
        var x = s * val(T.x, g[0], g[1]), rot = -s * val(T.rot, g[0], g[1]);
        var sc = val(T.sc, g[0], g[1]), op = val(T.op, g[0], g[1]);
        var el = slides[i];
        el.style.transform = 'translateX(' + (x - 50) + '%) rotateY(' + rot + 'deg) scale(' + sc + ')';
        el.style.opacity = op;
        el.style.zIndex = Math.round((3 - Math.min(a, 3)) * 10);
        el.style.pointerEvents = op < 0.15 ? 'none' : 'auto';
      }
      var idx = ((Math.round(pos) % n) + n) % n;
      if (idx !== active) setActive(idx);
    }

    function setActive(idx) {
      active = idx;
      slides.forEach(function (el, i) {
        el.classList.toggle('is-active', i === idx);
        el.setAttribute('tabindex', i === idx ? '0' : '-1');
        el.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
      });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); d.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      var el = slides[idx];
      capTitle.textContent = el.getAttribute('data-title');
      capSub.textContent = el.getAttribute('data-sub');
      capDemo.setAttribute('href', el.getAttribute('data-live'));
      capDemo.setAttribute('aria-label', 'Open the live demo of ' + el.getAttribute('data-title'));
      capMore.setAttribute('href', 'projects.html#' + el.getAttribute('data-id'));
      cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
    }

    function tick() {
      raf = 0;
      if (dragging) return;
      var diff = target - pos;
      if (reduceMotion || Math.abs(diff) < 0.002) { pos = target; render(); return; }
      pos += diff * 0.15;
      render();
      raf = requestAnimationFrame(tick);
    }
    function animate() { if (!raf) raf = requestAnimationFrame(tick); }
    function goTo(i) {                      // shortest way round to slide i
      var k = Math.round(pos), diff = wrapD(i - k);
      target = k + diff; animate();
    }
    function step(dir) { target = Math.round(target) + dir; animate(); }

    // ----- drag / swipe -----
    function slideSpan() { return slides[0].offsetWidth * 0.6; }
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = 0; startX = lastX = e.clientX; startPos = pos; lastT = e.timeStamp; vel = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      var dt = e.timeStamp - lastT;
      if (dt > 0) vel = 0.8 * vel + 0.2 * ((lastX - e.clientX) / slideSpan() / dt);
      lastX = e.clientX; lastT = e.timeStamp;
      pos = startPos - dx / slideSpan();
      render();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      var flick = Math.max(-0.5, Math.min(0.5, vel * 150));   // a quick flick adds a little momentum
      var base = Math.round(startPos), reach = Math.abs(pos - startPos) > 1.7 ? 2 : 1;   // one project per swipe, two only for a long drag
      target = Math.max(base - reach, Math.min(base + reach, Math.round(pos + flick)));
      animate();
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // a drag must not count as a click; clicking a side card brings it to the centre
    stage.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); return; }
      var a = e.target.closest && e.target.closest('.slide');
      if (a && slides.indexOf(a) !== active) { e.preventDefault(); goTo(slides.indexOf(a)); }
    }, true);
    stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // ----- controls -----
    wrap.querySelector('.car-prev').addEventListener('click', function () { step(-1); });
    wrap.querySelector('.car-next').addEventListener('click', function () { step(1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    // two-finger sideways swipe on a trackpad
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 24) return;
      e.preventDefault();
      var now = Date.now(); if (now - wheelLock < 420) return;
      wheelLock = now; step(e.deltaX > 0 ? 1 : -1);
    }, { passive: false });
    window.addEventListener('resize', render);

    render();
  })();

  if (reduceMotion) return;

  /* ---------- Pointer: page spotlight + per-card glow ---------- */
  var mouse = { x: -9999, y: -9999, active: false };
  var pending = false, lastEvt = null;
  function applyPointer() {
    pending = false;
    if (!lastEvt) return;
    var e = lastEvt;
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
    var card = e.target.closest && e.target.closest('.project, .skill-group, .stat, .explore-card, .link-card, .tl-card, .cert, .fact-card');
    if (card) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--x', (e.clientX - r.left) + 'px');
      card.style.setProperty('--y', (e.clientY - r.top) + 'px');
    }
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    root.classList.add('has-pointer');
    lastEvt = e;
    if (!pending) { pending = true; requestAnimationFrame(applyPointer); }
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.active = false; root.classList.remove('has-pointer'); });

  /* ---------- Canvas backgrounds (one mode per page) ---------- */
  var canvas = document.getElementById('bg');
  if (!canvas || !canvas.getContext || page === 'profile') return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, raf = 0, col = { a: '#7c6cf6', b: '#4fd1c5' }, t0 = performance.now();
  var pts = [], drops = [], lastStep = 0;
  var GLYPHS = '{}<>/;=()[]01$#*+-_'.split('');

  function readColors() {
    var cs = getComputedStyle(document.body);
    col.a = cs.getPropertyValue('--accent').trim() || col.a;
    col.b = cs.getPropertyValue('--accent-2').trim() || col.b;
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (page === 'home') {
      var n = Math.max(26, Math.min(80, Math.round((W * H) / 17000)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, r: Math.random() * 1.3 + 0.8 });
    } else if (page === 'skills') {
      var cols = Math.ceil(W / 20);
      drops = [];
      for (var c = 0; c < cols; c++) drops.push({ y: Math.random() * H, v: 6 + Math.random() * 10, on: Math.random() < 0.55 });
    }
  }

  /* HOME: drifting particle network */
  function drawNetwork() {
    ctx.clearRect(0, 0, W, H);
    var i, j, p, q, dx, dy, d, LINK = 125, REACH = 175;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (mouse.active) {
        dx = p.x - mouse.x; dy = p.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140 && d > 0.1) { p.x += (dx / d) * (140 - d) * 0.012; p.y += (dy / d) * (140 - d) * 0.012; }
      }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
    }
    ctx.lineWidth = 1;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      for (j = i + 1; j < pts.length; j++) {
        q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
        if (d < LINK * LINK) { ctx.globalAlpha = (1 - Math.sqrt(d) / LINK) * 0.3; ctx.strokeStyle = col.a; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      }
      if (mouse.active) {
        dx = p.x - mouse.x; dy = p.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < REACH) { ctx.globalAlpha = (1 - d / REACH) * 0.65; ctx.strokeStyle = col.b; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      }
    }
    for (i = 0; i < pts.length; i++) { p = pts[i]; ctx.globalAlpha = 0.6; ctx.fillStyle = (i % 3 === 0) ? col.b : col.a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  /* PROJECTS: blueprint grid that lights up around the cursor + a slow scan line */
  function gridLines(step) {
    ctx.beginPath();
    for (var x = 0; x <= W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (var y = 0; y <= H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();
  }
  function drawGrid(now) {
    ctx.clearRect(0, 0, W, H);
    var step = 56;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.08; ctx.strokeStyle = col.a; gridLines(step);
    if (mouse.active) {
      ctx.save();
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 230, 0, 6.2832); ctx.clip();
      ctx.globalAlpha = 0.34; ctx.strokeStyle = col.b; gridLines(step);
      ctx.globalAlpha = 0.9; ctx.fillStyle = col.a;
      for (var gx = Math.floor((mouse.x - 230) / step) * step; gx < mouse.x + 230; gx += step) {
        for (var gy = Math.floor((mouse.y - 230) / step) * step; gy < mouse.y + 230; gy += step) {
          var dd = Math.hypot(gx - mouse.x, gy - mouse.y);
          if (dd < 230) { ctx.globalAlpha = (1 - dd / 230) * 0.9; ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3); }
        }
      }
      ctx.restore();
    }
    var sy = ((now - t0) * 0.045) % (H + 240) - 120;
    var g = ctx.createLinearGradient(0, sy - 90, 0, sy + 90);
    g.addColorStop(0, 'transparent'); g.addColorStop(0.5, col.a); g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.1; ctx.fillStyle = g; ctx.fillRect(0, sy - 90, W, 180);
    ctx.globalAlpha = 1;
  }

  /* SKILLS: falling code glyphs with fading trails; columns near the cursor glow */
  function drawRain(now) {
    if (now - lastStep < 70) return;
    lastStep = now;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.font = '15px ' + (getComputedStyle(root).getPropertyValue('--font-mono') || 'monospace');
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      if (!d.on) { if (Math.random() < 0.004) { d.on = true; d.y = -20; } continue; }
      var x = i * 20 + 4;
      var near = mouse.active ? Math.max(0, 1 - Math.abs(x - mouse.x) / 160) : 0;
      ctx.globalAlpha = 0.35 + near * 0.6;
      ctx.fillStyle = near > 0.4 ? col.b : col.a;
      ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, d.y);
      d.y += d.v + near * 6;
      if (d.y > H + 20) { d.y = -20; d.on = Math.random() < 0.7; d.v = 6 + Math.random() * 10; }
    }
    ctx.globalAlpha = 1;
  }

  /* CONTACT: layered waves that swell toward the cursor */
  function drawWaves(now) {
    ctx.clearRect(0, 0, W, H);
    var t = (now - t0) / 1000;
    var mxn = mouse.active ? mouse.x / W : 0.5;
    var amp = 26 + (mouse.active ? (1 - Math.abs(mxn - 0.5) * 2) * 34 : 8);
    for (var k = 0; k < 4; k++) {
      var base = H * (0.66 + k * 0.075) + (mouse.active ? (mouse.y / H - 0.5) * 30 : 0);
      ctx.beginPath(); ctx.moveTo(0, H);
      for (var x = 0; x <= W; x += 8) {
        var y = base + Math.sin(x * 0.006 + t * (0.55 + k * 0.18) + k * 1.7) * (amp - k * 4) + Math.sin(x * 0.0025 - t * 0.4 + k) * 14;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath();
      var g = ctx.createLinearGradient(0, base - 60, 0, H);
      g.addColorStop(0, k % 2 ? col.b : col.a); g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.07 + k * 0.012; ctx.fillStyle = g; ctx.fill();
      ctx.globalAlpha = 0.28; ctx.strokeStyle = k % 2 ? col.b : col.a; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (page === 'home') drawNetwork();
    else if (page === 'projects') drawGrid(now);
    else if (page === 'skills') drawRain(now);
    else if (page === 'contact') drawWaves(now);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  readColors(); resize(); start();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  window.addEventListener('themechange', function () { readColors(); });
})();
