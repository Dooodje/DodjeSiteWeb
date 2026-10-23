// Landing Dodje : tout le texte est dans le HTML, ce script ajoute le jeu.
import './landing.css'
import { CHAPTERS, BUILDINGS, QUIZ } from './data.js'

const APP_STORE = 'https://apps.apple.com/fr/app/dodje-finance-jeux-le%C3%A7ons/id6743447215'
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=xyz.dodje.app&hl=fr'
const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const L = (name) => `/landing/lottie/${name}.json`

const state = {
  tab: 'top', dodji: 0, sel: 5, pil: 0, mk: 0, batIdx: 0, batN: 0,
  tb: 1, step: 0, q1: null, checked: false, fbOpen: false, swAns: null, slide: 0, slideN: 0,
  score: 0, phase: 'q'
}

/* ---------- Lien de téléchargement selon le téléphone ---------- */
const storeHref = /android/i.test(navigator.userAgent) ? PLAY_STORE : APP_STORE
$$('.dlhref').forEach((a) => { a.href = storeHref })

/* ---------- Animations Lottie de l'app : chargées à l'approche, en pause hors écran ---------- */
let lottiePromise = null
const lottieLib = () => (lottiePromise ||= import('lottie-web/build/player/lottie_light').then((m) => m.default || m))
const jsonCache = new Map()
const lotJson = (src) => {
  if (!jsonCache.has(src)) jsonCache.set(src, fetch(src).then((r) => r.text()))
  return jsonCache.get(src)
}
function hideLargeBlack(el) {
  el.querySelectorAll('path,rect,ellipse').forEach((n) => {
    const fill = (n.getAttribute('fill') || '').replace(/\s/g, '').toLowerCase()
    if (fill !== 'rgb(0,0,0)' && fill !== '#000' && fill !== '#000000') return
    const b = n.getBoundingClientRect()
    if (b.width > 70 && b.height > 28) n.setAttribute('fill', 'none')
  })
}
function syncLots() {
  const vh = window.innerHeight, vw = window.innerWidth
  $$('[data-lot]').forEach((el) => {
    const src = el.dataset.lot
    const pilOff = el.dataset.pil !== undefined && !el.classList.contains('pilon')
    if (!src || el.hidden || (pilOff && el.__anim)) { if (el.__anim && !el.__paused) { el.__anim.pause(); el.__paused = true } return }
    const r = el.getBoundingClientRect()
    const near = r.width > 0 && r.bottom > -vh * 0.4 && r.top < vh * 1.4 && r.right > -vw * 0.2 && r.left < vw * 1.2
    const loop = el.dataset.loop === '1'
    const from = Number(el.dataset.from || 0)
    const nofond = el.dataset.nofond === '1'
    const key = src + '|' + loop + (from ? '|f' + from : '') + (nofond ? '|nf2' : '')
    if (el.__lk !== key) {
      if (!near && !el.dataset.eager) return
      if (el.__anim) { el.__anim.destroy(); el.__anim = null }
      el.__lk = key; el.__paused = false
      Promise.all([lottieLib(), lotJson(src)]).then(([lottie, txt]) => {
        if (el.__lk !== key) return
        const data = JSON.parse(txt)
        if (nofond) data.layers = data.layers.filter((l) => l.nm !== 'Fond noir' && l.nm !== 'Calque de forme 1')
        const anim = lottie.loadAnimation({
          container: el, renderer: 'svg', loop, autoplay: !reduced && !from, animationData: data,
          rendererSettings: { preserveAspectRatio: el.dataset.cover === '1' ? 'xMidYMid slice' : 'xMidYMid meet' }
        })
        el.__anim = anim
        anim.addEventListener('DOMLoaded', () => {
          el.classList.add('ready')
          if (nofond) hideLargeBlack(el)
          if (!reduced && from) anim.goToAndPlay(from, true)
        })
        if (reduced) anim.goToAndStop(Math.floor(anim.totalFrames * (from ? 0.62 : 0.5)), true)
      })
    } else if (el.__anim && loop && !reduced) {
      if (near && el.__paused) { el.__anim.play(); el.__paused = false }
      else if (!near && !el.__paused) { el.__anim.pause(); el.__paused = true }
    }
  })
}

