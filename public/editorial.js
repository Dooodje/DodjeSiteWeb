/* Confort de lecture des articles Dodje : barre de progression et sommaire, ajoutés sans toucher au HTML indexé. */
(function () {
  var article = document.querySelector('body.ed-article .content-layout')
  if (!article) return

  // Barre de progression
  var bar = document.createElement('div')
  bar.className = 'ed-progress'
  bar.setAttribute('aria-hidden', 'true')
  bar.innerHTML = '<span></span>'
  document.body.appendChild(bar)
  var fill = bar.firstChild
  var ticking = false
  function update() {
    var r = article.getBoundingClientRect()
    var total = r.height - window.innerHeight
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1
    fill.style.transform = 'scaleX(' + p + ')'
    ticking = false
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update) }
  }, { passive: true })
  update()

  // Sommaire, s'il y a au moins 3 grandes parties
  if (article.querySelector('.ed-toc')) return
  var heads = Array.prototype.filter.call(article.querySelectorAll(':scope > h2'), function (h) {
    return !/^(Sources|Questions fréquentes|À lire aussi|Les mots à connaître)$/i.test(h.textContent.trim())
  })
  if (heads.length < 3) return
  var items = heads.map(function (h, i) {
    if (!h.id) {
      h.id = h.textContent.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'partie-' + (i + 1)
    }
    return '<li><a href="#' + h.id + '">' + h.textContent.replace(/[<>&]/g, '') + '</a></li>'
  })
  var toc = document.createElement('details')
  toc.className = 'ed-toc'
  toc.innerHTML = '<summary>Au sommaire</summary><ol>' + items.join('') + '</ol>'
  var anchor = article.querySelector('.content-keypoints') || article.querySelector('.content-hero')
  if (anchor) anchor.insertAdjacentElement('afterend', toc)
  else heads[0].insertAdjacentElement('beforebegin', toc)
})()
