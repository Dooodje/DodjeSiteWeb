(function () {
  'use strict';

  var ENDPOINT = 'https://formsubmit.co/ajax/contact@dodje.fr';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusEl = document.getElementById('contact-status');
  var submitBtn = form.querySelector('[type="submit"]');
  var defaultLabel = submitBtn ? submitBtn.textContent : 'Envoyer';

  function setStatus(type, html) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = 'contact-status contact-status--' + type;
    statusEl.innerHTML = html;
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Envoi…' : defaultLabel;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var honey = form.querySelector('[name="website"]');
    if (honey && honey.value) {
      setStatus('success', '<p>Message envoyé. On te répond dès que possible.</p>');
      form.reset();
      return;
    }

    var name = (form.elements.namedItem('name') || {}).value.trim();
    var email = (form.elements.namedItem('email') || {}).value.trim();
    var subject = (form.elements.namedItem('subject') || {}).value.trim();
    var message = (form.elements.namedItem('message') || {}).value.trim();

    if (!name || !email || !message) {
      setStatus('error', '<p>Merci de remplir nom, email et message.</p>');
      return;
    }

    if (message.length < 10) {
      setStatus('error', '<p>Le message est un peu court — 10 caractères minimum.</p>');
      return;
    }

    setLoading(true);
    setStatus('pending', '<p>Envoi en cours…</p>');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        name: name,
        email: email,
        _subject: '[Dodje] ' + (subject || 'Message depuis dodje.fr'),
        _template: 'table',
        _captcha: 'false',
        _replyto: email,
        Sujet: subject || 'Message',
        Message: message
      })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || (result.data && result.data.success === 'false')) {
          throw new Error((result.data && result.data.message) || 'send-failed');
        }
        form.reset();
        setStatus(
          'success',
          '<p>C’est parti. On lit ça et on te répond sur <strong>' +
            email.replace(/</g, '') +
            '</strong>.</p>'
        );
      })
      .catch(function () {
        var mailto =
          'mailto:contact@dodje.fr?subject=' +
          encodeURIComponent('[Dodje] ' + (subject || 'Contact')) +
          '&body=' +
          encodeURIComponent('Nom : ' + name + '\nEmail : ' + email + '\n\n' + message);
        setStatus(
          'error',
          '<p>L’envoi automatique n’a pas abouti. Tu peux réessayer, ou écrire directement à <a href="' +
            mailto +
            '">contact@dodje.fr</a>.</p>'
        );
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
