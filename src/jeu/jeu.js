// Page /jeu : tout le texte est dans le HTML, ce script ajoute la couche de jeu
// (quête de lecture, EXP, Dodji, mini-quiz, bâtiments à faire évoluer).
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const root = $('.jeu')
if (root) init()

function init() {
  root.classList.add('js')

  /* ---------- État du joueur (le temps de la visite) ---------- */
  const XP_PER_LEVEL = 100
  const state = { xp: 0, level: 1, dodji: 0, quests: new Set() }
  const bar = $('.jq')
  const fill = $('.jq-fill')
  const qName = $('.jq-name')
  const lvlEl = $('.jq-lvlnum')
  const countEl = $('.jq-count')
  const questSecs = $$('.jsec[data-quest]')
  const total = questSecs.length
  if (bar) {
    bar.hidden = false
    $('.jq-bar').setAttribute('aria-valuemax', String(total))
  }

  function pop(text, icon, x, y) {
    if (reduced) return
    const el = document.createElement('span')
    el.className = 'jpop'
    el.innerHTML = `${icon ? `<img src="${icon}" alt="">` : ''}${text}`
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1050)
  }
  function toast(text) {
    const el = document.createElement('div')
    el.className = 'jtoast'
    el.setAttribute('role', 'status')
    el.innerHTML = `<img src="/landing/img/MascotteHappy.svg" alt="">${text}`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2500)
  }
  function bump(el) {
    if (!el || reduced) return
    el.classList.remove('bump')
    void el.offsetWidth
    el.classList.add('bump')
  }
  function originOf(el) {
    const r = el.getBoundingClientRect()
    return [r.left + r.width / 2, r.top + Math.min(r.height / 2, 60)]
  }

  function reward({ dodji = 0, xp = 0, from }) {
    const [x, y] = from ? originOf(from) : [window.innerWidth / 2, 160]
    if (dodji) {
      state.dodji += dodji
      countEl.textContent = state.dodji.toLocaleString('fr-FR')
      bump($('.jq-dodji'))
      pop(`+${dodji}`, '/landing/img/DodjiPiece.svg', x - 30, y)
    }
    if (xp) {
      state.xp += xp
      setTimeout(() => pop(`+${xp} EXP`, '', x + 40, y + 10), 140)
      const lvl = 1 + Math.floor(state.xp / XP_PER_LEVEL)
      if (lvl > state.level) {
        state.level = lvl
        lvlEl.textContent = `Niv. ${lvl}`
        bump($('.jq-lvl'))
        toast(lvl >= 5 ? `Niveau ${lvl} ! L'Arène est ouverte` : `Niveau ${lvl} !`)
        refreshArena()
      }
    }
  }

  /* ---------- Quête de lecture ---------- */
  function refreshQuest() {
    const done = state.quests.size
    fill.style.transform = `scaleX(${done / total})`
    $('.jq-bar').setAttribute('aria-valuenow', String(done))
    const next = questSecs.find((s) => !state.quests.has(s.id))
    if (next) {
      qName.textContent = `${next.dataset.quest} (${done}/${total})`
    } else {
      qName.textContent = 'terminée, à toi de jouer !'
      bar.classList.add('done')
    }
  }
  refreshQuest()

  // Sommaire, construit depuis les sections de la quête (hors du HTML pour garder la version texte propre)
  const TOC_LABELS = { boucle: 'La boucle', lecon: 'Une leçon', ressources: 'Les ressources', ile: "L'île", batiments: 'Les bâtiments', rendezvous: 'Chaque jour', gratuit: 'Gratuit ou DodjeOne', faq: 'FAQ' }
  const toc = document.createElement('nav')
  toc.className = 'jtoc'
  toc.setAttribute('aria-label', 'Sommaire')
  questSecs.forEach((s, i) => {
    const a = document.createElement('a')
    a.href = `#${s.id}`
    a.innerHTML = `<span>${i + 1}</span>${TOC_LABELS[s.id] || s.dataset.quest}`
    toc.appendChild(a)
  })
  $('.jhero')?.after(toc)
  const tocLinks = new Map($$('a', toc).map((a) => [a.getAttribute('href').slice(1), a]))
  function completeQuest(sec) {
    if (state.quests.has(sec.id)) return
    state.quests.add(sec.id)
    tocLinks.get(sec.id)?.classList.add('done')
    reward({ dodji: 25, xp: 40, from: $('.jh2', sec) || sec })
    refreshQuest()
    if (state.quests.size === total) setTimeout(() => toast('Quête terminée : tu sais tout de Dodje !'), 900)
  }

  // Apparition des sections et validation de la quête quand on lit la section
  const secs = $$('.jsec')
  if ('IntersectionObserver' in window) {
    const seenIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('seen')
        seenIo.unobserve(e.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
    secs.forEach((s) => seenIo.observe(s))

    const questIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        completeQuest(e.target)
        questIo.unobserve(e.target)
      })
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 })
    questSecs.forEach((s) => questIo.observe(s))

    const curIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const a = tocLinks.get(e.target.id)
        if (a) a.classList.toggle('cur', e.isIntersecting)
      })
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 })
    secs.forEach((s) => s.id && curIo.observe(s))
  } else {
    secs.forEach((s) => s.classList.add('seen'))
  }

  /* ---------- Mini-quiz ---------- */
  const quiz = $('#jquiz')
  if (quiz) {
    let lives = 10
    const livesEl = $('.jquiz-livesn', quiz)
    const fb = $('.jquiz-fb', quiz)
    $$('.jans', quiz).forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return
        if (btn.dataset.ok === '1') {
          btn.classList.add('ok')
          $$('.jans', quiz).forEach((b) => { b.disabled = true })
          fb.hidden = false
          fb.innerHTML = '<b>Bonne réponse !</b> 20 % de 2 000 €, ça fait 400 € par mois. Dans l\'app, chaque module se termine par un quiz comme celui-ci.'
          reward({ dodji: 50, xp: 60, from: btn })
        } else {
          btn.classList.add('ko')
          btn.disabled = true
          lives = Math.max(0, lives - 1)
          livesEl.textContent = String(lives)
          bump($('.jquiz-lives', quiz))
          fb.hidden = false
          fb.innerHTML = '<b>Raté, une vie en moins.</b> Indice : la règle 50/30/20 met 20 % de côté. Elle reviendra dans une heure, dans l\'app.'
        }
      })
    })
  }

  /* ---------- Bâtiments ---------- */
  const NAMES = ["L'atelier", 'Le moulin', 'La réserve', 'Le phare', "L'agence", 'La foreuse', "L'Arène"]
  const ARENA = 6
  const levels = [0, 0, 0, 0, 0, 0, 1]
  let cur = 0
  const bat = $('.jbat')
  if (bat) {
    bat.classList.add('js')
    const cards = $$('.jbat-card', bat)
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
      t.textContent = $('h3', c)?.textContent || NAMES[k]
      tabBar.appendChild(t)
    })
    bat.prepend(tabBar)
    const stage = document.createElement('div')
    stage.className = 'jbat-stage'
    stage.innerHTML = `<div class="jbat-vis"><img class="jbat-img" src="/jeu/bat/1_lvl0.webp" alt="" width="480" height="480"></div>
      <div class="jbat-ctrl"><span class="jbat-lvl" aria-live="polite"></span><div class="jbat-pips" aria-hidden="true"><i></i><i></i><i></i><i></i></div><button type="button" class="cta jbat-up"></button></div>`
    $('.jbat-body', bat).prepend(stage)
    const img = $('.jbat-img', bat)
    const lvlB = $('.jbat-lvl', bat)
    const pips = $$('.jbat-pips i', bat)
    const up = $('.jbat-up', bat)
    const tabs = $$('[role="tab"]', tabBar)
    const src = (i, l) => `/jeu/bat/${i + 1}_lvl${l}.webp`

    // Précharge les niveaux du bâtiment affiché
    const preload = (i) => {
      if (i === ARENA) return
      for (let l = 0; l <= 4; l++) { const im = new Image(); im.src = src(i, l) }
    }

    function render(anim) {
      const l = levels[cur]
      const isArena = cur === ARENA
      img.src = isArena ? '/jeu/bat/7_lvl1.webp' : src(cur, l)
      const locked = isArena && state.level < 5
      img.style.filter = locked ? 'grayscale(1) brightness(.7) drop-shadow(0 14px 16px rgba(10,4,0,.3))' : ''
      img.alt = isArena ? `${NAMES[cur]}${locked ? ', verrouillée' : ''}` : `${NAMES[cur]}, ${l === 0 ? 'en ruine' : `niveau ${l}`}`
      if (isArena) {
        lvlB.innerHTML = locked ? 'Ouvre au <b>niveau 5</b>' : '<b>Ouverte</b>, rendez-vous lundi'
        pips.forEach((p) => { p.parentElement.hidden = true })
        up.disabled = true
        up.textContent = locked ? `Ton niveau : ${state.level} sur 5` : 'Prête pour le tournoi'
      } else {
        pips[0].parentElement.hidden = false
        lvlB.innerHTML = l === 0 ? '<b>En ruine</b>' : `Niveau <b>${l}</b> sur 4`
        pips.forEach((p, k) => p.classList.toggle('on', k < l))
        up.disabled = l >= 4
        up.textContent = l === 0 ? 'Construire' : l >= 4 ? 'Niveau max atteint' : `Améliorer au niveau ${l + 1}`
      }
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === cur))
        t.tabIndex = k === cur ? 0 : -1
      })
      cards.forEach((c, k) => c.classList.toggle('on', k === cur))
      if (anim && !reduced) {
        img.classList.remove('up')
        void img.offsetWidth
        img.classList.add('up')
      }
    }
    window.__refreshArena = () => { if (cur === ARENA) render(false) }

    tabs.forEach((t, k) => t.addEventListener('click', () => {
      cur = k
      preload(k)
      render(false)
    }))
    // Flèches du clavier entre les onglets
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
      reward({ xp: 15, from: img })
    })
    preload(0)
    render(false)
  }

  function refreshArena() {
    if (typeof window.__refreshArena === 'function') window.__refreshArena()
  }
}
