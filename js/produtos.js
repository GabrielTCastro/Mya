/* ================================================
   PRODUTOS.JS — Spotlight + 3D Tilt + Parallax
   Otimizado com rAF throttle
   ================================================ */

(function() {
  'use strict';



  /* ── LAZY LOAD ─────────────────────────────────── */
  document.querySelectorAll('.produto-img').forEach(function(img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', function() { this.classList.add('loaded'); });
    }
  });

  /* ── 3D TILT + PARALLAX + SPOTLIGHT ────────────── */
  var cards = document.querySelectorAll('.produto-card');
  var MAX_TILT     = 12;
  var CONTENT_MOVE = 8;
  var tiltRaf = null;

  var tiltState = {
    card: null,
    rotX: 0,
    rotY: 0,
    moveX: 0,
    moveY: 0,
    spotX: 0,
    spotY: 0,
    spotXp: 0,
    spotYp: 0
  };

  function applyTilt() {
    if (!tiltState.card) return;

    // Spotlight
    tiltState.card.style.setProperty('--x', tiltState.spotX.toFixed(2));
    tiltState.card.style.setProperty('--y', tiltState.spotY.toFixed(2));
    tiltState.card.style.setProperty('--xp', tiltState.spotXp.toFixed(2));
    tiltState.card.style.setProperty('--yp', tiltState.spotYp.toFixed(2));

    // Tilt
    tiltState.card.style.transform =
      'perspective(800px) rotateX(' + tiltState.rotY + 'deg) rotateY(' + tiltState.rotX + 'deg) scale3d(1.03,1.03,1.03)';

    // Parallax
    var body = tiltState.card.querySelector('.produto-body');
    if (body) {
      body.style.transform =
        'translateX(' + tiltState.moveX + 'px) translateY(' + tiltState.moveY + 'px)';
    }

    tiltRaf = null;
  }

  cards.forEach(function(card) {

    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      
      var localX = e.clientX - rect.left;
      var localY = e.clientY - rect.top;

      var x = localX / rect.width  - 0.5;
      var y = localY / rect.height - 0.5;

      tiltState.card  = card;
      tiltState.rotX  =  x * MAX_TILT;
      tiltState.rotY  = -y * MAX_TILT;
      tiltState.moveX =  x * CONTENT_MOVE;
      tiltState.moveY =  y * CONTENT_MOVE;
      tiltState.spotX = localX;
      tiltState.spotY = localY;
      tiltState.spotXp = localX / rect.width;
      tiltState.spotYp = localY / rect.height;

      if (!tiltRaf) {
        tiltRaf = requestAnimationFrame(applyTilt);
      }
    });

    card.addEventListener('mouseenter', function() {
      card.style.transition = 'box-shadow 0.4s ease';
      var body = card.querySelector('.produto-body');
      if (body) body.style.transition = 'none';
    });

    card.addEventListener('mouseleave', function() {
      if (tiltRaf) { cancelAnimationFrame(tiltRaf); tiltRaf = null; }
      tiltState.card = null;

      card.style.transition = 'transform 0.5s ease, box-shadow 0.4s ease';
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';

      var body = card.querySelector('.produto-body');
      if (body) {
        body.style.transition = 'transform 0.5s ease';
        body.style.transform = 'translateX(0) translateY(0)';
      }

      setTimeout(function() {
        card.style.transition = '';
        if (body) body.style.transition = '';
      }, 500);
    });
  });

})();
