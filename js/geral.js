/* ================================================
   GERAL.JS — Segurança e Anti-Inspeção
   Bloqueio de DevTools, clique direito e atalhos.
   ================================================ */

(function() {
  'use strict';

  // Bloquear clique direito
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  // Bloquear atalhos de DevTools
  document.addEventListener('keydown', function(e) {
    var bloqueados = [
      e.key === 'F12',
      (e.ctrlKey || e.metaKey) && e.shiftKey && ['I','J','C'].indexOf(e.key.toUpperCase()) !== -1,
      (e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'U',
      (e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'S'
    ];
    if (bloqueados.some(Boolean)) e.preventDefault();
  });

  // Detectar DevTools aberto (heurística de dimensão)
  // Usa apenas o evento resize — sem setInterval competindo com animações
  var threshold = 160;
  function check() {
    var aberto =
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold;
    var overlay = document.getElementById('devtools-overlay');
    if (overlay) overlay.style.display = aberto ? 'flex' : 'none';
  }
  window.addEventListener('resize', check);
  check(); // verificação inicial única

  // === ANIMAÇÕES DE ENTRADA VIA INTERSECTION OBSERVER ===
  function initRevealAnimations() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('revealed'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });
    document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
  }
  
  // Executa assim que possível (lembrando que os elementos podem ser injetados depois)
  // Então chamamos um MutationObserver simples para observar quando novos .reveal entrarem no DOM
  // ou chamamos a função logo e tentamos chamar de novo caso demore o load via fetch.
  // Já que chamamos os scripts no index APÓS carregar, podemos chamar direto.
  initRevealAnimations();

  // === SCROLL OTIMIZADO ===
  var isScrolling = false;
  window.addEventListener('scroll', function onScroll() {
    if (isScrolling) return;
    isScrolling = true;
    requestAnimationFrame(function() {
      // Lógica de scroll aqui (navbar se houver etc)
      isScrolling = false;
    });
  }, { passive: true });

})();
