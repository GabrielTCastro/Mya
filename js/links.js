/* ================================================
   LINKS.JS — 3D Card Slider para Redes Sociais com Firebase
   ================================================ */

import { db, ref, onValue } from "./firebase-init.js";

(function () {
  'use strict';

  // Configuração estática local para nomes e ícones SVG
  const METADATA_PLATAFORMAS = {
    instagram: {
      nome: 'Instagram',
      svg: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="white" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="white"/></svg>'
    },
    tiktok: {
      nome: 'TikTok',
      svg: '<svg viewBox="0 0 24 24"><path fill="white" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.21 8.21 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z"/></svg>'
    },
    youtube: {
      nome: 'YouTube',
      svg: '<svg viewBox="0 0 24 24"><path fill="white" d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.66 31.66 0 000 12a31.66 31.66 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.66 31.66 0 0024 12a31.66 31.66 0 00-.5-5.81zM9.54 15.57V8.43L15.82 12l-6.28 3.57z"/></svg>'
    },
    twitch: {
      nome: 'Twitch',
      svg: '<svg viewBox="0 0 24 24"><path fill="white" d="M11.57 4.71H9.43v5.36h2.14V4.71zm5.71 0h-2.14v5.36h2.14V4.71zM4.29 0L1.07 3.21v17.57h5.36V24l3.21-3.21h2.5L21 12.07V0H4.29zm14.57 11.14l-2.5 2.5h-2.5l-2.14 2.14v-2.14H8.36V2.14h10.5v9z"/></svg>'
    }
  };

  var PLATAFORMAS = [];
  var total       = 0;
  var currentIdx  = 0;
  var timer       = null;
  var busy        = false;

  function mod(n, m) { return ((n % m) + m) % m; }

  /* ── MONTAR HTML ──────────────────────────────── */
  function buildSlider() {
    var section = document.getElementById('redes');
    if (!section) return false;

    var cardsHTML = PLATAFORMAS.map(function (p) {
      return '<div class="social-card" data-platform="' + p.id + '">' +
               '<div class="social-card__inner">' +
                 '<div class="social-card__logo">' + p.svg + '</div>' +
                 '<span class="social-card__platform">' + p.nome + '</span>' +
                 '<span class="social-card__nick">' + p.nick + '</span>' +
                 '<a href="' + p.href + '" class="social-card__btn" target="_blank" rel="noopener noreferrer">' +
                   'Acessar <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>' +
                 '</a>' +
               '</div>' +
             '</div>';
    }).join('');

    var dotsHTML = PLATAFORMAS.map(function (_, i) {
      return '<span class="social-dot" data-index="' + i + '"></span>';
    }).join('');

    section.innerHTML =
      '<div class="section-header">' +
        '<div class="section-line" aria-hidden="true"></div>' +
        '<span class="section-label">Minhas Redes</span>' +
        '<div class="section-line" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="social-slider">' +
        '<div class="social-cards__wrapper">' + cardsHTML + '</div>' +
      '</div>' +
      '<div class="social-dots">' + dotsHTML + '</div>';

    return true;
  }

  /* ── APLICAR CLASSES 3D ──────────────────────── */
  function applyClasses() {
    var cards = document.querySelectorAll('.social-card');
    var dots  = document.querySelectorAll('.social-dot');
    var prev  = mod(currentIdx - 1, total);
    var next  = mod(currentIdx + 1, total);

    cards.forEach(function (card, i) {
      card.classList.remove('current--card', 'previous--card', 'next--card', 'hidden--card');
      if      (i === currentIdx) card.classList.add('current--card');
      else if (i === prev)       card.classList.add('previous--card');
      else if (i === next)       card.classList.add('next--card');
      else                       card.classList.add('hidden--card');
    });

    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === currentIdx);
    });
  }

  /* ── TROCAR CARD ─────────────────────────────── */
  function swap(dir) {
    if (busy || total === 0) return;
    busy = true;
    currentIdx = dir === 'left' ? mod(currentIdx - 1, total) : mod(currentIdx + 1, total);
    applyClasses();
    setTimeout(function () { busy = false; }, 750);
  }

  /* ── AUTOPLAY ────────────────────────────────── */
  function startAuto() {
    stopAuto();
    if (total === 0) return;
    timer = setInterval(function () { swap('left'); }, 4000);
  }
  function stopAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  /* ── EVENTOS ─────────────────────────────────── */
  function bindEvents() {
    var wrapper = document.querySelector('.social-cards__wrapper');
    var dotsEl  = document.querySelector('.social-dots');
    var slider  = document.querySelector('.social-slider');

    if (wrapper) {
      wrapper.addEventListener('click', function (e) {
        var card = e.target.closest('.social-card');
        if (!card) return;
        if (card.classList.contains('current--card')) return;
        e.preventDefault();
        if (card.classList.contains('previous--card')) swap('left');
        else if (card.classList.contains('next--card')) swap('right');
        startAuto();
      });
    }

    if (dotsEl) {
      dotsEl.addEventListener('click', function (e) {
        var dot = e.target.closest('.social-dot');
        if (!dot) return;
        var idx = parseInt(dot.dataset.index, 10);
        if (idx === currentIdx) return;
        busy = false;
        currentIdx = idx;
        applyClasses();
        startAuto();
      });
    }

    if (slider) {
      slider.addEventListener('mouseenter', stopAuto);
      slider.addEventListener('mouseleave', startAuto);
    }
  }

  /* ── CARREGAR DADOS DO FIREBASE ──────────────── */
  function loadFromFirebase() {
    const redesRef = ref(db, 'redes');
    
    // Escuta em tempo real para refletir modificações instantaneamente!
    onValue(redesRef, (snapshot) => {
      let data = snapshot.val();
      
      // Se não existir dados no banco, usa exibição padrão
      if (!data) {
        data = {
          instagram: { nick: '@seunick', href: 'https://www.instagram.com/' },
          tiktok: { nick: '@seunick', href: 'https://www.tiktok.com/' },
          youtube: { nick: '@seunick', href: 'https://www.youtube.com/' },
          twitch: { nick: '@seunick', href: 'https://www.twitch.tv/' }
        };
      }

      // Constrói o array PLATAFORMAS mapeando com os SVGs e nomes estáticos
      PLATAFORMAS = Object.keys(data).map(key => {
        const meta = METADATA_PLATAFORMAS[key] || { nome: key, svg: '' };
        return {
          id: key,
          nome: meta.nome,
          nick: data[key].nick || '@seunick',
          href: data[key].href || '#',
          svg: meta.svg
        };
      });

      total = PLATAFORMAS.length;
      currentIdx = 0;

      // Reconstrói e reinicializa o slider
      const ok = buildSlider();
      if (ok) {
        applyClasses();
        bindEvents();
        startAuto();
      }
    });
  }

  /* Garante execução após o DOM estar pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFromFirebase);
  } else {
    loadFromFirebase();
  }

})();
