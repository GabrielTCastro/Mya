/* ================================================
   PRODUTOS.JS — Spotlight + 3D Tilt + Parallax com Firebase
   Otimizado com rAF throttle e atualizações em tempo real
   ================================================ */

  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

  // Configuração do Firebase Realtime Database para o Dani Site (Mya)
  const firebaseConfig = {
    apiKey: "AIzaSyDmeQRWvfia5U1JZOZPDwM_0apdPo09cpc",
    authDomain: "mya-oficial.firebaseapp.com",
    databaseURL: "https://mya-oficial-default-rtdb.firebaseio.com",
    projectId: "mya-oficial",
    storageBucket: "mya-oficial.firebasestorage.app",
    messagingSenderId: "322566791231",
    appId: "1:322566791231:web:94492e5af7866ca8bf588a"
  };

  // Inicializa Firebase
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

(function() {
  'use strict';

  // Configurações de efeitos
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
    
    var img = tiltState.card.querySelector('.produto-img');
    if (img) {
      img.style.translate = (tiltState.moveX * 1.5) + 'px ' + (tiltState.moveY * 1.5) + 'px';
    }

    tiltRaf = null;
  }

  // Bind dos efeitos 3D nos cards de produto
  function bind3DEffects() {
    var cards = document.querySelectorAll('.produto-card');

    cards.forEach(function(card) {
      // Remove possíveis ouvintes antigos para evitar duplicações
      var newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
      card = newCard;

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
        
        var img = card.querySelector('.produto-img');
        if (img) img.style.transition = ''; // Garante que translate não tenha lag
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

        var img = card.querySelector('.produto-img');
        if (img) {
          img.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), translate 0.5s ease';
          img.style.translate = '0px 0px';
        }

        setTimeout(function() {
          card.style.transition = '';
          if (body) body.style.transition = '';
          if (img) img.style.transition = '';
        }, 500);
      });
    });

    // Lazy load de imagens do produto
    document.querySelectorAll('.produto-img').forEach(function(img) {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function() { this.classList.add('loaded'); });
      }
    });

    // Inicializa a animação de revelação de forma instantânea para os novos cards
    setTimeout(function() {
      var grid = document.getElementById('produtos-grid');
      if (grid) grid.classList.add('revealed');
    }, 100);
  }

  /* ── CARREGAR DADOS DO HERO E PRODUTOS DO FIREBASE ── */
  function initializeFirebaseData() {
    // 1. CARREGAR E ESCUTAR HERO
    const heroRef = ref(db, 'hero');
    onValue(heroRef, (snapshot) => {
      let data = snapshot.val();
      if (!data) {
        data = {
          nick: "𝓜𝔂𝓪",
          tagline: "Sua descrição curta aqui"
        };
        set(heroRef, data);
      }

      // Atualiza o DOM do Hero e o título da aba
      const heroNickEl = document.querySelector('.hero-nick');
      const heroTaglineEl = document.querySelector('.hero-tagline');
      const footerNickEl = document.querySelector('.footer-nick');
      const metaDescEl = document.querySelector('meta[name="description"]');

      if (heroNickEl) heroNickEl.textContent = data.nick;
      if (footerNickEl) footerNickEl.textContent = data.nick;
      if (heroTaglineEl) heroTaglineEl.textContent = data.tagline;
      document.title = data.nick;
      if (metaDescEl) metaDescEl.setAttribute('content', data.tagline);
      
      // Atualiza Favicon Dinamicamente
      if (data.favicon) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = data.favicon;
        
        const shortcutIcon = document.querySelector("link[rel='shortcut icon']");
        if (shortcutIcon) shortcutIcon.href = data.favicon;
      }
    });

    // 2. CARREGAR E ESCUTAR PRODUTOS
    const produtosRef = ref(db, 'produtos');
    onValue(produtosRef, (snapshot) => {
      let data = snapshot.val();
      
      // Se não existir dados, migra os produtos padrões
      if (!data) {
        data = {
          "prod1": {
            nome: "Jaqueta Esportiva",
            desc: "Uma jaqueta esportiva exclusivamente feminina super confortavel",
            img: "Imagens/Jaqueta.png",
            link: "https://shopee.com.br/product/428184127/26082452670?channel_code=MyCollection&gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTEhAAAAAwhK68lkrx37arwOeofrI0dSv02HTS84yuw28zjJi3wT3HJGhZ_zMQv6ElJi6S4jonpjgVjHwMQkMT5-bYwbz7vHaZlGhDInbEcoX6-Z5PwXKRS7PH_CLCo2E9-GuVumxaUpiKmTUMtpke-O2l5cFsdUWfLi0YzcF8aca1QzHvnVA&mmp_pid=an_18303130921&uls_trackid=55lti47p00pa&utm_campaign=id_U5ue1TyCNB&utm_content=----&utm_medium=affiliates&utm_source=an_18303130921&utm_term=ewuvgkjaw5vo"
          },
          "prod2": {
            nome: "Conjunto Fitness",
            desc: "Um conjunto com material de qualidade, confortavel e tento um short duplo",
            img: "Imagens/Conjunto.png",
            link: "https://shopee.com.br/product/349179341/22497622314?channel_code=MyCollection&gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTEhAAAAAy4vcs0cKrGaHKAcMuFJnIg6Wh7HxVEmPEuTGyloWEeubcH3mrSmiYUKW27S_EqfmOyIfP8BDKzt3ofQlbJyIJ3xvy-G3GdTnnSFvZ0rEFmYn5NGf6CqvZ-BsaYv5odox0JTs0QR64J55b5YQp3YhRfsrUyMilspx5Ti2MjcVdG5Q&mmp_pid=an_18303130921&uls_trackid=55ltsjn400l0&utm_campaign=id_HV6B4qweBz&utm_content=----&utm_medium=affiliates&utm_source=an_18303130921&utm_term=ewv4iwpu1bq9"
          }
        };
        set(produtosRef, data);
      }

      // Renderiza os produtos no container
      const gridEl = document.getElementById('produtos-grid');
      if (!gridEl) return;

      gridEl.innerHTML = '';

      Object.keys(data).forEach((key) => {
        const prod = data[key];
        const cardHTML = `
          <article class="produto-card" data-name="${prod.nome}">
            <div class="spotlight-outer"></div>
            <div class="produto-img-wrapper">
              <img src="${prod.img}" alt="${prod.nome}" class="produto-img" loading="lazy" decoding="async"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="produto-img-placeholder">
                <span>📦</span>
                <span>Imagem do Produto</span>
              </div>
            </div>
            <div class="produto-body">
              <h3 class="produto-nome">${prod.nome}</h3>
              <p class="produto-desc">${prod.desc}</p>
              <a href="${prod.link}" class="produto-btn" target="_blank" rel="noopener noreferrer sponsored">Acessar</a>
            </div>
          </article>
        `;
        gridEl.insertAdjacentHTML('beforeend', cardHTML);
      });

      // Aplica os efeitos 3D aos novos cards renderizados
      bind3DEffects();
    });
  }

  /* Garante execução após o DOM estar pronto */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseData);
  } else {
    initializeFirebaseData();
  }

})();
