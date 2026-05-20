const TYPEWRITER_SPEED = 22 // ms por carácter

let sessionId   = null
let sequenceId  = 1

/**
 * Fase 3: chat propio con Agentforce via Vercel Functions.
 * Las credenciales viven solo en el servidor — el cliente solo llama /api/*.
 *
 * @param {string} customerId  Contenido del QR escaneado en Fase 2
 */
export async function initPhase3(customerId) {
  const messagesEl = document.getElementById('chat-messages')
  const form       = document.getElementById('chat-form')
  const input      = document.getElementById('chat-input')
  const sendBtn    = form.querySelector('button[type="submit"]')

  const typingEl = _addTyping(messagesEl)

  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    })

    if (!res.ok) throw new Error(`Session ${res.status}`)
    const data = await res.json()
    sessionId = data.sessionId

    typingEl.remove()
    await _typewrite(messagesEl, '¡Hola! ¿En qué puedo ayudarte hoy?')
  } catch (err) {
    console.error('Session error:', err)
    typingEl.remove()
    await _typewrite(messagesEl, 'No se pudo conectar con el agente. Intenta de nuevo.')
    return
  }

  input.disabled   = false
  sendBtn.disabled = false
  input.focus()

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = input.value.trim()
    if (!text || input.disabled) return

    input.value      = ''
    input.disabled   = true
    sendBtn.disabled = true

    _addUserBubble(messagesEl, text)

    const typingEl2 = _addTyping(messagesEl)

    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, sequenceId: sequenceId++ }),
      })

      if (!res.ok) throw new Error(`Message ${res.status}`)
      const data = await res.json()

      typingEl2.remove()
      await _typewrite(messagesEl, data.reply)
    } catch (err) {
      console.error('Message error:', err)
      typingEl2.remove()
      await _typewrite(messagesEl, 'Error al enviar el mensaje. Intenta de nuevo.')
    } finally {
      input.disabled   = false
      sendBtn.disabled = false
      input.focus()
    }
  })
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function _addUserBubble(container, text) {
  const bubble = document.createElement('div')
  bubble.className   = 'chat-bubble user'
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
        cursor.style.transition = 'opacity 0.4s'
        cursor.style.opacity    = '0'
        setTimeout(() => { cursor.remove(); resolve() }, 450)
      }
    }, TYPEWRITER_SPEED)
  })
}
