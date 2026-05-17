/**
 * Fase 3: conversación con un agente Agentforce.
 *
 * Necesitarás las siguientes variables de entorno en un archivo .env:
 *   VITE_AGENTFORCE_URL       – endpoint REST de la sesión de Agentforce
 *   VITE_AGENTFORCE_API_KEY   – API key / Bearer token
 *
 * El flujo es:
 *   1. POST /sessions           → obtiene sessionId
 *   2. POST /sessions/:id/messages → envía mensaje y recibe respuesta del agente
 */

const BASE_URL = import.meta.env.VITE_AGENTFORCE_URL  || ''
const API_KEY  = import.meta.env.VITE_AGENTFORCE_API_KEY || ''

let sessionId = null

/**
 * @param {string} qrContent  Contenido del QR escaneado en Fase 2
 */
export async function initPhase3(qrContent) {
  const messagesEl = document.getElementById('chat-messages')
  const form       = document.getElementById('chat-form')
  const input      = document.getElementById('chat-input')

  _addBubble(messagesEl, 'typing', 'Conectando con el agente…')

  try {
    sessionId = await _createSession(qrContent)
    _clearBubbles(messagesEl)
    _addBubble(messagesEl, 'agent', `Sesión iniciada. Contenido del QR: "${qrContent}"`)
  } catch (err) {
    console.error('Agentforce session error:', err)
    _clearBubbles(messagesEl)
    _addBubble(messagesEl, 'agent', 'No se pudo conectar con el agente. Revisa la configuración.')
    return
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = input.value.trim()
    if (!text) return

    input.value = ''
    _addBubble(messagesEl, 'user', text)

    const typingEl = _addBubble(messagesEl, 'typing', 'Escribiendo…')

    try {
      const reply = await _sendMessage(text)
      typingEl.remove()
      _addBubble(messagesEl, 'agent', reply)
    } catch (err) {
      console.error('Agentforce message error:', err)
      typingEl.remove()
      _addBubble(messagesEl, 'agent', 'Error al enviar el mensaje.')
    }
  })
}

// ── Agentforce API helpers ────────────────────────────────────────────────────

async function _createSession(qrContent) {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ context: qrContent }),
  })

  if (!res.ok) throw new Error(`Session error: ${res.status}`)
  const data = await res.json()
  // Ajusta el campo según la respuesta real de Agentforce
  return data.sessionId ?? data.id
}

async function _sendMessage(text) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ message: text }),
  })

  if (!res.ok) throw new Error(`Message error: ${res.status}`)
  const data = await res.json()
  // Ajusta el campo según la respuesta real de Agentforce
  return data.reply ?? data.message ?? JSON.stringify(data)
}

function _headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function _addBubble(container, type, text) {
  const bubble = document.createElement('div')
  bubble.className = `chat-bubble ${type}`
  bubble.textContent = text
  container.appendChild(bubble)
  container.scrollTop = container.scrollHeight
  return bubble
}

function _clearBubbles(container) {
  container.innerHTML = ''
}
