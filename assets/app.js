
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const root = document.documentElement;

  const themeBtn = $('#theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('aa-theme', next); } catch (e) {   }
  });

  const nav = $('.nav');
  const links = $$('.nav-links a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    let cur = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top < window.innerHeight * 0.35) cur = s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const vio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) { v.src = v.dataset.src; }
        if (!v.closest('.tabpanel:not(.active)') && !v.closest('.step-panel:not(.active)')) {
          const p = v.play(); if (p && p.catch) p.catch(() => {});
        }
      } else if (!v.paused) { v.pause(); }
    });
  }, { rootMargin: '200px 0px' });
  const watch = r => $$('video[data-src], video.lazy', r).forEach(v => { if (!v.closest('.runway')) vio.observe(v); });
  watch(document);
  const playIn = r => $$('video', r).forEach(v => {
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
    const rect = v.getBoundingClientRect();
    if (rect.bottom > -200 && rect.top < window.innerHeight + 200) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  });
  const pauseIn = r => $$('video', r).forEach(v => v.pause());

  $$('.runway-track').forEach(t => {
    t.innerHTML += t.innerHTML;
    watch(t);
  });

  $$('[data-tabs]').forEach(group => {
    const key = group.dataset.tabs;
    const buttons = $$('[data-tab]', group);
    buttons.forEach(b => b.addEventListener('click', () => {
      buttons.forEach(x => x.classList.toggle('active', x === b));
      $$(`[data-tabpanel-of="${key}"]`).forEach(p => {
        const on = p.dataset.tabpanel === b.dataset.tab;
        if (!on && p.classList.contains('active')) pauseIn(p);
        p.classList.toggle('active', on);
        if (on) playIn(p);
      });

      window.dispatchEvent(new Event('resize'));
    }));
  });

  setInterval(() => {
    $$('[data-sync]').forEach(g => {
      if (g.closest('.tabpanel:not(.active)')) return;
      const vs = $$('video', g).filter(v => v.readyState >= 2 && !v.paused);
      if (vs.length < 2) return;
      const t = vs[0].currentTime;
      vs.slice(1).forEach(v => {
        const d = Math.abs(v.currentTime - t);
        if (d > 0.12 && d < (v.duration || 12) - 0.5) v.currentTime = t;
      });
    });
  }, 1000);

  $$('[data-tabs-step]').forEach(btn => btn.addEventListener('click', () => {
    const group = document.querySelector(`[data-tabs="${btn.dataset.tabsStep}"]`);
    if (!group) return;
    const buttons = $$('[data-tab]', group);
    const n = buttons.length;
    if (!n) return;
    const i = Math.max(0, buttons.findIndex(b => b.classList.contains('active')));
    buttons[(i + parseInt(btn.dataset.step, 10) + n) % n].click();
  }));

  (() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HOLD = 0, MOVE = 1400;
    const start = v => { if (!v.src && v.dataset.src) v.src = v.dataset.src; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const run = media => {
      const inp = media.querySelector('.eng-input'), ev = media.querySelector(':scope > video');
      if (!inp || !ev || reduce) return;
      clearTimeout(media._t1);
      const iv = inp.querySelector('video');
      if (iv) { try { iv.currentTime = 0; } catch (e) {   } start(iv); }
      inp.style.transition = 'none';
      inp.style.transform = '';
      const b = inp.getBoundingClientRect(), h = media.getBoundingClientRect();
      if (!b.width || !h.width) return;
      const sc = Math.min((0.66 * h.width) / b.width, (0.84 * h.height) / b.height);
      const dx = (h.left + h.width / 2) - (b.left + b.width / 2), dy = (h.top + h.height / 2) - (b.top + b.height / 2);
      inp.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})`;
      media.classList.add('intro');
      media._hold = true;
      ev.pause();
      try { ev.currentTime = 0; } catch (e) {   }
      void inp.offsetWidth;
      media._t1 = setTimeout(() => {
        inp.style.transition = `transform ${MOVE / 1000}s cubic-bezier(.65, 0, .35, 1)`;
        inp.style.transform = '';
        media.classList.remove('intro');

        media._t1 = setTimeout(() => {
          media._hold = false;
          try { ev.currentTime = 0; } catch (e) {   }
          start(ev);
        }, MOVE);
      }, HOLD);
    };
    $$('.eng-media').forEach(m => {
      const ev = m.querySelector(':scope > video');
      if (ev) ev.addEventListener('play', () => { if (m._hold) ev.pause(); });
    });
    const seen = new WeakMap();
    const io = new IntersectionObserver(es => es.forEach(e => {
      const m = e.target, panel = m.closest('.tabpanel');
      const shown = e.isIntersecting && e.intersectionRatio >= 0.5 && (!panel || panel.classList.contains('active'));
      if (shown && !seen.get(m)) { seen.set(m, true); run(m); }
      if (!e.isIntersecting) seen.set(m, false);
    }), { threshold: [0, 0.5] });
    $$('.eng-media').forEach(m => { if (m.querySelector('.eng-input')) io.observe(m); });
  })();

  (() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 901px)');
    const HOLD = 0, MOVE = 1400;
    const play = v => { if (!v.src && v.dataset.src) v.src = v.dataset.src; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const tiles = row => $$('figure video', row);
    const run = row => {
      const inp = row.querySelector('.sgt-in');
      if (!inp || reduce || !wide.matches) return;
      clearTimeout(row._t1);
      const iv = inp.querySelector('video');
      if (iv) { try { iv.currentTime = 0; } catch (e) {} play(iv); }
      inp.style.transition = 'none';
      inp.style.transform = '';
      const b = inp.getBoundingClientRect(), h = row.getBoundingClientRect();
      if (!b.width || !h.width) return;
      const sc = Math.min((0.66 * h.width) / b.width, (0.84 * h.height) / b.height);
      const dx = (h.left + h.width / 2) - (b.left + b.width / 2), dy = (h.top + h.height / 2) - (b.top + b.height / 2);
      inp.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})`;
      row.classList.add('intro');
      row._hold = true;
      tiles(row).forEach(v => { v.pause(); try { v.currentTime = 0; } catch (e) {} });
      void inp.offsetWidth;
      row._t1 = setTimeout(() => {
        inp.style.transition = `transform ${MOVE / 1000}s cubic-bezier(.65, 0, .35, 1)`;
        inp.style.transform = '';
        row.classList.remove('intro');
        row._t1 = setTimeout(() => {
          row._hold = false;
          tiles(row).forEach(v => { try { v.currentTime = 0; } catch (e) {} play(v); });
        }, MOVE);
      }, HOLD);
    };
    $$('.sgt-row').forEach(row => tiles(row).forEach(v => v.addEventListener('play', () => { if (row._hold) v.pause(); })));
    const seen = new WeakMap();
    const io = new IntersectionObserver(es => es.forEach(e => {
      const row = e.target, panel = row.closest('.tabpanel');
      const shown = e.isIntersecting && e.intersectionRatio >= 0.5 && (!panel || panel.classList.contains('active'));
      if (shown && !seen.get(row)) { seen.set(row, true); run(row); }
      if (!e.isIntersecting) seen.set(row, false);
    }), { threshold: [0, 0.5] });
    $$('.sgt-row').forEach(row => io.observe(row));
  })();

  $$('.stepper').forEach(st => {
    const btns = $$('.step-btn', st), panels = $$('.step-panel', st);
    const ms = parseInt(st.dataset.stepMs || '7000', 10);
    st.style.setProperty('--step-ms', ms + 'ms');
    let i = 0, timer = null, visible = false;
    const show = k => {
      i = (k + panels.length) % panels.length;
      btns.forEach((b, j) => { b.classList.remove('active'); void b.offsetWidth; b.classList.toggle('active', j === i); });
      panels.forEach((p, j) => {
        const on = j === i;
        if (!on) pauseIn(p);
        p.classList.toggle('active', on);
        if (on) { $$('video', p).forEach(v => { if (!v.src && v.dataset.src) v.src = v.dataset.src; v.currentTime = 0; const q = v.play(); if (q && q.catch) q.catch(() => {}); }); }
      });
      restart();
    };
    const restart = () => { clearTimeout(timer); if (visible && !st.classList.contains('paused')) timer = setTimeout(() => show(i + 1), ms); };
    btns.forEach((b, j) => b.addEventListener('click', () => { st.classList.remove('paused'); show(j); }));
    st.addEventListener('mouseenter', () => { st.classList.add('paused'); clearTimeout(timer); });
    st.addEventListener('mouseleave', () => { st.classList.remove('paused'); show(i); });
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) show(i); else clearTimeout(timer); }), { threshold: 0.3 }).observe(st);
  });

  $$('.compare').forEach(c => {
    const set = x => {
      const r = c.getBoundingClientRect();
      const p = Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100));
      c.style.setProperty('--pos', p + '%');
    };
    let drag = false;
    c.addEventListener('pointerdown', e => { drag = true; c.setPointerCapture(e.pointerId); set(e.clientX); });
    c.addEventListener('pointermove', e => { if (drag) set(e.clientX); });
    c.addEventListener('pointerup', () => { drag = false; });
    c.addEventListener('pointercancel', () => { drag = false; });
  });

  $$('[data-compare-select]').forEach(group => {
    const target = $(group.dataset.compareSelect);
    if (!target) return;
    const img = $('.base-img', target), lbl = $('.lbl.r', target);
    $$('button', group).forEach(b => b.addEventListener('click', () => {
      $$('button', group).forEach(x => x.classList.toggle('active', x === b));
      img.src = b.dataset.img; lbl.textContent = b.dataset.label;
    }));
  });

  $$('.flipbook').forEach(f => {
    const imgs = $$('img', f); if (imgs.length < 2) return;
    let k = 0; const ms = parseInt(f.dataset.ms || '900', 10);
    setInterval(() => { imgs[k].classList.remove('active'); k = (k + 1) % imgs.length; imgs[k].classList.add('active'); }, ms);
  });
  $$('.carousel').forEach(c => {
    const imgs = $$('img', c), dots = $$('.dots button', c); let k = 0, t = null;
    const go = j => { k = (j + imgs.length) % imgs.length; imgs.forEach((im, i) => im.classList.toggle('active', i === k)); dots.forEach((d, i) => d.classList.toggle('active', i === k)); clearTimeout(t); t = setTimeout(() => go(k + 1), 5200); };
    $('.prev', c).addEventListener('click', () => go(k - 1));
    $('.next', c).addEventListener('click', () => go(k + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    go(0);
  });

  const lb = $('#lightbox'), lbBody = $('.lb-body', lb), lbCap = $('.lb-cap', lb);
  const close = () => { lb.classList.remove('open'); lbBody.innerHTML = ''; };
  $('.lb-close', lb).addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const vid = (src, cls) => `<video class="${cls || ''}" src="${src}" autoplay muted loop playsinline></video>`;
  document.addEventListener('click', e => {
    const card = e.target.closest('[data-lightbox]');
    if (!card) return;
    const d = card.dataset;
    let html = '';
    if (d.twin) html += vid(d.twin);
    if (d.video) html += vid(d.video, 'studio');
    if (d.img) html += `<img src="${d.img}" alt="">`;
    lbBody.innerHTML = html;
    lbCap.textContent = d.caption || '';
    lb.classList.add('open');
  });

  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: 0.08 });
  $$('.reveal').forEach(el => rio.observe(el));

  const PK_VS = 'attribute vec2 p; varying vec2 uv; void main(){ uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }';
  const PK_FS = 'precision mediump float; varying vec2 uv; uniform sampler2D tex; ' +
    'void main(){ vec3 c = texture2D(tex, vec2(uv.x, uv.y * 0.5)).rgb; float a = texture2D(tex, vec2(uv.x, 0.5 + uv.y * 0.5)).g; ' +
    'gl_FragColor = vec4(c * a, a); }';

  const PK_MAX = 12;
  let pkLive = 0;
  $$('.packed').forEach(wrap => {
    const video = wrap.querySelector('video');
    let canvas = wrap.querySelector('canvas');
    if (!video) return;
    let gl = null, running = false, raf = 0, svgMode = false, budgetSvg = false;
    const fitSvg = () => {
      const r = wrap.getBoundingClientRect();
      const vw = video.videoWidth || 1920, vh = (video.videoHeight || 2160) / 2;
      const s = Math.min(r.width / vw, r.height / vh);
      Object.assign(video.style, { width: (vw * s) + 'px', height: (2 * vh * s) + 'px', left: ((r.width - vw * s) / 2) + 'px',
                                   top: ((r.height - vh * s) / 2) + 'px' });
    };
    const fit = () => {
      if (!canvas) return;
      const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = video.videoWidth || 1920, vh = (video.videoHeight || 2160) / 2;
      const s = Math.min(r.width / vw, r.height / vh);
      canvas.style.width = (vw * s) + 'px'; canvas.style.height = (vh * s) + 'px';
      canvas.style.left = ((r.width - vw * s) / 2) + 'px'; canvas.style.top = ((r.height - vh * s) / 2) + 'px';
      canvas.width = Math.max(1, Math.round(vw * s * dpr)); canvas.height = Math.max(1, Math.round(vh * s * dpr));
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const release = () => {
      if (!gl) return;
      const ext = gl.getExtension('WEBGL_lose_context');
      gl = null; pkLive--;
      if (ext) ext.loseContext();
      const fresh = canvas.cloneNode(false);
      canvas.replaceWith(fresh); canvas = fresh;
      wrap.classList.remove('ready');
    };
    const toSvg = () => {
      svgMode = true;
      release();
      wrap.classList.add('svg');
      fitSvg();
    };
    const setup = () => {
      const g = canvas && canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
      if (!g) return false;
      const sh = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); return s; };
      const prog = g.createProgram();
      g.attachShader(prog, sh(g.VERTEX_SHADER, PK_VS)); g.attachShader(prog, sh(g.FRAGMENT_SHADER, PK_FS)); g.linkProgram(prog);
      if (!g.getProgramParameter(prog, g.LINK_STATUS)) return false;
      g.useProgram(prog);
      g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
      const loc = g.getAttribLocation(prog, 'p');
      g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      g.bindTexture(g.TEXTURE_2D, g.createTexture());
      [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach(k => g.texParameteri(g.TEXTURE_2D, k, g.CLAMP_TO_EDGE));
      [g.TEXTURE_MIN_FILTER, g.TEXTURE_MAG_FILTER].forEach(k => g.texParameteri(g.TEXTURE_2D, k, g.LINEAR));
      g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
      canvas.addEventListener('webglcontextlost', () => {
        if (gl !== g) return;
        gl = null; pkLive--; wrap.classList.remove('ready');
        const fresh = canvas.cloneNode(false); canvas.replaceWith(fresh); canvas = fresh;
        if (running && !svgMode && !setup()) toSvg();
      });
      gl = g; pkLive++;
      fit();
      return true;
    };
    const draw = () => {
      if (!svgMode && gl && video.readyState >= 2) {
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
          gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          wrap.classList.add('ready');
        } catch (e) { toSvg(); }
      }
      if (running && !svgMode) raf = requestAnimationFrame(draw);
    };
    const start = () => {
      if (running) return;
      running = true;
      if (!svgMode && !gl) {
        if (pkLive >= PK_MAX) { budgetSvg = true; toSvg(); }
        else if (!setup()) toSvg();
      }
      video.play().catch(() => {});
      if (!svgMode) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false; cancelAnimationFrame(raf); video.pause(); release();
      if (budgetSvg) {
        budgetSvg = false; svgMode = false; wrap.classList.remove('svg');
        ['width', 'height', 'left', 'top'].forEach(k => { video.style[k] = ''; });
      }
    };
    video.addEventListener('playing', () => wrap.classList.add('playing'));
    video.addEventListener('emptied', () => wrap.classList.remove('playing'));
    video.addEventListener('loadedmetadata', () => (svgMode ? fitSvg() : fit()));
    window.addEventListener('resize', () => (svgMode ? fitSvg() : fit()));
    wrap._pk = { start, stop };
    if (wrap.closest('.runway')) return;
    new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop())), { threshold: 0.02 }).observe(wrap);
  });

  $$('.method-video').forEach(box => {
    const v = box.querySelector('video');
    const btns = $$('.mch-btn', box);
    const frame = box.querySelector('.mv-frame');
    if (!v || !btns.length || !frame) return;
    const nativePlay = HTMLMediaElement.prototype.play;
    let userPaused = false, seeking = false, shown = null;
    v.play = function () { return userPaused ? Promise.resolve() : nativePlay.call(this); };
    const bar = document.createElement('div');
    bar.className = 'hero-controls mv-controls';
    bar.innerHTML = '<button class="hc-btn hc-play" type="button" aria-label="Pause"></button>' +
      '<input class="hc-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek">' +
      '<span class="hc-time">0:00 / 0:00</span>';
    frame.appendChild(bar);
    const playBtn = bar.querySelector('.hc-play'), seek = bar.querySelector('.hc-seek'), time = bar.querySelector('.hc-time');
    const ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    const ICON_PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const ts = btns.map(b => parseFloat(b.dataset.t) || 0);
    const sync = () => {
      const paused = v.paused || userPaused;
      if (paused !== shown) {
        playBtn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
        playBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
        frame.classList.toggle('paused', paused);
        shown = paused;
      }
      if (!seeking && v.duration) seek.value = String(Math.round(1000 * v.currentTime / v.duration));
      time.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
      let k = 0;
      ts.forEach((t, i) => { if (v.currentTime >= t) k = i; });
      btns.forEach((b, i) => b.classList.toggle('active', i === k));
    };
    playBtn.addEventListener('click', () => {
      if (v.paused || userPaused) { userPaused = false; nativePlay.call(v).catch(() => {}); }
      else { userPaused = true; v.pause(); }
      sync();
    });
    seek.addEventListener('input', () => { seeking = true; if (v.duration) v.currentTime = (+seek.value / 1000) * v.duration; sync(); });
    seek.addEventListener('change', () => { seeking = false; sync(); });
    btns.forEach((b, i) => b.addEventListener('click', () => {
      v.currentTime = ts[i] + 0.05;
      userPaused = false;
      nativePlay.call(v).catch(() => {});
      sync();
    }));
    ['timeupdate', 'play', 'pause', 'loadedmetadata', 'seeked'].forEach(ev => v.addEventListener(ev, sync));
    sync();
  });

  $$('.sgc').forEach(c => {
    const slides = $$('.sgc-slide', c), dots = $$('.sgc-dots button', c);
    if (!slides.length) return;
    const ms = parseInt(c.dataset.ms || '9000', 10);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wide = window.matchMedia('(min-width: 901px)');
    const HOLD = 0, MOVE = 1400;
    let i = 0, timer = null, visible = false, hover = false, extra = 0, seen = false, t1 = null, t2 = null;
    const tiles = s => $$('.sgc-tile video', s);
    const play = v => { if (!v.src && v.dataset.src) v.src = v.dataset.src; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    slides.forEach(s => tiles(s).forEach(v => v.addEventListener('play', () => { if (s._hold) v.pause(); })));
    const intro = s => {
      clearTimeout(t1); clearTimeout(t2);
      slides.forEach(x => {
        x.classList.remove('intro'); x._hold = false;
        const q = x.querySelector('.sgc-in');
        if (q) { q.style.transition = 'none'; q.style.transform = ''; }
      });
      const inp = s.querySelector('.sgc-in');
      if (!inp || reduce || !wide.matches) return 0;
      const b = inp.getBoundingClientRect(), h = s.getBoundingClientRect();
      if (!b.width || !h.width) return 0;
      const sc = Math.min((0.66 * h.width) / b.width, (0.84 * h.height) / b.height);
      const dx = (h.left + h.width / 2) - (b.left + b.width / 2), dy = (h.top + h.height / 2) - (b.top + b.height / 2);
      inp.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})`;
      s.classList.add('intro');
      s._hold = true;
      tiles(s).forEach(v => { v.pause(); try { v.currentTime = 0; } catch (e) {} });
      void inp.offsetWidth;
      t1 = setTimeout(() => {
        inp.style.transition = `transform ${MOVE / 1000}s cubic-bezier(.65, 0, .35, 1)`;
        inp.style.transform = '';
        s.classList.remove('intro');
        t2 = setTimeout(() => {
          s._hold = false;
          tiles(s).forEach(v => { try { v.currentTime = 0; } catch (e) {} play(v); });
        }, MOVE);
      }, HOLD);
      return HOLD + MOVE;
    };
    const restart = () => { clearTimeout(timer); if (visible && !hover) timer = setTimeout(() => show(i + 1), ms + extra); };
    const show = k => {
      i = (k + slides.length) % slides.length;
      slides.forEach((s, j) => {
        const on = j === i;
        if (!on && s.classList.contains('active')) pauseIn(s);
        s.classList.toggle('active', on);
        if (on) $$('video', s).forEach(v => {
          if (!v.src && v.dataset.src) v.src = v.dataset.src;
          try { v.currentTime = 0; } catch (e) {}
          const p = v.play(); if (p && p.catch) p.catch(() => {});
        });
      });
      dots.forEach((d, j) => d.classList.toggle('active', j === i));
      window.dispatchEvent(new Event('resize'));
      extra = intro(slides[i]);
      restart();
    };
    $('.sgc-prev', c).addEventListener('click', () => show(i - 1));
    $('.sgc-next', c).addEventListener('click', () => show(i + 1));
    dots.forEach((d, j) => d.addEventListener('click', () => show(j)));
    c.addEventListener('mouseenter', () => { hover = true; clearTimeout(timer); });
    c.addEventListener('mouseleave', () => { hover = false; restart(); });
    document.addEventListener('keydown', e => {
      if (!visible || document.querySelector('#lightbox.open')) return;
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    });
    new IntersectionObserver(es => es.forEach(e => {
      visible = e.isIntersecting;
      if (visible && !seen) { seen = true; show(i); } else restart();
      if (!visible) seen = false;
    }), { threshold: 0.3 }).observe(c);
  });

  const SG_T = 9.0, sgT0 = performance.now();
  const SG_SEEK_GAP = 1500;
  const sgCorrect = (v, want, d) => {
    let diff = want - v.currentTime;
    if (diff > d / 2) diff -= d;
    if (diff < -d / 2) diff += d;
    const t = performance.now();
    if (Math.abs(diff) > 0.3) {
      const first = v._sgSeek == null;
      if (!v.seeking && (first || (v.readyState >= 2 && t - v._sgSeek > SG_SEEK_GAP))) {
        v._sgSeek = t;
        try { v.currentTime = want; } catch (e) {}
        if (v.playbackRate !== 1) v.playbackRate = 1;
        return;
      }
    }
    const rate = Math.abs(diff) > 0.02 ? 1 + Math.max(-0.1, Math.min(0.1, diff)) : 1;
    if (v.playbackRate !== rate) v.playbackRate = rate;
  };
  const sgSync = v => {
    if (v.readyState < 1 || v.paused) return;
    const d = v.duration || SG_T;
    sgCorrect(v, (((performance.now() - sgT0) / 1000) % SG_T) % d, d);
  };
  const sgFree = () => $$('.sg-turn video').filter(v => !v.closest('.runway'));
  sgFree().forEach(v => v.addEventListener('playing', () => sgSync(v)));
  setInterval(() => sgFree().forEach(sgSync), 500);

  (() => {
    const run = $('.runway');
    if (!run) return;
    const cards = $$('.runway-card', run)
      .map(c => ({ c, clip: $('.sg-clip video', c), turn: $('.packed video', c), wrap: $('.packed', c), on: false }))
      .filter(k => k.clip && k.turn && k.wrap);
    let near = false, raf = 0;
    const follow = (v, phase) => {
      if (v.readyState < 1 || !v.duration) return;
      sgCorrect(v, phase % v.duration, v.duration);
    };
    const pre = k => {
      if (k.pre) return;
      k.pre = true;
      if (!k.clip.src && k.clip.dataset.src) k.clip.src = k.clip.dataset.src;
      k.clip.preload = 'auto';
      k.turn.preload = 'auto';
      const im = k.wrap.querySelector('.pk-poster');
      if (im) im.loading = 'eager';
    };
    const on = k => {
      if (k.on) return;
      k.on = true;
      if (!k.clip.src && k.clip.dataset.src) k.clip.src = k.clip.dataset.src;
      k.clip.preload = 'auto';
      k.turn.preload = 'auto';
      const p = k.clip.play(); if (p && p.catch) p.catch(() => {});
      if (k.wrap._pk) k.wrap._pk.start();
      else { const q = k.turn.play(); if (q && q.catch) q.catch(() => {}); }
    };
    const off = k => {
      if (!k.on) return;
      k.on = false;
      k.clip.pause();
      if (k.wrap._pk) k.wrap._pk.stop(); else k.turn.pause();
    };
    const pick = () => {
      const R = run.getBoundingClientRect();
      cards.forEach(k => {
        const b = k.c.getBoundingClientRect();
        if (near && b.right > R.left - 20 && b.left < R.right + b.width + 40) on(k); else off(k);
        if (near && b.right > R.left - 3 * b.width && b.left < R.right + 3 * b.width) pre(k);
      });
    };
    const tick = () => {
      const phase = ((performance.now() - sgT0) / 1000) % SG_T;
      cards.forEach(k => { if (k.on) { follow(k.turn, phase); follow(k.clip, phase); } });
      raf = near ? requestAnimationFrame(tick) : 0;
    };
    new IntersectionObserver(es => es.forEach(e => {
      near = e.isIntersecting;
      pick();
      if (near && !raf) raf = requestAnimationFrame(tick);
    }), { rootMargin: '500px 0px' }).observe(run);
    setInterval(() => { if (near) pick(); }, 250);
    run._pick = pick;

    const go = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run.classList.add('go'); go.disconnect(); } }),
      { threshold: 0.2 });
    go.observe(run);
  })();

  (() => {
    const run = $('.runway.runway-rows');
    if (!run) return;
    const tracks = $$('.runway-track', run);
    if (!tracks.length) return;
    const ICON = {
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
      pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
    };
    const box = document.createElement('div');
    box.className = 'runway-scrub';
    box.innerHTML = '<button class="rs-btn" type="button"></button>' +
      '<input type="range" min="0" max="1000" step="1" value="0" aria-label="Move through the avatars">';
    run.after(box);
    const btn = box.querySelector('.rs-btn'), sl = box.querySelector('input');
    const anims = () => tracks.map(t => (t.getAnimations ? t.getAnimations()[0] : null));
    const dur = a => { const d = a && a.effect && a.effect.getTiming().duration; return typeof d === 'number' && d > 0 ? d : 0; };
    let drag = false, taken = false, hover = false, paused = false, manual = 0;
    const setFrac = f => {
      anims().forEach((a, i) => {
        const d = dur(a);
        if (d) { a.currentTime = f * d; return; }
        tracks[i].style.transform = `translateX(-${(i % 2 ? 1 - f : f) * 50}%)`;
      });
      manual = f;
    };
    const frac = () => {
      const a = anims()[0], d = dur(a);
      return d ? (((a.currentTime || 0) % d) + d) % d / d : manual;
    };
    const hold = () => anims().forEach(a => { if (a && dur(a)) a.pause(); });
    const resume = () => {
      if (drag || hover || paused || !run.classList.contains('go')) return;
      anims().forEach(a => { if (a && dur(a)) a.play(); });
    };
    const label = () => {
      btn.innerHTML = paused ? ICON.play : ICON.pause;
      btn.setAttribute('aria-label', paused ? 'Play the avatars' : 'Pause the avatars');
    };
    btn.addEventListener('click', () => { paused = !paused; taken = true; if (paused) hold(); else resume(); label(); });
    sl.addEventListener('pointerdown', () => { drag = true; taken = true; hold(); });
    sl.addEventListener('input', () => { taken = true; hold(); setFrac(+sl.value / 1000); if (run._pick) run._pick(); });
    sl.addEventListener('change', () => { drag = false; resume(); });
    window.addEventListener('pointerup', () => { if (drag) { drag = false; resume(); } });
    run.addEventListener('mouseenter', () => { hover = true; if (taken) hold(); });
    run.addEventListener('mouseleave', () => { hover = false; if (taken) resume(); });
    label();
    let vis = false;
    const show = () => {
      if (!drag) sl.value = String(Math.round(frac() * 1000));
      if (vis) requestAnimationFrame(show);
    };
    new IntersectionObserver(es => es.forEach(e => { const was = vis; vis = e.isIntersecting; if (vis && !was) requestAnimationFrame(show); }))
      .observe(box);
  })();
})();

(() => {
  const stage = document.querySelector('.hero-stage');
  const wrap = stage && stage.querySelector('.hero-packed');
  const v = wrap && wrap.querySelector('video');
  if (!v) return;
  const nativePlay = HTMLMediaElement.prototype.play;
  let userPaused = false, seeking = false;
  v.muted = true;
  v.play = function () { this.muted = true; return userPaused ? Promise.resolve() : nativePlay.call(this); };
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
  };
  const bar = document.createElement('div');
  bar.className = 'hero-controls';
  bar.innerHTML = '<button class="hc-btn hc-play" type="button" aria-label="Pause"></button>' +
    '<input class="hc-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek">' +
    '<span class="hc-time">0:00 / 0:00</span>';
  stage.appendChild(bar);
  const playBtn = bar.querySelector('.hc-play'), seek = bar.querySelector('.hc-seek'), time = bar.querySelector('.hc-time');
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  let shownPaused = null;
  const tick = () => {
    if (!v.muted) v.muted = true;
    const paused = v.paused || userPaused;
    if (paused !== shownPaused) {
      playBtn.innerHTML = paused ? ICON.play : ICON.pause; playBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      stage.classList.toggle('paused', paused); shownPaused = paused;
    }
    if (!seeking && v.duration) seek.value = String(Math.round(1000 * v.currentTime / v.duration));
    time.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
  };
  playBtn.addEventListener('click', () => {
    if (v.paused || userPaused) { userPaused = false; nativePlay.call(v).catch(() => {}); }
    else { userPaused = true; v.pause(); }
    tick();
  });
  seek.addEventListener('input', () => { seeking = true; if (v.duration) v.currentTime = (+seek.value / 1000) * v.duration; tick(); });
  seek.addEventListener('change', () => { seeking = false; tick(); });
  ['timeupdate', 'play', 'pause', 'loadedmetadata', 'seeked', 'volumechange'].forEach(ev => v.addEventListener(ev, tick));
  v.addEventListener('playing', () => stage.classList.add('started'), { once: true });

  const hero = stage.closest('.hero'), cap = hero && hero.querySelector('.hero-caption');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (hero && !(cap && !reduce && window.scrollY < 40)) hero.classList.remove('intro');
  if (hero && cap && !reduce && window.scrollY < 40) {
    let hold = true;
    const wrapped = v.play;
    v.play = function () { return hold ? Promise.resolve() : wrapped.call(this); };
    v.pause();
    hero.classList.add('intro');
    const go = () => {
    const base = getComputedStyle(cap).transform;
    const b = cap.getBoundingClientRect(), h = hero.getBoundingClientRect();
    const sc = Math.max(1, Math.min(2.6, (0.82 * h.width) / b.width, (0.42 * h.height) / b.height));
    const dx = (h.left + h.width / 2) - (b.left + b.width / 2), dy = (h.top + h.height * 0.46) - (b.top + b.height / 2);
    cap.style.transition = 'none';
    cap.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})` + (base && base !== 'none' ? ' ' + base : '');
    cap.classList.add('big');
    void cap.offsetWidth;
    setTimeout(() => {
      cap.style.transition = 'transform 1.5s cubic-bezier(.65, 0, .35, 1)';
      cap.style.transform = '';
      hold = false;
      v.currentTime = 0;
      if (!userPaused) nativePlay.call(v).catch(() => {});
      hero.classList.remove('intro');
      setTimeout(() => { cap.style.transition = ''; }, 1600);
    }, 500);
    };
    Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 800))]).then(go);
  }
  tick();
})();

(() => {
  document.querySelectorAll('.q-group').forEach(g => {
    const tabs = g.querySelectorAll('.q-tab'), panels = g.querySelectorAll('.q-panel');
    tabs.forEach(b => b.addEventListener('click', () => {
      tabs.forEach(x => x.classList.toggle('is-active', x === b));
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.q === b.dataset.q));
    }));
  });
})();
