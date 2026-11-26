(function () {
  var menu = document.querySelector('.menu-toggle');
  var navigation = document.querySelector('#navigation');
  if (menu && navigation) {
    menu.addEventListener('click', function () {
      var expanded = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(expanded));
      menu.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
      navigation.classList.toggle('is-open', expanded);
    });
    navigation.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-label', 'Abrir menu');
        navigation.classList.remove('is-open');
      });
    });
  }

  var notice = document.querySelector('#notice');
  if (notice) {
    document.querySelectorAll('[data-access]').forEach(function (button) {
      button.addEventListener('click', function () {
        document.querySelector('#notice-title').textContent = button.dataset.access;
        document.querySelector('#notice-message').textContent =
          'Esta é uma demonstração da landing page. O acesso e o cadastro no aplicativo ainda não estão conectados.';
        notice.showModal();
      });
    });
    notice.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () { notice.close(); });
    });
    notice.addEventListener('click', function (event) {
      if (event.target === notice) {
        var box = notice.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) notice.close();
      }
    });
  }

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
      var body = data.get('mensagem') + '\n\n— ' + data.get('nome') + ' <' + data.get('email') + '>';
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
})();