/* ---------- Le saut des sections (0,9 → 1,06 → 0,978 → 1, cascade de 40 ms) ---------- */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target) } })
  }, { threshold: 0.18 })
  $$('.sec, .sitefoot').forEach((s) => io.observe(s))
} else document.body.classList.add('noio')

/* ---------- Navbar, barre de téléchargement, Dodji ---------- */
const SECTIONS = ['top', 'dodje', 'ile', 'test', 'investir', 'batiments', 'community', 'faq-home', 'telecharger']
let raf = 0
function onScroll() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    let current = 'top'
    for (const id of SECTIONS) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < window.innerHeight * 0.5) current = id }
    state.tab = current
    syncBatAuto()
    $$('.navlink').forEach((a) => { const on = a.getAttribute('href') === '#' + current; a.classList.toggle('cur', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current') })
    const end = document.getElementById('telecharger')
    const endNear = !!end && end.getBoundingClientRect().top < window.innerHeight * 0.6
    $('.dlbar').classList.toggle('off', current === 'top' || endNear)
    syncLots()
  })
}
window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll)

// Compteur de Dodji : le chiffre défile jusqu'au nouveau total et un « +X » vert s'envole
let countRaf = 0, shown = 0
function rollCount(to) {
  const el = $('.dodjicount'), from = shown, t0 = performance.now(), dur = reduced ? 0 : Math.min(900, 380 + (to - from) * 4)
  cancelAnimationFrame(countRaf)
  const tick = (t) => {
    const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3)
    shown = Math.round(from + (to - from) * e)
    el.textContent = shown.toLocaleString('fr-FR')
    if (k < 1) countRaf = requestAnimationFrame(tick)
  }
  countRaf = requestAnimationFrame(tick)
}
function gain(n) {
  state.dodji += n
  const pill = $('.dodjipill')
  pill.hidden = false
  rollCount(state.dodji)
  const plus = document.createElement('span')
  plus.className = 'dodjiplus'
  plus.textContent = '+' + n.toLocaleString('fr-FR')
  pill.appendChild(plus)
  plus.addEventListener('animationend', () => plus.remove())
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump')
  $('.dltitle').textContent = `Tes ${state.dodji} Dodji t'attendent`
}

/* ---------- 2. La porte d'entrée : trois textes, trois animations ---------- */
let pilTimer = 0
function showPil(i) {
  state.pil = i
  // Fondu enchaîné : les trois textes et les trois animations sont superposés, seul l'actif est visible
  $$('.pilpane').forEach((p) => { const on = +p.dataset.pil === i; p.classList.toggle('pilon', on); p.setAttribute('aria-hidden', String(!on)) })
  $$('.pilvis .lot').forEach((l) => {
    const on = +l.dataset.pil === i
    l.classList.toggle('pilon', on)
    if (on && l.__anim && l.__paused) { l.__anim.play(); l.__paused = false }
  })
  $$('.pbar').forEach((b) => {
    const k = +b.dataset.pil
    b.classList.remove('on', 'done'); void b.offsetWidth
    if (k === i) b.classList.add('on'); else if (k < i) b.classList.add('done')
    b.setAttribute('aria-selected', String(k === i))
  })
  syncLots()
}
function startPil() {
  clearInterval(pilTimer)
  pilTimer = setInterval(() => { if (state.tab === 'dodje' && !document.hidden) showPil((state.pil + 1) % 3) }, 4000)
}
$$('.pbar').forEach((b) => b.addEventListener('click', () => { showPil(+b.dataset.pil); startPil() }))
startPil()

