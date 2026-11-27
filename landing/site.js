(function () {
  var menu = document.querySelector('.menu-toggle');
  var navigation = document.querySelector('#navigation');
  var navAnim = null;
  function setMenu(open) {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (navAnim) { navAnim.cancel(); navAnim = null; }
    if (open) { navigation.classList.add('is-open'); return; }
    if (!navigation.animate || !navigation.classList.contains('is-open')) { navigation.classList.remove('is-open'); return; }
    navAnim = navigation.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }],
      { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
    navAnim.onfinish = function () { navigation.classList.remove('is-open'); navAnim = null; };
  }
  if (menu && navigation) {
    menu.addEventListener('click', function () { setMenu(menu.getAttribute('aria-expanded') !== 'true'); });
    navigation.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
  }

  var notice = document.querySelector('#notice');
  if (notice) {
    var closing = false;
    var openNotice = function () {
      closing = false;
      notice.showModal();
      requestAnimationFrame(function () { requestAnimationFrame(function () { notice.classList.add('is-open'); }); });
    };
    var closeNotice = function () {
      if (closing || !notice.open) return;
      closing = true;
      notice.classList.remove('is-open');
      setTimeout(function () { notice.close(); closing = false; }, 320);
    };
    document.querySelectorAll('[data-access]').forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelector('#notice-title').textContent = button.dataset.access;
        document.querySelector('#notice-message').textContent =
          'Esta é uma demonstração da landing page. O acesso e o cadastro no aplicativo ainda não estão conectados.';
        openNotice();
      });
    });
    notice.querySelectorAll('button').forEach(function (button) { button.addEventListener('click', closeNotice); });
    notice.addEventListener('cancel', function (event) { event.preventDefault(); closeNotice(); });
    notice.addEventListener('click', function (event) {
      if (event.target === notice) {
        var box = notice.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeNotice();
      }
    });
  }

  /* Perguntas frequentes: abre e fecha com altura animada */
  document.querySelectorAll('.accordion details').forEach(function (details) {
    var summary = details.querySelector('summary');
    var anim = null;
    if (!summary || !details.animate) return;
    summary.addEventListener('click', function (event) {
      event.preventDefault();
      if (anim) anim.cancel();
      var borders = details.offsetHeight - details.clientHeight;
      var start = details.offsetHeight;
      var end;
      var opening = !details.open;
      if (opening) { details.open = true; end = details.offsetHeight; }
      else { end = summary.offsetHeight + borders; }
      details.style.overflow = 'hidden';
      anim = details.animate({ height: [start + 'px', end + 'px'] }, { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
      anim.onfinish = anim.oncancel = function () {
        if (!opening) details.open = false;
        details.style.overflow = '';
        anim = null;
      };
    });
  });

  /* Índice recolhível das páginas longas: aberto em telas largas, fechado no celular */
  var toc = document.querySelector('.doc-toc details');
  if (toc && window.matchMedia('(min-width: 901px)').matches) toc.setAttribute('open', '');

  /* Formulário de contato (sem backend): monta a mensagem e oferece mailto + copiar */
  var form = document.querySelector('#contact-form');
  if (form) {
    var out = document.querySelector('#contact-result');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      var to = form.dataset.to;
      var subject = '[Calmind] ' + data.get('assunto');
      var body = data.get('mensagem') + '\n\nEnviado por: ' + data.get('nome') + ' <' + data.get('email') + '>';
      document.querySelector('#contact-subject').textContent = subject;
      document.querySelector('#contact-body').textContent = body;
      var link = document.querySelector('#contact-mailto');
      link.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      out.hidden = false;
      out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    var copy = document.querySelector('#contact-copy');
    if (copy) copy.addEventListener('click', function () {
      var text = 'Para: ' + form.dataset.to + '\nAssunto: ' + document.querySelector('#contact-subject').textContent + '\n\n' + document.querySelector('#contact-body').textContent;
      try {
        navigator.clipboard.writeText(text).then(function () { copy.textContent = 'Copiado'; }, function () { copy.textContent = 'Não foi possível copiar'; });
      } catch (e) { copy.textContent = 'Não foi possível copiar'; }
    });
  }

  /* ===== Movimento (técnicas do LandingBuilder, em JS puro) ===== */
  var root = document.documentElement;
  var mqReduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var mqCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)') : { matches: false };
  var connection = navigator.connection || {};
  if (connection.saveData) root.setAttribute('data-lite', '');
  var reduced = function () { return mqReduced.matches; };

  /* header com sombra depois de rolar */
  var header = document.querySelector('.site-header');
  var onScrollHeader = function () { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* barra de progresso: CSS nativo (scroll-timeline); fallback em JS */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(bar, document.body.firstChild);
  var nativeProgress = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll(root block)');
  if (!nativeProgress && !reduced()) {
    var barFrame = 0;
    var drawBar = function () {
      barFrame = 0;
      var max = root.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', function () { if (!barFrame) barFrame = requestAnimationFrame(drawBar); }, { passive: true });
    drawBar();
  }

  /* reveal ao rolar, com escalonamento entre irmãos */
  var revealSelectors = [
    '.section-heading', '.benefits .xpanel', '.step', '.audience-copy', '.privacy .card',
    '.testimonials figure', '.accordion details', '.closing .container > *',
    '.page-grid .card', '.stack > section', '.status-box', '.cvv-box', '.form-result',
    '.priv-demo', '.footer-grid > *', '.swatch', '.logo-box', '.doc-callout', '.doc > h2'
  ];
  var targets = Array.prototype.slice.call(document.querySelectorAll(revealSelectors.join(',')));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.app-panel'));
  targets.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentNode.children, function (n) { return n.matches && targets.indexOf(n) !== -1; });
    var idx = el.parentNode.classList.contains('doc') ? 0 : siblings.indexOf(el);
    el.style.setProperty('--d', Math.min(idx, 5) * (el.classList.contains('card') || el.classList.contains('xpanel') ? 120 : 90) + 'ms');
    el.setAttribute('data-reveal', '');
  });
  panels.forEach(function (el) { el.setAttribute('data-reveal', 'scale'); });
  var revealables = targets.concat(panels);
  if (reduced() || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  }
  window.__calmindReveal = true; /* avisa o failsafe do <head> que o reveal foi montado */

  /* parallax: o CSS usa view(); sem suporte, o JS escreve --p */
  var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var nativeParallax = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()') && CSS.supports('animation-range: entry');
  if (parallax.length && !nativeParallax && !reduced() && 'IntersectionObserver' in window) {
    var seen = new Set();
    var pFrame = 0;
    var drawParallax = function () {
      pFrame = 0;
      seen.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
        el.style.setProperty('--p', String(Math.max(0, Math.min(1, p))));
      });
    };
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      if (!pFrame) pFrame = requestAnimationFrame(drawParallax);
    });
    parallax.forEach(function (el) { el.setAttribute('data-parallax-js', ''); pio.observe(el); });
    window.addEventListener('scroll', function () { if (!pFrame) pFrame = requestAnimationFrame(drawParallax); }, { passive: true });
  }

  /* link ativo da navegação e do índice (âncoras da própria página) */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('#navigation a[href^="#"], .doc-toc a[href^="#"]'));
  var spyItems = spyLinks.map(function (a) { return { link: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; }).filter(function (i) { return i.el; });
  if (spyItems.length) {
    var spyFrame = 0;
    var runSpy = function () {
      spyFrame = 0;
      var ref = 140;
      var current = null;
      spyItems.forEach(function (i) { if (i.el.getBoundingClientRect().top <= ref) current = i; });
      if (window.scrollY + window.innerHeight >= root.scrollHeight - 2) current = spyItems[spyItems.length - 1];
      spyItems.forEach(function (i) {
        if (i === current) i.link.setAttribute('aria-current', 'location'); else i.link.removeAttribute('aria-current');
      });
    };
    var schedule = function () { if (!spyFrame) spyFrame = requestAnimationFrame(runSpy); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    runSpy();
  }

  /* inclinação suave da imagem do hero (só com mouse, sem reduzir movimento) */
  var tilt = document.querySelector('[data-tilt]');
  if (tilt && window.matchMedia && matchMedia('(any-hover: hover)').matches && !reduced() && !root.hasAttribute('data-lite')) {
    var tFrame = 0, tx = 0, ty = 0;
    var applyTilt = function () { tFrame = 0; tilt.style.setProperty('--rx', ty + 'deg'); tilt.style.setProperty('--ry', tx + 'deg'); };
    var area = tilt.closest('.hero') || tilt;
    area.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = tilt.getBoundingClientRect();
      var nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      var ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      tx = +(nx * 6).toFixed(2); ty = +(-ny * 5).toFixed(2);
      if (!tFrame) tFrame = requestAnimationFrame(applyTilt);
    });
    area.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!tFrame) tFrame = requestAnimationFrame(applyTilt); });
  }

  /* cards: foco de luz que segue o mouse e inclinação 3D leve (só com mouse) */
  if (window.matchMedia && matchMedia('(any-hover: hover)').matches && !reduced() && !root.hasAttribute('data-lite')) {
    var activeCard = null, cFrame = 0, cx = 0, cy = 0;
    var paint = function () {
      cFrame = 0;
      if (!activeCard) return;
      var r = activeCard.getBoundingClientRect();
      var px = (cx - r.left) / r.width, py = (cy - r.top) / r.height;
      activeCard.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      activeCard.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      activeCard.style.setProperty('--cry', ((px - 0.5) * 5).toFixed(2) + 'deg');
      activeCard.style.setProperty('--crx', ((0.5 - py) * 4).toFixed(2) + 'deg');
    };
    var resetCard = function (card) {
      if (!card) return;
      card.style.removeProperty('--cry'); card.style.removeProperty('--crx');
    };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (card !== activeCard) { resetCard(activeCard); activeCard = card; }
      if (!card) return;
      cx = e.clientX; cy = e.clientY;
      if (!cFrame) cFrame = requestAnimationFrame(paint);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { resetCard(activeCard); activeCard = null; });
  }

  /* título em palavras (entrada escalonada) */
  if (!reduced()) {
    document.querySelectorAll('.hero-copy h1, .page-hero h1').forEach(function (h1) {
      var i = 0;
      var split = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var span = document.createElement('span');
              span.className = 'w'; span.style.setProperty('--i', i++); span.textContent = part;
              frag.appendChild(span);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1 && child.tagName !== 'BR') { split(child); }
        });
      };
      split(h1);
      h1.classList.add('split');
    });
  }

  /* luz suave que segue o mouse no hero */
  var heroEl = document.querySelector('.hero');
  if (heroEl && window.matchMedia && matchMedia('(any-hover: hover)').matches && !reduced() && !root.hasAttribute('data-lite')) {
    var hFrame = 0, hx = 0, hy = 0;
    heroEl.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = heroEl.getBoundingClientRect(); hx = e.clientX - r.left; hy = e.clientY - r.top;
      heroEl.classList.add('is-lit');
      if (!hFrame) hFrame = requestAnimationFrame(function () { hFrame = 0; heroEl.style.setProperty('--hx', hx + 'px'); heroEl.style.setProperty('--hy', hy + 'px'); });
    });
    heroEl.addEventListener('pointerleave', function () { heroEl.classList.remove('is-lit'); });
  }

  /* Privacidade: demonstração do seletor e do que a psicóloga vê */
  var demo = document.querySelector('.priv-demo');
  if (demo) {
    var opts = demo.querySelectorAll('.priv-opt');
    var consentText = demo.querySelector('.priv-consent-text');
    var touched = false, timer = 0;
    var stamp = function () {
      var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
      return z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear() + ' às ' + z(d.getHours()) + ':' + z(d.getMinutes());
    };
    var setMode = function (mode) {
      demo.setAttribute('data-mode', mode);
      opts.forEach(function (o) { o.setAttribute('aria-pressed', String(o.dataset.mode === mode)); });
      consentText.classList.add('is-swapping');
      setTimeout(function () {
        consentText.textContent = mode === 'shared'
          ? 'Consentimento registrado em ' + stamp() + '.'
          : 'Relato privado: nenhum consentimento de compartilhamento.';
        consentText.classList.remove('is-swapping');
      }, 220);
    };
    opts.forEach(function (o) {
      o.addEventListener('click', function () { touched = true; clearInterval(timer); setMode(o.dataset.mode); });
    });
    setMode('private');
    /* alterna sozinho algumas vezes enquanto está visível, até a pessoa interagir */
    if (!reduced() && 'IntersectionObserver' in window) {
      var cycles = 0;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          clearInterval(timer);
          if (e.isIntersecting && !touched) {
            timer = setInterval(function () {
              if (touched || cycles >= 6) { clearInterval(timer); return; }
              cycles++;
              setMode(demo.getAttribute('data-mode') === 'shared' ? 'private' : 'shared');
            }, 2600);
          }
        });
      }, { threshold: 0.5 }).observe(demo);
    }
    /* cards destacam a parte correspondente da demonstração */
    var parts = { consent: demo.querySelector('.priv-consent'), selector: demo.querySelector('.priv-toggle'), view: demo.querySelector('.priv-view') };
    var cards = document.querySelectorAll('.priv-card');
    var activate = function (card) {
      cards.forEach(function (c) { c.classList.toggle('is-active', c === card); });
      Object.keys(parts).forEach(function (k) { parts[k].classList.toggle('is-highlight', !!card && card.dataset.target === k); });
    };
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () { activate(card); });
      card.addEventListener('focus', function () { activate(card); });
      card.addEventListener('click', function () {
        activate(card);
        if (card.dataset.target === 'view' || card.dataset.target === 'consent') { touched = true; clearInterval(timer); setMode('shared'); }
        if (card.dataset.target === 'selector') { touched = true; clearInterval(timer); setMode('private'); }
      });
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
    });
    var wrap = document.querySelector('.priv-cards');
    if (wrap) wrap.addEventListener('mouseleave', function () { activate(null); });
  }
})();
