const BASE_URL = import.meta.env.VITE_AGENTFORCE_URL    || ''
const API_KEY  = import.meta.env.VITE_AGENTFORCE_API_KEY || ''

const TYPEWRITER_SPEED = 22 // ms por carácter

let sessionId = null

/**
 * Fase 3: chat propio con efecto typewriter conectado a Agentforce REST API.
 * @param {string} customerId  Contenido del QR escaneado en Fase 2
 */
export async function initPhase3(customerId) {
  const messagesEl = document.getElementById('chat-messages')
  const form       = document.getElementById('chat-form')
  const input      = document.getElementById('chat-input')

  const typingEl = _addTyping(messagesEl)

  try {
    sessionId = await _createSession(customerId)
    typingEl.remove()
    await _typewrite(messagesEl, '¡Hola! Estoy listo para ayudarte.')
  } catch (err) {
    console.error('Session error:', err)
    typingEl.remove()
    await _typewrite(messagesEl, 'No se pudo conectar con el agente. Revisa la configuración.')
    return
  }

  input.disabled = false
  input.focus()

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = input.value.trim()
    if (!text) return

    input.value    = ''
    input.disabled = true

    _addUserBubble(messagesEl, text)

    const typingEl2 = _addTyping(messagesEl)

    try {
      const reply = await _sendMessage(text)
      typingEl2.remove()
      await _typewrite(messagesEl, reply)
    } catch (err) {
      console.error('Message error:', err)
      typingEl2.remove()
      await _typewrite(messagesEl, 'Error al enviar el mensaje.')
    } finally {
      input.disabled = false
      input.focus()
    }
  })
}

// ── Agentforce REST API ───────────────────────────────────────────────────────

async function _createSession(customerId) {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ context: customerId }),
  })
  if (!res.ok) throw new Error(`Session ${res.status}`)
  const data = await res.json()
  return data.sessionId ?? data.id
}

async function _sendMessage(text) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ message: text }),
  })
  if (!res.ok) throw new Error(`Message ${res.status}`)
  const data = await res.json()
  return data.reply ?? data.message ?? JSON.stringify(data)
}

function _headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function _addUserBubble(container, text) {
  const bubble = document.createElement('div')
  bubble.className  = 'chat-bubble user'
  bubble.textContent = text
  container.appendChild(bubble)
  container.scrollTop = container.scrollHeight
}

function _addTyping(container) {
  const bubble = document.createElement('div')
  bubble.className = 'chat-bubble typing'
  bubble.innerHTML = `
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `
  container.appendChild(bubble)
  container.scrollTop = container.scrollHeight
  return bubble
}

// Escribe el texto letra a letra en una burbuja de agente
function _typewrite(container, text) {
  return new Promise((resolve) => {
    const bubble = document.createElement('div')
    bubble.className = 'chat-bubble agent'

    const cursor = document.createElement('span')
    cursor.className = 'tw-cursor'
    bubble.appendChild(cursor)

    container.appendChild(bubble)
    container.scrollTop = container.scrollHeight

    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        bubble.insertBefore(document.createTextNode(text[i]), cursor)
        i++
        container.scrollTop = container.scrollHeight
      } else {
        clearInterval(interval)
        // Cursor se desvanece al terminar
        cursor.style.transition = 'opacity 0.4s'
        cursor.style.opacity    = '0'
        setTimeout(() => { cursor.remove(); resolve() }, 450)
      }
    }, TYPEWRITER_SPEED)
  })
}