/* ---------- 3. L'île ---------- */
// Le zoom de l'Arène est sur l'image. On ne la retire qu'une fois la suivante
// décodée, sinon l'image encore affichée se dézoome avant le changement.
const layerToken = { card: 0, test: 0 }
function swapLayer(img, n, bucket, onReady) {
  if (!img) return
  const arena = n === 16
  const token = ++layerToken[bucket]
  const commitCard = (el) => { if (bucket === 'card') el.parentElement.classList.toggle('arena', arena) }
  if (img.dataset.n === String(n)) {
    img.classList.toggle('arena', arena)
    commitCard(img)
    if (onReady) onReady()
    return
  }
  const next = document.createElement('img')
  next.className = img.className
  next.classList.toggle('arena', arena)
  next.alt = ''
  const w = img.getAttribute('width'), h = img.getAttribute('height')
  if (w) next.setAttribute('width', w)
  if (h) next.setAttribute('height', h)
  next.decoding = 'sync'
  next.dataset.n = String(n)
  next.src = `/landing/chapitres/${n}.webp`
  const commit = () => {
    if (layerToken[bucket] !== token || !img.isConnected) return
    img.replaceWith(next)
    commitCard(next)
    if (onReady) onReady()
  }
  if (typeof next.decode === 'function') next.decode().then(commit, commit)
  else if (next.complete) commit()
  else {
    next.addEventListener('load', commit, { once: true })
    next.addEventListener('error', commit, { once: true })
  }
}
function selectBiome(n) {
  state.sel = n
  $$('.biome').forEach((b) => { const on = +b.dataset.n === n; b.setAttribute('aria-pressed', String(on)); b.style.zIndex = on ? 30 : 10 + +b.dataset.n })
  $$('.mapchip').forEach((c) => c.classList.toggle('sel', +c.dataset.n === n))
  const c = CHAPTERS[n], card = $('.chcard')
  swapLayer($('.chbg', card), n, 'card', () => {
    $('.chsub', card).textContent = c.sub
    $('.chtitle', card).textContent = c.title
    $('.chdesc', card).textContent = c.desc
  })
  setTestBiome(n)
}
$$('.biome').forEach((b) => b.addEventListener('click', () => {
  selectBiome(+b.dataset.n)
  if (window.innerWidth < 980) setTimeout(() => $('.chcard').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60)
}))
$('.gotest').addEventListener('click', () => {
  document.getElementById('test').scrollIntoView({ behavior: 'smooth' })
})

