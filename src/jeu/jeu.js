// Page /jeu : le texte est dans le HTML. Ce script ajoute le mini-quiz et les bâtiments à faire évoluer.
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

/* ---------- Mini-quiz ---------- */
const quiz = $('#jquiz')
if (quiz) {
  const fb = $('.jquiz-fb', quiz)
  $$('.jans', quiz).forEach((btn) => {
    btn.addEventListener('click', () => {
      fb.hidden = false
      if (btn.dataset.ok === '1') {
        btn.classList.add('ok')
        $$('.jans', quiz).forEach((b) => { b.disabled = true })
        fb.innerHTML = '<b>Bonne réponse.</b> 20 % de 2 000 €, soit 400 € par mois. Dans l\'app, ce quiz te rapporterait des Dodji.'
      } else {
        btn.classList.add('ko')
        btn.disabled = true
        fb.innerHTML = '<b>Une vie en moins.</b> Indice : la règle 50/30/20 met 20 % de côté.'
      }
    })
  })
}

/* ---------- Bâtiments ---------- */
const bat = $('.jbat')
if (bat) {
  const ARENA = 6
  const levels = [1, 1, 1, 1, 1, 1, 1]
  let cur = 0
  const cards = $$('.jbat-card', bat)
  const names = cards.map((c) => $('h3', c).textContent)
  const src = (i, l) => (i === ARENA ? '/jeu/bat/7_lvl1.webp' : `/jeu/bat/${i + 1}_lvl${l}.webp`)

  bat.classList.add('js')
  const tabBar = document.createElement('div')
  tabBar.className = 'jbat-tabs'
  tabBar.setAttribute('role', 'tablist')
  tabBar.setAttribute('aria-label', "Bâtiments de l'île")
  cards.forEach((c, k) => {
    c.id = `jbat-card-${k}`
    c.setAttribute('role', 'tabpanel')
    const t = document.createElement('button')
    t.type = 'button'
    t.setAttribute('role', 'tab')
    t.setAttribute('aria-controls', c.id)
    const short = names[k].replace(/^(L'|Le |La )/, '')
    t.textContent = short.charAt(0).toUpperCase() + short.slice(1)
    tabBar.appendChild(t)
  })
  const body = document.createElement('div')
  body.className = 'jbat-body'
  body.innerHTML = `<div class="jbat-stage"><img class="jbat-img" src="${src(0, 1)}" alt="" width="480" height="480">
    <div class="jbat-ctrl"><span class="jbat-lvl" aria-live="polite"></span><button type="button" class="jbat-up">Améliorer</button></div></div>`
  body.appendChild($('.jbat-list', bat))
  bat.append(tabBar, body)

  const img = $('.jbat-img', bat)
  const lvl = $('.jbat-lvl', bat)
  const up = $('.jbat-up', bat)
  const tabs = $$('[role="tab"]', tabBar)

  function render(fade) {
    const l = levels[cur]
    const arena = cur === ARENA
    img.src = src(cur, l)
    img.alt = arena ? names[cur] : `${names[cur]}, niveau ${l}`
    lvl.textContent = arena ? 'Dès le niveau 5' : `Niveau ${l} sur 4`
    up.hidden = arena
    up.disabled = l >= 4
    up.textContent = l >= 4 ? 'Niveau max' : 'Améliorer'
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === cur))
      t.tabIndex = k === cur ? 0 : -1
    })
    cards.forEach((c, k) => c.classList.toggle('on', k === cur))
    if (fade) {
      img.classList.remove('up')
      void img.offsetWidth
      img.classList.add('up')
    }
  }

  tabs.forEach((t, k) => t.addEventListener('click', () => { cur = k; render(false) }))
  tabBar.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const n = (cur + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length
    tabs[n].focus()
    tabs[n].click()
  })
  up.addEventListener('click', () => {
    if (cur === ARENA || levels[cur] >= 4) return
    levels[cur] += 1
    render(true)
  })
  render(false)
}
