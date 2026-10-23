(function () {
  'use strict';

  var ENDPOINT = 'https://formsubmit.co/ajax/contact@dodje.fr';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusEl = document.getElementById('contact-status');
  var submitBtn = form.querySelector('[type="submit"]');
  var defaultLabel = submitBtn ? submitBtn.textContent : 'Envoyer';
  var orgField = document.getElementById('ct-org');
  var done = document.getElementById('ct-done');
  var doneText = document.getElementById('ct-done-text');

  // Le champ « Organisation » ne s'affiche que pour les profils professionnels
  function syncProfile() {
    var p = form.querySelector('[name="profile"]:checked');
    var pro = p && p.value !== 'Joueur';
    if (orgField) orgField.hidden = !pro;
  }
  form.querySelectorAll('[name="profile"]').forEach(function (r) { r.addEventListener('change', syncProfile); });
  syncProfile();

  function setStatus(type, html) {
    if (!statusEl) return;
    statusEl.hidden = !type;
    statusEl.className = 'contact-status contact-status--' + type;
    statusEl.innerHTML = html || '';
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Envoi en cours…' : defaultLabel;
  }

  function showDone(email) {
    if (doneText) doneText.textContent = 'On le lit et on te répond sur ' + email + '.';
    form.hidden = true;
    if (done) done.hidden = false;
  }

  if (done) {
    done.querySelector('.ct-again').addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
      setStatus('', '');
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var honey = form.querySelector('[name="website"]');
    if (honey && honey.value) { form.reset(); showDone('ton adresse'); return; }

    var val = function (n) { var el = form.elements.namedItem(n); return el ? String(el.value).trim() : ''; };
    var name = val('name');
    var email = val('email');
    var org = val('organisation');
    var message = val('message');
    var profileEl = form.querySelector('[name="profile"]:checked');
    var profile = profileEl ? profileEl.value : 'Autre';

    if (!name || !email || !message) {
      setStatus('error', '<p>Il manque ton nom, ton email ou ton message.</p>');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error', '<p>Ton adresse email ne semble pas valide.</p>');
      return;
    }
    if (message.length < 10) {
      setStatus('error', '<p>Ton message est un peu court : 10 caractères minimum.</p>');
      return;
    }

    setLoading(true);
    setStatus('', '');
    // Le service d'envoi peut mettre jusqu'à 30 secondes : on le dit, et on coupe à 60 secondes
    var slowTimer = setTimeout(function () {
      setStatus('pending', '<p>Envoi en cours, cela peut prendre jusqu\u2019à 30 secondes. Garde la page ouverte.</p>');
    }, 3000);
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var abortTimer = ctrl ? setTimeout(function () { ctrl.abort(); }, 60000) : 0;

    fetch(ENDPOINT, {
      signal: ctrl ? ctrl.signal : undefined,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        _subject: '[Dodje] ' + profile + (org ? ' : ' + org : ''),
        _template: 'table',
        _captcha: 'false',
        _replyto: email,
        Profil: profile,
        Organisation: org || 'Non précisée',
        Message: message
      })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        if (!result.ok || (result.data && String(result.data.success) === 'false')) {
          throw new Error((result.data && result.data.message) || 'send-failed');
        }
        form.reset();
        syncProfile();
        showDone(email);
      })
      .catch(function () {
        var mailto = 'mailto:contact@dodje.fr?subject=' + encodeURIComponent('[Dodje] ' + profile) +
          '&body=' + encodeURIComponent('Nom : ' + name + '\nEmail : ' + email + (org ? '\nOrganisation : ' + org : '') + '\n\n' + message);
        setStatus('error', '<p>L’envoi n’a pas abouti. Réessaie, ou écris-nous directement à <a href="' + mailto + '">contact@dodje.fr</a>.</p>');
      })
      .finally(function () { clearTimeout(slowTimer); clearTimeout(abortTimer); setLoading(false); });
  });
})();
