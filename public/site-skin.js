// Barre de téléchargement et liens stores des pages de contenu (même comportement que la landing)
(function () {
  'use strict';
  var APP_STORE = 'https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215';
  var PLAY_STORE = 'https://play.google.com/store/apps/details?id=xyz.dodje.app&hl=fr';
  var ua = navigator.userAgent;
  var mobile = /android|iphone|ipad|ipod/i.test(ua);
  if (mobile) {
    var store = /android/i.test(ua) ? PLAY_STORE : APP_STORE;
    document.querySelectorAll('.sk-dlhref').forEach(function (a) {
      a.href = store;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }
  var bar = document.querySelector('.sk-dlbar');
  var foot = document.querySelector('.sk-foot');
  if (!bar) return;
  var footVisible = false;
  function update() {
    bar.classList.toggle('off', window.scrollY < 320 || footVisible);
  }
  if (foot && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      footVisible = entries[0].isIntersecting;
      update();
    }, { rootMargin: '0px 0px -40px 0px' }).observe(foot);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