/* ---------- 4. Teste ton niveau : le lecteur de module de l'app ---------- */
const DODJI = '/landing/img/DodjiPiece.svg'
function setTestBiome(n) {
  Object.assign(state, { tb: n, step: 0, q1: null, checked: false, fbOpen: false, swAns: null, slide: 0, score: 0, phase: 'q' })
  swapLayer($('.testbg'), n, 'test')
  $('.testname').textContent = CHAPTERS[n].name
  renderQuiz()
}
function quizHtml() {
  const s = state, [Q1, Q2, Q3] = QUIZ[s.tb] || QUIZ[1]
  const inQ = s.phase === 'q'
  const dots = [0, 1, 2].map((i) => {
    const done = i < s.step || !inQ || (i === s.step && s.checked), cur = i === s.step && inQ
    const bg = done || cur ? '#F3FF90' : '#2B2B2B', col = done || cur ? '#0A0400' : 'rgba(255,255,255,.6)'
    return `<span class="dot" style="background:${bg};color:${col}">${done ? '✓' : i + 1}</span>${i < 2 ? '<span class="dash"></span>' : ''}`
  }).join('')
  const body = s.step === 0 ? Q1[0] : s.step === 2 ? Q3[0] : ''
  let mid = ''
  if (s.step === 0) {
    mid = `<div class="enter qanswers">${Q1[1].map((a, i) => {
      const on = s.q1 === i
      return `<button class="ans${on ? ' on' : ''}" type="button" data-a="${i}" aria-pressed="${on}">${a}</button>`
    }).join('')}</div>`
  } else if (s.step === 1) {
    mid = `<div class="enter swzone"><div id="swcard" class="swcard"><p>${Q2[0]}</p></div>
      <div class="swbtns"><button class="swbtn" type="button" data-sw="0" aria-label="Faux"><svg viewBox="0 0 100 100" width="44" height="44" aria-hidden="true"><g fill="none" stroke="#EA2F4A" stroke-width="14" stroke-linecap="round"><path d="M30 30 L70 70"/><path d="M70 30 L30 70"/></g></svg></button>
      <button class="swbtn" type="button" data-sw="1" aria-label="Vrai"><svg viewBox="0 0 100 100" width="44" height="44" aria-hidden="true"><path d="M26 54 L44 72 L76 34" fill="none" stroke="#06D001" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>`
  } else {
    mid = `<div class="enter slidezone"><div class="panel slideval"><span class="slidelabel">${Q3[1][s.slide]}</span></div>
      <div class="slideRow"><button class="pm" type="button" data-pm="-1" aria-label="Moins">−</button>
      <div class="slidetrack"><div class="ticks" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<span class="tick${i <= s.slide ? ' on' : ''}"></span>`).join('')}</div>
      <input id="slideRange" class="range" type="range" min="0" max="3" step="0.01" value="${s.slide}" aria-label="Choisis une valeur" aria-valuetext="${Q3[1][s.slide]}"></div>
      <button class="pm" type="button" data-pm="1" aria-label="Plus">+</button></div></div>`
  }
  const canAnswer = inQ && !s.checked && ((s.step === 0 && s.q1 !== null) || s.step === 2)
  const bot = canAnswer ? '<button class="cta submit" type="button" style="width:100%">Réponse</button>' : `<span class="cta-off" style="width:100%">${s.step === 1 ? 'Swipe la carte' : 'Réponse'}</span>`

  let over = ''
  if (inQ && s.fbOpen) {
    const ok = s.step === 0 ? s.q1 === Q1[2] : s.step === 1 ? s.swAns === Q2[1] : s.slide === Q3[2]
    const txt = s.step === 0 ? Q1[3] : s.step === 1 ? Q2[2] : Q3[3]
    const col = ok ? '#06D001' : '#EA2F4A'
    const title = ok ? ['Bien vu !', 'Bien joué !', 'Exactement !'][s.step] : ['Presque !', 'Pas tout à fait.', 'Oups !'][s.step]
    const fbLot = ok
      ? `<div class="lot fblot" data-lot="${L('fb-bonne')}" data-loop="1" aria-hidden="true"></div>`
      : `<div class="lot fblot" data-lot="${L('fb-mauvaise')}" data-loop="1" aria-hidden="true"></div>`
    over = `<div class="fbwrap" role="dialog" aria-live="assertive"><div class="fbback"></div><div class="fbcard" style="background:${ok ? '#DCFFD9' : '#FFD9E1'}">
      ${fbLot}
      <b class="fbtitle" style="color:${col}">${title}</b><p class="fbtext" style="color:${col}">${txt}</p>
      <button class="press next" type="button" style="background:${col}">Suivant</button></div></div>`
  }
  if (s.phase === 'result') {
    const passed = s.score >= 2, label = passed ? 'Validé' : 'Échec'
    const vis = passed
      ? `<div class="resgain popin"><img src="${DODJI}" alt="" width="72" height="72"><b>+300</b><span>Dodji</span></div>`
      : `<div class="lot reslot" data-lot="${L('fb-mauvaise')}" data-loop="0" data-from="48" aria-hidden="true"></div>`
    over = `<div class="over enter resultov"><div class="resultin">
      <div class="reslabel" aria-label="${label}" style="color:${passed ? '#06D001' : '#EA2F4A'}">${[...label].map((c, i) => `<span class="letter" style="--i:${i}">${c}</span>`).join('')}</div>
      <span id="scorePct" class="respct">0%</span>
      <span class="resdet">${s.score}/3 bonnes réponses</span>
      <div class="resvis">${vis}</div></div>
      <div class="resfoot">${!passed ? '<button class="cta restart" type="button">Recommencer</button>' : '<a class="cta" href="#investir">Investir mes Dodjis</a>'}</div></div>`
  }
  return `<div class="topband"><div class="tbrow">
      <div class="dots" aria-label="Question ${Math.min(3, s.step + 1)} sur 3">${dots}</div></div>
      <span class="qtitle">Question ${s.step + 1}</span>${body ? `<p class="qbody">${body}</p>` : ''}</div>
    <div class="qmid">${mid}</div>
    <div id="swL" class="swglow swl"></div><div id="swR" class="swglow swr"></div>
    <div class="botband">${bot}</div>${over}`
}
function renderQuiz() {
  $('#quiz').innerHTML = quizHtml()
  syncLots()
}
function answer(good) {
  state.checked = true; state.fbOpen = true
  if (good) state.score++
  renderQuiz()
}
function rollScore(target) {
  const el = $('#scorePct'); if (!el) return
  const t0 = performance.now()
  const tick = (t) => { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(target * e) + '%'; if (k < 1) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  setTimeout(() => { el.textContent = target + '%' }, 950)
}
const quiz = $('#quiz')
quiz.addEventListener('click', (e) => {
  const t = e.target.closest('button, a')
  if (!t) return
  const [Q1, Q2, Q3] = QUIZ[state.tb] || QUIZ[1]
  if (t.dataset.a !== undefined && !state.checked) {
    // Comme dans l'app : seule la réponse touchée change, rien n'est redessiné
    state.q1 = +t.dataset.a
    $$('.ans', quiz).forEach((b) => { const on = b === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)) })
    const bot = $('.botband', quiz)
    if (bot && !$('.submit', bot)) bot.innerHTML = '<button class="cta submit" type="button" style="width:100%">Réponse</button>'
  }
  else if (t.dataset.sw !== undefined && !state.checked) { state.swAns = t.dataset.sw === '1'; answer(state.swAns === Q2[1]) }
  else if (t.dataset.pm) setSlide(state.slide + +t.dataset.pm, true)
  else if (t.classList.contains('submit')) {
    if (state.step === 0 && state.q1 !== null) answer(state.q1 === Q1[2])
    else if (state.step === 2) answer(state.slide === Q3[2])
  } else if (t.classList.contains('next')) {
    if (state.step >= 2) {
      state.phase = 'result'; state.fbOpen = false
      if (state.score >= 2 && state.dodji === 0) gain(300)
      renderQuiz(); rollScore(Math.round(state.score / 3 * 100))
    } else { state.step++; state.checked = false; state.fbOpen = false; renderQuiz() }
  } else if (t.classList.contains('restart')) setTestBiome(state.tb)
})
/* Curseur fluide : le pouce glisse et se cale sur la graduation la plus proche */
let glideRaf = 0, glideTo = 0
function glideThumb(target) {
  const el = $('#slideRange'); if (!el) return
  cancelAnimationFrame(glideRaf); clearTimeout(glideTo)
  const from = +el.value, t0 = performance.now()
  const tick = (t) => { const k = Math.min(1, (t - t0) / 220), e = 1 - Math.pow(1 - k, 3); el.value = String(from + (target - from) * e); if (k < 1) glideRaf = requestAnimationFrame(tick) }
  glideRaf = requestAnimationFrame(tick)
  glideTo = setTimeout(() => { cancelAnimationFrame(glideRaf); el.value = String(target) }, 260)
}
function setSlide(v, moveThumb) {
  if (state.checked) return
  const k = Math.max(0, Math.min(3, v)), [, , Q3] = QUIZ[state.tb] || QUIZ[1]
  if (moveThumb) glideThumb(k)
  if (k === state.slide) return
  state.slide = k; state.slideN++
  const lab = $('.slidelabel')
  if (lab) { lab.textContent = Q3[1][k]; lab.classList.remove('vA', 'vB'); void lab.offsetWidth; lab.classList.add(state.slideN % 2 ? 'vA' : 'vB') }
  $$('.tick').forEach((tk, i) => tk.classList.toggle('on', i <= k))
  const r = $('#slideRange'); if (r) r.setAttribute('aria-valuetext', Q3[1][k])
}
quiz.addEventListener('input', (e) => { if (e.target.id === 'slideRange') setSlide(Math.round(+e.target.value), false) })
;['pointerup', 'touchend', 'keyup', 'change'].forEach((ev) => quiz.addEventListener(ev, (e) => { if (e.target.id === 'slideRange' && !state.checked) glideThumb(state.slide) }))
/* Swipe : la carte suit le doigt, les bords s'allument en rouge ou en vert */
let drag = null
function swGlow(dx) {
  const l = $('#swL'), r = $('#swR')
  if (l) l.style.opacity = String(Math.max(0, Math.min(1, -dx / 140)))
  if (r) r.style.opacity = String(Math.max(0, Math.min(1, dx / 140)))
}
quiz.addEventListener('pointerdown', (e) => {
  const c = e.target.closest('#swcard'); if (!c || state.checked) return
  drag = { x: e.clientX, dx: 0, el: c }; c.classList.add('drag')
  try { c.setPointerCapture(e.pointerId) } catch (err) { /* rien */ }
})
quiz.addEventListener('pointermove', (e) => {
  if (!drag) return
  drag.dx = e.clientX - drag.x
  drag.el.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 18}deg)`
  swGlow(drag.dx)
})
const endDrag = () => {
  if (!drag) return
  const { dx, el } = drag; drag = null
  el.classList.remove('drag'); el.style.transform = ''; swGlow(0)
  if (Math.abs(dx) > 90 && !state.checked) { const [, Q2] = QUIZ[state.tb] || QUIZ[1]; state.swAns = dx > 0; answer(state.swAns === Q2[1]) }
}
quiz.addEventListener('pointerup', endDrag)
quiz.addEventListener('pointercancel', endDrag)

