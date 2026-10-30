(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover)').matches;
  const mobile = window.matchMedia('(max-width: 760px)').matches;

  /* ---------- Word splitting (keeps nested elements intact) ---------- */
  function splitWords(el) {
    const nodes = Array.from(el.childNodes);
    el.textContent = '';
    nodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'word';
          const i = document.createElement('i'); i.textContent = part;
          w.appendChild(i); el.appendChild(w);
        });
      } else {
        const w = document.createElement('span'); w.className = 'word';
        const i = document.createElement('i'); i.appendChild(n);
        w.appendChild(i); el.appendChild(w);
      }
    });
  }

  // Manifesto: per-word spans for scrub colouring
  const scrubEl = document.querySelector('.scrub');
  if (scrubEl) {
    scrubEl.innerHTML = scrubEl.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  }

  /* ---------- Mobile menu ---------- */
  const navEl = document.querySelector('.nav'), burger = document.querySelector('.nav__burger');
  if (navEl && burger) {
    const setOpen = o => { navEl.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); };
    burger.addEventListener('click', () => setOpen(!navEl.classList.contains('is-open')));
    navEl.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  }

  /* ---------- Header avatar: loads and appears only after the hero photo leaves the screen ---------- */
  const ava = document.querySelector('.nav__ava'), heroPhoto = document.querySelector('.hero__photo');
  const showAva = on => { if (!ava) return; if (on && !ava.getAttribute('src')) ava.src = ava.dataset.src; ava.classList.toggle('is-on', on); };
  if (ava && heroPhoto && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => showAva(!e.isIntersecting), { rootMargin: '-60px 0px 0px 0px' }).observe(heroPhoto);
  } else showAva(true);

  /* ---------- Testimonials: "See more" ---------- */
  const more = document.querySelector('.tiles__more');
  if (more) more.addEventListener('click', () => {
    const tilesEl = document.querySelector('.tiles');
    const hidden = Array.from(document.querySelectorAll('.tile')).filter(t => getComputedStyle(t).display === 'none');
    hidden.forEach(t => t.classList.remove('is-hidden'));
    tilesEl.classList.add('is-all');
    if (window.gsap && !mobile) gsap.from(hidden, { y: 40, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
    more.remove();
  });

  function staticMode() {
    document.body.classList.remove('is-loading');
    document.documentElement.classList.add('is-static');
    const l = document.querySelector('.loader'); if (l) l.remove();
    document.querySelectorAll('.count').forEach(c => c.textContent = c.dataset.to);
  }
  /* Phones get a static page: animation libraries are not even run */
  if (mobile || reduce) { staticMode(); return; }

  function loadVendors() {
    return Array.from(document.querySelectorAll('script.vendor')).reduce((p, v) => p.then(() => new Promise(res => {
      const s = document.createElement('script');
      if (v.textContent.trim()) { s.text = v.textContent; document.body.appendChild(s); res(); }
      else { s.src = v.dataset.src; s.onload = s.onerror = res; document.body.appendChild(s); }
    })), Promise.resolve());
  }
  const onLoad = fn => (document.readyState === 'complete' ? fn() : window.addEventListener('load', fn));
  loadVendors().then(() => { if (typeof window.gsap === 'undefined') { staticMode(); return; } document.querySelectorAll('.split').forEach(splitWords); animate(); });

  function animate() {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, offset: id === '#top' ? 0 : -40 });
    }));
  }

  /* ---------- Preloader → hero intro ---------- */
  gsap.set('.hero__title .word > i', { yPercent: 115 });
  gsap.set('.reveal-up', { y: 30, opacity: 0 });
  gsap.set('.loader__name span', { yPercent: 0 });

  const counter = { v: 0 };
  const num = document.getElementById('loaderNum');
  const intro = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
  intro
    .from('.loader__name span', { yPercent: 110, duration: 1.1, stagger: 0.12, ease: 'expo.out' }, 0)
    .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => num.textContent = Math.round(counter.v) }, 0)
    .to('.loader__bar i', { width: '100%', duration: 1.8, ease: 'power2.inOut' }, 0)
    .to('.loader__name span', { yPercent: -110, duration: 0.8, stagger: 0.06, ease: 'expo.in' }, 1.9)
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1 }, 2.4)
    .add(() => { document.body.classList.remove('is-loading'); lenis && lenis.start(); }, 2.9)
    .to('.hero__title .word > i', { yPercent: 0, duration: 1.3, stagger: 0.045, ease: 'expo.out' }, 2.75)
    .to('.reveal-up', { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'expo.out' }, 3.2)
    .add(() => document.querySelector('.loader').remove());
  gsap.set('.loader', { clipPath: 'inset(0 0 0% 0)' });

  /* ---------- Hero parallax out ---------- */
  gsap.to('.hero__inner', {
    yPercent: -18, opacity: 0.15, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* ---------- Flow-field canvas ---------- */
  (function field() {
    const c = document.getElementById('field'); if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, dpr, parts = [], mouse = { x: -9999, y: -9999 }, t = 0, running = true;
    const N = window.innerWidth < 760 ? 200 : 520;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#f3ecff'; ctx.fillRect(0, 0, w, h);
    }
    function spawn(p) { p.x = Math.random() * w; p.y = Math.random() * h; p.life = 60 + Math.random() * 160; p.hue = Math.random(); return p; }
    resize(); for (let i = 0; i < N; i++) parts.push(spawn({}));
    window.addEventListener('resize', resize);
    c.parentElement.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    c.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: s => { running = s.isActive; if (running) loop(); } });
    function angle(x, y) {
      return Math.sin(x * 0.0021 + t) * 2.1 + Math.cos(y * 0.0027 - t * 0.7) * 1.7 + Math.sin((x + y) * 0.0009 + t * 0.4);
    }
    function loop() {
      if (!running) return;
      t += 0.0035;
      ctx.fillStyle = 'rgba(243,236,255,0.09)'; ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const p of parts) {
        let a = angle(p.x, p.y);
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 32000) a += Math.atan2(dy, dx) * 1.2;
        const nx = p.x + Math.cos(a) * 1.6, ny = p.y + Math.sin(a) * 1.6;
        ctx.strokeStyle = p.hue < 0.55 ? 'rgba(90,43,196,0.30)' : p.hue < 0.85 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.12)';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny;
        if (--p.life < 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) spawn(p);
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ---------- Yellow light wandering behind purple glass (hero and contact) ---------- */
  function sun(section) {
    const sunEl = section && section.querySelector('.sun i');
    if (!sunEl) return;
    const photo = section.querySelector('.hero__photo');
    let R = 220, pts = [], pos = { x: 0, y: 0 }, mouseT = 0;
    const qx = gsap.quickTo(sunEl, 'x', { duration: 2.2, ease: 'power2.out' });
    const qy = gsap.quickTo(sunEl, 'y', { duration: 2.2, ease: 'power2.out' });
    function layout() {
      const hr = section.getBoundingClientRect();
      const W = hr.width, H = hr.height;
      R = Math.max(150, Math.min(270, W * 0.18));
      sunEl.style.setProperty('--r2', (R * 2) + 'px');
      const navH = section.classList.contains('hero') ? (document.querySelector('.nav') || { offsetHeight: 0 }).offsetHeight : 0;
      let hidden = () => false;
      if (photo) {
        const pr = photo.getBoundingClientRect();
        const ph = { l: pr.left - hr.left, t: pr.top - hr.top, r: pr.right - hr.left, b: pr.bottom - hr.top };
        hidden = (x, y) => x > ph.l + R * 0.35 && x < ph.r - R * 0.35 && y > ph.t + R * 0.35 && y < ph.b - R * 0.35;
      }
      pts = [];
      for (let x = -R * 0.2; x <= W + R * 0.2; x += W / 28)
        for (let y = navH + R * 0.15; y <= H + R * 0.25; y += H / 22)
          if (!hidden(x, y)) pts.push({ x, y });
    }
    layout();
    const nearest = (x, y) => pts.reduce((b, p) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(b.x - x, b.y - y) ? p : b), pts[0]);
    function go(p) { if (!p) return; pos = p; qx(p.x); qy(p.y); }
    const hr0 = section.getBoundingClientRect();
    let start;
    if (photo) { const ph = photo.getBoundingClientRect(); start = nearest(ph.left - hr0.left + ph.width * 0.3, ph.top - hr0.top + ph.height * 0.8); }
    else start = nearest(hr0.width * 0.8, hr0.height * 0.75);
    gsap.set(sunEl, { x: start.x, y: start.y }); pos = start;
    setInterval(() => {
      if (Date.now() - mouseT > 2500 && pts.length) {
        const cand = pts.filter(p => { const d = Math.hypot(p.x - pos.x, p.y - pos.y); return d > R * 0.4 && d < R * 2.2; });
        go(cand.length ? cand[Math.floor(Math.random() * cand.length)] : pts[Math.floor(Math.random() * pts.length)]);
      }
    }, 2400);
    section.addEventListener('mousemove', e => {
      const hr = section.getBoundingClientRect();
      mouseT = Date.now();
      go({ x: e.clientX - hr.left, y: e.clientY - hr.top });
    });
    window.addEventListener('resize', () => { layout(); go(nearest(pos.x, pos.y)); });
    gsap.to(sunEl, { scale: 1.12, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }
  sun(document.querySelector('.hero'));
  onLoad(() => sun(document.querySelector('.contact')));

  /* ---------- Generic heading reveals ---------- */
  document.querySelectorAll('.h2, .statement__big, .contact__big').forEach(h => {
    gsap.from(h.querySelectorAll('.word > i'), {
      yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: h, start: 'top 85%' }
    });
  });

  /* ---------- Horizontal results ---------- */
  (function results() {
    const pin = document.querySelector('.results__pin');
    const track = document.querySelector('.results__track');
    if (!pin || !track) return;
    track.querySelectorAll('.rcard').forEach(card => {
      gsap.from(card, { y: 80, opacity: 0, rotateX: -10, transformPerspective: 1200, duration: 1.2, delay: [...track.children].indexOf(card) * 0.1, ease: 'expo.out', scrollTrigger: { trigger: track, start: 'top 85%' } });
    });
    const counters = Array.from(track.querySelectorAll('.count')).map(el => ({ el, to: +el.dataset.to, done: false, card: el.closest('.rcard') }));
    const tick = () => {
      let left = 0;
      counters.forEach(c => {
        if (c.done) return; left++;
        const r = c.card.getBoundingClientRect();
        if (r.left < window.innerWidth * 0.9 && r.right > 0 && r.top < window.innerHeight * 0.9 && r.bottom > 0) {
          c.done = true; const o = { v: 0 };
          gsap.to(o, { v: c.to, duration: 1.6, ease: 'expo.out', onUpdate: () => c.el.textContent = Math.round(o.v) });
        }
      });
      if (!left) gsap.ticker.remove(tick);
    };
    gsap.ticker.add(tick);
    const ST = { trigger: '.results__track', start: 'top 80%' };
    document.querySelectorAll('.chart__line').forEach(line => {
      const len = line.getTotalLength();
      gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2, ease: 'expo.inOut', scrollTrigger: ST });
    });
    gsap.from('.chart__dot, .chart__v', { opacity: 0, scale: 0, transformOrigin: 'center', stagger: 0.06, duration: 0.5, delay: 0.6, scrollTrigger: ST });
    gsap.from('.chart__area', { opacity: 0, duration: 1.4, delay: 0.8, scrollTrigger: ST });
    gsap.from('.chart--bars rect', { scaleY: 0, transformOrigin: '50% 100%', transformBox: 'fill-box', stagger: 0.03, duration: 0.8, ease: 'expo.out', scrollTrigger: ST });
  })();

  /* ---------- Services: entrance + 3D tilt + glow ---------- */
  gsap.utils.toArray('.svc').forEach(s => {
    gsap.from(s.querySelectorAll('.svc__head, .opt'), { y: 90, opacity: 0, rotateX: -10, transformPerspective: 1200, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 85%' } });
  });
  if (fine) document.querySelectorAll('[data-tilt]').forEach(el => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(el, { transformPerspective: 1400 });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      rx((0.5 - py) * 6); ry((px - 0.5) * 8);
    });
    el.addEventListener('mouseleave', () => { rx(0); ry(0); });
  });
  

  /* ---------- Statement: lines fly in, brand swoosh draws itself ---------- */
  const st = document.querySelectorAll('.statement__big .split');
  st.forEach((el, i) => {
    gsap.fromTo(el, { xPercent: i ? 40 : -40, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top 85%', end: 'center center', scrub: true } });
  });
  gsap.utils.toArray('.glass').forEach(g => {
    gsap.fromTo(g, { xPercent: -1.5 }, { xPercent: 1.5, ease: 'none', scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Testimonial tiles ---------- */
  gsap.from('.tile', { y: 50, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.tiles', start: 'top 85%' } });

  /* ---------- Press rows ---------- */
  gsap.from('.press__list li', { y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.press__list', start: 'top 85%' } });

  /* ---------- Contact orb parallax ---------- */

  if (fine) {
    /* Magnetic */
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.35);
        my((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  onLoad(() => ScrollTrigger.refresh());
  }
})();
