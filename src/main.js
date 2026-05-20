import './style.css'
import { gsap } from 'gsap'
import { initPhase1 } from './phases/phase1.js'
import { initPhase2 } from './phases/phase2.js'
import { initPhase3, preloadWidget } from './phases/phase3.js'

const phase1El  = document.getElementById('phase-1')
const phase2El  = document.getElementById('phase-2')
const phase3El  = document.getElementById('phase-3')
const overlay   = document.getElementById('transition-overlay')

// ── Phase transitions ─────────────────────────────────────────────────────────

function startPhase2() {
  phase1El.style.display = 'none'
  phase2El.classList.remove('phase-hidden')
  window.scrollTo(0, 0)
  preloadWidget()
  initPhase2(startPhase3)
}

function startPhase3(qrContent) {
  gsap.to(overlay, {
    opacity: 1,
    duration: 0.5,
    ease: 'power2.inOut',
    onComplete: () => {
      phase2El.classList.add('phase-hidden')
      phase3El.classList.remove('phase-hidden')
      window.scrollTo(0, 0)
      initPhase3(qrContent)
      gsap.to(overlay, { opacity: 0, duration: 0.5, delay: 0.15, ease: 'power2.out' })
    },
  })
}

// ── Boot ──────────────────────────────────────────────────────────────────────

initPhase1(startPhase2)
