import './style.css'
import { initPhase1 } from './phases/phase1.js'
import { initPhase2 } from './phases/phase2.js'
import { initPhase3 } from './phases/phase3.js'

const phase1El = document.getElementById('phase-1')
const phase2El = document.getElementById('phase-2')
const phase3El = document.getElementById('phase-3')

// ── Phase transitions ─────────────────────────────────────────────────────────

function startPhase2() {
  phase1El.style.display = 'none'
  phase2El.classList.remove('phase-hidden')
  window.scrollTo(0, 0)
  initPhase2(startPhase3)
}

function startPhase3(qrContent) {
  phase2El.classList.add('phase-hidden')
  phase3El.classList.remove('phase-hidden')
  window.scrollTo(0, 0)
  initPhase3(qrContent)
}

// ── Boot ──────────────────────────────────────────────────────────────────────

initPhase1(startPhase2)
