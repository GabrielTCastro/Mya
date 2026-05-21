/* ================================================
   PARTICLES.JS — Depth Layering v5
   
   Ordem de draw (único ctx):
     1. BACK  — partículas azuis pequenas, source-over
     2. NICK  — fillText azul escuro mas visível (~60% opa)
     3. FRONT — partículas azuis com glow, 'lighter'
                'lighter' soma cor: azul + azul escuro do nick
                = azul mais claro → ilumina o nick na área
   
   Partículas FRONT: desenhadas com radialGradient
   pré-renderizado em offscreen canvas (sem alocação/frame)
   ================================================ */

(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────*/
  const NICK_TEXT  = '𝓜𝔂𝓪';
  // Azul escuro, visível mas sem neon — a luz vem das partículas
  const NICK_COLOR = 'rgba(48, 120, 200, 0.62)';

  const ACCENT = { r: 48, g: 176, b: 255 };

  const BACK = {
    count:  50,
    minR: 0.5, maxR: 1.8,
    minSpd: 20, maxSpd: 55,
    minOpa: 0.10, maxOpa: 0.50,
    blur: 4,
    driftA: 32, driftF: 0.30,
  };

  const FRONT = {
    count:  22,           // moderado
    minR: 3.0, maxR: 6.0, // raio do núcleo da luz
    minSpd: 11, maxSpd: 34,
    minOpa: 0.80, maxOpa: 1.0,
    driftA: 20, driftF: 0.24,
  };

  /* ── DOM ────────────────────────────────────────*/
  const hero = document.getElementById('hero');
  if (!hero) return;

  hero.querySelectorAll('.snow').forEach(el => el.remove());
  const heroBg = hero.querySelector('.hero-bg');
  if (heroBg) heroBg.style.filter = 'none';

  const nickEl = hero.querySelector('.hero-nick');
  if (nickEl) nickEl.style.visibility = 'hidden';

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  hero.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  /* ── OFFSCREEN: textura de luz pré-renderizada ──
     Um círculo de luz radial num canvas pequeno.
     Reutilizado em drawImage a cada frame — zero alocação. */
  const GLOW_SIZE = 120; // px do offscreen (raio máximo * ~20)
  const offscreen = document.createElement('canvas');
  offscreen.width = offscreen.height = GLOW_SIZE;
  const octx = offscreen.getContext('2d');

  function buildGlowTexture() {
    octx.clearRect(0, 0, GLOW_SIZE, GLOW_SIZE);
    const cx = GLOW_SIZE / 2;
    const grad = octx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    // Centro: azul accent puro, opaco
    grad.addColorStop(0,   `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 1.0)`);
    // Meio: azul mais suave
    grad.addColorStop(0.25,`rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.6)`);
    // Borda: desvanece até transparente — isso faz a "partícula de luz"
    grad.addColorStop(1,   `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.0)`);
    octx.fillStyle = grad;
    octx.beginPath();
    octx.arc(cx, cx, cx, 0, Math.PI * 2);
    octx.fill();
  }
  buildGlowTexture();

  /* ── DIMENSÕES ──────────────────────────────────*/
  let W = 0, H = 0, nickY = 0, nickFontSize = 0;

  function resize() {
    const r = hero.getBoundingClientRect();
    W = canvas.width  = r.width;
    H = canvas.height = r.height;
    nickFontSize = Math.min(Math.max(W * 0.22, 88), 192);
    nickY = H * 0.48;
  }
  resize();
  new ResizeObserver(resize).observe(hero);

  /* ── PARTÍCULAS ─────────────────────────────────*/
  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawn(cfg, spread) {
    return {
      x:      rand(0, W || 800),
      y:      spread ? rand(-20, H || 600) : -10,
      r:      rand(cfg.minR, cfg.maxR),
      spd:    rand(cfg.minSpd, cfg.maxSpd),
      opa:    rand(cfg.minOpa, cfg.maxOpa),
      drift:  rand(0, Math.PI * 2),
      driftA: rand(cfg.driftA * 0.3, cfg.driftA),
      driftF: rand(cfg.driftF * 0.6, cfg.driftF * 1.5),
    };
  }

  function recycle(p, cfg) {
    p.x = rand(0, W); p.y = -p.r * 4;
    p.r = rand(cfg.minR, cfg.maxR);
    p.spd = rand(cfg.minSpd, cfg.maxSpd);
    p.opa = rand(cfg.minOpa, cfg.maxOpa);
    p.drift = rand(0, Math.PI * 2);
    p.driftA = rand(cfg.driftA * 0.3, cfg.driftA);
    p.driftF = rand(cfg.driftF * 0.6, cfg.driftF * 1.5);
  }

  const backParts  = Array.from({ length: BACK.count  }, () => spawn(BACK,  true));
  const frontParts = Array.from({ length: FRONT.count }, () => spawn(FRONT, true));

  /* ── FONT ───────────────────────────────────────*/
  let fontReady = false;
  document.fonts.load(`bold 100px 'Russo One'`).then(() => { fontReady = true; });

  /* ── UPDATE ─────────────────────────────────────*/
  function update(parts, cfg, dt) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.y     += p.spd * dt;
      p.drift += p.driftF * Math.PI * 2 * dt;
      p.x     += Math.sin(p.drift) * p.driftA * dt;
      if (p.y > H + p.r * 4 || p.x < -80 || p.x > W + 80) recycle(p, cfg);
    }
  }

  /* ── DRAW ───────────────────────────────────────*/
  function drawBack() {
    ctx.shadowBlur  = BACK.blur;
    ctx.shadowColor = `rgba(${ACCENT.r},${ACCENT.g},${ACCENT.b},0.8)`;
    ctx.fillStyle   = `rgb(${ACCENT.r},${ACCENT.g},${ACCENT.b})`;

    for (let i = 0; i < backParts.length; i++) {
      const p = backParts[i];
      const fade = p.y > H * 0.82 ? Math.max(0, (H - p.y) / (H * 0.18)) : 1;
      ctx.globalAlpha = p.opa * fade;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  function drawNick() {
    if (!fontReady) return;
    ctx.globalAlpha  = 1;
    ctx.shadowBlur   = 0;
    ctx.fillStyle    = NICK_COLOR;
    ctx.font         = `${nickFontSize}px 'Russo One', sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(NICK_TEXT, W / 2, nickY);
  }

  function drawFront() {
    /* 'lighter' soma os valores RGB dos pixels.
       Partícula azul (48,176,255) sobre nick azul-escuro (48,120,200):
       resultado = azul mais claro/brilhante naquele ponto.
       Onde a partícula passa → o nick fica iluminado. */
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < frontParts.length; i++) {
      const p = frontParts[i];
      const fade = p.y > H * 0.82 ? Math.max(0, (H - p.y) / (H * 0.18)) : 1;
      const alpha = p.opa * fade;
      if (alpha <= 0) continue;

      ctx.globalAlpha = alpha;

      /* Desenha a textura de luz pré-renderizada escalada para o raio da partícula.
         O halo vai até ~10x o raio do núcleo — luz que se espalha de verdade. */
      const size = p.r * 20;
      ctx.drawImage(offscreen, p.x - size / 2, p.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ── LOOP ───────────────────────────────────────*/
  let lastTime = 0, running = true;

  function tick(now) {
    if (!running) return;
    if (!lastTime) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    ctx.clearRect(0, 0, W, H);

    update(backParts,  BACK,  dt);
    update(frontParts, FRONT, dt);

    // 1. Partículas de fundo (atrás do nick)
    ctx.globalCompositeOperation = 'source-over';
    drawBack();

    // 2. Nick azul-escuro no canvas
    ctx.globalCompositeOperation = 'source-over';
    drawNick();

    // 3. Partículas de frente com 'lighter' — iluminam o nick
    drawFront();

    requestAnimationFrame(tick);
  }

  /* ── reduced-motion ─────────────────────────────*/
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  running = !mq.matches;
  if (running) requestAnimationFrame(tick);
  else document.fonts.ready.then(() => { fontReady = true; resize(); drawNick(); });
  mq.addEventListener('change', e => {
    running = !e.matches;
    if (running) { lastTime = 0; requestAnimationFrame(tick); }
  });

})();
