// Barre de téléchargement des pages de contenu : même comportement que la landing.
(function () {
  'use strict';
  var PLAY_STORE = 'https://play.google.com/store/apps/details?id=xyz.dodje.app&hl=fr';
  if (/android/i.test(navigator.userAgent)) {
    document.querySelectorAll('.dlhref').forEach(function (a) { a.href = PLAY_STORE; });
  }
  var bar = document.querySelector('.dlbar');
  if (!bar) return;
  var foot = document.querySelector('.sitefoot');
  var footVisible = false;
  function update() { bar.classList.toggle('off', window.scrollY < 240 || footVisible); }
  if (foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { footVisible = entries[0].isIntersecting; update(); }, { rootMargin: '0px 0px -60px 0px' }).observe(foot);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
