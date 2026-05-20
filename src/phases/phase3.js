const BOOTSTRAP_URL =
  'https://nt1779211331673.my.site.com/ESWWebQRDeployment1779234551621/assets/js/bootstrap.min.js'

/**
 * Fase 3: carga el widget de Agentforce Embedded Messaging
 * y pasa el customerId (contenido del QR) como campo oculto de pre-chat.
 *
 * @param {string} customerId  Contenido del QR escaneado en Fase 2
 */
export function initPhase3(customerId) {
  _clearSalesforceSession()

  const script = document.createElement('script')
  script.type  = 'text/javascript'
  script.src   = BOOTSTRAP_URL

  script.onload  = () => _initMessaging(customerId)
  script.onerror = () => _setStatus('Error al cargar el agente. Intenta de nuevo.', true)

  document.body.appendChild(script)
}

// ── Inicializa el widget una vez cargado el bootstrap ────────────────────────

function _initMessaging(customerId) {
  try {
    embeddedservice_bootstrap.settings.language = 'es'

    embeddedservice_bootstrap.init(
      '00DKh000003TzXB',
      'WebQRDeployment',
      'https://nt1779211331673.my.site.com/ESWWebQRDeployment1779234551621',
      { scrt2URL: 'https://nt1779211331673.my.salesforce-scrt.com' }
    )

    // El widget dispara este evento cuando está listo para recibir configuración
    window.addEventListener('onEmbeddedMessagingReady', () => {
      _onReady(customerId)
    })
  } catch (err) {
    console.error('Agentforce init error:', err)
    _setStatus('Error al inicializar el agente.', true)
  }
}

// ── Widget listo: termina sesión previa y abre chat nuevo ────────────────────

function _onReady(customerId) {
  try {
    embeddedservice_bootstrap.prechatAPI.setHiddenPrechatFields({ customerId })

    // Si hay una conversación activa la terminamos primero
    const hasActiveSession = _hasActiveSession()

    if (hasActiveSession) {
      // Escucha el evento de conversación finalizada para luego abrir la nueva
      window.addEventListener('onEmbeddedMessagingConversationEnded', () => {
        _clearSalesforceSession()
        setTimeout(() => embeddedservice_bootstrap.utilAPI.launchChat(), 600)
      }, { once: true })

      embeddedservice_bootstrap.utilAPI.endChat()
    } else {
      setTimeout(() => embeddedservice_bootstrap.utilAPI.launchChat(), 800)
    }

    _setStatus('El chat está abierto. Puedes comenzar la conversación.')
    document.getElementById('phase3-title').textContent = 'Agente conectado'
  } catch (err) {
    console.error('Agentforce ready error:', err)
    _setStatus('Error al configurar el agente.', true)
  }
}

// Detecta si hay una sesión/conversación activa en localStorage
function _hasActiveSession() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('embeddedservice') || key.includes('ESW') || key.includes('00DKh000003TzXB'))) {
      return true
    }
  }
  return false
}

// ── Limpia la sesión anterior de Salesforce en localStorage ──────────────────

function _clearSalesforceSession() {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('embeddedservice') || key.includes('ESW') || key.includes('00DKh000003TzXB'))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

// ── Helper UI ─────────────────────────────────────────────────────────────────

function _setStatus(text, isError = false) {
  const el = document.getElementById('phase3-sub')
  if (!el) return
  el.textContent  = text
  el.style.color  = isError ? '#ff453a' : ''
}