/* ---------- 5. Investir : S.E.V.E 5 (ETF) ou BIT-TRONC (altcoin), cours simulé en direct ---------- */
const MARKET = [
  { k: 'seve5', name: 'S.E.V.E 5', type: 'ETF', expl: "un panier d'entreprises en un seul achat, le risque est réparti.", base: 120, vol: 0.012, drift: 0.0025,
    locked: [['Actions', "une part d'une seule entreprise, plus de potentiel et plus de risque."]] },
  { k: 'bit', name: 'BIT-TRONC', type: 'Altcoin', expl: 'une crypto qui vit sur son propre réseau, sans être calée sur une monnaie.', base: 3400, vol: 0.04, drift: 0.003,
    locked: [['Stablecoin', 'calée sur le dollar, elle ne bouge presque pas.'], ['Memecoin', "née d'une blague, ultra spéculative."]] }
]
const LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="#777" stroke-width="2.4" stroke-linecap="round"/><rect x="5" y="10" width="14" height="10" rx="3" fill="#777"/></svg>'
let live = null
function step(a, v, rnd = Math.random) {
  const pull = (a.base - v) / a.base * 0.04
  return Math.max(a.base * 0.05, v * (1 + pull + a.drift * 0.15 + (rnd() + rnd() + rnd() - 1.5) * a.vol * 0.35))
}
function liveFor(a) {
  if (live && live.a === a) return live
  let seed = 7
  for (const ch of a.k) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const pts = []; let v = a.base
  for (let i = 0; i < 72; i++) { v = step(a, v, rnd); pts.push(v) }
  live = { a, pts, open: pts[0], size: 72 }
  return live
}
function drawLive() {
  const Lv = live, pts = Lv.pts, last = pts[pts.length - 1]
  const lmin = Math.min(Lv.open, ...pts), lmax = Math.max(Lv.open, ...pts)
  const pad = (lmax - lmin) * 0.18 || last * 0.01
  const ly = (v) => 8 + 104 * (1 - (v - (lmin - pad)) / (lmax - lmin + 2 * pad))
  const lx = (i) => i * 292 / (Lv.size - 1)
  const line = pts.map((v, i) => (i ? 'L' : 'M') + lx(i).toFixed(1) + ' ' + ly(v).toFixed(1)).join(' ')
  const up = last >= Lv.open, col = up ? '#06D001' : '#EA2F4A'
  const chg = (last / Lv.open - 1) * 100, dec = last < 10 ? 3 : 2
  $('#lvLine').setAttribute('d', line); $('#lvLine').setAttribute('stroke', col)
  $('#lvArea').setAttribute('d', line + ` L${lx(pts.length - 1).toFixed(1)} 120 L0 120 Z`)
  $('#lvBase').setAttribute('d', `M0 ${ly(Lv.open).toFixed(1)} L300 ${ly(Lv.open).toFixed(1)}`)
  $('#lvS1').setAttribute('stop-color', col); $('#lvS2').setAttribute('stop-color', col)
  const h = $('#lvHead'); h.style.left = (lx(pts.length - 1) / 3).toFixed(2) + '%'; h.style.top = (ly(last) / 1.2).toFixed(2) + '%'; h.style.background = col; h.style.color = col
  $('#lvPrice').textContent = last.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  $('#lvChg').textContent = (chg >= 0 ? '▲ ' : '▼ ') + Math.abs(chg).toFixed(2).replace('.', ',') + ' %'
  $('#lvChg').style.color = col; $('#lvDot').style.background = col
}
function setMarket(mk) {
  state.mk = mk
  const a = MARKET[mk]
  $('.tabs').classList.toggle('mk1', mk === 1)
  $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(+t.dataset.mk === mk)))
  $('.iname').textContent = a.name
  $('.itype').textContent = a.type; $('.itype2').textContent = a.type
  $('.iexpltxt').textContent = a.expl
  $('.ilockedlist').innerHTML = a.locked.map(([t, e]) => `<li>${LOCK}<span><b>${t}</b> : ${e}</span></li>`).join('')
  liveFor(a); drawLive()
}
$$('.tab').forEach((t) => t.addEventListener('click', () => setMarket(+t.dataset.mk)))
setInterval(() => {
  if (!live || state.tab !== 'investir' || document.hidden) return
  live.pts.push(step(live.a, live.pts[live.pts.length - 1]))
  if (live.pts.length > live.size) live.pts.shift()
  drawLive()
}, 1000)

