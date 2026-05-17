import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

export function initPhase1(onComplete) {
  const lenis = _initLenis()
  _addScrollHint()
  _addProgressDots()
  _animateScenes(lenis, onComplete)
}

// ── Lenis smooth scroll ──────────────────────────────────────────────────────

function _initLenis() {
  const lenis = new Lenis({ lerp: 0.08 })

  lenis.on('scroll', () => ScrollTrigger.update())

  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)

  return lenis
}

// ── Scroll hint arrow (hides after first scene leaves) ───────────────────────

function _addScrollHint() {
  const hint = document.createElement('div')
  hint.className = 'scroll-hint'
  hint.innerHTML = `
    <span>Scroll</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `
  document.body.appendChild(hint)

  ScrollTrigger.create({
    trigger: '.story-scene[data-scene="0"]',
    start: 'bottom 80%',
    onEnter: () => gsap.to(hint, { opacity: 0, duration: 0.4, pointerEvents: 'none' }),
    onLeaveBack: () => gsap.to(hint, { opacity: 1, duration: 0.4, pointerEvents: 'none' }),
  })
}

// ── Progress dots ─────────────────────────────────────────────────────────────

function _addProgressDots() {
  const scenes = document.querySelectorAll('.story-scene')
  const nav = document.createElement('nav')
  nav.className = 'story-dots'
  nav.setAttribute('aria-hidden', 'true')

  scenes.forEach((_, i) => {
    const dot = document.createElement('div')
    dot.className = 'story-dot' + (i === 0 ? ' active' : '')
    nav.appendChild(dot)
  })

  document.body.appendChild(nav)

  const dots = nav.querySelectorAll('.story-dot')

  scenes.forEach((scene, i) => {
    ScrollTrigger.create({
      trigger: scene,
      start: 'top 60%',
      end: 'bottom 60%',
      onEnter: ()     => _setActiveDot(dots, i),
      onEnterBack: () => _setActiveDot(dots, i),
    })
  })
}

function _setActiveDot(dots, index) {
  dots.forEach((d, i) => d.classList.toggle('active', i === index))
}

// ── Per-scene word-by-word animation ─────────────────────────────────────────

function _animateScenes(lenis, onComplete) {
  const scenes = document.querySelectorAll('.story-scene')

  scenes.forEach((scene, i) => {
    const textEl = scene.querySelector('.story-text')
    const split  = new SplitText(textEl, { type: 'words' })

    // Start fully hidden
    gsap.set(split.words, { opacity: 0, y: 24, filter: 'blur(6px)' })

    const isLast = i === scenes.length - 1
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: '+=1400',
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
        // Last scene fires the transition when the user scrolls past it
        onLeave: isLast ? () => _transition(lenis, onComplete) : undefined,
      },
    })

    // Words appear staggered as scroll progresses
    tl.to(split.words, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      stagger: 0.06,
      duration: 0.4,
      ease: 'power2.out',
    })
    // Hold fully visible before next scene
    .to({}, { duration: 0.3 })
  })
}

// ── Phase 1 → Phase 2 transition ─────────────────────────────────────────────

function _transition(lenis, onComplete) {
  lenis.stop()
  ScrollTrigger.getAll().forEach((t) => t.kill())

  const overlay = document.getElementById('transition-overlay')

  gsap.to(overlay, {
    opacity: 1,
    duration: 0.6,
    ease: 'power2.inOut',
    onComplete: () => {
      lenis.destroy()
      onComplete()

      gsap.to(overlay, { opacity: 0, duration: 0.5, delay: 0.1, ease: 'power2.out' })
    },
  })
}
