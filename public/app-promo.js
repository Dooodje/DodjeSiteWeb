(function () {
  'use strict';

  var APP_STORE =
    'https://apps.apple.com/us/app/dodje-%C3%A9ducation-financi%C3%A8re/id6743447215';
  var PLAY_STORE =
    'https://play.google.com/store/apps/details?id=xyz.dodje.app';
  var MOBILE_MQ = window.matchMedia('(max-width: 767px)');
  var SCROLL_THRESHOLD = 100;

  var APPLE_SVG =
    '<svg class="mobile-floating-bar__icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">' +
    '<path d="M17.05 12.54c-.03-3.08 2.52-4.56 2.64-4.63-1.44-2.1-3.67-2.39-4.45-2.42-1.9-.19-3.7 1.11-4.66 1.11-.97 0-2.45-1.08-4.03-1.05-2.07.03-3.98 1.2-5.05 3.05-2.16 3.75-.55 9.3 1.55 12.34 1.03 1.49 2.26 3.16 3.87 3.1 1.55-.06 2.14-1 4.02-1 1.87 0 2.41 1 4.04.97 1.67-.03 2.73-1.52 3.75-3.02 1.18-1.73 1.67-3.4 1.7-3.49-.04-.02-3.25-1.25-3.38-4.96zM14 3.49c.85-1.03 1.43-2.46 1.27-3.89-1.23.05-2.72.82-3.6 1.85-.79.91-1.48 2.37-1.29 3.76 1.37.11 2.77-.69 3.62-1.72z"/>' +
    '</svg>';

  var GOOGLE_SVG =
    '<svg class="mobile-floating-bar__icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' +
    '<path d="M3.55 2.18c-.35.2-.55.57-.55 1.02v17.6c0 .45.2.82.55 1.02L13.7 12 3.55 2.18zm11.22 8.78 2.92-2.82L6.08 1.57c-.47-.27-.9-.28-1.23-.09l9.92 9.48zm0 2.08-9.92 9.48c.33.19.76.18 1.23-.09l11.61-6.57-2.92-2.82zm1.08-1.04 3.35 3.2 1.57-.89c1.64-.93 1.64-3.69 0-4.62l-1.57-.89-3.35 3.2z"/>' +
    '</svg>';

  function storeButtonHtml(store, label, name, extraClass) {
    return (
      '<a href="' +
      store +
      '" class="mobile-floating-bar__store mobile-floating-bar__store--' +
      extraClass +
      '" target="_blank" rel="noopener noreferrer">' +
      (extraClass === 'apple' ? APPLE_SVG : GOOGLE_SVG) +
      '<span class="mobile-floating-bar__text">' +
      '<span class="mobile-floating-bar__label">Télécharger sur</span>' +
      '<span class="mobile-floating-bar__name">' +
      name +
      '</span>' +
      '</span>' +
      '</a>'
    );
  }

  function createFloatingBar() {
    if (document.getElementById('mobile-floating-bar')) return;

    var bar = document.createElement('div');
    bar.className = 'mobile-floating-bar';
    bar.id = 'mobile-floating-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Télécharger Dodje');
    bar.setAttribute('aria-hidden', 'true');
    bar.setAttribute('inert', '');

    bar.innerHTML =
      '<div class="mobile-floating-bar__shell">' +
      '<div class="mobile-floating-bar__inner">' +
      storeButtonHtml(APP_STORE, 'Télécharger sur', 'App Store', 'apple') +
      storeButtonHtml(PLAY_STORE, 'Télécharger sur', 'Google Play', 'google') +
      '</div></div>';

    document.body.appendChild(bar);
  }

  function setBarVisible(visible) {
    var bar = document.getElementById('mobile-floating-bar');
    if (!bar) return;
    bar.classList.toggle('visible', visible);
    bar.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (visible) {
      bar.removeAttribute('inert');
    } else {
      bar.setAttribute('inert', '');
    }
    document.body.classList.toggle('mobile-floating-bar-active', visible);
  }

  function isMenuOpen() {
    var menu = document.getElementById('mobile-menu');
    return menu && menu.classList.contains('active');
  }

  function updateBar() {
    if (!MOBILE_MQ.matches) {
      setBarVisible(false);
      return;
    }
    createFloatingBar();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    var shouldShow = scrollTop > SCROLL_THRESHOLD && !isMenuOpen();
    setBarVisible(shouldShow);
  }

  function enhanceMobileMenuCtas() {
    document.querySelectorAll('.mobile-cta').forEach(function (cta) {
      if (cta.classList.contains('mobile-cta--stores')) return;
      if (cta.querySelector('.mobile-floating-bar__store')) return;
      cta.classList.add('mobile-cta--stores');
      cta.innerHTML =
        '<div class="mobile-cta__stores">' +
        storeButtonHtml(APP_STORE, 'Télécharger sur', 'App Store', 'apple') +
        storeButtonHtml(PLAY_STORE, 'Télécharger sur', 'Google Play', 'google') +
        '</div>';
    });
  }

  function init() {
    enhanceMobileMenuCtas();
    if (!document.getElementById('mobile-floating-bar')) {
      createFloatingBar();
    }
    updateBar();
    window.addEventListener('scroll', updateBar, { passive: true });
    MOBILE_MQ.addEventListener('change', updateBar);

    var menuToggle = document.getElementById('mobile-menu-toggle');
    var menuClose = document.getElementById('mobile-menu-close');
    var menuOverlay = document.getElementById('mobile-menu-overlay');
    [menuToggle, menuClose, menuOverlay].forEach(function (el) {
      if (el) el.addEventListener('click', function () {
        setTimeout(updateBar, 50);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