/* ---------- 6. Bâtiments : carrousel + récolte gamifiée ---------- */
const track = $('#batTrack')
let batTimer = 0
let batHold = false
let batLive = false
function goBat(i, { wrap = false, instant = false } = {}) {
  const n = BUILDINGS.length
  const k = wrap ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i))
  const jump = instant || reduced
  if (jump) track.style.scrollBehavior = 'auto'
  track.scrollTo({ left: k * track.clientWidth, behavior: jump ? 'auto' : 'smooth' })
  if (jump) track.style.scrollBehavior = ''
  setBatIdx(k)
}
function startBat() {
  clearInterval(batTimer)
  batTimer = setInterval(() => {
    if (batHold || state.tab !== 'batiments' || document.hidden) return
    const next = (state.batIdx + 1) % BUILDINGS.length
    goBat(next, { wrap: true, instant: next === 0 })
  }, 4000)
}
function syncBatAuto() {
  if (state.tab === 'batiments') {
    if (!batLive) { batLive = true; startBat() }
  } else if (batLive) {
    batLive = false
    clearInterval(batTimer)
  }
}
function setBatIdx(k) {
  state.batIdx = k
  $$('.cdot').forEach((d, i) => d.classList.toggle('on', i === k))
  $('.batprev').disabled = k === 0
  $('.batnext').disabled = k === BUILDINGS.length - 1
}
track.addEventListener('scroll', () => {
  const k = Math.round(track.scrollLeft / Math.max(1, track.clientWidth))
  if (k !== state.batIdx) setBatIdx(k)
  syncLots()
}, { passive: true })
$('.batprev').addEventListener('click', () => { goBat(state.batIdx - 1); startBat() })
$('.batnext').addEventListener('click', () => { goBat(state.batIdx + 1); startBat() })
$$('.cdot').forEach((d) => d.addEventListener('click', () => { goBat(+d.dataset.i); startBat() }))
track.addEventListener('pointerdown', () => { batHold = true })
window.addEventListener('pointerup', () => { if (!batHold) return; batHold = false; startBat() })
window.addEventListener('pointercancel', () => { if (!batHold) return; batHold = false; startBat() })
const COINS = [[-90, -70], [-50, -120], [0, -140], [55, -115], [95, -65], [-110, -10], [110, -15]]
$$('.battap').forEach((b) => b.addEventListener('click', () => {
  state.batN++
  const p = state.batN % 2 ? 'A' : 'B'
  const box = $('.lotbox', b)
  box.classList.remove('bA', 'bB'); void box.offsetWidth; box.classList.add('b' + p)
  $('.batfx').innerHTML = COINS.map(([x, y]) => `<img class="burst p${p}" src="${DODJI}" alt="" style="--x:${x}px;--y:${y}px">`).join('') +
    `<span class="coinpop p${p}">+5 <img src="${DODJI}" alt="" width="30" height="30"></span>`
  gain(5)
}))

/* ---------- Démarrage ---------- */
setTestBiome(1)
setMarket(0)
setBatIdx(0)
onScroll()
syncLots()
